"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/auth";
import { askAssistant } from "@/lib/ai-provider";
import { assistantPolicy } from "@/lib/assistant-policy";
import { suggestTaskSlots } from "@/lib/availability";
import { getCompanies, getGoals, getPerformanceData, getProjects, getTasks } from "@/lib/queries";
import { calculatePerformance, periodPair } from "@/lib/performance";
import { addDays, getSchedule, localDate } from "@/lib/schedule";
import { uuid } from "@/lib/validation";

export async function saveAutonomy(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const level = String(form.get("level") ?? "");
  if (level !== "N0" && level !== "N1") redirect("/assistente?error=Nível inválido.");
  const { error } = await supabase.from("user_preferences").upsert({ workspace_id: workspace.id, autonomy_level: level });
  if (error) redirect(`/assistente?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/assistente");
  redirect("/assistente?message=Autonomia atualizada.");
}

export async function sendAssistantMessage(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const message = String(form.get("message") ?? "").trim();
  let conversationId = String(form.get("conversation_id") ?? "");
  if (!message || message.length > 2000) redirect("/assistente?error=Escreva uma mensagem de até 2000 caracteres.");
  const [companies, projects, tasks, goals, performance, { data: preferences }] = await Promise.all([
    getCompanies(), getProjects(), getTasks(), getGoals(), getPerformanceData(), supabase.from("user_preferences").select("autonomy_level").eq("workspace_id", workspace.id).maybeSingle(),
  ]);
  let companyId: string | null = null;
  let projectId: string | null = null;
  if (conversationId) {
    if (!uuid.safeParse(conversationId).success) redirect("/assistente?error=Conversa inválida.");
    const { data } = await supabase.from("assistant_conversations").select("id,company_id,project_id").eq("workspace_id", workspace.id).eq("id", conversationId).single();
    if (!data) redirect("/assistente?error=Conversa não encontrada.");
    companyId = data.company_id; projectId = data.project_id;
  } else {
    const requestedCompany = String(form.get("company_id") ?? "");
    const requestedProject = String(form.get("project_id") ?? "");
    companyId = companies.some((company) => company.id === requestedCompany) ? requestedCompany : null;
    projectId = projects.some((project) => project.id === requestedProject && (!companyId || project.company_id === companyId)) ? requestedProject : null;
    const { data, error } = await supabase.from("assistant_conversations").insert({ workspace_id: workspace.id, title: message.slice(0, 90), company_id: companyId, project_id: projectId }).select("id").single();
    if (error || !data) redirect("/assistente?error=Não foi possível iniciar a conversa.");
    conversationId = data.id;
  }
  const path = `/assistente?conversation=${conversationId}`;
  const { error: userError } = await supabase.from("assistant_messages").insert({ workspace_id: workspace.id, conversation_id: conversationId, role: "user", content: message });
  if (userError) redirect(`${path}&error=${encodeURIComponent(userError.message)}`);
  const scopedProjects = projects.filter((project) => (!companyId || project.company_id === companyId) && (!projectId || project.id === projectId)).slice(0, 20);
  const scopedTasks = tasks.filter((task) => (!companyId || task.company_id === companyId) && (!projectId || task.project_id === projectId)).slice(0, 50);
  const today = localDate();
  const weeklyPeriods = periodPair("week", today);
  const monthlyPeriods = periodPair("month", today);
  const context = { companies: companies.filter((company) => !companyId || company.id === companyId).map(({ id, name, description }) => ({ id, name, description: description.slice(0, 500) })),
    projects: scopedProjects.map(({ id, company_id, name, description, goal_text, status }) => ({ id, company_id, name, description: description.slice(0, 500), goal_text: goal_text.slice(0, 300), status })),
    tasks: scopedTasks.map(({ id, company_id, project_id, title, status, priority, due_at, estimated_minutes }) => ({ id, company_id, project_id, title, status, priority, due_at, estimated_minutes })),
    weekly: { periods: weeklyPeriods, current: calculatePerformance(performance, weeklyPeriods.current, companyId, projectId), previous: calculatePerformance(performance, weeklyPeriods.previous, companyId, projectId) },
    monthly: { periods: monthlyPeriods, current: calculatePerformance(performance, monthlyPeriods.current, companyId, projectId), previous: calculatePerformance(performance, monthlyPeriods.previous, companyId, projectId) },
    goals: goals.filter((goal) => (!companyId || goal.company_id === companyId) && (!projectId || goal.project_id === projectId)).slice(0, 15).map((goal) => ({ id: goal.id, name: goal.name, target_value: goal.target_value, unit: goal.unit, starts_on: goal.starts_on, ends_on: goal.ends_on,
      latest_checkin: performance.checkins.filter((item) => item.goal_id === goal.id).sort((a, b) => b.recorded_on.localeCompare(a.recorded_on) || b.created_at.localeCompare(a.created_at))[0] ?? null })) };
  let answer: string;
  let usage: { model: string; input_tokens: number | null; output_tokens: number | null; latency_ms: number } | undefined;
  try {
    const response = await askAssistant(message, context);
    usage = response.usage;
    const suggestion = response.result;
    answer = suggestion.answer;
    const level = preferences?.autonomy_level === "N0" ? "N0" : "N1";
    let action: { action_type: "create_task" | "schedule_task"; arguments_json: Record<string, unknown>; preview_json: Record<string, unknown> } | null = null;
    if (suggestion.action_type === "create_task" && suggestion.task_title) {
      const company = companies.find((item) => item.id === suggestion.company_id && (!companyId || item.id === companyId));
      const project = projects.find((item) => item.id === suggestion.project_id && (!projectId || item.id === projectId) && item.company_id === (company?.id ?? null));
      const args = { title: suggestion.task_title, description: suggestion.task_description ?? "", company_id: company?.id ?? null, project_id: project?.id ?? null,
        priority: suggestion.priority, estimated_minutes: suggestion.estimated_minutes, due_at: suggestion.due_at };
      action = { action_type: "create_task", arguments_json: args, preview_json: args };
    }
    if (suggestion.action_type === "schedule_task" && suggestion.schedule_task_id) {
      const task = scopedTasks.find((item) => item.id === suggestion.schedule_task_id && !["done", "cancelled"].includes(item.status));
      if (task?.estimated_minutes) {
        const today = localDate();
        const days = await getSchedule(Array.from({ length: 14 }, (_, index) => addDays(today, index)));
        const slot = suggestTaskSlots(task, days, new Date(), 1)[0];
        if (slot) action = { action_type: "schedule_task", arguments_json: { task_id: task.id, starts_at: slot.startsAt, ends_at: slot.endsAt },
          preview_json: { task_id: task.id, task_title: task.title, starts_at: slot.startsAt, ends_at: slot.endsAt, reason: slot.reason } };
        else answer += " Não encontrei uma vaga compatível nos próximos 14 dias antes do prazo.";
      } else answer += " Para agendar, escolha uma tarefa aberta com duração estimada.";
    }
    if (action) {
      const policy = assistantPolicy(level, action.action_type);
      if (policy === "requires_approval") {
        const { error } = await supabase.from("assistant_action_requests").insert({ workspace_id: workspace.id, conversation_id: conversationId, action_type: action.action_type,
          arguments_json: action.arguments_json, preview_json: action.preview_json, autonomy_level: "N1" });
        if (error) answer += " A prévia não pôde ser salva; nenhuma alteração foi feita.";
        else answer += " Confira a prévia abaixo e confirme para aplicar.";
      } else answer += " No modo N0, esta é apenas uma sugestão. Nenhuma alteração foi feita.";
    }
  } catch (error) {
    answer = error instanceof Error ? error.message : "A IA está indisponível. Seus dados permanecem salvos.";
  }
  await supabase.from("assistant_messages").insert({ workspace_id: workspace.id, conversation_id: conversationId, role: "assistant", content: answer.slice(0, 10000),
    model: usage?.model ?? null, input_tokens: usage?.input_tokens ?? null, output_tokens: usage?.output_tokens ?? null, latency_ms: usage?.latency_ms ?? null });
  revalidatePath("/assistente");
  redirect(path);
}

export async function decideAssistantAction(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = String(form.get("id") ?? "");
  const conversationId = String(form.get("conversation_id") ?? "");
  const approve = form.get("decision") === "approve";
  if (!uuid.safeParse(id).success || !uuid.safeParse(conversationId).success) redirect("/assistente?error=Proposta inválida.");
  const { error } = await supabase.rpc("decide_assistant_action", { p_workspace_id: workspace.id, p_request_id: id, p_approve: approve });
  if (error) redirect(`/assistente?conversation=${conversationId}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/assistente"); revalidatePath("/tarefas"); revalidatePath("/semana"); revalidatePath("/hoje");
  redirect(`/assistente?conversation=${conversationId}&message=${approve ? "Ação aplicada." : "Sugestão recusada."}`);
}

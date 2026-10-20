"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/auth";
import { fromFortalezaLocal } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { clientSchema, companySchema, formString, projectSchema, taskSchema, uuid } from "@/lib/validation";
import { validateNorteSeed } from "@/lib/norte-seed";
import { ensureWeeklyCsmDemands } from "@/lib/weekly-csm-import";
import { getSchedule, localDate, weekDates } from "@/lib/schedule";
import { getTasks } from "@/lib/queries";
import { getCompanies, getProjects } from "@/lib/queries";
import { planWeek } from "@/lib/week-planner";
import { buildOperationalAgenda, operationalProposalKey } from "@/lib/operational-agenda";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function value(form: FormData, key: string) { return formString(form, key); }
function refresh() {
  ["/hoje", "/semana", "/empresas", "/clientes", "/projetos", "/tarefas", "/inbox", "/configuracoes/carga-inicial", "/assistente", "/performance"].forEach((path) => revalidatePath(path));
}
export async function importWeeklyCsmDemands() {
  const { supabase, workspace } = await getWorkspace();
  const added = await ensureWeeklyCsmDemands(supabase, workspace.id);
  refresh();
  redirect(`/semana?message=${encodeURIComponent(`${added} demanda(s) CSM ausente(s) adicionada(s).`)}`);
}
export async function approveWeekPlan(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const submitted = value(form, "proposal");
  const dates = weekDates(localDate());
  const [days, tasks] = await Promise.all([getSchedule(dates), getTasks()]);
  if (!days[0]?.calendarEnabled) fail("/semana", "A migração de calendário ainda não foi aplicada.");
  const current = planWeek(tasks, days, new Date()).items.map(({ taskId, startsAt, endsAt }) => ({ taskId, startsAt, endsAt }));
  if (submitted !== JSON.stringify(current) || !current.length) fail("/semana", "A agenda mudou. Revise a nova prévia antes de aprovar.");
  const { data, error } = await supabase.rpc("approve_week_plan", { p_workspace_id: workspace.id, p_items: current });
  if (error) fail("/semana", error.message);
  refresh();
  redirect(`/semana?message=${encodeURIComponent(`${data} reserva(s) aprovada(s).`)}`);
}
export async function importOperationalAgenda(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const [companies, projects, tasks] = await Promise.all([getCompanies(), getProjects(), getTasks()]);
  const proposal = buildOperationalAgenda(companies, projects, tasks);
  if (value(form, "proposal_key") !== operationalProposalKey(proposal)) fail("/semana", "Os dados mudaram. Confira a prévia novamente.");
  if (proposal.issues.some((issue) => issue.startsWith("Operação ausente") || issue.startsWith("Projeto ou vínculo ausente") || issue.startsWith("Rotinas sobrepostas")))
    fail("/semana", "Resolva os vínculos e horários em conflito antes de aplicar.");
  const { data, error } = await supabase.rpc("import_operational_week", { p_workspace_id: workspace.id, p_version: proposal.source.meta.version,
    p_days: proposal.days, p_tasks: proposal.tasks.map((item) => ({ source_key: item.source_key, title: item.title,
      description: item.description, company_id: item.company_id, project_id: item.project_id, parent_key: item.parent_key,
      estimated_minutes: item.estimated_minutes, source_priority: item.source_priority, due_at: item.due_at })) });
  if (error) fail("/semana", error.message);
  refresh();
  redirect(`/semana?message=${encodeURIComponent(`Programação aplicada: ${data.days} dias e ${data.tasks} tarefas novas. Confira e aprove os horários de execução.`)}`);
}
export async function reserveTaskSlot(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "task_id");
  if (!uuid.safeParse(id).success) fail("/tarefas", "Tarefa inválida.");
  const { data: task } = await supabase.from("tasks").select("id,title,company_id,project_id,estimated_minutes").eq("workspace_id", workspace.id).eq("id", id).single();
  if (!task) fail("/tarefas", "Tarefa não encontrada.");
  const start = new Date(value(form, "starts_at"));
  const end = new Date(value(form, "ends_at"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() - start.getTime() !== task.estimated_minutes * 60000)
    fail(`/tarefas/${id}`, "Horário ou duração inválidos.");
  const operational = (await getSchedule([localDate(start)])).some((day) => day.operational);
  const { error } = operational
    ? await supabase.rpc("approve_week_plan", { p_workspace_id: workspace.id, p_items: [{ taskId: id, startsAt: start.toISOString(), endsAt: end.toISOString() }] })
    : await supabase.rpc("save_calendar_event", { p_workspace_id: workspace.id, p_event_id: null, p_event_type: "execution", p_title: task.title,
      p_company_id: task.company_id, p_project_id: task.project_id, p_task_id: id, p_starts_at: start.toISOString(), p_ends_at: end.toISOString(), p_allow_protected_override: false });
  if (error) fail(`/tarefas/${id}`, error.message);
  refresh();
  redirect(`/tarefas/${id}?message=Bloco de execução reservado.`);
}

export async function saveAppointment(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const title = value(form, "title").trim();
  const companyId = value(form, "company_id") || null;
  const starts = fromFortalezaLocal(value(form, "starts_at"));
  const ends = fromFortalezaLocal(value(form, "ends_at"));
  if ((id && !uuid.safeParse(id).success) || (companyId && !uuid.safeParse(companyId).success) || !title || title.length > 240 || Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()))
    fail("/semana", "Revise os dados do compromisso.");
  const operational = (await getSchedule([localDate(starts)])).some((day) => day.operational);
  const { error } = operational
    ? await supabase.rpc("save_operational_appointment", { p_workspace_id: workspace.id, p_event_id: id || null, p_title: title,
      p_company_id: companyId, p_starts_at: starts.toISOString(), p_ends_at: ends.toISOString() })
    : await supabase.rpc("save_calendar_event", { p_workspace_id: workspace.id, p_event_id: id || null, p_event_type: "appointment", p_title: title,
      p_company_id: companyId, p_project_id: null, p_task_id: null, p_starts_at: starts.toISOString(), p_ends_at: ends.toISOString(), p_allow_protected_override: value(form, "approve_protected") === "yes" });
  if (error) fail("/semana", error.message);
  refresh();
  redirect("/semana?message=Compromisso salvo.");
}
export async function saveRecurrenceException(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const ruleId = value(form, "rule_id");
  const date = value(form, "date");
  const action = value(form, "action");
  const start = value(form, "starts_at");
  const end = value(form, "ends_at");
  if (!uuid.safeParse(ruleId).success || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["skip", "override", "restore"].includes(action)
    || (action === "override" && (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)))) fail("/semana", "Exceção inválida.");
  const { error } = await supabase.rpc("save_recurrence_exception", { p_workspace_id: workspace.id, p_rule_id: ruleId, p_date: date, p_action: action,
    p_start: action === "override" ? start : null, p_end: action === "override" ? end : null, p_title: null, p_approve_protected: value(form, "approve_protected") === "yes" });
  if (error) fail("/semana", error.message);
  refresh();
  redirect("/semana?message=Ocorrência atualizada.");
}
export async function cancelCalendarEvent(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  if (!uuid.safeParse(id).success) fail("/semana", "Evento inválido.");
  const { error } = await supabase.rpc("cancel_calendar_event", { p_workspace_id: workspace.id, p_event_id: id });
  if (error) fail("/semana", error.message);
  refresh();
  redirect("/semana?message=Reserva cancelada.");
}
export async function finishExecution(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const actual = Number(value(form, "actual_minutes"));
  if (!uuid.safeParse(id).success || !Number.isInteger(actual) || actual < 1 || actual > 720) fail("/semana", "Informe a duração realizada.");
  const { error } = await supabase.rpc("finish_calendar_execution", { p_workspace_id: workspace.id, p_event_id: id, p_actual_minutes: actual });
  if (error) fail("/semana", error.message);
  refresh();
  redirect("/semana?message=Execução registrada.");
}
export async function runNorteSeed(form: FormData) {
  const { supabase } = await getWorkspace();
  const dryRun = value(form, "mode") !== "apply";
  const payload = validateNorteSeed();
  const { data, error } = await supabase.rpc("import_norte_data", { payload, dry_run: dryRun });
  if (error || !data) fail("/configuracoes/carga-inicial", "Não foi possível executar a carga. Confira a prévia e tente novamente.");
  refresh();
  redirect(`/configuracoes/carga-inicial?result=${encodeURIComponent(JSON.stringify(data))}`);
}
export async function signIn(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: value(form, "email"), password: value(form, "password") });
  if (error) fail("/login", "E-mail ou senha inválidos.");
  redirect("/hoje");
}
export async function signUp(form: FormData) {
  const supabase = await createClient();
  const email = value(form, "email");
  const password = value(form, "password");
  if (!email.includes("@") || password.length < 8) fail("/cadastro", "Informe um e-mail válido e senha com ao menos 8 caracteres.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) fail("/cadastro", error.message);
  if (!data.session) redirect("/login?message=Confira seu e-mail para confirmar o cadastro.");
  redirect("/hoje");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setCompanyFilter(form: FormData) {
  const id = value(form, "company_id");
  const { supabase, workspace } = await getWorkspace();
  if (id) {
    if (!uuid.safeParse(id).success) fail("/hoje", "Empresa inválida.");
    const { data } = await supabase.from("companies").select("id").eq("workspace_id", workspace.id).eq("id", id).single();
    if (!data) fail("/hoje", "Empresa não encontrada.");
  }
  (await cookies()).set("company_filter", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  refresh();
  redirect("/hoje");
}

export async function saveCompany(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const parsed = companySchema.safeParse(Object.fromEntries(["name", "segment", "description", "cnpj", "color", "status"].map((key) => [key, value(form, key)])));
  if (!parsed.success) fail(id ? `/empresas/${id}` : "/empresas", "Revise os campos da empresa.");
  const query = id
    ? supabase.from("companies").update(parsed.data).eq("id", id).eq("workspace_id", workspace.id).select("id").single()
    : supabase.from("companies").insert({ ...parsed.data, workspace_id: workspace.id }).select("id").single();
  const { data, error } = await query;
  if (error || !data) fail(id ? `/empresas/${id}` : "/empresas", error?.message || "Não foi possível salvar.");
  refresh();
  redirect(`/empresas/${data.id}`);
}

export async function saveClient(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const parsed = clientSchema.safeParse(Object.fromEntries(["name", "company_id", "notes", "email", "phone", "status"].map((key) => [key, value(form, key)])));
  if (!parsed.success) fail(id ? `/clientes/${id}` : "/clientes", "Revise os campos do cliente.");
  const payload = { ...parsed.data, email: parsed.data.email || null, phone: parsed.data.phone || null };
  const query = id
    ? supabase.from("clients").update(payload).eq("id", id).eq("workspace_id", workspace.id).select("id").single()
    : supabase.from("clients").insert({ ...payload, workspace_id: workspace.id }).select("id").single();
  const { data, error } = await query;
  if (error || !data) fail(id ? `/clientes/${id}` : "/clientes", error?.message || "Não foi possível salvar.");
  refresh();
  redirect(`/clientes/${data.id}`);
}

export async function saveProject(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const parsed = projectSchema.safeParse(Object.fromEntries(["name", "company_id", "client_id", "description", "goal_text", "status"].map((key) => [key, value(form, key)])));
  if (!parsed.success) fail(id ? `/projetos/${id}` : "/projetos", "Revise os campos do projeto.");
  if (!parsed.data.company_id && !id) fail("/projetos/novo", "Selecione uma empresa para o novo projeto.");
  if (!parsed.data.company_id && parsed.data.client_id) fail(id ? `/projetos/${id}` : "/projetos", "Cliente requer empresa.");
  const query = id
    ? supabase.from("projects").update(parsed.data).eq("id", id).eq("workspace_id", workspace.id).select("id").single()
    : supabase.from("projects").insert({ ...parsed.data, workspace_id: workspace.id }).select("id").single();
  const { data, error } = await query;
  if (error || !data) fail(id ? `/projetos/${id}` : "/projetos", error?.message || "Não foi possível salvar.");
  refresh();
  redirect(`/projetos/${data.id}`);
}

export async function saveTask(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const parsed = taskSchema.safeParse(Object.fromEntries(["title", "description", "company_id", "project_id", "client_id", "status", "priority", "source_priority", "due_at", "estimated_minutes"].map((key) => [key, value(form, key)])));
  if (!parsed.success) fail(id ? `/tarefas/${id}` : "/tarefas", "Revise os campos da tarefa.");
  const { due_at, estimated_minutes, ...fields } = parsed.data;
  if (fields.client_id && !fields.company_id) fail(id ? `/tarefas/${id}` : "/tarefas", "Selecione a empresa do cliente.");
  if (fields.project_id && !fields.company_id) {
    const { data: selectedProject } = await supabase.from("projects").select("company_id").eq("workspace_id", workspace.id).eq("id", fields.project_id).single();
    if (!selectedProject || selectedProject.company_id) fail(id ? `/tarefas/${id}` : "/tarefas", "Selecione a empresa do projeto.");
  }
  const minutes = estimated_minutes ? Number(estimated_minutes) : null;
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) fail(id ? `/tarefas/${id}` : "/tarefas", "Duração deve estar entre 1 e 1440 minutos.");
  const due = due_at ? fromFortalezaLocal(due_at) : null;
  if (due && Number.isNaN(due.getTime())) fail(id ? `/tarefas/${id}` : "/tarefas", "Prazo inválido.");
  let completedAt: string | null = null;
  if (fields.status === "done") {
    const { data: previous } = id ? await supabase.from("tasks").select("status, completed_at").eq("id", id).eq("workspace_id", workspace.id).single() : { data: null };
    completedAt = previous?.status === "done" && previous.completed_at ? previous.completed_at : new Date().toISOString();
  }
  const payload = { ...fields, due_at: due?.toISOString() ?? null, estimated_minutes: minutes, completed_at: completedAt };
  const query = id
    ? supabase.from("tasks").update(payload).eq("id", id).eq("workspace_id", workspace.id).select("id").single()
    : supabase.from("tasks").insert({ ...payload, workspace_id: workspace.id }).select("id").single();
  const { data, error } = await query;
  if (error || !data) fail(id ? `/tarefas/${id}` : "/tarefas", error?.message || "Não foi possível salvar.");
  refresh();
  redirect(`/tarefas/${data.id}`);
}

export async function completeTask(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  if (!uuid.safeParse(id).success) fail("/tarefas", "Tarefa inválida.");
  const { data, error } = await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id).neq("status", "done").select("id").single();
  if (error || !data) fail("/tarefas", error?.message || "Tarefa não encontrada.");
  refresh();
}
export async function setTaskStatus(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  const status = value(form, "status");
  if (!uuid.safeParse(id).success || !["todo", "in_progress", "blocked"].includes(status)) fail("/hoje", "Estado inválido.");
  if (status === "blocked" || status === "todo") {
    const { error } = await supabase.rpc("defer_task", { p_workspace_id: workspace.id, p_task_id: id, p_status: status });
    if (error) fail("/hoje", error.message);
  } else {
    const { data, error } = await supabase.from("tasks").update({ status }).eq("id", id).eq("workspace_id", workspace.id)
      .in("status", ["todo", "in_progress", "blocked"]).select("id").single();
    if (error || !data) fail("/hoje", error?.message || "Tarefa não encontrada.");
  }
  refresh();
  redirect(status === "todo" ? "/semana" : "/hoje");
}

export async function captureInbox(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const rawText = value(form, "raw_text").trim();
  if (!rawText || rawText.length > 2000) fail("/inbox", "Digite uma demanda de até 2000 caracteres.");
  const { data, error } = await supabase.from("inbox_items").insert({ workspace_id: workspace.id, raw_text: rawText }).select("id").single();
  if (error || !data) fail("/inbox", error?.message || "Não foi possível capturar a demanda.");
  refresh();
  redirect("/inbox");
}

export async function convertInbox(form: FormData) {
  const { supabase } = await getWorkspace();
  const id = value(form, "id");
  if (!uuid.safeParse(id).success) fail("/inbox", "Demanda inválida.");
  const { data: taskId, error } = await supabase.rpc("convert_inbox_to_task", { item_id: id });
  if (error || !taskId) fail("/inbox", error?.message || "Não foi possível converter.");
  refresh();
  redirect(`/tarefas/${taskId}`);
}

export async function dismissInbox(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = value(form, "id");
  if (!uuid.safeParse(id).success) fail("/inbox", "Demanda inválida.");
  const { data, error } = await supabase.from("inbox_items").update({ status: "dismissed" }).eq("id", id).eq("workspace_id", workspace.id).eq("status", "open").select("id").single();
  if (error || !data) fail("/inbox", error?.message || "Demanda não encontrada.");
  refresh();
}

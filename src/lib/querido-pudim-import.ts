import { queridoPudimDueAt, queridoPudimPlan, queridoPudimPlanMarker } from "./querido-pudim-plan";

type Database = Awaited<ReturnType<typeof import("./supabase/server").createClient>>;

export async function ensureQueridoPudimPlan(supabase: Database, workspaceId: string) {
  const { data: client, error: clientError } = await supabase.from("clients")
    .select("id,company_id").eq("workspace_id", workspaceId).eq("seed_key", "querido-pudim").maybeSingle();
  if (clientError) throw new Error(clientError.message);
  if (!client) return 0;

  const { data: project, error: projectError } = await supabase.from("projects")
    .select("id").eq("workspace_id", workspaceId).eq("seed_key", "vp-querido").maybeSingle();
  if (projectError) throw new Error(projectError.message);

  const keys = queridoPudimPlan.map((item) => item.key);
  const { data: existing, error: existingError } = await supabase.from("tasks")
    .select("id,seed_key,description").eq("workspace_id", workspaceId).in("seed_key", keys);
  if (existingError) throw new Error(existingError.message);
  const byKey = new Map((existing ?? []).map((task) => [task.seed_key, task]));
  let changed = 0;
  for (const item of queridoPudimPlan) {
    const prior = byKey.get(item.key);
    if (prior?.description?.includes(queridoPudimPlanMarker)) continue;
    const description = [queridoPudimPlanMarker, item.detail, prior?.description].filter(Boolean).join("\n\n");
    const payload = {
      title: item.title,
      description,
      due_at: queridoPudimDueAt(item.due),
      company_id: client.company_id,
      client_id: client.id,
      project_id: project?.id ?? null,
    };
    const { error } = prior
      ? await supabase.from("tasks").update(payload).eq("workspace_id", workspaceId).eq("id", prior.id)
      : await supabase.from("tasks").insert({ ...payload, workspace_id: workspaceId, seed_key: item.key, status: "todo" });
    if (error && error.code !== "23505") throw new Error(error.message);
    if (!error) changed++;
  }
  return changed;
}

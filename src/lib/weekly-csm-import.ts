import { weeklyCsmDemands, weeklyCsmDueAt, weeklyCsmSeedPrefix } from "./weekly-csm-demands";

type Database = Awaited<ReturnType<typeof import("./supabase/server").createClient>>;

export async function ensureWeeklyCsmDemands(supabase: Database, workspaceId: string) {
  const { data: company, error: companyError } = await supabase.from("companies")
    .select("id").eq("workspace_id", workspaceId).eq("seed_key", "csm").maybeSingle();
  if (companyError) throw new Error(companyError.message);
  if (!company) return 0;

  const { data: existing, error: existingError } = await supabase.from("tasks")
    .select("title,seed_key").eq("workspace_id", workspaceId).eq("company_id", company.id);
  if (existingError) throw new Error(existingError.message);
  const existingKeys = new Set((existing ?? []).map((task) => task.seed_key));
  const existingTitles = new Set((existing ?? []).map((task) => task.title.toLocaleLowerCase("pt-BR")));
  let added = 0;
  for (const demand of weeklyCsmDemands) {
    const seedKey = `${weeklyCsmSeedPrefix}${demand.key}`;
    const normalizedTitle = demand.title.toLocaleLowerCase("pt-BR");
    if (existingKeys.has(seedKey) || existingTitles.has(normalizedTitle)) continue;
    const { error } = await supabase.from("tasks").insert({
      workspace_id: workspaceId,
      company_id: company.id,
      seed_key: seedKey,
      title: demand.title,
      description: `Demanda da planilha CSM de 19/10/2026. Prioridade original: ${demand.sourcePriority}. ${demand.priority === "P1" ? "Prioridade máxima definida pelo usuário." : ""}`.trim(),
      priority: demand.priority,
      due_at: weeklyCsmDueAt,
      status: "todo",
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    if (!error) added++;
    existingKeys.add(seedKey);
    existingTitles.add(normalizedTitle);
  }
  return added;
}

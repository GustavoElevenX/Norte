"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/auth";
import { uuid } from "@/lib/validation";

const fail = (message: string): never => redirect(`/performance?error=${encodeURIComponent(message)}`);
const get = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

export async function saveGoal(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = get(form, "id");
  const company = get(form, "company_id") || null;
  const project = get(form, "project_id") || null;
  const name = get(form, "name");
  const unit = get(form, "unit");
  const target = get(form, "target_value").replace(",", ".");
  const starts = get(form, "starts_on");
  const ends = get(form, "ends_on");
  const goalType = get(form, "goal_type");
  const status = get(form, "status") || "active";
  if ((id && !uuid.safeParse(id).success) || (company && !uuid.safeParse(company).success) || (project && !uuid.safeParse(project).success)
    || name.length < 1 || name.length > 160 || unit.length < 1 || unit.length > 40 || !/^\d{1,12}(\.\d{1,2})?$/.test(target) || Number(target) <= 0
    || !validDate(starts) || !validDate(ends) || ends < starts || !["quantitative", "milestone"].includes(goalType) || !["active", "completed", "archived"].includes(status)) fail("Revise os dados da meta.");
  const payload = { workspace_id: workspace.id, company_id: company, project_id: project, name, unit, target_value: target, starts_on: starts, ends_on: ends, goal_type: goalType, status };
  const { error } = id ? await supabase.from("goals").update(payload).eq("workspace_id", workspace.id).eq("id", id) : await supabase.from("goals").insert(payload);
  if (error) fail(error.message);
  revalidatePath("/performance"); revalidatePath("/hoje");
  redirect("/performance?message=Meta salva.");
}

export async function addGoalCheckin(form: FormData) {
  const { supabase, workspace } = await getWorkspace();
  const id = get(form, "goal_id");
  const date = get(form, "recorded_on");
  const actual = get(form, "actual_value").replace(",", ".");
  const note = get(form, "note");
  if (!uuid.safeParse(id).success || !validDate(date) || !/^\d{1,12}(\.\d{1,2})?$/.test(actual) || note.length > 2000) fail("Revise o registro da meta.");
  const { error } = await supabase.from("goal_checkins").insert({ workspace_id: workspace.id, goal_id: id, recorded_on: date, actual_value: actual, note, source: "manual" });
  if (error) fail(error.message);
  revalidatePath("/performance"); revalidatePath("/hoje");
  redirect("/performance?message=Registro adicionado.");
}

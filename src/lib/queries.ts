import { getWorkspace } from "@/lib/auth";
import { cache } from "react";
import { ensureWeeklyCsmDemands } from "@/lib/weekly-csm-import";

export const getCompanies = cache(async function getCompanies() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("companies").select("*").eq("workspace_id", workspace.id).order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProjects = cache(async function getProjects() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("projects").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getClients = cache(async function getClients() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("clients").select("*").eq("workspace_id", workspace.id).order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getTasks = cache(async function getTasks() {
  const { supabase, workspace } = await getWorkspace();
  await ensureWeeklyCsmDemands(supabase, workspace.id);
  const { data, error } = await supabase.from("tasks").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getInbox = cache(async function getInbox() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("inbox_items").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getAreas = cache(async function getAreas() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("strategic_areas").select("*").eq("workspace_id", workspace.id);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getDemandContexts = cache(async function getDemandContexts() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("demand_contexts").select("*").eq("workspace_id", workspace.id).order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getGoals = cache(async function getGoals() {
  const { supabase, workspace } = await getWorkspace();
  const { data, error } = await supabase.from("goals").select("*").eq("workspace_id", workspace.id).order("ends_on");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPerformanceData = cache(async function getPerformanceData() {
  const { supabase, workspace } = await getWorkspace();
  const [planning, completions, inbox, executions, checkins] = await Promise.all([
    supabase.from("task_planning_snapshots").select("task_id,planned_for,company_id,project_id,priority").eq("workspace_id", workspace.id).limit(5000),
    supabase.from("task_completion_events").select("task_id,completed_at,company_id,project_id,priority,due_at").eq("workspace_id", workspace.id).limit(5000),
    supabase.from("inbox_items").select("created_at,status").eq("workspace_id", workspace.id).limit(5000),
    supabase.from("calendar_events").select("completed_at,actual_minutes,company_id,project_id").eq("workspace_id", workspace.id).eq("status", "completed").limit(5000),
    supabase.from("goal_checkins").select("id,goal_id,recorded_on,actual_value,note,created_at").eq("workspace_id", workspace.id).limit(5000),
  ]);
  const error = planning.error || completions.error || inbox.error || executions.error || checkins.error;
  if (error) throw new Error(error.message);
  return { planning: planning.data ?? [], completions: completions.data ?? [], inbox: inbox.data ?? [], executions: executions.data ?? [], checkins: checkins.data ?? [] };
});

import { getWorkspace } from "@/lib/auth";
import { cache } from "react";

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

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getWorkspace = cache(async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: workspace, error } = await supabase.from("workspaces")
    .select("id, name, timezone").eq("owner_user_id", user.id).single();
  if (error || !workspace) throw new Error("Workspace indisponível. Aplique a migração inicial no Supabase.");
  return { supabase, user, workspace };
});

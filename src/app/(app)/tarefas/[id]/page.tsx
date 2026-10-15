import { notFound } from "next/navigation";
import { TaskForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";
import { getClients, getCompanies, getProjects } from "@/lib/queries";
export default async function Tarefa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) { const [{ id }, query, companies, clients, projects] = await Promise.all([params, searchParams, getCompanies(), getClients(), getProjects()]); const { supabase, workspace } = await getWorkspace(); const { data: task } = await supabase.from("tasks").select("*").eq("id", id).eq("workspace_id", workspace.id).single(); if (!task) notFound(); return <><PageHeading title={task.title} description="Edite a tarefa e acompanhe seu estado." /><Notice {...query} /><TaskForm task={task} companies={companies} clients={clients} projects={projects} /></>; }

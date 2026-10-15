import { notFound } from "next/navigation";
import { ClientForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";
import { getCompanies } from "@/lib/queries";
export default async function Cliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) { const [{ id }, query, companies] = await Promise.all([params, searchParams, getCompanies()]); const { supabase, workspace } = await getWorkspace(); const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("workspace_id", workspace.id).single(); if (!client) notFound(); return <><PageHeading title={client.name} description="Dados do cliente" /><Notice {...query} /><ClientForm client={client} companies={companies} /></>; }

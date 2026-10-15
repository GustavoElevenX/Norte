import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";

export default async function Empresa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, workspace } = await getWorkspace();
  const { data: company } = await supabase.from("companies").select("*").eq("id", id).eq("workspace_id", workspace.id).single();
  if (!company) notFound();
  return <><PageHeading title={company.name} description="Perfil e contexto da empresa" /><Notice {...query} /><div className="detail-links"><Link href="/projetos">Projetos</Link><Link href="/tarefas">Tarefas</Link><Link href="/clientes">Clientes</Link></div><CompanyForm company={company} /></>;
}

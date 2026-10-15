import { ProjectForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getClients, getCompanies } from "@/lib/queries";
export default async function NovoProjeto({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const [companies, clients, query] = await Promise.all([getCompanies(), getClients(), searchParams]); return <><PageHeading title="Novo projeto" description="Guarde o contexto que ajudará você a executar." /><Notice {...query} />{companies.length ? <ProjectForm companies={companies} clients={clients} /> : <p>Cadastre uma empresa antes de criar projetos.</p>}</>; }

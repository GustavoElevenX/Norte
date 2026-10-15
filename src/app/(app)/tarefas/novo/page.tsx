import { TaskForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getClients, getCompanies, getProjects } from "@/lib/queries";
export default async function NovaTarefa({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const [companies, clients, projects, query] = await Promise.all([getCompanies(), getClients(), getProjects(), searchParams]); return <><PageHeading title="Nova tarefa" description="Prioridade estratégica e prazo são campos independentes." /><Notice {...query} /><TaskForm companies={companies} clients={clients} projects={projects} /></>; }

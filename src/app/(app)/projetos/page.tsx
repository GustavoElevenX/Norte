import Link from "next/link";
import { EmptyState, Notice, PageHeading } from "@/components/ui";
import { selectedCompanyId } from "@/lib/filter";
import { getAreas, getCompanies, getProjects } from "@/lib/queries";

export default async function Projetos({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [projects, companies, areas, query] = await Promise.all([getProjects(), getCompanies(), getAreas(), searchParams]);
  const companyId = await selectedCompanyId(companies);
  const visible = projects.filter((project) => !companyId || project.company_id === companyId);
  return <><PageHeading title="Projetos" description="Contexto e objetivos de cada iniciativa." action={{ href: "/projetos/novo", label: "+ Novo projeto" }} /><Notice {...query} />{visible.length ? <div className="list">{visible.map((project) => <Link className="list-row" href={`/projetos/${project.id}`} key={project.id}><div><strong>{project.name}</strong><p>{companies.find((company) => company.id === project.company_id)?.name ?? "Projeto transversal"}{project.area_id ? ` · Área ${areas.find((area) => area.id === project.area_id)?.name ?? ""}` : ""}{project.priority ? ` · ${project.priority}` : ""} · {project.status === "active" ? "Ativo" : project.status === "done" ? "Concluído" : project.status === "paused" ? "Pausado / sob demanda" : "Arquivado"}</p></div><span aria-hidden="true">→</span></Link>)}</div> : <EmptyState title="Nenhum projeto ainda" description="Crie um projeto e registre seu objetivo e contexto." action={{ href: "/projetos/novo", label: "Criar projeto" }} />}</>;
}

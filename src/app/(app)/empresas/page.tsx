import Link from "next/link";
import { EmptyState, Notice, PageHeading } from "@/components/ui";
import { getCompanies } from "@/lib/queries";
import { companySegmentLabel } from "@/lib/company-segment";

export default async function Empresas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [companies, params] = await Promise.all([getCompanies(), searchParams]);
  return <><PageHeading title="Empresas" description="Organize cada frente de trabalho com seu próprio contexto." action={{ href: "/empresas/novo", label: "+ Nova empresa" }} /><Notice {...params} />{companies.length ? <div className="directory-grid">{companies.map((company) => <Link className="directory-card" href={`/empresas/${company.id}`} key={company.id}><span className="color-dot" style={{ backgroundColor: company.color }} /><h2>{company.name}</h2><p>{companySegmentLabel(company.segment)}</p><span className="muted">{company.status === "active" ? "Ativa" : "Arquivada"}</span></Link>)}</div> : <EmptyState title="Nenhuma empresa cadastrada" description="Cadastre sua primeira empresa para organizar projetos e tarefas." action={{ href: "/empresas/novo", label: "Cadastrar empresa" }} />}</>;
}

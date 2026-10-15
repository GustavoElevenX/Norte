import Link from "next/link";
import { EmptyState, Notice, PageHeading } from "@/components/ui";
import { getClients, getCompanies } from "@/lib/queries";
import { selectedCompanyId } from "@/lib/filter";

export default async function Clientes({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [clients, companies, query] = await Promise.all([getClients(), getCompanies(), searchParams]);
  const companyId = await selectedCompanyId(companies);
  const visible = clients.filter((client) => !companyId || client.company_id === companyId);
  return <><PageHeading title="Clientes" description="Clientes atendidos pelas suas empresas." action={{ href: "/clientes/novo", label: "+ Novo cliente" }} /><Notice {...query} />{visible.length ? <div className="list">{visible.map((client) => <Link className="list-row" href={`/clientes/${client.id}`} key={client.id}><div><strong>{client.name}</strong><p>{companies.find((company) => company.id === client.company_id)?.name} · {client.status === "archived" ? "Arquivado" : "Ativo"}</p></div><span aria-hidden="true">→</span></Link>)}</div> : <EmptyState title="Nenhum cliente cadastrado" description="Adicione clientes às empresas prestadoras de serviço." action={{ href: "/clientes/novo", label: "Cadastrar cliente" }} />}</>;
}

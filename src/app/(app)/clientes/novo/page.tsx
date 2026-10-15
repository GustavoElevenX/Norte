import { ClientForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getCompanies } from "@/lib/queries";
export default async function NovoCliente({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const [companies, query] = await Promise.all([getCompanies(), searchParams]); return <><PageHeading title="Novo cliente" /><Notice {...query} />{companies.length ? <ClientForm companies={companies} /> : <p>Cadastre uma empresa antes de adicionar clientes.</p>}</>; }

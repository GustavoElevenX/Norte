import Link from "next/link";
import { Building2, LogOut } from "lucide-react";
import { AppNavigation } from "@/components/app-navigation";
import { signOut, setCompanyFilter } from "@/app/actions";
import { getWorkspace } from "@/lib/auth";
import { getCompanies } from "@/lib/queries";
import { selectedCompanyId } from "@/lib/filter";
import { workspaceDisplayName } from "@/lib/workspace-name";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ workspace, user }, companies] = await Promise.all([getWorkspace(), getCompanies()]);
  const selectedId = await selectedCompanyId(companies);
  return <div className="app-shell"><aside className="sidebar"><Link href="/hoje" className="brand">Norte<span>.</span></Link><AppNavigation /><div className="sidebar-bottom"><span className="workspace-name">{workspaceDisplayName(workspace.name)}</span><span className="user-email">{user.email}</span><Link href="/configuracoes/carga-inicial" className="plain-button">Carga inicial</Link><form action={signOut}><button className="plain-button" type="submit"><LogOut size={16} /> Sair</button></form></div></aside><div className="app-main"><header className="topbar"><Link href="/hoje" className="mobile-brand brand">Norte<span>.</span></Link><form action={setCompanyFilter} className="company-filter"><Building2 size={17} aria-hidden="true" /><select name="company_id" aria-label="Filtrar empresa" defaultValue={selectedId ?? ""}><option value="">Todas as empresas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><button type="submit">Aplicar</button></form><Link href="/hoje#captura" className="button primary top-capture">Nova demanda</Link></header><main className="content">{children}</main><AppNavigation mobile /></div></div>;
}

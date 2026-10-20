"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, ChartNoAxesCombined, CheckSquare2, FolderKanban, House, Inbox, Sparkles, Users } from "lucide-react";

const links = [
  { href: "/hoje", label: "Hoje", icon: House },
  { href: "/semana", label: "Minha Semana", icon: CalendarDays },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare2 },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/assistente", label: "Assistente", icon: Sparkles },
  { href: "/performance", label: "Performance", icon: ChartNoAxesCombined },
];

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={mobile ? "Navegação móvel" : "Principal"} className={mobile ? "mobile-nav" : "side-nav"}>
    {links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}

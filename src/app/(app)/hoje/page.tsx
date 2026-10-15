import Link from "next/link";
import { captureInbox, completeTask } from "@/app/actions";
import { ScheduleList } from "@/components/schedule";
import { EmptyState, formatDate, PageHeading } from "@/components/ui";
import { selectedCompanyId } from "@/lib/filter";
import { getCompanies, getInbox, getTasks } from "@/lib/queries";
import { addDays, companyScheduleColors, getSchedule, localDate } from "@/lib/schedule";

export default async function Hoje() {
  const today = localDate();
  const dates = Array.from({ length: 8 }, (_, i) => addDays(today, i));
  const [companies, allTasks, inbox, schedule] = await Promise.all([getCompanies(), getTasks(), getInbox(), getSchedule(dates)]);
  const companyId = await selectedCompanyId(companies);
  const now = new Date();
  const tasks = allTasks.filter((task) => (!companyId || task.company_id === companyId) && !["done", "cancelled"].includes(task.status));
  const ordered = [...tasks].sort((a, b) => (a.priority ?? "P9").localeCompare(b.priority ?? "P9") || (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));
  const overdue = tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < now.getTime());
  const openInbox = inbox.filter((item) => item.status === "open").length;
  const localTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Fortaleza" }).format(now);
  const next = schedule.flatMap((day) => day.slots.map((slot) => ({ ...slot, date: day.date }))).find((slot) => (slot.date > today || slot.ends_at.slice(0, 5) > localTime) && (!companyId || slot.company_id === companyId));
  return <><PageHeading title="Hoje" description={new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "America/Fortaleza" }).format(now)} />
    <section className="hero-empty" id="captura"><div className="document-icon" aria-hidden="true">▤</div><h2>{tasks.length ? "O que entra agora?" : "Seu dia começa aqui"}</h2><p>Capture rapidamente uma demanda para organizar depois.</p><form action={captureInbox} className="capture-form"><input name="raw_text" aria-label="Nova demanda" placeholder="O que precisa ser feito?" required maxLength={2000} /><button className="button primary" type="submit">Adicionar à inbox</button></form></section>
    <section className="section"><div className="section-heading"><h2>Agenda de hoje</h2><Link href="/semana">Minha Semana</Link></div>
      {next ? <p className="next-routine"><strong>Próximo bloco{next.date > today ? ` (${next.date.slice(8, 10)}/${next.date.slice(5, 7)})` : ""}:</strong> {next.starts_at.slice(0, 5)}–{next.ends_at.slice(0, 5)} · {next.title}</p> : <p className="muted">Sem próximo bloco fixo.</p>}
      <ScheduleList slots={schedule[0].slots} companyId={companyId} colors={companyScheduleColors(companies)} /></section>
    <section className="section"><div className="section-heading"><h2>Próximas tarefas</h2><Link href="/tarefas">Ver todas</Link></div>{ordered.length ? <div className="list">{ordered.slice(0, 5).map((task) => <div className="list-row" key={task.id}><div><Link className="row-title" href={`/tarefas/${task.id}`}>{task.title}</Link><p>{companies.find((company) => company.id === task.company_id)?.name ?? "Área transversal"} · {task.priority ?? "Sem prioridade"} · {formatDate(task.due_at)}</p></div><form action={completeTask}><input type="hidden" name="id" value={task.id} /><button className="button secondary small" type="submit">Concluir</button></form></div>)}</div> : <EmptyState title="Nenhuma tarefa por enquanto." description="Converta uma demanda da inbox ou crie uma tarefa." action={{ href: "/tarefas/novo", label: "Criar tarefa" }} />}</section>
    <div className="quick-summary"><Link href="/inbox"><strong>{openInbox}</strong><span>Demandas na inbox</span></Link><Link href="/tarefas"><strong>{overdue.length}</strong><span>Tarefas vencidas</span></Link><Link href="/empresas"><strong>{companies.filter((company) => company.status === "active").length}</strong><span>Operações ativas</span></Link></div></>;
}

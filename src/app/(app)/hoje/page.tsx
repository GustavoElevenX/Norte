import Link from "next/link";
import { captureInbox, completeTask } from "@/app/actions";
import { ScheduleList } from "@/components/schedule";
import { dailyBriefing } from "@/lib/briefing";
import { EmptyState, formatDate, PageHeading } from "@/components/ui";
import { selectedCompanyId } from "@/lib/filter";
import { getCompanies, getGoals, getInbox, getPerformanceData, getTasks } from "@/lib/queries";
import { addDays, companyScheduleColors, getSchedule, localDate } from "@/lib/schedule";
import { weeklyCsmDemands, weeklyCsmSeedPrefix } from "@/lib/weekly-csm-demands";
import { comparePlanningTasks, visiblePriority } from "@/lib/week-planner";

export default async function Hoje() {
  const today = localDate();
  const dates = Array.from({ length: 8 }, (_, i) => addDays(today, i));
  const [companies, allTasks, inbox, schedule, performance, goals] = await Promise.all([getCompanies(), getTasks(), getInbox(), getSchedule(dates), getPerformanceData(), getGoals()]);
  const companyId = await selectedCompanyId(companies);
  const now = new Date();
  const tasks = allTasks.filter((task) => (!companyId || task.company_id === companyId) && !["done", "cancelled"].includes(task.status));
  const ordered = [...tasks].sort(comparePlanningTasks);
  const overdue = tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < now.getTime());
  const openInbox = inbox.filter((item) => item.status === "open").length;
  const localTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Fortaleza" }).format(now);
  const next = schedule.flatMap((day) => day.slots.map((slot) => ({ ...slot, date: day.date }))).find((slot) => (slot.date > today || slot.ends_at.slice(0, 5) > localTime) && (!companyId || slot.company_id === companyId));
  const brief = dailyBriefing(allTasks, schedule[0], performance.completions, now, companyId);
  const activeGoals = goals.filter((goal) => goal.status === "active" && goal.starts_on <= today && goal.ends_on >= today && (!companyId || goal.company_id === companyId));
  const csmCompany = companies.find((company) => company.seed_key === "csm");
  const showWeeklyCsm = today >= "2026-10-19" && today <= "2026-10-23" && csmCompany && (!companyId || companyId === csmCompany.id);
  return <><PageHeading title="Hoje" description={new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "America/Fortaleza" }).format(now)} />
    {!schedule[0].calendarEnabled || !performance.available ? <p className="notice">Reservas de agenda e métricas aguardam as migrações do banco. As tarefas e rotinas seguem disponíveis.</p> : null}
    <section className="hero-empty" id="captura"><div className="document-icon" aria-hidden="true">▤</div><h2>{tasks.length ? "O que entra agora?" : "Seu dia começa aqui"}</h2><p>Capture rapidamente uma demanda para organizar depois.</p><form action={captureInbox} className="capture-form"><input name="raw_text" aria-label="Nova demanda" placeholder="O que precisa ser feito?" required maxLength={2000} /><button className="button primary" type="submit">Adicionar à inbox</button></form></section>
    <section className="section"><div className="section-heading"><h2>Agenda de hoje</h2><Link href="/semana">Minha Semana</Link></div>
      {next ? <p className="next-routine"><strong>Próximo bloco{next.date > today ? ` (${next.date.slice(8, 10)}/${next.date.slice(5, 7)})` : ""}:</strong> {next.starts_at.slice(0, 5)}–{next.ends_at.slice(0, 5)} · {next.title}</p> : <p className="muted">Sem próximo bloco fixo.</p>}
      <ScheduleList slots={schedule[0].slots} events={schedule[0].events} companyId={companyId} colors={companyScheduleColors(companies)} date={today} /></section>
    {showWeeklyCsm ? <section className="section"><div className="section-heading"><h2>Prioridades CSM · até 23/10</h2><Link href="/semana">Ver semana</Link></div><p className="muted">As duas primeiras são a prioridade máxima. Em seguida vêm as demais demandas P4 e depois P3 da planilha.</p><div className="list">{weeklyCsmDemands.map((demand) => { const task = allTasks.find((item) => item.seed_key === `${weeklyCsmSeedPrefix}${demand.key}` || item.title.toLocaleLowerCase("pt-BR") === demand.title.toLocaleLowerCase("pt-BR")); return <div className="list-row" key={demand.key}><div>{task ? <Link className="row-title" href={`/tarefas/${task.id}`}>{demand.title}</Link> : <strong>{demand.title}</strong>}<p>{demand.priority === "P1" ? "Prioridade máxima" : `Planilha ${demand.sourcePriority}`} · {task?.status === "done" ? "Concluída" : "Pendente"}</p></div></div>; })}</div></section> : null}
    <section className="section"><div className="section-heading"><h2>Resumo do dia</h2><Link href="/assistente">Conversar com o assistente</Link></div><div className="brief-grid"><div className="metric-card"><h2>Capacidade restante</h2><strong>{brief.availableMinutes} min</strong><p>Janelas de trabalho sem reservas ou indisponibilidades.</p></div><div className="metric-card"><h2>Atenção</h2><strong>{brief.overdue.length} vencidas · {brief.blocked.length} bloqueadas</strong><p>{brief.appointments.length} compromissos hoje.</p></div><div className="metric-card"><h2>Registrado hoje</h2><strong>{brief.completed.length} concluídas</strong><p>{activeGoals.length} metas ativas neste período.</p></div></div><h3>Prioridades sugeridas</h3>{brief.priorities.length ? <div className="list">{brief.priorities.map((task) => <div className="list-row" key={task.id}><Link className="row-title" href={`/tarefas/${task.id}`}>{task.title}</Link><span className="muted">{visiblePriority(task)}{task.due_at && new Date(task.due_at) < now ? " · prazo vencido" : ""}</span></div>)}</div> : <p className="muted">Sem tarefas abertas para recomendar.</p>}</section>
    <section className="section"><div className="section-heading"><h2>Próximas tarefas</h2><Link href="/tarefas">Ver todas</Link></div>{ordered.length ? <div className="list">{ordered.slice(0, 5).map((task) => <div className="list-row" key={task.id}><div><Link className="row-title" href={`/tarefas/${task.id}`}>{task.title}</Link><p>{companies.find((company) => company.id === task.company_id)?.name ?? "Área transversal"} · {visiblePriority(task)} · {formatDate(task.due_at)}</p></div><form action={completeTask}><input type="hidden" name="id" value={task.id} /><button className="button secondary small" type="submit">Concluir</button></form></div>)}</div> : <EmptyState title="Nenhuma tarefa por enquanto." description="Converta uma demanda da inbox ou crie uma tarefa." action={{ href: "/tarefas/novo", label: "Criar tarefa" }} />}</section>
    <div className="quick-summary"><Link href="/inbox"><strong>{openInbox}</strong><span>Demandas na inbox</span></Link><Link href="/tarefas"><strong>{overdue.length}</strong><span>Tarefas vencidas</span></Link><Link href="/empresas"><strong>{companies.filter((company) => company.status === "active").length}</strong><span>Operações ativas</span></Link></div></>;
}

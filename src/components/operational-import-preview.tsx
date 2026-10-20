import { importOperationalAgenda } from "@/app/actions";
import { operationalProposalKey, type buildOperationalAgenda } from "@/lib/operational-agenda";

type Proposal = ReturnType<typeof buildOperationalAgenda>;
type ExistingDay = { date: string; operational?: boolean; events: Array<{ id: string; title: string; starts_at: string; ends_at: string; status?: string }> };
const localHour = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Fortaleza", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));

export function OperationalImportPreview({ proposal, existingDays, now = new Date() }: { proposal: Proposal; existingDays: ExistingDay[]; now?: Date }) {
  const alreadyApplied = existingDays.some((day) => day.operational);
  const conflicts = proposal.days.flatMap((day) => {
    const events = existingDays.find((item) => item.date === day.day)?.events ?? [];
    return day.slots.filter((slot) => slot.mode !== "flexible").flatMap((slot) => events.filter((event) =>
      event.status === "confirmed" && new Date(event.ends_at) > now && localHour(event.starts_at) < slot.ends_at && slot.starts_at < localHour(event.ends_at))
      .map((event) => `${day.day} ${slot.starts_at}–${slot.ends_at}: ${slot.title} × ${event.title}`));
  });
  const fatal = proposal.issues.some((issue) => issue.startsWith("Operação ausente") || issue.startsWith("Projeto ou vínculo ausente") || issue.startsWith("Rotinas sobrepostas"));
  return <section className="section"><div className="section-heading"><h2>Importar agenda operacional · 20 a 24/10</h2><span className="muted">19 modelos de rotina · 18 tarefas propostas</span></div>
    <p className="muted">Prévia do arquivo versionado. As rotinas desta semana substituem apenas a exibição dos blocos antigos nessas datas; a carga histórica permanece no banco. Nenhuma tarefa ou reserva é concluída automaticamente.</p>
    <details><summary>Conferir rotinas e intervalos protegidos</summary><div className="list">{proposal.source.recurrent_blocks.map((block) => <div className="list-row" key={block.source_key}><div><strong>{block.title}</strong><p>{block.days.join(", ")} · {block.starts_at}–{block.ends_at} · {block.kind === "unavailable" ? "Protegido" : "Rotina fixa"}</p></div></div>)}</div></details>
    <details open={!alreadyApplied}><summary>Conferir tarefas e horários propostos</summary><div className="list">{proposal.source.concrete_execution_blocks.map((block, index) => {
      const task = proposal.tasks[index];
      const passed = new Date(`${block.date}T${block.ends_at}:00-03:00`) < now;
      return <div className="list-row" key={block.source_key}><div><strong>{block.title}</strong><p>{block.date.slice(8, 10)}/{block.date.slice(5, 7)} · {block.starts_at}–{block.ends_at} · {block.priority} · {task.match ? `Reutilizar tarefa existente (${task.match.status})` : "Nova tarefa"}{passed ? " · Horário passado: execução a confirmar e replanejar" : " · Horário ainda não reservado"}</p></div></div>;
    })}</div></details>
    {proposal.issues.length ? <div className="notice"><strong>Vínculos a revisar:</strong><ul>{proposal.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div> : null}
    {conflicts.length ? <div className="notice"><strong>Conflitos com reservas existentes:</strong><ul>{conflicts.map((issue) => <li key={issue}>{issue}</li>)}</ul></div> : null}
    {alreadyApplied ? <p className="muted">Programação operacional já aplicada. Repetir a importação não cria tarefas duplicadas.</p> : <form action={importOperationalAgenda}><input type="hidden" name="proposal_key" value={operationalProposalKey(proposal)} /><button className="button primary" type="submit" disabled={fatal || conflicts.length > 0}>Aplicar rotinas e tarefas após conferir</button></form>}
  </section>;
}

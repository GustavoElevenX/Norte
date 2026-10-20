import Link from "next/link";
import { completeTask, setTaskStatus } from "@/app/actions";

type Slot = { id: string; title: string; starts_at: string; ends_at: string; mode: string; priority: string | null; company_id: string | null; project_id: string | null; alternative_project_id: string | null };
type Event = { id: string; title: string; starts_at: string; ends_at: string; event_type: string; company_id: string | null; task_id: string | null; status?: string };
const hour = (value: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" }).format(new Date(value));

export function ScheduleList({ slots, events = [], companyId, colors = {}, now = new Date(), date }: { slots: Slot[]; events?: Event[]; companyId: string | null; colors?: Record<string, string>; now?: Date; date?: string }) {
  const visible = slots.filter((slot) => !companyId || slot.company_id === companyId || slot.mode === "unavailable");
  const visibleEvents = events.filter((event) => !companyId || event.company_id === companyId);
  if (!visible.length && !visibleEvents.length) return <p className="muted">Nenhum bloco ou compromisso para este dia.</p>;
  const items = [...visible.map((slot) => ({ kind: "slot" as const, start: slot.starts_at.slice(0, 5), slot })), ...visibleEvents.map((event) => ({ kind: "event" as const, start: hour(event.starts_at), event }))].sort((a, b) => a.start.localeCompare(b.start));
  const localNow = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now).replace(" ", "T");
  const label = (start: string, end: string) => !date ? "" : `${date}T${start}` <= localNow && localNow < `${date}T${end}` ? "Agora · " : `${date}T${end}` <= localNow ? "Pendente de confirmação · " : "Próximo · ";
  return <div className="schedule-list">{items.map((item) => item.kind === "slot" ? <div className={`schedule-slot ${item.slot.mode}`} key={`slot-${item.slot.id}`} style={item.slot.mode === "unavailable" ? undefined : { borderLeftColor: item.slot.company_id ? colors[item.slot.company_id] : "#7251a2" }}>
    <time>{item.slot.starts_at.slice(0, 5)}–{item.slot.ends_at.slice(0, 5)}</time>
    <div><strong>{item.slot.project_id ? <Link href={`/projetos/${item.slot.project_id}`}>{item.slot.title}</Link> : item.slot.title}</strong>
      <p>{label(item.slot.starts_at.slice(0, 5), item.slot.ends_at.slice(0, 5))}{item.slot.mode === "unavailable" ? "Protegido · indisponível" : item.slot.mode === "routine" ? "Rotina fixa" : item.slot.mode === "flexible" ? "Janela de trabalho flexível" : "Janela de trabalho protegida"}{item.slot.priority ? ` · ${item.slot.priority}` : ""}</p></div>
  </div> : <div className="schedule-slot occupied" key={`event-${item.event.id}`}><time>{hour(item.event.starts_at)}–{hour(item.event.ends_at)}</time><div><strong>{item.event.task_id ? <Link href={`/tarefas/${item.event.task_id}`}>{item.event.title}</Link> : item.event.title}</strong><p>{item.event.status === "completed" ? "Concluído · " : label(hour(item.event.starts_at), hour(item.event.ends_at))}{item.event.event_type === "execution" ? "Execução reservada" : "Compromisso"} · horário ocupado</p>{item.event.task_id && item.event.status === "confirmed" ? <div className="row-actions"><form action={setTaskStatus}><input type="hidden" name="id" value={item.event.task_id} /><button className="plain-button" name="status" value="in_progress">Iniciar</button><button className="plain-button" name="status" value="blocked">Bloqueada</button><button className="plain-button" name="status" value="todo">Adiar</button></form><form action={completeTask}><input type="hidden" name="id" value={item.event.task_id} /><button className="plain-button">Concluir tarefa</button></form></div> : null}</div></div>)}</div>;
}

import Link from "next/link";

type Slot = { id: string; title: string; starts_at: string; ends_at: string; mode: string; priority: string | null; company_id: string | null; project_id: string | null; alternative_project_id: string | null };
type Event = { id: string; title: string; starts_at: string; ends_at: string; event_type: string; company_id: string | null; task_id: string | null };
const hour = (value: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" }).format(new Date(value));

export function ScheduleList({ slots, events = [], companyId, colors = {} }: { slots: Slot[]; events?: Event[]; companyId: string | null; colors?: Record<string, string> }) {
  const visible = slots.filter((slot) => !companyId || slot.company_id === companyId || slot.mode === "unavailable");
  const visibleEvents = events.filter((event) => !companyId || event.company_id === companyId);
  if (!visible.length && !visibleEvents.length) return <p className="muted">Nenhum bloco ou compromisso para este dia.</p>;
  return <div className="schedule-list">{visible.map((slot) => <div className={`schedule-slot ${slot.mode}`} key={slot.id} style={slot.mode === "unavailable" ? undefined : { borderLeftColor: slot.company_id ? colors[slot.company_id] : "#7251a2" }}>
    <time>{slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}</time>
    <div><strong>{slot.project_id ? <Link href={`/projetos/${slot.project_id}`}>{slot.title}</Link> : slot.title}</strong>
      <p>{slot.mode === "unavailable" ? "Indisponível" : slot.mode === "flexible" ? "Janela de trabalho flexível" : "Janela de trabalho protegida"}{slot.priority ? ` · ${slot.priority}` : ""}</p></div>
  </div>)}{visibleEvents.map((event) => <div className="schedule-slot occupied" key={event.id}><time>{hour(event.starts_at)}–{hour(event.ends_at)}</time><div><strong>{event.task_id ? <Link href={`/tarefas/${event.task_id}`}>{event.title}</Link> : event.title}</strong><p>{event.event_type === "execution" ? "Execução reservada · horário ocupado" : "Compromisso · horário ocupado"}</p></div></div>)}</div>;
}

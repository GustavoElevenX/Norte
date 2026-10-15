import Link from "next/link";

type Slot = { id: string; title: string; starts_at: string; ends_at: string; mode: string; priority: string | null; company_id: string | null; project_id: string | null; alternative_project_id: string | null };

export function ScheduleList({ slots, companyId, colors = {} }: { slots: Slot[]; companyId: string | null; colors?: Record<string, string> }) {
  const visible = slots.filter((slot) => !companyId || slot.company_id === companyId || slot.mode === "unavailable");
  if (!visible.length) return <p className="muted">Nenhum bloco fixo para este dia.</p>;
  return <div className="schedule-list">{visible.map((slot) => <div className={`schedule-slot ${slot.mode}`} key={slot.id} style={slot.mode === "unavailable" ? undefined : { borderLeftColor: slot.company_id ? colors[slot.company_id] : "#7251a2" }}>
    <time>{slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}</time>
    <div><strong>{slot.project_id ? <Link href={`/projetos/${slot.project_id}`}>{slot.title}</Link> : slot.title}</strong>
      <p>{slot.mode === "unavailable" ? "Pausa ocupada" : slot.mode === "flexible" ? "Flexível · Sobi por padrão, Vetorne sob demanda" : "Rotina protegida"}{slot.priority ? ` · ${slot.priority}` : ""}</p></div>
  </div>)}</div>;
}

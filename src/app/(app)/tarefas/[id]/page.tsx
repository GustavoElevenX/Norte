import { notFound } from "next/navigation";
import { reserveTaskSlot } from "@/app/actions";
import { TaskForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";
import { suggestTaskSlots } from "@/lib/availability";
import { getClients, getCompanies, getProjects } from "@/lib/queries";
import { addDays, getSchedule, localDate } from "@/lib/schedule";

export default async function Tarefa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ id }, query, companies, clients, projects] = await Promise.all([params, searchParams, getCompanies(), getClients(), getProjects()]);
  const { supabase, workspace } = await getWorkspace();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).eq("workspace_id", workspace.id).single();
  if (!task) notFound();
  const today = localDate();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const [days, { data: reservations }] = await Promise.all([getSchedule(dates), supabase.from("calendar_events").select("*").eq("workspace_id", workspace.id).eq("task_id", id).eq("status", "confirmed").order("starts_at")]);
  const suggestions = suggestTaskSlots(task, days);
  return <><PageHeading title={task.title} description="Edite a tarefa e distribua sua execução nos blocos de trabalho." /><Notice {...query} />
    <TaskForm task={task} companies={companies} clients={clients} projects={projects} />
    <section className="section"><div className="section-heading"><h2>Execução na agenda</h2></div>
      {reservations?.length ? <div className="list">{reservations.map((event) => <div className="list-row" key={event.id}><strong>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(event.starts_at))}</strong><span className="muted">{task.estimated_minutes} min reservados</span></div>)}</div> : <p className="muted">Nenhuma execução reservada.</p>}
      {!task.estimated_minutes ? <p className="notice">Defina a duração estimada da tarefa para procurar vagas.</p> : suggestions.length ? <div className="list">{suggestions.map((slot) => <div className="list-row" key={slot.startsAt}><div><strong>{slot.date.split("-").reverse().join("/")} · {slot.start}–{slot.end}</strong><p>{slot.ruleTitle} · {slot.reason}</p></div><form action={reserveTaskSlot}><input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="starts_at" value={slot.startsAt} /><input type="hidden" name="ends_at" value={slot.endsAt} /><button className="button secondary small" type="submit">Confirmar horário</button></form></div>)}</div> : <p className="notice">Sem vaga compatível nos próximos 14 dias antes do prazo. Ajuste a duração, o bloco ou o prazo.</p>}
    </section></>;
}

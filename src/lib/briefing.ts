import { availableMinutes, type ScheduleDay } from "./availability.ts";
import { comparePlanningTasks } from "./week-planner.ts";

type Task = { id: string; title: string; status: string; priority: string | null; source_priority?: string | null; seed_key?: string | null; due_at: string | null; company_id: string | null; project_id?: string | null; estimated_minutes?: number | null };
type Completion = { task_id: string; completed_at: string };
const localDate = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

export function dailyBriefing(tasks: Task[], day: ScheduleDay, completions: Completion[], now: Date, companyId: string | null) {
  const scoped = tasks.filter((task) => !companyId || task.company_id === companyId);
  const open = scoped.filter((task) => !["done", "cancelled"].includes(task.status));
  const overdue = open.filter((task) => task.due_at && new Date(task.due_at) < now);
  const blocked = open.filter((task) => task.status === "blocked");
  const priorities = [...open].sort((a, b) => !a.source_priority && !b.source_priority && !a.seed_key?.startsWith("csm-week-") && !b.seed_key?.startsWith("csm-week-")
    ? (a.priority ?? "P9").localeCompare(b.priority ?? "P9") || (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999")
    : comparePlanningTasks(a, b)).slice(0, 3);
  const completedIds = new Set(completions.filter((item) => localDate(item.completed_at) === day.date).map((item) => item.task_id));
  return { priorities, overdue, blocked, completed: scoped.filter((task) => completedIds.has(task.id)), availableMinutes: availableMinutes(day),
    appointments: day.events.filter((event) => event.event_type === "appointment" && (!companyId || event.company_id === companyId)) };
}

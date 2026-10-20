import { fromFortalezaLocal } from "./dates.ts";
import { matchesWindow, type ScheduleDay } from "./availability.ts";
import { weeklyCsmDemands, weeklyCsmSeedPrefix } from "./weekly-csm-demands.ts";

export type PlanningTask = {
  id: string; title: string; company_id: string | null; project_id: string | null;
  estimated_minutes: number | null; due_at: string | null; priority: string | null;
  status: string; seed_key?: string | null; source_priority?: string | null;
};
export type PlannedItem = { taskId: string; title: string; date: string; start: string; end: string; startsAt: string; endsAt: string; minutes: number };
export type PlanningIssue = { taskId: string; title: string; reason: string; remainingMinutes: number };

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const localClock = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Fortaleza", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));

type PriorityTask = Pick<PlanningTask, "title" | "due_at" | "priority" | "source_priority" | "seed_key">;
export function visiblePriority(task: PriorityTask) {
  const csm = task.seed_key?.startsWith(weeklyCsmSeedPrefix)
    ? weeklyCsmDemands.find((item) => `${weeklyCsmSeedPrefix}${item.key}` === task.seed_key) : null;
  return task.source_priority ?? csm?.sourcePriority ?? (task.priority ? `${task.priority} · escala antiga` : "Sem prioridade");
}

function rank(task: PriorityTask) {
  const csm = task.seed_key?.startsWith(weeklyCsmSeedPrefix)
    ? weeklyCsmDemands.find((item) => `${weeklyCsmSeedPrefix}${item.key}` === task.seed_key) : null;
  return Number((task.source_priority ?? csm?.sourcePriority ?? "P0").slice(1));
}
export function comparePlanningTasks(a: PriorityTask, b: PriorityTask) {
  return (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999") || rank(b) - rank(a)
    || (a.priority ?? "P9").localeCompare(b.priority ?? "P9") || a.title.localeCompare(b.title);
}

function freeSegments(start: number, end: number, occupied: Array<[number, number]>) {
  let segments: Array<[number, number]> = [[start, end]];
  for (const [busyStart, busyEnd] of occupied) segments = segments.flatMap(([a, b]): Array<[number, number]> =>
    busyEnd <= a || busyStart >= b ? [[a, b]] : [
      ...(busyStart > a ? [[a, busyStart] as [number, number]] : []),
      ...(busyEnd < b ? [[busyEnd, b] as [number, number]] : []),
    ]);
  return segments;
}

/** Pure preview: nothing is persisted until the user approves the current proposal. */
export function planWeek(tasks: PlanningTask[], days: ScheduleDay[], now = new Date()) {
  const items: PlannedItem[] = [];
  const issues: PlanningIssue[] = [];
  const occupied = new Map(days.map((day) => [day.date, day.events.map((event) =>
    [minutes(localClock(event.starts_at)), minutes(localClock(event.ends_at))] as [number, number])
    .concat(day.slots.filter((slot) => slot.mode === "unavailable" || slot.mode === "routine").map((slot) =>
      [minutes(slot.starts_at), minutes(slot.ends_at)] as [number, number]))]));
  const ordered = tasks.filter((task) => !["done", "cancelled", "blocked"].includes(task.status))
    .sort(comparePlanningTasks);
  for (const task of ordered) {
    if (!task.estimated_minutes || task.estimated_minutes < 1) {
      issues.push({ taskId: task.id, title: task.title, reason: "Defina uma duração antes de planejar.", remainingMinutes: 0 });
      continue;
    }
    const reserved = days.flatMap((day) => day.events).filter((event) => event.task_id === task.id && (event.status === "completed" || new Date(event.ends_at) >= now))
      .reduce((sum, event) => sum + Math.round((new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime()) / 60000), 0);
    let remaining = Math.max(0, task.estimated_minutes - reserved);
    for (const day of days) {
      if (!remaining) break;
      for (const rule of day.slots.filter((slot) => matchesWindow(slot, task))) {
        if (!remaining) break;
        for (const [a, b] of freeSegments(minutes(rule.starts_at), minutes(rule.ends_at), occupied.get(day.date) ?? [])) {
          if (!remaining) break;
          const start = Math.ceil(a / 5) * 5;
          const earliest = fromFortalezaLocal(`${day.date}T${clock(start)}`);
          const actualStart = earliest < now ? Math.ceil((start + (now.getTime() - earliest.getTime()) / 60000) / 5) * 5 : start;
          const duration = Math.min(120, remaining, b - actualStart);
          if (duration < Math.min(15, remaining)) continue;
          const startsAt = fromFortalezaLocal(`${day.date}T${clock(actualStart)}`);
          const endsAt = fromFortalezaLocal(`${day.date}T${clock(actualStart + duration)}`);
          if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || (task.due_at && endsAt > new Date(task.due_at))) continue;
          items.push({ taskId: task.id, title: task.title, date: day.date, start: clock(actualStart), end: clock(actualStart + duration), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), minutes: duration });
          occupied.get(day.date)?.push([actualStart, actualStart + duration]);
          remaining -= duration;
        }
      }
    }
    if (remaining) issues.push({ taskId: task.id, title: task.title, reason: "Capacidade ou prazo insuficiente nas janelas compatíveis.", remainingMinutes: remaining });
  }
  return { items: items.sort((a, b) => a.startsAt.localeCompare(b.startsAt)), issues };
}

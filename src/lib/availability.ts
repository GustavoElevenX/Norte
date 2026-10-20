import { fromFortalezaLocal } from "./dates.ts";

export type WorkRule = { id: string; title: string; starts_at: string; ends_at: string; mode: string; company_id: string | null; project_id: string | null; alternative_project_id?: string | null };
export type BusyEvent = { id: string; starts_at: string; ends_at: string; title: string; event_type: string; company_id: string | null; task_id: string | null; status?: string };
export type ScheduleDay = { date: string; slots: WorkRule[]; events: BusyEvent[] };
export type CandidateTask = { id: string; company_id: string | null; project_id: string | null; estimated_minutes: number | null; due_at: string | null; priority: string | null };

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const localClock = (instant: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Fortaleza" }).format(new Date(instant));

export function matchesWindow(rule: WorkRule, task: CandidateTask) {
  if (rule.mode === "unavailable" || rule.mode === "routine") return false;
  if (rule.mode === "flexible") return true;
  if (rule.project_id) return rule.project_id === task.project_id || rule.alternative_project_id === task.project_id;
  return Boolean(rule.company_id && rule.company_id === task.company_id);
}

function subtract(start: number, end: number, occupied: Array<[number, number]>) {
  let free: Array<[number, number]> = [[start, end]];
  for (const [busyStart, busyEnd] of occupied) {
    free = free.flatMap(([a, b]): Array<[number, number]> => busyEnd <= a || busyStart >= b ? [[a, b]] : [
      ...(busyStart > a ? [[a, busyStart] as [number, number]] : []),
      ...(busyEnd < b ? [[busyEnd, b] as [number, number]] : []),
    ]);
  }
  return free;
}

export function availableMinutes(day: ScheduleDay) {
  const occupied: Array<[number, number]> = [
    ...day.slots.filter((slot) => slot.mode === "unavailable" || slot.mode === "routine").map((slot) => [minutes(slot.starts_at), minutes(slot.ends_at)] as [number, number]),
    ...day.events.map((event) => [minutes(localClock(event.starts_at)), minutes(localClock(event.ends_at))] as [number, number]),
  ];
  return day.slots.filter((slot) => slot.mode !== "unavailable" && slot.mode !== "routine").reduce((sum, slot) =>
    sum + subtract(minutes(slot.starts_at), minutes(slot.ends_at), occupied).reduce((free, [a, b]) => free + b - a, 0), 0);
}

export function suggestTaskSlots(task: CandidateTask, days: ScheduleDay[], now = new Date(), limit = 5) {
  if (!task.estimated_minutes || task.estimated_minutes < 1) return [];
  const suggestions: { date: string; start: string; end: string; startsAt: string; endsAt: string; ruleTitle: string; reason: string }[] = [];
  for (const day of days) {
    const occupied: Array<[number, number]> = [
      ...day.slots.filter((slot) => slot.mode === "unavailable" || slot.mode === "routine").map((slot) => [minutes(slot.starts_at), minutes(slot.ends_at)] as [number, number]),
      ...day.events.map((event) => [minutes(localClock(event.starts_at)), minutes(localClock(event.ends_at))] as [number, number]),
    ];
    for (const rule of day.slots.filter((slot) => matchesWindow(slot, task))) {
      for (const [start, end] of subtract(minutes(rule.starts_at), minutes(rule.ends_at), occupied)) {
        const candidate = Math.ceil(start / 5) * 5;
        if (candidate + task.estimated_minutes > end) continue;
        const startsAt = fromFortalezaLocal(`${day.date}T${clock(candidate)}`);
        const endsAt = fromFortalezaLocal(`${day.date}T${clock(candidate + task.estimated_minutes)}`);
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt < now) continue;
        if (task.due_at && endsAt > new Date(task.due_at)) continue;
        suggestions.push({ date: day.date, start: clock(candidate), end: clock(candidate + task.estimated_minutes), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), ruleTitle: rule.title,
          reason: rule.mode === "protected" ? "Bloco reservado para esta empresa ou projeto" : "Bloco flexível disponível" });
      }
    }
  }
  return suggestions.sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, limit);
}

const addDays = (date: string, days: number) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
const isoWeekday = (date: string) => { const day = new Date(`${date}T12:00:00Z`).getUTCDay(); return day || 7; };

export type Period = { start: string; end: string; partial: boolean };
type Planning = { task_id: string; planned_for: string; company_id: string | null; project_id: string | null; priority: string | null };
type Completion = { task_id: string; completed_at: string; company_id: string | null; project_id: string | null; priority: string | null; due_at: string | null };
type Inbox = { created_at: string; status: string };
type Execution = { completed_at: string | null; actual_minutes: number | null; company_id: string | null; project_id: string | null };
export type PerformanceData = { planning: Planning[]; completions: Completion[]; inbox: Inbox[]; executions: Execution[] };

const datePart = (instant: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instant));
const ratio = (part: number, total: number) => total ? Math.round(part / total * 1000) / 10 : null;
const prevMonth = (date: string) => {
  const [year, month] = date.split("-").map(Number);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}-01`;
};
const monthEnd = (start: string) => new Date(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)), 0)).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

export function periodPair(preset: "week" | "month" | "custom", today: string, customStart?: string, customEnd?: string): { current: Period; previous: Period } {
  let start: string;
  let end: string;
  let previousStart: string;
  let previousEnd: string;
  if (preset === "week") {
    start = addDays(today, 1 - isoWeekday(today)); end = today;
    previousStart = addDays(start, -7); previousEnd = addDays(previousStart, daysBetween(start, end));
  } else if (preset === "month") {
    start = `${today.slice(0, 7)}-01`; end = today;
    previousStart = prevMonth(start); previousEnd = addDays(previousStart, Math.min(daysBetween(start, end), daysBetween(previousStart, monthEnd(previousStart))));
  } else {
    if (!customStart || !customEnd || !/^\d{4}-\d{2}-\d{2}$/.test(customStart) || !/^\d{4}-\d{2}-\d{2}$/.test(customEnd) || customEnd < customStart || customEnd > today || daysBetween(customStart, customEnd) > 366)
      throw new Error("Escolha um período válido de até 366 dias, sem datas futuras.");
    start = customStart; end = customEnd;
    previousEnd = addDays(start, -1); previousStart = addDays(previousEnd, -daysBetween(start, end));
  }
  return { current: { start, end, partial: preset !== "custom" }, previous: { start: previousStart, end: previousEnd, partial: preset !== "custom" } };
}

export function calculatePerformance(data: PerformanceData, period: Period, companyId: string | null, projectId: string | null) {
  const scope = (item: { company_id?: string | null; project_id?: string | null }) => (!companyId || item.company_id === companyId) && (!projectId || item.project_id === projectId);
  const within = (date: string) => date >= period.start && date <= period.end;
  const plannedRows = data.planning.filter((item) => scope(item) && within(item.planned_for));
  const plannedIds = new Set(plannedRows.map((item) => item.task_id));
  const p1Ids = new Set(plannedRows.filter((item) => item.priority === "P1").map((item) => item.task_id));
  const completions = [...new Map(data.completions.filter((item) => scope(item) && within(datePart(item.completed_at)))
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at)).map((item) => [item.task_id, item])).values()];
  const completedIds = new Set(completions.map((item) => item.task_id));
  const completedPlanned = [...plannedIds].filter((id) => completedIds.has(id)).length;
  const completedP1 = [...p1Ids].filter((id) => completedIds.has(id)).length;
  const withDeadline = completions.filter((item) => item.due_at);
  const onTime = withDeadline.filter((item) => new Date(item.completed_at) <= new Date(item.due_at!)).length;
  const newDemands = companyId || projectId ? null : data.inbox.filter((item) => within(datePart(item.created_at))).length;
  const actualMinutes = data.executions.filter((item) => scope(item) && item.completed_at && within(datePart(item.completed_at))).reduce((sum, item) => sum + (item.actual_minutes ?? 0), 0);
  return { planned: plannedIds.size, completedPlanned, executionRate: ratio(completedPlanned, plannedIds.size), completed: completions.length,
    withDeadline: withDeadline.length, onTime, onTimeRate: ratio(onTime, withDeadline.length), plannedP1: p1Ids.size, completedP1,
    p1Rate: ratio(completedP1, p1Ids.size), newDemands, actualMinutes };
}

export function goalAttainment(target: number, actual: number) { return target > 0 ? ratio(actual, target) : null; }

export function compareValue(current: number, previous: number) {
  return { difference: current - previous, relativePercent: previous === 0 ? null : Math.round((current - previous) / previous * 1000) / 10 };
}

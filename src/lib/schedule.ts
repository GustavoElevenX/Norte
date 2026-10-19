import { getWorkspace } from "@/lib/auth";
import { weeklyCsmDemands } from "@/lib/weekly-csm-demands";
import { isMissingTable } from "@/lib/supabase/schema-error";

export const dayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export function companyScheduleColors(companies: { id: string; seed_key?: string | null; color: string }[]) {
  const known: Record<string, string> = { csm: "#0b7897", vertice: "#ad5b43", sobi: "#5b62ae", vetorne: "#3f8a62" };
  return Object.fromEntries(companies.map((company) => [company.id, known[company.seed_key ?? ""] ?? company.color]));
}

export function localDate(now = new Date(), timezone = "America/Fortaleza") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isoWeekday(date: string) {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function weekDates(date: string) {
  const start = new Date(`${date}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (isoWeekday(date) - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getSchedule(dates: string[]) {
  const { supabase, workspace } = await getWorkspace();
  const [{ data: rules, error: ruleError }, { data: exceptions, error: exceptionError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from("weekly_recurrence_rules").select("*").eq("workspace_id", workspace.id).order("weekday").order("starts_at"),
    supabase.from("weekly_recurrence_exceptions").select("*").eq("workspace_id", workspace.id).gte("occurs_on", dates[0]).lte("occurs_on", dates.at(-1)!),
    supabase.from("calendar_events").select("*").eq("workspace_id", workspace.id).neq("status", "cancelled")
      .gte("starts_at", `${dates[0]}T00:00:00-03:00`).lt("starts_at", `${addDays(dates.at(-1)!, 1)}T00:00:00-03:00`),
  ]);
  if (ruleError || exceptionError || (eventError && !isMissingTable(eventError))) throw new Error(ruleError?.message || exceptionError?.message || eventError?.message);
  return dates.map((date) => ({
    date,
    calendarEnabled: !eventError,
    events: (events ?? []).filter((event) => localDate(new Date(event.starts_at), workspace.timezone) === date).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    slots: (rules ?? []).filter((rule) => rule.weekday === isoWeekday(date) && rule.effective_from <= date).flatMap((rule) => {
      const exception = exceptions?.find((item) => item.rule_id === rule.id && item.occurs_on === date);
      if (exception?.action === "skip") return [];
      const weeklyFocus = date === "2026-10-19" && !exception?.title
        ? rule.seed_key === "routine-mo-1000" ? weeklyCsmDemands[0].title
          : rule.seed_key === "routine-mo-1300" ? weeklyCsmDemands[1].title : null
        : null;
      return [{ ...rule, title: exception?.title ?? weeklyFocus ?? rule.title, starts_at: exception?.starts_at ?? rule.starts_at, ends_at: exception?.ends_at ?? rule.ends_at, project_id: weeklyFocus ? null : exception?.project_id ?? rule.project_id }];
    }).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  }));
}

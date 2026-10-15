import { getWorkspace } from "@/lib/auth";

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
  const [{ data: rules, error: ruleError }, { data: exceptions, error: exceptionError }] = await Promise.all([
    supabase.from("weekly_recurrence_rules").select("*").eq("workspace_id", workspace.id).order("weekday").order("starts_at"),
    supabase.from("weekly_recurrence_exceptions").select("*").eq("workspace_id", workspace.id).gte("occurs_on", dates[0]).lte("occurs_on", dates.at(-1)!),
  ]);
  if (ruleError || exceptionError) throw new Error(ruleError?.message || exceptionError?.message);
  return dates.map((date) => ({
    date,
    slots: (rules ?? []).filter((rule) => rule.weekday === isoWeekday(date) && rule.effective_from <= date).flatMap((rule) => {
      const exception = exceptions?.find((item) => item.rule_id === rule.id && item.occurs_on === date);
      if (exception?.action === "skip") return [];
      return [{ ...rule, title: exception?.title ?? rule.title, starts_at: exception?.starts_at ?? rule.starts_at, ends_at: exception?.ends_at ?? rule.ends_at, project_id: exception?.project_id ?? rule.project_id }];
    }).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  }));
}

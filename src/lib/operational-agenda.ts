import source from "../../data/norte-agenda-2026-10-20-v1.json";
import { addDays, isoWeekday } from "./schedule.ts";
import { createHash } from "node:crypto";

type Company = { id: string; seed_key: string | null };
type Project = { id: string; seed_key: string | null; company_id: string | null };
type Task = { id: string; seed_key: string | null; title: string; company_id: string | null; project_id: string | null; status: string; due_at?: string | null };
export type OperationalSlot = { id: string; title: string; starts_at: string; ends_at: string; mode: "routine" | "unavailable" | "flexible"; company_id: string | null; project_id: string | null; alternative_project_id: null; priority: null };
export type OperationalDay = { day: string; version: string; slots: OperationalSlot[] };
export type OperationalTask = { source_key: string; title: string; description: string; company_id: string | null; project_id: string | null; parent_key: string | null; estimated_minutes: number; source_priority: string; due_at: string | null };

const weekdayCodes = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const windows = (day: string): Array<[string, string]> => isoWeekday(day) === 6
  ? [["08:00", "12:00"]] : [["08:00", "12:00"], ["13:30", "18:30"], ["20:30", "21:30"]];

export function validateOperationalSource() {
  if (source.meta.version !== "2026-10-20-v1" || source.meta.timezone !== "America/Fortaleza"
    || source.meta.period_start !== "2026-10-20" || source.meta.period_end !== "2026-10-24"
    || source.recurrent_blocks.length !== 19 || source.concrete_execution_blocks.length !== 18) throw new Error("Arquivo operacional inesperado.");
  const keys = [...source.recurrent_blocks, ...source.concrete_execution_blocks].map((item) => item.source_key);
  if (new Set(keys).size !== keys.length) throw new Error("Chave de origem duplicada.");
  for (const item of [...source.recurrent_blocks, ...source.concrete_execution_blocks]) {
    if (!/^\d{2}:\d{2}$/.test(item.starts_at) || !/^\d{2}:\d{2}$/.test(item.ends_at) || item.starts_at >= item.ends_at) throw new Error(`Horário inválido: ${item.source_key}`);
  }
  return source;
}

export function buildOperationalAgenda(companies: Company[], projects: Project[], tasks: Task[]) {
  validateOperationalSource();
  const companyByKey = new Map(companies.map((item) => [item.seed_key, item.id]));
  const projectByKey = new Map(projects.map((item) => [item.seed_key, item]));
  const issues: string[] = [];
  const companyId = (key: string | null) => {
    if (!key) return null;
    const id = companyByKey.get(key);
    if (!id) issues.push(`Operação ausente: ${key}`);
    return id ?? null;
  };
  const projectId = (key: string | null, company: string | null) => {
    if (!key) return null;
    const project = projectByKey.get(key);
    if (!project || project.company_id !== company) issues.push(`Projeto ou vínculo ausente: ${key}`);
    return project?.company_id === company ? project.id : null;
  };
  const days: OperationalDay[] = [];
  for (let day = source.meta.period_start; day <= source.meta.period_end; day = addDays(day, 1)) {
    const code = weekdayCodes[isoWeekday(day) - 1];
    const fixed: OperationalSlot[] = source.recurrent_blocks.filter((item) => item.days.includes(code)).map((item) => {
      const company = companyId(item.company_key);
      return { id: `${item.source_key}-${day}`, title: item.title, starts_at: item.starts_at, ends_at: item.ends_at,
        mode: item.kind as "routine" | "unavailable", company_id: company, project_id: projectId(item.project_key, company), alternative_project_id: null, priority: null };
    });
    fixed.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    for (let i = 1; i < fixed.length; i++) if (fixed[i - 1].ends_at > fixed[i].starts_at) issues.push(`Rotinas sobrepostas em ${day}.`);
    const flexible: OperationalSlot[] = [];
    for (const [start, end] of windows(day)) {
      let cursor = start;
      for (const item of fixed.filter((slot) => slot.starts_at < end && slot.ends_at > start)) {
        if (item.starts_at > cursor) flexible.push({ id: `window-${day}-${cursor}`, title: "Execução de tarefas", starts_at: cursor, ends_at: item.starts_at,
          mode: "flexible", company_id: null, project_id: null, alternative_project_id: null, priority: null });
        if (item.ends_at > cursor) cursor = item.ends_at;
      }
      if (cursor < end) flexible.push({ id: `window-${day}-${cursor}`, title: "Execução de tarefas", starts_at: cursor, ends_at: end,
        mode: "flexible", company_id: null, project_id: null, alternative_project_id: null, priority: null });
    }
    days.push({ day, version: source.meta.version, slots: [...fixed, ...flexible].sort((a, b) => a.starts_at.localeCompare(b.starts_at)) });
  }
  const newTasks: OperationalTask[] = source.concrete_execution_blocks.map((item) => {
    const company = companyId(item.company_key);
    const project = projectId(item.project_key, company);
    const parent = tasks.find((task) => task.seed_key === item.deliverable_key);
    if (item.deliverable_key && !parent) issues.push(`Entrega vinculável ainda ausente: ${item.deliverable_key}`);
    return { source_key: item.source_key, title: item.title, description: item.notes, company_id: company, project_id: project,
      parent_key: item.deliverable_key, estimated_minutes: item.estimated_minutes, source_priority: item.priority,
      due_at: item.source_key === "plan-2026-10-24-1100-jfk-delivery-digital" ? "2026-10-24T15:00:00.000Z" : parent?.due_at ?? null };
  });
  const existing = newTasks.map((item) => ({ ...item, match: tasks.find((task) => task.seed_key === item.source_key
    || task.company_id === item.company_id && task.project_id === item.project_id
      && task.title.toLocaleLowerCase("pt-BR") === item.title.toLocaleLowerCase("pt-BR")) ?? null }));
  return { days, tasks: existing, issues: [...new Set(issues)], source };
}

export function operationalProposalKey(proposal: ReturnType<typeof buildOperationalAgenda>) {
  return createHash("sha256").update(JSON.stringify({ days: proposal.days, tasks: proposal.tasks })).digest("hex");
}

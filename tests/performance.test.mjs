import test from "node:test";
import assert from "node:assert/strict";
import { calculatePerformance, compareValue, goalAttainment, periodPair } from "../src/lib/performance.ts";
import { assistantPolicy } from "../src/lib/assistant-policy.ts";
import { dailyBriefing } from "../src/lib/briefing.ts";

test("semana e mês em andamento usam dias equivalentes na comparação", () => {
  assert.deepEqual(periodPair("week", "2026-10-15"), { current: { start: "2026-10-12", end: "2026-10-15", partial: true }, previous: { start: "2026-10-05", end: "2026-10-08", partial: true } });
  assert.deepEqual(periodPair("month", "2026-03-31").previous, { start: "2026-02-01", end: "2026-02-28", partial: true });
});

test("métricas expõem denominador e ignoram criação sem planejamento", () => {
  const data = { planning: [{ task_id: "a", planned_for: "2026-10-15", company_id: "csm", project_id: null, priority: "P1" }, { task_id: "b", planned_for: "2026-10-15", company_id: "csm", project_id: null, priority: "P3" }],
    completions: [{ task_id: "a", completed_at: "2026-10-15T14:00:00Z", company_id: "csm", project_id: null, priority: "P1", due_at: "2026-10-15T15:00:00Z" }, { task_id: "c", completed_at: "2026-10-15T14:00:00Z", company_id: "vertice", project_id: null, priority: "P3", due_at: null }],
    inbox: [], executions: [] };
  const result = calculatePerformance(data, { start: "2026-10-15", end: "2026-10-15", partial: false }, "csm", null);
  assert.equal(result.planned, 2);
  assert.equal(result.executionRate, 50);
  assert.equal(result.p1Rate, 100);
  assert.equal(result.onTimeRate, 100);
  assert.equal(result.completed, 1);
  assert.equal(result.newDemands, null);
});

test("sem denominador não produz porcentagem falsa", () => {
  const empty = calculatePerformance({ planning: [], completions: [], inbox: [], executions: [] }, { start: "2026-10-01", end: "2026-10-15", partial: true }, null, null);
  assert.equal(empty.executionRate, null);
  assert.equal(empty.onTimeRate, null);
  assert.equal(goalAttainment(0, 5), null);
  assert.equal(compareValue(5, 0).relativePercent, null);
});

test("N0 e N1 nunca executam mutação automaticamente", () => {
  assert.equal(assistantPolicy("N0", "create_task"), "suggest_only");
  assert.equal(assistantPolicy("N1", "schedule_task"), "requires_approval");
});

test("resumo preserva prioridade estratégica e destaca prazo vencido separado", () => {
  const tasks = [{ id: "p1", title: "Estratégia", status: "todo", priority: "P1", due_at: null, company_id: "csm" }, { id: "p3", title: "Prazo", status: "todo", priority: "P3", due_at: "2026-10-15T12:00:00Z", company_id: "csm" }];
  const brief = dailyBriefing(tasks, { date: "2026-10-15", slots: [], events: [] }, [], new Date("2026-10-15T15:00:00Z"), "csm");
  assert.equal(brief.priorities[0].id, "p1");
  assert.equal(brief.overdue[0].id, "p3");
});

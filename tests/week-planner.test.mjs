import test from "node:test";
import assert from "node:assert/strict";
import { planWeek, visiblePriority } from "../src/lib/week-planner.ts";

const slot = (id, start, end, mode = "flexible") => ({ id, title: id, starts_at: start, ends_at: end, mode, company_id: null, project_id: null });
const task = (id, minutes, extra = {}) => ({ id, title: id, company_id: null, project_id: null, estimated_minutes: minutes,
  due_at: null, priority: "P2", status: "todo", ...extra });
const days = [
  { date: "2026-10-20", slots: [slot("work", "10:00", "12:00"), slot("lunch", "12:00", "13:30", "unavailable"), slot("afternoon", "13:30", "15:00")], events: [] },
  { date: "2026-10-24", slots: [slot("saturday", "08:00", "12:00")], events: [] },
];
const now = new Date("2026-10-20T12:00:00Z");

test("distribui sem invadir almoço ou passado e inclui sábado", () => {
  const result = planWeek([task("large", 330)], days, now);
  assert.equal(result.items.reduce((sum, item) => sum + item.minutes, 0), 330);
  assert.ok(result.items.some((item) => item.date === "2026-10-24"));
  assert.ok(result.items.every((item) => item.date !== "2026-10-20" || item.end <= "12:00" || item.start >= "13:30"));
  assert.ok(result.items.every((item) => item.date !== "2026-10-24" || item.end <= "12:00"));
});

test("respeita compromisso, ignora bloqueada e informa duração ausente", () => {
  const booked = [{ ...days[0], events: [{ id: "meeting", title: "Reunião", event_type: "appointment", company_id: null, task_id: null,
    starts_at: "2026-10-20T13:00:00Z", ends_at: "2026-10-20T14:00:00Z" }] }, days[1]];
  const result = planWeek([task("one", 60), task("blocked", 45, { status: "blocked" }), task("unknown", null)], booked, now);
  assert.equal(result.items[0].start, "11:00");
  assert.ok(!result.items.some((item) => item.taskId === "blocked"));
  assert.equal(result.issues[0].taskId, "unknown");
});

test("usa P4 de origem sem reinterpretar silenciosamente a prioridade antiga", () => {
  assert.equal(visiblePriority(task("csm", 30, { seed_key: "csm-week-2026-10-19-pdv-stock", priority: "P1" })), "P4");
  assert.equal(visiblePriority(task("legacy", 30)), "P2 · escala antiga");
});

test("replaneja somente no futuro e mantém rotina fixa fora da capacidade", () => {
  const operational = [{ date: "2026-10-20", slots: [slot("execution", "16:00", "17:30"), slot("vetorne", "17:30", "18:00", "routine"),
    slot("night", "20:30", "21:30")], events: [] }];
  const result = planWeek([task("unfinished", 60)], operational, new Date("2026-10-20T20:48:00Z"));
  assert.equal(result.items[0].start, "20:30");
  assert.equal(result.items[0].end, "21:30");
});

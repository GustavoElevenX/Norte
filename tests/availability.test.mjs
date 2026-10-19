import test from "node:test";
import assert from "node:assert/strict";
import { availableMinutes, suggestTaskSlots } from "../src/lib/availability.ts";

const rule = (mode, start, end, company = null, project = null) => ({ id: `${mode}-${start}`, title: mode, starts_at: start, ends_at: end, mode, company_id: company, project_id: project });
const task = { id: "task", company_id: "csm", project_id: "delivery", estimated_minutes: 40, due_at: null, priority: "P1" };
const day = { date: "2026-10-19", slots: [rule("protected", "08:00", "10:00", "csm", "delivery"), rule("unavailable", "12:00", "13:00"), rule("flexible", "13:00", "14:00")], events: [] };
const now = new Date("2026-10-18T12:00:00Z");

test("sugere execução no bloco do projeto, sem tratar bloco de trabalho como ocupado", () => {
  const slots = suggestTaskSlots(task, [day], now);
  assert.equal(slots[0].start, "08:00");
  assert.equal(slots[0].startsAt, "2026-10-19T11:00:00.000Z");
  assert.equal(availableMinutes(day), 180);
});

test("compromisso ocupa tempo e desloca a sugestão", () => {
  const occupied = { ...day, events: [{ id: "meeting", title: "Reunião", event_type: "appointment", company_id: null, task_id: null, starts_at: "2026-10-19T11:00:00Z", ends_at: "2026-10-19T11:30:00Z" }] };
  assert.equal(suggestTaskSlots(task, [occupied], now)[0].start, "08:30");
  assert.equal(availableMinutes(occupied), 150);
});

test("bloco protegido de outro projeto não aceita tarefa e prazo limita o encaixe", () => {
  const other = { ...task, project_id: "outro", due_at: "2026-10-19T15:00:00Z" };
  assert.deepEqual(suggestTaskSlots(other, [day], now), []);
});

test("sem intervalo suficiente não inventa vaga", () => {
  assert.deepEqual(suggestTaskSlots({ ...task, estimated_minutes: 130 }, [day], now), []);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seed = JSON.parse(readFileSync(new URL("../data/norte-inicial-2026-10-15-v1.json", import.meta.url), "utf8"));

test("carga canônica tem chaves únicas e relações válidas", () => {
  const counts = { operations: 4, areas: 1, clients: 3, projects: 15, demand_contexts: 32, weekly_schedule: 39 };
  for (const [type, count] of Object.entries(counts)) {
    assert.equal(seed[type].length, count);
    assert.equal(new Set(seed[type].map((item) => item.key)).size, count);
  }
  const companies = new Set(seed.operations.map((item) => item.key));
  const areas = new Set(seed.areas.map((item) => item.key));
  const clients = new Set(seed.clients.map((item) => item.key));
  const projects = new Set(seed.projects.map((item) => item.key));
  assert.deepEqual([...seed.clients.map((item) => item.company_key)], ["vertice", "vertice", "vertice"]);
  for (const item of seed.projects) {
    if (item.company_key) assert.ok(companies.has(item.company_key));
    if (item.area_key) assert.ok(areas.has(item.area_key));
    if (item.client_key) assert.ok(clients.has(item.client_key));
  }
  for (const item of seed.demand_contexts) assert.ok(projects.has(item.project_key));
  assert.ok(seed.projects.some((item) => item.area_key === "jfk" && item.company_key === null));
});

test("agenda cobre 45 horas úteis, 5 almoços e não sobrepõe slots", () => {
  let work = 0;
  let lunch = 0;
  for (const day of ["MO", "TU", "WE", "TH", "FR"]) {
    const slots = seed.weekly_schedule.filter((slot) => slot.day === day).sort((a, b) => a.start.localeCompare(b.start));
    let cursor = "08:00";
    for (const slot of slots) {
      assert.equal(slot.start, cursor);
      const duration = (Number(slot.end.slice(0, 2)) * 60 + Number(slot.end.slice(3))) - (Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3)));
      assert.ok(duration > 0);
      if (slot.mode === "unavailable") lunch += duration; else work += duration;
      cursor = slot.end;
    }
    assert.equal(cursor, "18:00");
  }
  assert.equal(work, 45 * 60);
  assert.equal(lunch, 5 * 60);
  const friday = seed.weekly_schedule.filter((slot) => slot.day === "FR" && slot.start === "17:00");
  assert.equal(friday.length, 1);
  assert.equal(friday[0].mode, "flexible");
  assert.equal(friday[0].alternative_project_key, "vetorne-comercial");
});

test("histórico não ganha conclusão ou prazo", () => {
  for (const item of seed.demand_contexts) {
    assert.equal(item.deadline, null);
    assert.equal(item.completion, null);
  }
  for (const slot of seed.weekly_schedule) {
    assert.equal(slot.deadline, null);
    assert.equal(slot.completed, false);
  }
});

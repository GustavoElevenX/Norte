import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agenda = JSON.parse(readFileSync(new URL("../data/norte-agenda-2026-10-20-v1.json", import.meta.url), "utf8"));
const canonical = JSON.parse(readFileSync(new URL("../data/norte-inicial-2026-10-15-v1.json", import.meta.url), "utf8"));
const dates = { TU: "2026-10-20", WE: "2026-10-21", TH: "2026-10-22", FR: "2026-10-23", SA: "2026-10-24" };

test("agenda operacional tem chaves únicas e vínculos da carga histórica", () => {
  assert.equal(agenda.recurrent_blocks.length, 19);
  assert.equal(agenda.concrete_execution_blocks.length, 18);
  const keys = [...agenda.recurrent_blocks, ...agenda.concrete_execution_blocks].map((item) => item.source_key);
  assert.equal(new Set(keys).size, keys.length);
  const companies = new Set(canonical.operations.map((item) => item.key));
  const projects = new Map(canonical.projects.map((item) => [item.key, item]));
  for (const item of [...agenda.recurrent_blocks, ...agenda.concrete_execution_blocks]) {
    if (item.company_key) assert.ok(companies.has(item.company_key), item.source_key);
    if (item.project_key) assert.equal(projects.get(item.project_key)?.company_key ?? null, item.company_key, item.source_key);
  }
});

test("rotinas não se sobrepõem e sábado termina ao meio-dia", () => {
  for (const [code, date] of Object.entries(dates)) {
    const blocks = agenda.recurrent_blocks.filter((item) => item.days.includes(code)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    for (let i = 1; i < blocks.length; i++) assert.ok(blocks[i - 1].ends_at <= blocks[i].starts_at, `${date}: ${blocks[i].source_key}`);
    const concrete = agenda.concrete_execution_blocks.filter((item) => item.date === date).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    for (const item of concrete) {
      assert.ok(!blocks.some((fixed) => fixed.starts_at < item.ends_at && item.starts_at < fixed.ends_at), `${date}: ${item.source_key}`);
      if (code === "SA") assert.ok(item.ends_at <= "12:00");
    }
  }
  const tuesday = agenda.recurrent_blocks.filter((item) => item.days.includes("TU"));
  assert.ok(tuesday.some((item) => item.kind === "unavailable" && item.starts_at === "12:00" && item.ends_at === "13:30"));
  assert.ok(tuesday.some((item) => item.kind === "unavailable" && item.starts_at === "19:00" && item.ends_at === "20:00"));
  assert.ok(tuesday.some((item) => item.kind === "unavailable" && item.starts_at === "21:30" && item.ends_at === "22:00"));
});

test("blocos propostos não afirmam conclusão", () => {
  assert.ok(agenda.concrete_execution_blocks.every((item) => item.state === "not_confirmed"));
  assert.deepEqual(agenda.meta.current_user_priority_order, ["P4", "P3", "P2", "P1"]);
});

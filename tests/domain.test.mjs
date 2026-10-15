import test from "node:test";
import assert from "node:assert/strict";
import { fromFortalezaLocal } from "../src/lib/dates.ts";
import { companySchema } from "../src/lib/validation.ts";

test("prazo local atravessa virada de ano em UTC", () => {
  assert.equal(fromFortalezaLocal("2026-12-31T23:30").toISOString(), "2027-01-01T02:30:00.000Z");
  assert.ok(Number.isNaN(fromFortalezaLocal("2026-02-30T12:00").getTime()));
});

test("CNPJ opcional é validado e normalizado", () => {
  const base = { name: "Empresa", segment: "", description: "", color: "#0c6980", status: "active" };
  assert.equal(companySchema.parse({ ...base, cnpj: "04.252.011/0001-10" }).cnpj, "04252011000110");
  assert.equal(companySchema.safeParse({ ...base, cnpj: "04.252.011/0001-11" }).success, false);
  assert.equal(companySchema.parse({ ...base, cnpj: "" }).cnpj, null);
});

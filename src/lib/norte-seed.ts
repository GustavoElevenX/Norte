import payload from "../../data/norte-inicial-2026-10-15-v1.json";

export const norteSeed = payload;

export function validateNorteSeed() {
  const expected = { operations: 4, areas: 1, clients: 3, projects: 15, demand_contexts: 32, weekly_schedule: 39 } as const;
  for (const [name, count] of Object.entries(expected)) {
    const items = payload[name as keyof typeof expected];
    if (items.length !== count || new Set(items.map((item) => item.key)).size !== count) {
      throw new Error(`Carga Norte inválida: ${name}`);
    }
  }
  const companies = new Set(payload.operations.map((item) => item.key));
  const areas = new Set(payload.areas.map((item) => item.key));
  const clients = new Set(payload.clients.map((item) => item.key));
  const projects = new Set(payload.projects.map((item) => item.key));
  for (const item of payload.clients) if (!companies.has(item.company_key)) throw new Error(`Empresa ausente: ${item.key}`);
  for (const item of payload.projects) {
    if (item.company_key && !companies.has(item.company_key)) throw new Error(`Empresa ausente: ${item.key}`);
    if (item.area_key && !areas.has(item.area_key)) throw new Error(`Área ausente: ${item.key}`);
    if (item.client_key && !clients.has(item.client_key)) throw new Error(`Cliente ausente: ${item.key}`);
  }
  for (const item of payload.demand_contexts) if (!projects.has(item.project_key)) throw new Error(`Projeto ausente: ${item.key}`);
  const weekdays = ["MO", "TU", "WE", "TH", "FR"];
  for (const day of weekdays) {
    const slots = payload.weekly_schedule.filter((item) => item.day === day).sort((a, b) => a.start.localeCompare(b.start));
    let end = "08:00";
    let lunch = 0;
    for (const slot of slots) {
      if (slot.start !== end || slot.end <= slot.start || slot.timezone !== payload.metadata.timezone || slot.effective_from !== payload.metadata.effective_from) throw new Error(`Agenda inválida: ${day}`);
      if (slot.project_key && !projects.has(slot.project_key)) throw new Error(`Projeto ausente: ${slot.key}`);
      if (slot.company_key && !companies.has(slot.company_key)) throw new Error(`Empresa ausente: ${slot.key}`);
      if (slot.mode === "unavailable") lunch++;
      end = slot.end;
    }
    if (end !== "18:00" || lunch !== 1) throw new Error(`Jornada inválida: ${day}`);
  }
  return payload;
}

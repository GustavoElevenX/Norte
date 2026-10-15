/** Converts a datetime-local value in America/Fortaleza to a UTC instant. */
export function fromFortalezaLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(NaN);
  const guess = new Date(`${value}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localAtGuess = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  const offset = localAtGuess - guess.getTime();
  const result = new Date(guess.getTime() - offset);
  const verified = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(result);
  const q = Object.fromEntries(verified.map(({ type, value }) => [type, value]));
  return `${q.year}-${q.month}-${q.day}T${q.hour}:${q.minute}` === value ? result : new Date(NaN);
}

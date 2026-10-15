import Link from "next/link";

export function PageHeading({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  return <div className="page-heading"><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action ? <Link className="button primary" href={action.href}>{action.label}</Link> : null}</div>;
}
export function Notice({ error, message }: { error?: string; message?: string }) {
  return error ? <p role="alert" className="notice error">{error}</p> : message ? <p role="status" className="notice">{message}</p> : null;
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  return <div className="empty-state"><div className="empty-icon" aria-hidden="true">□</div><h2>{title}</h2>{description ? <p>{description}</p> : null}{action ? <Link className="button secondary" href={action.href}>{action.label}</Link> : null}</div>;
}
export function Field({ label, name, defaultValue, type = "text", required = false, placeholder, min, max }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string; min?: number; max?: number }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} min={min} max={max} /></label>;
}
export function TextArea({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string | null; placeholder?: string }) {
  return <label className="field"><span>{label}</span><textarea name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={4} /></label>;
}
export function SelectField({ label, name, options, defaultValue, required }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string | null; required?: boolean }) {
  return <label className="field"><span>{label}</span><select name={name} defaultValue={defaultValue ?? ""} required={required}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
export function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(value));
}
export function dueInput(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Fortaleza" }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

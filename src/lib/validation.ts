import { z } from "zod";

export const uuid = z.string().uuid();
export const optionalUuid = z.union([uuid, z.literal("")]).transform((value) => value || null);
function validCnpj(input: string) {
  if (!input) return true;
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const check = (length: number) => {
    let weight = length - 7;
    const sum = digits.slice(0, length).split("").reduce((total, digit) => {
      const next = total + Number(digit) * weight;
      weight = weight === 2 ? 9 : weight - 1;
      return next;
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
}
export const companySchema = z.object({
  name: z.string().trim().min(1).max(120),
  segment: z.string().trim().max(120),
  description: z.string().trim().max(4000),
  cnpj: z.string().trim().max(18).refine(validCnpj, "CNPJ inválido").transform((value) => value ? value.replace(/\D/g, "") : null),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  status: z.enum(["active", "archived"]),
});
export const clientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company_id: uuid,
  notes: z.string().trim().max(4000),
  email: z.union([z.email(), z.literal("")]),
  phone: z.string().trim().max(40),
  status: z.enum(["active", "archived"]),
});
export const projectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  company_id: optionalUuid,
  client_id: optionalUuid,
  description: z.string().trim().max(8000),
  goal_text: z.string().trim().max(4000),
  status: z.enum(["active", "paused", "done", "archived"]),
});
export const taskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(8000),
  company_id: optionalUuid,
  project_id: optionalUuid,
  client_id: optionalUuid,
  status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]),
  priority: z.union([z.enum(["P1", "P2", "P3"]), z.literal("")]).transform((value) => value || null),
  source_priority: z.union([z.enum(["P1", "P2", "P3", "P4"]), z.literal("")]).transform((value) => value || null),
  due_at: z.string(),
  estimated_minutes: z.string(),
});

export function formString(form: FormData, key: string) { return String(form.get(key) ?? ""); }

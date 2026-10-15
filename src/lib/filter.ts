import { cookies } from "next/headers";
export async function selectedCompanyId(companies: { id: string }[]) {
  const id = (await cookies()).get("company_filter")?.value;
  return companies.some((company) => company.id === id) ? id! : null;
}

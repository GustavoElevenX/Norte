import { CompanyForm } from "@/components/forms";
import { Notice, PageHeading } from "@/components/ui";
export default async function NovaEmpresa({ searchParams }: { searchParams: Promise<{ error?: string }> }) { return <><PageHeading title="Nova empresa" description="Comece pelo nome; os demais dados podem ser alterados depois." /><Notice {...await searchParams} /><CompanyForm /></>; }

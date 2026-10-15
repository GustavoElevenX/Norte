import { runNorteSeed } from "@/app/actions";
import { PageHeading, Notice } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";
import { workspaceDisplayName } from "@/lib/workspace-name";

const labels: Record<string, string> = {
  operations: "Frentes de trabalho",
  areas: "Áreas estratégicas",
  clients: "Clientes",
  projects: "Projetos",
  demand_contexts: "Demandas e contextos",
  tasks: "Tarefas abertas",
  weekly_schedule: "Blocos semanais",
};

type ImportResult = {
  dry_run?: boolean;
  created_if_applied?: Record<string, number>;
  created?: Record<string, number>;
  already_present?: Record<string, number>;
  conflicts?: { type: string; key: string }[];
};

export default async function CargaInicial({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  const [{ workspace }, query] = await Promise.all([getWorkspace(), searchParams]);
  let result: ImportResult | null = null;
  if (query.result) {
    try { result = JSON.parse(query.result) as ImportResult; } catch { result = null; }
  }
  const additions = result?.dry_run ? result.created_if_applied : result?.created;
  return <><PageHeading title="Carga inicial" description={`Espaço de trabalho: ${workspaceDisplayName(workspace.name)}. Dados Norte de 15/10/2026.`} />
    <Notice error={query.error} />
    <section className="form-panel"><h2 className="form-title">Contexto profissional e rotina</h2>
      <p>4 frentes de trabalho, 1 área JFK, 3 clientes, 15 projetos, 32 demandas e 39 blocos semanais. A carga acrescenta apenas itens ausentes e preserva alterações existentes.</p>
      <div className="row-actions"><form action={runNorteSeed}><input type="hidden" name="mode" value="dry-run" /><button className="button secondary" type="submit">Conferir carga</button></form>
        <form action={runNorteSeed}><input type="hidden" name="mode" value="apply" /><button className="button primary" type="submit">Aplicar carga nesta conta</button></form></div>
    </section>
    {result ? <section className="section" aria-live="polite"><h2>{result.dry_run ? "Prévia da carga" : "Carga aplicada"}</h2>
      <div className="list">{Object.entries(labels).filter(([key]) => additions?.[key] !== undefined || result?.already_present?.[key] !== undefined).map(([key, label]) => <div className="list-row" key={key}><strong>{label}</strong><span className="muted">{Number(additions?.[key] ?? 0)} {result?.dry_run ? "a criar" : "criados"} · {Number(result?.already_present?.[key] ?? 0)} já existentes</span></div>)}</div>
      {result.conflicts?.length ? <p role="alert" className="notice error">Há {result.conflicts.length} item(ns) com nome igual a um cadastro existente. Revise antes de aplicar.</p> : null}
    </section> : null}</>;
}

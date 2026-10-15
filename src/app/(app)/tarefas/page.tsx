import Link from "next/link";
import { completeTask } from "@/app/actions";
import { EmptyState, formatDate, Notice, PageHeading } from "@/components/ui";
import { selectedCompanyId } from "@/lib/filter";
import { getCompanies, getDemandContexts, getProjects, getTasks } from "@/lib/queries";

export default async function Tarefas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [tasks, companies, projects, contexts, query] = await Promise.all([getTasks(), getCompanies(), getProjects(), getDemandContexts(), searchParams]);
  const companyId = await selectedCompanyId(companies);
  const visible = tasks.filter((task) => !companyId || task.company_id === companyId);
  const review = contexts.filter((item) => ["historical_review", "candidate", "on_demand"].includes(item.classification) && (!companyId || projects.find((project) => project.id === item.project_id)?.company_id === companyId));
  return <><PageHeading title="Tarefas" description="Acompanhe execução, prioridades e prazos." action={{ href: "/tarefas/novo", label: "+ Nova tarefa" }} /><Notice {...query} />{visible.length ? <div className="list">{visible.map((task) => <div className="list-row" key={task.id}><div><Link href={`/tarefas/${task.id}`} className="row-title">{task.title}</Link><p>{companies.find((company) => company.id === task.company_id)?.name ?? "Área transversal"} · {task.priority ?? "Sem prioridade"} · {formatDate(task.due_at)} · {task.status === "done" ? "Concluída" : task.status === "blocked" ? "Bloqueada" : task.status === "cancelled" ? "Cancelada" : task.status === "in_progress" ? "Em andamento" : "A fazer"}</p></div>{task.status !== "done" && task.status !== "cancelled" ? <form action={completeTask}><input type="hidden" name="id" value={task.id} /><button type="submit" className="button secondary small">Concluir</button></form> : null}</div>)}</div> : <EmptyState title="Nenhuma tarefa cadastrada" description="Crie uma tarefa ou converta uma demanda da inbox." action={{ href: "/tarefas/novo", label: "Criar tarefa" }} />}
    {review.length ? <section className="section"><div className="section-heading"><h2>A revisar</h2></div><p className="muted">Assuntos históricos, hipóteses e ações sob demanda. Confirme antes de assumir pendência.</p><div className="list">{review.map((item) => <div className="list-row" key={item.id}><div><strong>{item.title}</strong><p>{projects.find((project) => project.id === item.project_id)?.name} · {item.notes}</p></div></div>)}</div></section> : null}</>;
}

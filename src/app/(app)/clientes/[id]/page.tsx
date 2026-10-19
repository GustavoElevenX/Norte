import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/forms";
import { formatDate, Notice, PageHeading } from "@/components/ui";
import { getWorkspace } from "@/lib/auth";
import { queridoPudimDueAt, queridoPudimPlan } from "@/lib/querido-pudim-plan";
import { getCompanies, getTasks } from "@/lib/queries";

export default async function Cliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, query, companies] = await Promise.all([params, searchParams, getCompanies()]);
  const { supabase, workspace } = await getWorkspace();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("workspace_id", workspace.id).single();
  if (!client) notFound();
  const tasks = client.seed_key === "querido-pudim" ? await getTasks() : [];
  const planTasks = queridoPudimPlan.map((item) => ({
    item,
    task: tasks.find((task) => task.client_id === client.id && task.seed_key === item.key),
  }));

  return <><PageHeading title={client.name} description="Dados do cliente" /><Notice {...query} />
    {client.seed_key === "querido-pudim" ? <section className="section"><div className="section-heading"><h2>Plano até 31 de outubro</h2><Link href="/tarefas">Todas as tarefas</Link></div><p className="muted">Etapas de 20 a 31/10 vinculadas à cliente e ao projeto Querido Pudim.</p><div className="list">{planTasks.map(({ item, task }) => <div className="list-row" key={item.key}><div>{task ? <Link className="row-title" href={`/tarefas/${task.id}`}>{task.title}</Link> : <strong>{item.title}</strong>}<p>{task?.status === "done" ? "Concluída" : "Pendente"} · até {formatDate(task?.due_at ?? queridoPudimDueAt(item.due))}</p></div></div>)}</div></section> : null}
    <ClientForm client={client} companies={companies} /></>;
}

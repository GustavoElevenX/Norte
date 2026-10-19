import Link from "next/link";
import { decideAssistantAction, saveAutonomy, sendAssistantMessage } from "@/app/assistant-actions";
import { Notice, PageHeading } from "@/components/ui";
import { aiConfigured } from "@/lib/ai-provider";
import { getWorkspace } from "@/lib/auth";
import { getCompanies, getProjects } from "@/lib/queries";

export default async function Assistente({ searchParams }: { searchParams: Promise<{ conversation?: string; error?: string; message?: string }> }) {
  const query = await searchParams;
  const { supabase, workspace } = await getWorkspace();
  const [companies, projects, { data: conversations }, { data: preferences }] = await Promise.all([
    getCompanies(), getProjects(), supabase.from("assistant_conversations").select("id,title,company_id,project_id,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("user_preferences").select("autonomy_level").eq("workspace_id", workspace.id).maybeSingle(),
  ]);
  const conversation = conversations?.find((item) => item.id === query.conversation);
  const [{ data: messages }, { data: actions }] = conversation ? await Promise.all([
    supabase.from("assistant_messages").select("id,role,content,created_at").eq("workspace_id", workspace.id).eq("conversation_id", conversation.id).order("created_at"),
    supabase.from("assistant_action_requests").select("id,action_type,preview_json,status,created_at,result_entity_id").eq("workspace_id", workspace.id).eq("conversation_id", conversation.id).order("created_at"),
  ]) : [{ data: [] }, { data: [] }];
  return <><PageHeading title="Assistente" description="Consulte seus dados e aprove ações propostas pela IA." /><Notice error={query.error} message={query.message} />
    {!aiConfigured() ? <p className="notice">O chat aguarda configuração de AI_PROVIDER, AI_MODEL e AI_API_KEY no servidor. Agenda, tarefas e metas continuam disponíveis.</p> : null}
    <section className="section compact"><form action={saveAutonomy} className="assistant-settings"><label className="field"><span>Autonomia</span><select name="level" defaultValue={preferences?.autonomy_level ?? "N1"}><option value="N0">N0 · só consultar e sugerir</option><option value="N1">N1 · preparar ações para aprovação</option></select></label><button className="button secondary small">Salvar preferência</button></form></section>
    <div className="assistant-layout"><aside className="assistant-history"><h2>Conversas</h2><Link href="/assistente" className="button secondary small">Nova conversa</Link>{conversations?.map((item) => <Link className="assistant-history-link" href={`/assistente?conversation=${item.id}`} key={item.id}>{item.title}</Link>)}</aside>
      <section className="assistant-chat">{conversation ? <><p className="muted">Contexto: {conversation.project_id ? projects.find((p) => p.id === conversation.project_id)?.name : conversation.company_id ? companies.find((c) => c.id === conversation.company_id)?.name : "Todas as empresas"}</p><div className="assistant-messages">{messages?.map((message) => <div className={`assistant-message ${message.role}`} key={message.id}><strong>{message.role === "user" ? "Você" : "Norte"}</strong><p>{message.content}</p></div>)}</div>{actions?.map((action) => <div className="assistant-preview" key={action.id}><strong>{action.action_type === "create_task" ? "Prévia de tarefa" : "Prévia de agendamento"}</strong><pre>{JSON.stringify(action.preview_json, null, 2)}</pre>{action.status === "pending" ? <form action={decideAssistantAction} className="row-actions"><input type="hidden" name="id" value={action.id} /><input type="hidden" name="conversation_id" value={conversation.id} /><button className="button primary small" name="decision" value="approve">Confirmar</button><button className="button secondary small" name="decision" value="reject">Recusar</button></form> : <p className="muted">{action.status === "executed" ? "Aplicada" : "Recusada"}{action.status === "executed" && action.result_entity_id && action.action_type === "create_task" ? <> · <Link href={`/tarefas/${action.result_entity_id}`}>Abrir tarefa</Link></> : null}</p>}</div>)}</> : <p className="muted">Inicie uma conversa. O assistente só consulta informações deste workspace.</p>}
        <form action={sendAssistantMessage} className="assistant-compose">{conversation ? <input type="hidden" name="conversation_id" value={conversation.id} /> : <div className="form-grid"><label className="field"><span>Empresa</span><select name="company_id"><option value="">Todas</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label><label className="field"><span>Projeto</span><select name="project_id"><option value="">Todos</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label></div>}<label className="field"><span>Mensagem</span><textarea name="message" rows={3} maxLength={2000} required placeholder="Ex.: O que está atrasado na Vértice?" /></label><button className="button primary" disabled={!aiConfigured()}>Enviar</button></form>
      </section></div></>;
}

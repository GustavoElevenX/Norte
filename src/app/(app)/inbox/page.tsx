import { captureInbox, convertInbox, dismissInbox } from "@/app/actions";
import { EmptyState, Notice, PageHeading } from "@/components/ui";
import { getInbox } from "@/lib/queries";

export default async function Inbox({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [items, query] = await Promise.all([getInbox(), searchParams]);
  const open = items.filter((item) => item.status === "open");
  return <><PageHeading title="Inbox" description="Registre primeiro. Classifique quando tiver tempo." /><Notice {...query} /><form action={captureInbox} className="capture-form inbox-capture"><input name="raw_text" aria-label="Nova demanda" placeholder="O que precisa ser feito?" required maxLength={2000} /><button type="submit" className="button primary">Adicionar à inbox</button></form>{open.length ? <div className="list">{open.map((item) => <div className="list-row inbox-row" key={item.id}><div><strong>{item.raw_text}</strong><p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(item.created_at))}</p></div><div className="row-actions"><form action={convertInbox}><input type="hidden" name="id" value={item.id} /><button className="button secondary small" type="submit">Converter em tarefa</button></form><form action={dismissInbox}><input type="hidden" name="id" value={item.id} /><button className="plain-button" type="submit">Dispensar</button></form></div></div>)}</div> : <EmptyState title="Inbox vazia" description="Toda demanda capturada aparece aqui antes de ser classificada." />}</>;
}

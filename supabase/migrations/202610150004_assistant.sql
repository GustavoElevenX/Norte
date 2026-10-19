create table public.user_preferences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  autonomy_level text not null default 'N1' check (autonomy_level in ('N0','N1')),
  updated_at timestamptz not null default now()
);
create trigger user_preferences_updated before update on public.user_preferences for each row execute function public.set_updated_at();
create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null default 'Nova conversa',
  company_id uuid,
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,company_id) references public.companies(workspace_id,id),
  foreign key(workspace_id,project_id) references public.projects(workspace_id,id)
);
create trigger assistant_conversations_updated before update on public.assistant_conversations for each row execute function public.set_updated_at();
create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null,
  role text not null check(role in ('user','assistant')),
  content text not null check(char_length(content) between 1 and 10000),
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  created_at timestamptz not null default now(),
  foreign key(workspace_id,conversation_id) references public.assistant_conversations(workspace_id,id) on delete cascade
);
create index assistant_messages_conversation_idx on public.assistant_messages(workspace_id,conversation_id,created_at);
create table public.assistant_action_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null,
  action_type text not null check(action_type in ('create_task','schedule_task')),
  arguments_json jsonb not null,
  preview_json jsonb not null,
  status text not null default 'pending' check(status in ('pending','executed','rejected')),
  autonomy_level text not null check(autonomy_level='N1'),
  idempotency_key uuid not null default gen_random_uuid(),
  approved_at timestamptz,
  executed_at timestamptz,
  result_entity_id uuid,
  created_at timestamptz not null default now(),
  unique(workspace_id,idempotency_key),
  foreign key(workspace_id,conversation_id) references public.assistant_conversations(workspace_id,id) on delete cascade
);
create index assistant_actions_pending_idx on public.assistant_action_requests(workspace_id,conversation_id,created_at) where status='pending';
alter table public.user_preferences enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_action_requests enable row level security;
create policy preferences_owner on public.user_preferences for all to authenticated using(public.is_workspace_owner(workspace_id)) with check(public.is_workspace_owner(workspace_id));
create policy conversations_owner on public.assistant_conversations for all to authenticated using(public.is_workspace_owner(workspace_id)) with check(public.is_workspace_owner(workspace_id));
create policy messages_select on public.assistant_messages for select to authenticated using(public.is_workspace_owner(workspace_id));
create policy messages_insert on public.assistant_messages for insert to authenticated with check(public.is_workspace_owner(workspace_id));
create policy actions_select on public.assistant_action_requests for select to authenticated using(public.is_workspace_owner(workspace_id));
create policy actions_insert on public.assistant_action_requests for insert to authenticated with check(public.is_workspace_owner(workspace_id));

create or replace function public.decide_assistant_action(p_workspace_id uuid,p_request_id uuid,p_approve boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_request public.assistant_action_requests%rowtype;
declare v_id uuid;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  select * into v_request from public.assistant_action_requests where workspace_id=p_workspace_id and id=p_request_id for update;
  if not found or v_request.status<>'pending' then raise exception 'Proposta já decidida ou inexistente'; end if;
  if not p_approve then
    update public.assistant_action_requests set status='rejected' where id=p_request_id;
    return null;
  end if;
  if v_request.action_type='create_task' then
    insert into public.tasks(workspace_id,title,description,company_id,project_id,priority,estimated_minutes,due_at,source)
    values(p_workspace_id, v_request.arguments_json->>'title', coalesce(v_request.arguments_json->>'description',''),
      nullif(v_request.arguments_json->>'company_id','')::uuid,nullif(v_request.arguments_json->>'project_id','')::uuid,
      nullif(v_request.arguments_json->>'priority',''),nullif(v_request.arguments_json->>'estimated_minutes','')::integer,
      nullif(v_request.arguments_json->>'due_at','')::timestamptz,'manual') returning id into v_id;
  elsif v_request.action_type='schedule_task' then
    select public.save_calendar_event(p_workspace_id,null,'execution',t.title,t.company_id,t.project_id,t.id,
      (v_request.arguments_json->>'starts_at')::timestamptz,(v_request.arguments_json->>'ends_at')::timestamptz,false)
      into v_id from public.tasks t where t.workspace_id=p_workspace_id and t.id=(v_request.arguments_json->>'task_id')::uuid;
    if v_id is null then raise exception 'Tarefa não encontrada'; end if;
  else raise exception 'Ação não permitida'; end if;
  update public.assistant_action_requests set status='executed',approved_at=now(),executed_at=now(),result_entity_id=v_id where id=p_request_id;
  return v_id;
end $$;
revoke all on function public.decide_assistant_action(uuid,uuid,boolean) from public;
grant execute on function public.decide_assistant_action(uuid,uuid,boolean) to authenticated;

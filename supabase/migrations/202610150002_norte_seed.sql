-- The seed is applied by an authenticated workspace owner through import_norte_data.
alter table public.companies add column seed_key text;
alter table public.clients add column seed_key text;
alter table public.projects add column seed_key text;
alter table public.projects add column area_id uuid;
alter table public.projects add column priority text check (priority in ('P1', 'P2', 'P3'));
alter table public.tasks add column seed_key text;
create unique index companies_seed_key_uq on public.companies(workspace_id, seed_key) where seed_key is not null;
create unique index clients_seed_key_uq on public.clients(workspace_id, seed_key) where seed_key is not null;
create unique index projects_seed_key_uq on public.projects(workspace_id, seed_key) where seed_key is not null;
create unique index tasks_seed_key_uq on public.tasks(workspace_id, seed_key) where seed_key is not null;

create table public.strategic_areas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seed_key text,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create unique index strategic_areas_seed_key_uq on public.strategic_areas(workspace_id, seed_key) where seed_key is not null;
alter table public.projects add constraint projects_area_fk foreign key (workspace_id, area_id) references public.strategic_areas(workspace_id,id);
alter table public.projects alter column company_id drop not null;
alter table public.projects add constraint projects_company_or_area check (company_id is not null or area_id is not null);
alter table public.projects drop constraint projects_workspace_id_company_id_client_id_fkey;
alter table public.projects add constraint projects_client_fk foreign key (workspace_id,client_id) references public.clients(workspace_id,id);
alter table public.projects add constraint projects_client_company_check check (client_id is null or company_id is not null);
alter table public.tasks drop constraint tasks_workspace_id_company_id_project_id_fkey;
do $$ declare constraint_name text; begin
  select conname into constraint_name from pg_constraint
  where conrelid = 'public.tasks'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%project_id IS NULL%company_id IS NOT NULL%'
  limit 1;
  if constraint_name is not null then
    execute format('alter table public.tasks drop constraint %I', constraint_name);
  end if;
end $$;
alter table public.tasks add constraint tasks_project_fk foreign key (workspace_id,project_id) references public.projects(workspace_id,id);

create or replace function public.validate_project_links()
returns trigger language plpgsql set search_path = '' as $$
declare p_company_id uuid; c_company_id uuid;
begin
  if new.client_id is not null then
    select company_id into c_company_id from public.clients where workspace_id = new.workspace_id and id = new.client_id;
    if c_company_id is distinct from new.company_id then raise exception 'Cliente e empresa não correspondem'; end if;
  end if;
  if tg_table_name = 'tasks' then
    if new.project_id is not null then
      select company_id into p_company_id from public.projects where workspace_id = new.workspace_id and id = new.project_id;
      if p_company_id is distinct from new.company_id then raise exception 'Projeto e empresa não correspondem'; end if;
    end if;
  end if;
  return new;
end $$;
create trigger projects_validate_links before insert or update on public.projects for each row execute function public.validate_project_links();
create trigger tasks_validate_links before insert or update on public.tasks for each row execute function public.validate_project_links();

create table public.demand_contexts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seed_key text,
  project_id uuid not null,
  task_id uuid,
  title text not null,
  notes text not null default '',
  classification text not null check (classification in ('routine_link','historical_review','candidate','recent_explicit','confirmed_topic','on_demand')),
  priority text check (priority in ('P1','P2','P3')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,id),
  foreign key (workspace_id,project_id) references public.projects(workspace_id,id),
  foreign key (workspace_id,task_id) references public.tasks(workspace_id,id)
);
create unique index demand_contexts_seed_key_uq on public.demand_contexts(workspace_id,seed_key) where seed_key is not null;
create index demand_contexts_project_idx on public.demand_contexts(workspace_id,project_id);

create table public.weekly_recurrence_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seed_key text,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  title text not null,
  timezone text not null default 'America/Fortaleza',
  effective_from date not null,
  mode text not null check (mode in ('protected','unavailable','flexible')),
  company_id uuid,
  project_id uuid,
  alternative_project_id uuid,
  priority text check (priority in ('P1','P2','P3')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,id),
  check (starts_at < ends_at),
  check (mode <> 'unavailable' or (company_id is null and project_id is null)),
  foreign key (workspace_id,company_id) references public.companies(workspace_id,id),
  foreign key (workspace_id,project_id) references public.projects(workspace_id,id),
  foreign key (workspace_id,alternative_project_id) references public.projects(workspace_id,id)
);
create unique index weekly_rules_seed_key_uq on public.weekly_recurrence_rules(workspace_id,seed_key) where seed_key is not null;
create index weekly_rules_lookup_idx on public.weekly_recurrence_rules(workspace_id,weekday,starts_at);

create or replace function public.prevent_weekly_overlap()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.seed_key is not null and exists (
    select 1 from public.weekly_recurrence_rules r where r.workspace_id=new.workspace_id and r.seed_key=new.seed_key
  ) then return null; end if;
  if exists (select 1 from public.weekly_recurrence_rules r
    where r.workspace_id=new.workspace_id and r.weekday=new.weekday and r.id<>new.id
      and r.starts_at<new.ends_at and new.starts_at<r.ends_at)
  then raise exception 'Blocos semanais sobrepostos'; end if;
  return new;
end $$;
create trigger weekly_rules_no_overlap before insert or update on public.weekly_recurrence_rules
for each row execute function public.prevent_weekly_overlap();

create table public.weekly_recurrence_exceptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_id uuid not null,
  occurs_on date not null,
  action text not null check (action in ('skip','override')),
  title text,
  starts_at time,
  ends_at time,
  project_id uuid,
  created_at timestamptz not null default now(),
  unique (workspace_id,rule_id,occurs_on),
  foreign key (workspace_id,rule_id) references public.weekly_recurrence_rules(workspace_id,id) on delete cascade,
  foreign key (workspace_id,project_id) references public.projects(workspace_id,id),
  check (action = 'skip' or (starts_at is not null and ends_at is not null and starts_at < ends_at))
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version text not null,
  actor_user_id uuid not null references auth.users(id),
  created_count jsonb not null default '{}'::jsonb,
  ignored_count jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.import_items (
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(batch_id,entity_type,entity_id)
);

create trigger strategic_areas_updated before update on public.strategic_areas for each row execute function public.set_updated_at();
create trigger demand_contexts_updated before update on public.demand_contexts for each row execute function public.set_updated_at();
create trigger weekly_rules_updated before update on public.weekly_recurrence_rules for each row execute function public.set_updated_at();

alter table public.strategic_areas enable row level security;
alter table public.demand_contexts enable row level security;
alter table public.weekly_recurrence_rules enable row level security;
alter table public.weekly_recurrence_exceptions enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_items enable row level security;
create policy areas_owner on public.strategic_areas for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy contexts_owner on public.demand_contexts for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy rules_owner on public.weekly_recurrence_rules for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy exceptions_owner on public.weekly_recurrence_exceptions for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy batches_select on public.import_batches for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy items_select on public.import_items for select to authenticated using (public.is_workspace_owner(workspace_id));

create or replace function public.import_norte_data(payload jsonb, dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  ws uuid;
  actor uuid := auth.uid();
  batch uuid;
  item jsonb;
  entity_id uuid;
  company_id uuid;
  client_id uuid;
  project_id uuid;
  area_id uuid;
  alt_project_id uuid;
  task_id uuid;
  created jsonb := '{}'::jsonb;
  ignored jsonb := '{}'::jsonb;
  conflicts jsonb := '[]'::jsonb;
  label text;
  actual integer;
  expected integer;
  classes text[] := array['operations','areas','clients','projects','demand_contexts','weekly_schedule'];
begin
  if actor is null then raise exception 'Login necessário'; end if;
  select id into ws from public.workspaces where owner_user_id = actor;
  if ws is null then raise exception 'Workspace não encontrado'; end if;
  if payload->'metadata'->>'version' <> 'norte-inicial-2026-10-15-v1' then raise exception 'Versão da carga não reconhecida'; end if;
  if jsonb_array_length(payload->'operations') <> 4 or jsonb_array_length(payload->'areas') <> 1
     or jsonb_array_length(payload->'clients') <> 3 or jsonb_array_length(payload->'projects') <> 15
     or jsonb_array_length(payload->'demand_contexts') <> 32 or jsonb_array_length(payload->'weekly_schedule') <> 39
  then raise exception 'Contagens inválidas no payload'; end if;

  for item in select value from jsonb_array_elements(payload->'operations') loop
    if exists(select 1 from public.companies where workspace_id=ws and lower(name)=lower(item->>'name') and seed_key is distinct from item->>'key') then
      conflicts := conflicts || jsonb_build_array(jsonb_build_object('type','company','key',item->>'key','reason','same_name_without_seed'));
    end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'clients') loop
    if exists(select 1 from public.clients where workspace_id=ws and lower(name)=lower(item->>'name') and seed_key is distinct from item->>'key') then
      conflicts := conflicts || jsonb_build_array(jsonb_build_object('type','client','key',item->>'key','reason','same_name_without_seed'));
    end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'projects') loop
    if exists(select 1 from public.projects where workspace_id=ws and lower(name)=lower(item->>'name') and seed_key is distinct from item->>'key') then
      conflicts := conflicts || jsonb_build_array(jsonb_build_object('type','project','key',item->>'key','reason','same_name_without_seed'));
    end if;
  end loop;

  -- A dry run checks existing keys without writing anything.
  if dry_run then
    foreach label in array classes loop
      execute format('select count(*) from jsonb_array_elements($1->%L) e where not exists (select 1 from public.%I t where t.workspace_id=$2 and t.seed_key=e->>''key'')',
        label, case label when 'operations' then 'companies' when 'areas' then 'strategic_areas' when 'weekly_schedule' then 'weekly_recurrence_rules' else label end)
      into actual using payload, ws;
      expected := jsonb_array_length(payload->label);
      created := created || jsonb_build_object(label,actual);
      ignored := ignored || jsonb_build_object(label,expected-actual);
    end loop;
    return jsonb_build_object('dry_run',true,'created_if_applied',created,'already_present',ignored,'conflicts',conflicts,'workspace_id',ws);
  end if;

  if jsonb_array_length(conflicts) > 0 then raise exception 'Carga contém conflitos de nomes; execute a prévia e resolva antes de aplicar'; end if;

  perform pg_advisory_xact_lock(hashtext(ws::text), hashtext('norte-initial-seed'));
  insert into public.import_batches(workspace_id,version,actor_user_id)
  values(ws,payload->'metadata'->>'version',actor) returning id into batch;

  for item in select value from jsonb_array_elements(payload->'operations') loop
    entity_id := null;
    insert into public.companies(workspace_id,seed_key,name,segment,description)
    values(ws,item->>'key',item->>'name',item->>'kind',item->>'known_context')
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'companies',entity_id,now()); end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'areas') loop
    entity_id := null;
    insert into public.strategic_areas(workspace_id,seed_key,name,description)
    values(ws,item->>'key',item->>'name',item->>'known_context')
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'strategic_areas',entity_id,now()); end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'clients') loop
    select id into company_id from public.companies where workspace_id=ws and seed_key=item->>'company_key';
    if company_id is null then raise exception 'Empresa ausente para cliente %', item->>'key'; end if;
    entity_id := null;
    insert into public.clients(workspace_id,seed_key,company_id,name,notes)
    values(ws,item->>'key',company_id,item->>'name',concat_ws(' — ',item->>'contact_name',item->>'notes'))
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'clients',entity_id,now()); end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'projects') loop
    company_id := null; client_id := null; area_id := null;
    if item->>'company_key' is not null then
      select id into company_id from public.companies where workspace_id=ws and seed_key=item->>'company_key';
      if company_id is null then raise exception 'Empresa ausente para projeto %', item->>'key'; end if;
    end if;
    if item->>'client_key' is not null then
      select id into client_id from public.clients where workspace_id=ws and seed_key=item->>'client_key';
      if client_id is null then raise exception 'Cliente ausente para projeto %', item->>'key'; end if;
    end if;
    if item->>'area_key' is not null then
      select id into area_id from public.strategic_areas where workspace_id=ws and seed_key=item->>'area_key';
      if area_id is null then raise exception 'Área ausente para projeto %', item->>'key'; end if;
    end if;
    entity_id := null;
    insert into public.projects(workspace_id,seed_key,company_id,client_id,area_id,name,goal_text,priority,status)
    values(ws,item->>'key',company_id,client_id,area_id,item->>'name',item->>'objective',item->>'priority',
      case when item->>'status' = 'on_demand' then 'paused' else 'active' end)
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'projects',entity_id,now()); end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'demand_contexts') loop
    select p.id,p.company_id,p.client_id into project_id,company_id,client_id from public.projects p where p.workspace_id=ws and p.seed_key=item->>'project_key';
    if project_id is null then raise exception 'Projeto ausente para demanda %',item->>'key'; end if;
    task_id := null;
    if item->>'classification' in ('recent_explicit','confirmed_topic') then
      insert into public.tasks(workspace_id,seed_key,project_id,company_id,client_id,title,description,priority,status)
      values(ws,item->>'key',project_id,company_id,client_id,item->>'title',item->>'notes',item->>'priority','todo')
      on conflict do nothing returning id into task_id;
      if task_id is not null then insert into public.import_items values(batch,ws,'tasks',task_id,now()); end if;
      select id into task_id from public.tasks where workspace_id=ws and seed_key=item->>'key';
    end if;
    entity_id := null;
    insert into public.demand_contexts(workspace_id,seed_key,project_id,task_id,title,notes,classification,priority)
    values(ws,item->>'key',project_id,task_id,item->>'title',item->>'notes',item->>'classification',item->>'priority')
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'demand_contexts',entity_id,now()); end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'weekly_schedule') loop
    company_id := null; project_id := null; alt_project_id := null;
    if item->>'company_key' is not null then
      select id into company_id from public.companies where workspace_id=ws and seed_key=item->>'company_key';
      if company_id is null then raise exception 'Empresa ausente para rotina %',item->>'key'; end if;
    end if;
    if item->>'project_key' is not null then
      select id into project_id from public.projects where workspace_id=ws and seed_key=item->>'project_key';
      if project_id is null then raise exception 'Projeto ausente para rotina %',item->>'key'; end if;
    end if;
    if item->>'alternative_project_key' is not null then
      select id into alt_project_id from public.projects where workspace_id=ws and seed_key=item->>'alternative_project_key';
    end if;
    entity_id := null;
    insert into public.weekly_recurrence_rules(workspace_id,seed_key,weekday,starts_at,ends_at,title,timezone,effective_from,mode,company_id,project_id,alternative_project_id,priority)
    values(ws,item->>'key',array_position(array['MO','TU','WE','TH','FR','SA','SU'],item->>'day'),
      (item->>'start')::time,(item->>'end')::time,item->>'title',item->>'timezone',(item->>'effective_from')::date,
      item->>'mode',company_id,project_id,alt_project_id,item->>'priority')
    on conflict do nothing returning id into entity_id;
    if entity_id is not null then insert into public.import_items values(batch,ws,'weekly_recurrence_rules',entity_id,now()); end if;
  end loop;

  foreach label in array classes loop
    select count(*) into actual from public.import_items where batch_id=batch and entity_type=
      case label when 'operations' then 'companies' when 'areas' then 'strategic_areas' when 'weekly_schedule' then 'weekly_recurrence_rules' else label end;
    expected := jsonb_array_length(payload->label);
    created := created || jsonb_build_object(label,actual);
    ignored := ignored || jsonb_build_object(label,expected-actual);
  end loop;
  select count(*) into actual from public.import_items where batch_id=batch and entity_type='tasks';
  created := created || jsonb_build_object('tasks',actual);
  update public.import_batches set created_count=created,ignored_count=ignored where id=batch;
  return jsonb_build_object('dry_run',false,'batch_id',batch,'created',created,'already_present',ignored,'conflicts',conflicts,'workspace_id',ws);
end $$;
revoke all on function public.import_norte_data(jsonb,boolean) from public,anon;
grant execute on function public.import_norte_data(jsonb,boolean) to authenticated;

-- Refuses rollback after a user edit or if a user created an exception to a seeded rule.
create or replace function public.rollback_norte_batch(target_batch uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare ws uuid; actor uuid := auth.uid(); row_item record; changed boolean; entity_table text;
begin
  select workspace_id into ws from public.import_batches where id=target_batch and actor_user_id=actor;
  if actor is null or ws is null or not public.is_workspace_owner(ws) then raise exception 'Lote não encontrado ou acesso negado'; end if;
  if exists (select 1 from public.weekly_recurrence_exceptions e join public.import_items i
    on i.workspace_id=e.workspace_id and i.entity_id=e.rule_id and i.entity_type='weekly_recurrence_rules'
    where i.batch_id=target_batch) then raise exception 'Há exceções de agenda criadas depois da carga'; end if;
  for row_item in select * from public.import_items where batch_id=target_batch loop
    entity_table := row_item.entity_type;
    execute format('select exists(select 1 from public.%I where id=$1 and workspace_id=$2 and updated_at<>created_at)',entity_table)
      into changed using row_item.entity_id,ws;
    if changed then raise exception 'Lote contém dados editados; rollback recusado'; end if;
  end loop;
  foreach entity_table in array array['weekly_recurrence_rules','demand_contexts','tasks','projects','clients','strategic_areas','companies'] loop
    execute format('delete from public.%I where id in (select entity_id from public.import_items where batch_id=$1 and entity_type=$2) and workspace_id=$3',entity_table)
      using target_batch,entity_table,ws;
  end loop;
  delete from public.import_batches where id=target_batch;
  return jsonb_build_object('rolled_back',true,'batch_id',target_batch);
end $$;
revoke all on function public.rollback_norte_batch(uuid) from public,anon;
grant execute on function public.rollback_norte_batch(uuid) to authenticated;

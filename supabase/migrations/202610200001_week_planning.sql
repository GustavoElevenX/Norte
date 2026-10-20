-- Atomic approval of a fresh, server-recomputed weekly preview.
-- Existing data and historical seed keys are untouched.
-- Fail before changing the schema if the earlier migrations are missing.
do $$
declare
  missing_migrations text;
begin
  select string_agg(format('%s (%s)', migration, relation_name), ', ' order by migration)
    into missing_migrations
  from (values
    ('202610150001_initial.sql', 'public.workspaces', to_regclass('public.workspaces')),
    ('202610150001_initial.sql', 'public.tasks', to_regclass('public.tasks')),
    ('202610150002_norte_seed.sql', 'public.weekly_recurrence_rules', to_regclass('public.weekly_recurrence_rules')),
    ('202610150003_calendar.sql', 'public.calendar_events', to_regclass('public.calendar_events')),
    ('202610150004_assistant.sql', 'public.user_preferences', to_regclass('public.user_preferences')),
    ('202610150005_performance.sql', 'public.task_planning_snapshots', to_regclass('public.task_planning_snapshots'))
  ) as dependencies(migration, relation_name, relation_id)
  where relation_id is null;
  if missing_migrations is not null then
    raise exception 'Migrações anteriores ausentes: %. Aplique somente as ausentes, em ordem, antes de 202610200001_week_planning.sql.', missing_migrations;
  end if;
end $$;

alter table public.tasks add column if not exists source_priority text check (source_priority in ('P1','P2','P3','P4'));
alter table public.tasks add column if not exists parent_task_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.tasks'::regclass and conname = 'tasks_parent_workspace_fk') then
    alter table public.tasks add constraint tasks_parent_workspace_fk
      foreign key (workspace_id,parent_task_id) references public.tasks(workspace_id,id);
  end if;
end $$;
create index if not exists tasks_parent_workspace_idx on public.tasks(workspace_id,parent_task_id) where parent_task_id is not null;

create table if not exists public.operational_day_plans (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  day date not null,
  version text not null,
  slots jsonb not null check (jsonb_typeof(slots) = 'array'),
  created_at timestamptz not null default now(),
  primary key (workspace_id,day)
);
alter table public.operational_day_plans enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operational_day_plans' and policyname = 'operational_day_plans_select') then
    create policy operational_day_plans_select on public.operational_day_plans for select to authenticated
      using (public.is_workspace_owner(workspace_id));
  end if;
end $$;

create or replace function public.enforce_operational_calendar()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_timezone text;
  v_day date;
  v_start time;
  v_end time;
  v_slots jsonb;
begin
  if new.status <> 'confirmed' then return new; end if;
  select timezone into v_timezone from public.workspaces where id=new.workspace_id;
  v_day := (new.starts_at at time zone v_timezone)::date;
  select slots into v_slots from public.operational_day_plans where workspace_id=new.workspace_id and day=v_day;
  if v_slots is null then return new; end if;
  if (new.ends_at at time zone v_timezone)::date <> v_day then raise exception 'Evento deve terminar no mesmo dia operacional'; end if;
  v_start := (new.starts_at at time zone v_timezone)::time;
  v_end := (new.ends_at at time zone v_timezone)::time;
  if extract(isodow from v_day)=6 and v_end > time '12:00' then raise exception 'Sábado termina às 12h'; end if;
  if exists(select 1 from jsonb_array_elements(v_slots) s where s->>'mode' in ('routine','unavailable')
    and (s->>'starts_at')::time < v_end and v_start < (s->>'ends_at')::time) then
    raise exception 'Evento conflita com rotina fixa ou intervalo protegido';
  end if;
  if new.event_type='execution' and not exists(select 1 from jsonb_array_elements(v_slots) s where s->>'mode'='flexible'
    and (s->>'starts_at')::time <= v_start and v_end <= (s->>'ends_at')::time) then
    raise exception 'Execução fora da janela de trabalho';
  end if;
  return new;
end $$;
drop trigger if exists calendar_operational_guard on public.calendar_events;
create trigger calendar_operational_guard before insert or update of starts_at,ends_at,status on public.calendar_events
for each row execute function public.enforce_operational_calendar();

create or replace function public.save_operational_appointment(
  p_workspace_id uuid, p_event_id uuid, p_title text, p_company_id uuid,
  p_starts_at timestamptz, p_ends_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_day date; v_timezone text;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  if length(trim(coalesce(p_title,''))) not between 1 and 240 or p_starts_at is null or p_ends_at is null
    or p_ends_at <= p_starts_at or p_ends_at > p_starts_at + interval '12 hours' then raise exception 'Compromisso inválido'; end if;
  if p_company_id is not null and not exists(select 1 from public.companies where workspace_id=p_workspace_id and id=p_company_id) then raise exception 'Empresa inválida'; end if;
  perform 1 from public.workspaces where id=p_workspace_id for update;
  select timezone into v_timezone from public.workspaces where id=p_workspace_id;
  v_day := (p_starts_at at time zone v_timezone)::date;
  if not exists(select 1 from public.operational_day_plans where workspace_id=p_workspace_id and day=v_day) then raise exception 'Dia operacional não encontrado'; end if;
  if p_event_id is null then
    insert into public.calendar_events(workspace_id,company_id,title,event_type,starts_at,ends_at)
    values(p_workspace_id,p_company_id,trim(p_title),'appointment',p_starts_at,p_ends_at) returning id into v_id;
  else
    update public.calendar_events set company_id=p_company_id,title=trim(p_title),starts_at=p_starts_at,ends_at=p_ends_at
    where workspace_id=p_workspace_id and id=p_event_id and event_type='appointment' and status='confirmed' returning id into v_id;
    if v_id is null then raise exception 'Compromisso não encontrado'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.save_operational_appointment(uuid,uuid,text,uuid,timestamptz,timestamptz) from public;
grant execute on function public.save_operational_appointment(uuid,uuid,text,uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.import_operational_week(
  p_workspace_id uuid, p_version text, p_days jsonb, p_tasks jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  day_item jsonb;
  slot jsonb;
  task_item jsonb;
  existing_version text;
  existing_slots jsonb;
  previous_end time;
  v_company_id uuid;
  v_project_id uuid;
  parent_id uuid;
  day_date date;
  inserted_days integer := 0;
  inserted_tasks integer := 0;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  if p_version <> '2026-10-20-v1' or jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) <> 5
    or jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) <> 18 then raise exception 'Carga operacional inválida'; end if;
  if (select count(distinct value->>'day') from jsonb_array_elements(p_days)) <> 5 then raise exception 'Dias operacionais duplicados'; end if;
  perform 1 from public.workspaces where id = p_workspace_id for update;
  for day_item in select value from jsonb_array_elements(p_days) loop
    day_date := (day_item->>'day')::date;
    if day_date < date '2026-10-20' or day_date > date '2026-10-24'
      or jsonb_typeof(day_item->'slots') <> 'array' then raise exception 'Dia operacional inválido'; end if;
    previous_end := null;
    for slot in select value from jsonb_array_elements(day_item->'slots') order by value->>'starts_at' loop
      if (slot->>'starts_at')::time >= (slot->>'ends_at')::time
        or (previous_end is not null and previous_end > (slot->>'starts_at')::time)
        or slot->>'mode' not in ('routine','unavailable','flexible') then raise exception 'Blocos operacionais sobrepostos ou inválidos'; end if;
      previous_end := (slot->>'ends_at')::time;
      v_company_id := nullif(slot->>'company_id','')::uuid;
      v_project_id := nullif(slot->>'project_id','')::uuid;
      if v_company_id is not null and not exists(select 1 from public.companies c where c.workspace_id=p_workspace_id and c.id=v_company_id) then raise exception 'Empresa de rotina inválida'; end if;
      if v_project_id is not null and not exists(select 1 from public.projects p where p.workspace_id=p_workspace_id and p.id=v_project_id and p.company_id is not distinct from v_company_id) then raise exception 'Projeto de rotina inválido'; end if;
      if slot->>'mode' <> 'flexible' and exists (
        select 1 from public.calendar_events c join public.workspaces w on w.id=c.workspace_id
        where c.workspace_id=p_workspace_id and c.status='confirmed' and c.ends_at>now()
          and (c.starts_at at time zone w.timezone)::date=day_date
          and (c.starts_at at time zone w.timezone)::time < (slot->>'ends_at')::time
          and (slot->>'starts_at')::time < (c.ends_at at time zone w.timezone)::time
      ) then raise exception 'Compromisso existente conflita com rotina ou intervalo protegido em %', day_date; end if;
    end loop;
    select version,slots into existing_version,existing_slots from public.operational_day_plans where workspace_id=p_workspace_id and day=day_date;
    if found then
      if existing_version <> p_version or existing_slots <> day_item->'slots' then raise exception 'Já existe plano operacional diferente em %', day_date; end if;
    else
      insert into public.operational_day_plans(workspace_id,day,version,slots)
      values(p_workspace_id,day_date,p_version,day_item->'slots');
      inserted_days := inserted_days + 1;
    end if;
  end loop;
  for task_item in select value from jsonb_array_elements(p_tasks) loop
    if nullif(task_item->>'source_key','') is null or nullif(task_item->>'title','') is null
      or nullif(task_item->>'estimated_minutes','') is null or (task_item->>'estimated_minutes')::integer not between 1 and 720
      or coalesce(task_item->>'source_priority','') not in ('P1','P2','P3','P4') then raise exception 'Tarefa operacional inválida'; end if;
    v_company_id := nullif(task_item->>'company_id','')::uuid;
    v_project_id := nullif(task_item->>'project_id','')::uuid;
    if v_company_id is not null and not exists(select 1 from public.companies c where c.workspace_id=p_workspace_id and c.id=v_company_id) then raise exception 'Empresa da tarefa inválida'; end if;
    if v_project_id is not null and not exists(select 1 from public.projects p where p.workspace_id=p_workspace_id and p.id=v_project_id and p.company_id is not distinct from v_company_id) then raise exception 'Projeto da tarefa inválido'; end if;
    select id into parent_id from public.tasks where workspace_id=p_workspace_id and seed_key=task_item->>'parent_key';
    if exists(select 1 from public.tasks t where t.workspace_id=p_workspace_id and (t.seed_key=task_item->>'source_key'
      or t.company_id is not distinct from v_company_id and t.project_id is not distinct from v_project_id
        and lower(t.title)=lower(task_item->>'title'))) then continue; end if;
    insert into public.tasks(workspace_id,seed_key,title,description,company_id,project_id,parent_task_id,estimated_minutes,source_priority,due_at,status)
    values(p_workspace_id,task_item->>'source_key',task_item->>'title',coalesce(task_item->>'description',''),v_company_id,v_project_id,parent_id,
      (task_item->>'estimated_minutes')::integer,task_item->>'source_priority',nullif(task_item->>'due_at','')::timestamptz,'todo')
    on conflict do nothing;
    if found then inserted_tasks := inserted_tasks + 1; end if;
  end loop;
  return jsonb_build_object('days',inserted_days,'tasks',inserted_tasks);
end $$;
revoke all on function public.import_operational_week(uuid,text,jsonb,jsonb) from public;
grant execute on function public.import_operational_week(uuid,text,jsonb,jsonb) to authenticated;

create or replace function public.defer_task(p_workspace_id uuid, p_task_id uuid, p_status text)
returns integer language plpgsql security definer set search_path = '' as $$
declare cancelled integer;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  if p_status not in ('todo','blocked') then raise exception 'Estado inválido'; end if;
  perform 1 from public.workspaces where id=p_workspace_id for update;
  update public.tasks set status=p_status where workspace_id=p_workspace_id and id=p_task_id and status not in ('done','cancelled');
  if not found then raise exception 'Tarefa indisponível'; end if;
  update public.calendar_events set status='cancelled' where workspace_id=p_workspace_id and task_id=p_task_id
    and event_type='execution' and status='confirmed' and ends_at>now();
  get diagnostics cancelled = row_count;
  return cancelled;
end $$;
revoke all on function public.defer_task(uuid,uuid,text) from public;
grant execute on function public.defer_task(uuid,uuid,text) to authenticated;

create or replace function public.approve_week_plan(p_workspace_id uuid, p_items jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  item jsonb;
  task public.tasks%rowtype;
  starts timestamptz;
  ends timestamptz;
  plan_slots jsonb;
  local_date date;
  local_start time;
  local_end time;
  workspace_timezone text;
  applied integer := 0;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 150 then raise exception 'Plano inválido'; end if;
  perform 1 from public.workspaces where id = p_workspace_id for update;
  select timezone into workspace_timezone from public.workspaces where id=p_workspace_id;
  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item) <> 'object' or nullif(item->>'taskId','') is null
      or nullif(item->>'startsAt','') is null or nullif(item->>'endsAt','') is null then
      raise exception 'Item do plano inválido';
    end if;
    select * into task from public.tasks where workspace_id = p_workspace_id and id = (item->>'taskId')::uuid;
    if not found or task.status in ('done','cancelled','blocked') then raise exception 'Tarefa indisponível'; end if;
    starts := (item->>'startsAt')::timestamptz;
    ends := (item->>'endsAt')::timestamptz;
    if starts < now() or ends <= starts or ends > starts + interval '2 hours' then raise exception 'Horário expirado ou inválido'; end if;
    local_date := (starts at time zone workspace_timezone)::date;
    local_start := (starts at time zone workspace_timezone)::time;
    local_end := (ends at time zone workspace_timezone)::time;
    select slots into plan_slots from public.operational_day_plans where workspace_id=p_workspace_id and day=local_date;
    if plan_slots is not null then
      if (ends at time zone workspace_timezone)::date <> local_date or not exists (
        select 1 from jsonb_array_elements(plan_slots) s where s->>'mode'='flexible'
          and (s->>'starts_at')::time <= local_start and local_end <= (s->>'ends_at')::time
      ) then raise exception 'Horário fora da janela operacional'; end if;
      if not exists(select 1 from public.calendar_events where workspace_id=p_workspace_id and task_id=task.id
        and starts_at=starts and ends_at=ends and status='confirmed') then
        insert into public.calendar_events(workspace_id,company_id,project_id,task_id,title,event_type,starts_at,ends_at)
        values(p_workspace_id,task.company_id,task.project_id,task.id,task.title,'execution',starts,ends);
      end if;
    else
      perform public.save_calendar_event(p_workspace_id, null, 'execution', task.title,
        task.company_id, task.project_id, task.id, starts, ends, false);
    end if;
    applied := applied + 1;
  end loop;
  return applied;
end $$;
revoke all on function public.approve_week_plan(uuid,jsonb) from public;
grant execute on function public.approve_week_plan(uuid,jsonb) to authenticated;

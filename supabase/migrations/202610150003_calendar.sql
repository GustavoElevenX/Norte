-- Existing protected/flexible recurrence rows are work windows, not occupied events.
-- Existing unavailable rows (including lunch) remain hard blocks.
create extension if not exists btree_gist;
drop policy exceptions_owner on public.weekly_recurrence_exceptions;
create policy exceptions_select on public.weekly_recurrence_exceptions for select to authenticated using (public.is_workspace_owner(workspace_id));
drop policy rules_owner on public.weekly_recurrence_rules;
create policy rules_select on public.weekly_recurrence_rules for select to authenticated using (public.is_workspace_owner(workspace_id));

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid,
  project_id uuid,
  task_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 240),
  event_type text not null check (event_type in ('appointment','execution')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled')),
  completed_at timestamptz,
  actual_minutes integer check (actual_minutes between 1 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,id),
  foreign key (workspace_id,company_id) references public.companies(workspace_id,id),
  foreign key (workspace_id,project_id) references public.projects(workspace_id,id),
  foreign key (workspace_id,task_id) references public.tasks(workspace_id,id),
  check (ends_at > starts_at and ends_at <= starts_at + interval '12 hours'),
  check ((event_type = 'execution') = (task_id is not null)),
  constraint calendar_events_no_overlap exclude using gist
    (workspace_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
    where (status <> 'cancelled')
);
create index calendar_events_range_idx on public.calendar_events(workspace_id,starts_at) where status<>'cancelled';
create index calendar_events_task_idx on public.calendar_events(workspace_id,task_id) where task_id is not null;
create trigger calendar_events_updated before update on public.calendar_events for each row execute function public.set_updated_at();
alter table public.calendar_events enable row level security;
create policy calendar_events_select on public.calendar_events for select to authenticated using (public.is_workspace_owner(workspace_id));

-- RPC is the sole write path: validate ownership, company/project/task and the
-- active local recurrence before the exclusion constraint commits the event.
create or replace function public.save_calendar_event(
  p_workspace_id uuid, p_event_id uuid, p_event_type text, p_title text,
  p_company_id uuid, p_project_id uuid, p_task_id uuid,
  p_starts_at timestamptz, p_ends_at timestamptz,
  p_allow_protected_override boolean default false
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_date date;
  v_start time;
  v_end time;
  v_weekday integer;
  v_timezone text;
  v_task public.tasks%rowtype;
  v_project_company uuid;
  v_matching_window boolean;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  if p_event_type not in ('appointment','execution') or length(trim(coalesce(p_title,''))) not between 1 and 240
    or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at
    or p_ends_at > p_starts_at + interval '12 hours' then
    raise exception 'Dados do evento inválidos';
  end if;
  if p_company_id is not null and not exists (select 1 from public.companies where workspace_id=p_workspace_id and id=p_company_id) then raise exception 'Empresa inválida'; end if;
  if p_project_id is not null then
    select company_id into v_project_company from public.projects where workspace_id=p_workspace_id and id=p_project_id;
    if not found or v_project_company is distinct from p_company_id then raise exception 'Projeto e empresa não correspondem'; end if;
  end if;
  if p_event_type='execution' then
    select * into v_task from public.tasks where workspace_id=p_workspace_id and id=p_task_id;
    if not found or v_task.status in ('done','cancelled') then raise exception 'Tarefa indisponível'; end if;
    if v_task.company_id is distinct from p_company_id or v_task.project_id is distinct from p_project_id then
      raise exception 'Tarefa e contexto não correspondem';
    end if;
  elsif p_task_id is not null then raise exception 'Compromisso não pode vincular tarefa'; end if;
  select timezone into v_timezone from public.workspaces where id=p_workspace_id;
  v_date := (p_starts_at at time zone v_timezone)::date;
  if (p_ends_at at time zone v_timezone)::date <> v_date then raise exception 'Evento deve terminar no mesmo dia local'; end if;
  v_start := (p_starts_at at time zone v_timezone)::time;
  v_end := (p_ends_at at time zone v_timezone)::time;
  v_weekday := extract(isodow from v_date);

  if exists (
    select 1 from public.weekly_recurrence_rules r
    left join public.weekly_recurrence_exceptions e on e.workspace_id=r.workspace_id and e.rule_id=r.id and e.occurs_on=v_date
    where r.workspace_id=p_workspace_id and r.weekday=v_weekday and r.effective_from<=v_date
      and (e.id is null or e.action <> 'skip') and r.mode='unavailable'
      and coalesce(e.starts_at,r.starts_at)<v_end and v_start<coalesce(e.ends_at,r.ends_at)
  ) then raise exception 'Horário indisponível'; end if;

  if p_event_type='execution' then
    select exists (
      select 1 from public.weekly_recurrence_rules r
      left join public.weekly_recurrence_exceptions e on e.workspace_id=r.workspace_id and e.rule_id=r.id and e.occurs_on=v_date
      where r.workspace_id=p_workspace_id and r.weekday=v_weekday and r.effective_from<=v_date
        and (e.id is null or e.action <> 'skip') and r.mode in ('protected','flexible')
        and coalesce(e.starts_at,r.starts_at)<=v_start and v_end<=coalesce(e.ends_at,r.ends_at)
        and (r.mode='flexible' or (r.project_id is not null and r.project_id=p_project_id)
          or (r.alternative_project_id is not null and r.alternative_project_id=p_project_id)
          or (r.project_id is null and r.company_id=p_company_id and p_company_id is not null))
    ) into v_matching_window;
    if not v_matching_window then raise exception 'Não há bloco de trabalho compatível para esta tarefa'; end if;
  elsif not p_allow_protected_override and exists (
    select 1 from public.weekly_recurrence_rules r
    left join public.weekly_recurrence_exceptions e on e.workspace_id=r.workspace_id and e.rule_id=r.id and e.occurs_on=v_date
    where r.workspace_id=p_workspace_id and r.weekday=v_weekday and r.effective_from<=v_date
      and (e.id is null or e.action <> 'skip') and r.mode='protected'
      and coalesce(e.starts_at,r.starts_at)<v_end and v_start<coalesce(e.ends_at,r.ends_at)
  ) then raise exception 'Compromisso afetaria bloco protegido; aprove o reagendamento'; end if;

  if p_event_id is null then
    if p_event_type='execution' then
      select id into v_id from public.calendar_events
      where workspace_id=p_workspace_id and task_id=p_task_id and starts_at=p_starts_at and ends_at=p_ends_at and status='confirmed';
      if v_id is not null then return v_id; end if;
    end if;
    insert into public.calendar_events(workspace_id,company_id,project_id,task_id,title,event_type,starts_at,ends_at)
    values(p_workspace_id,p_company_id,p_project_id,p_task_id,trim(p_title),p_event_type,p_starts_at,p_ends_at)
    returning id into v_id;
  else
    update public.calendar_events set company_id=p_company_id,project_id=p_project_id,task_id=p_task_id,
      title=trim(p_title),event_type=p_event_type,starts_at=p_starts_at,ends_at=p_ends_at
    where workspace_id=p_workspace_id and id=p_event_id and status='confirmed' returning id into v_id;
    if v_id is null then raise exception 'Evento não encontrado'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.save_calendar_event(uuid,uuid,text,text,uuid,uuid,uuid,timestamptz,timestamptz,boolean) from public;
grant execute on function public.save_calendar_event(uuid,uuid,text,text,uuid,uuid,uuid,timestamptz,timestamptz,boolean) to authenticated;

create or replace function public.finish_calendar_execution(p_workspace_id uuid, p_event_id uuid, p_actual_minutes integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  update public.calendar_events set status='completed',completed_at=now(),actual_minutes=p_actual_minutes
  where workspace_id=p_workspace_id and id=p_event_id and event_type='execution' and status='confirmed'
    and p_actual_minutes between 1 and 720;
  if not found then raise exception 'Bloco de execução inválido'; end if;
end $$;
revoke all on function public.finish_calendar_execution(uuid,uuid,integer) from public;
grant execute on function public.finish_calendar_execution(uuid,uuid,integer) to authenticated;

create or replace function public.cancel_calendar_event(p_workspace_id uuid, p_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  update public.calendar_events set status='cancelled' where workspace_id=p_workspace_id and id=p_event_id and status='confirmed';
  if not found then raise exception 'Evento não encontrado'; end if;
end $$;
revoke all on function public.cancel_calendar_event(uuid,uuid) from public;
grant execute on function public.cancel_calendar_event(uuid,uuid) to authenticated;

create or replace function public.save_recurrence_exception(
  p_workspace_id uuid, p_rule_id uuid, p_date date, p_action text,
  p_start time default null, p_end time default null, p_title text default null,
  p_approve_protected boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
declare v_rule public.weekly_recurrence_rules%rowtype;
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Workspace não autorizado'; end if;
  select * into v_rule from public.weekly_recurrence_rules where workspace_id=p_workspace_id and id=p_rule_id;
  if not found or p_date < v_rule.effective_from or extract(isodow from p_date) <> v_rule.weekday then raise exception 'Ocorrência inválida'; end if;
  if v_rule.mode='protected' and not p_approve_protected then raise exception 'Aprove a alteração do bloco protegido'; end if;
  if p_action='restore' then
    delete from public.weekly_recurrence_exceptions where workspace_id=p_workspace_id and rule_id=p_rule_id and occurs_on=p_date;
    return;
  end if;
  if p_action not in ('skip','override') or (p_action='override' and (p_start is null or p_end is null or p_start >= p_end)) then raise exception 'Exceção inválida'; end if;
  if p_action='override' then
    if exists (
      select 1 from public.weekly_recurrence_rules r
      left join public.weekly_recurrence_exceptions e on e.workspace_id=r.workspace_id and e.rule_id=r.id and e.occurs_on=p_date
      where r.workspace_id=p_workspace_id and r.id<>p_rule_id and r.weekday=v_rule.weekday and r.effective_from<=p_date
        and (e.id is null or e.action<>'skip')
        and coalesce(e.starts_at,r.starts_at)<p_end and p_start<coalesce(e.ends_at,r.ends_at)
    ) then raise exception 'Bloco conflitante com outra rotina'; end if;
    if v_rule.mode='unavailable' and exists (
      select 1 from public.calendar_events c where c.workspace_id=p_workspace_id and c.status<>'cancelled'
        and (c.starts_at at time zone v_rule.timezone)::date=p_date
        and (c.starts_at at time zone v_rule.timezone)::time<p_end
        and p_start<(c.ends_at at time zone v_rule.timezone)::time
    ) then raise exception 'Há compromisso ou execução neste horário'; end if;
  end if;
  insert into public.weekly_recurrence_exceptions(workspace_id,rule_id,occurs_on,action,title,starts_at,ends_at)
  values(p_workspace_id,p_rule_id,p_date,p_action,case when p_action='override' then nullif(trim(p_title),'') else null end,
    case when p_action='override' then p_start else null end,case when p_action='override' then p_end else null end)
  on conflict(workspace_id,rule_id,occurs_on) do update set action=excluded.action,title=excluded.title,
    starts_at=excluded.starts_at,ends_at=excluded.ends_at;
end $$;
revoke all on function public.save_recurrence_exception(uuid,uuid,date,text,time,time,text,boolean) from public;
grant execute on function public.save_recurrence_exception(uuid,uuid,date,text,time,time,text,boolean) to authenticated;

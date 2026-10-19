create table public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid,
  project_id uuid,
  name text not null check(char_length(trim(name)) between 1 and 160),
  goal_type text not null default 'quantitative' check(goal_type in ('quantitative','milestone')),
  unit text not null check(char_length(trim(unit)) between 1 and 40),
  target_value numeric(14,2) not null check(target_value > 0),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check(status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,company_id) references public.companies(workspace_id,id),
  foreign key(workspace_id,project_id) references public.projects(workspace_id,id),
  check(ends_on >= starts_on),
  check(project_id is null or company_id is not null)
);
create index goals_scope_idx on public.goals(workspace_id,company_id,starts_on,ends_on);
create trigger goals_updated before update on public.goals for each row execute function public.set_updated_at();
create table public.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  goal_id uuid not null,
  recorded_on date not null,
  actual_value numeric(14,2) not null check(actual_value >= 0),
  note text not null default '' check(char_length(note) <= 2000),
  source text not null default 'manual' check(source='manual'),
  created_at timestamptz not null default now(),
  foreign key(workspace_id,goal_id) references public.goals(workspace_id,id)
);
create index goal_checkins_lookup_idx on public.goal_checkins(workspace_id,goal_id,recorded_on desc,created_at desc);

-- Immutable facts preserve historical planning and completion when a task is edited later.
create table public.task_planning_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null,
  event_id uuid not null,
  planned_for date not null,
  company_id uuid,
  project_id uuid,
  priority text,
  estimated_minutes integer not null,
  planned_at timestamptz not null default now(),
  unique(workspace_id,event_id,planned_for),
  foreign key(workspace_id,task_id) references public.tasks(workspace_id,id),
  foreign key(workspace_id,event_id) references public.calendar_events(workspace_id,id)
);
create index planning_period_idx on public.task_planning_snapshots(workspace_id,planned_for,company_id);
create table public.task_completion_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null,
  company_id uuid,
  project_id uuid,
  priority text,
  due_at timestamptz,
  completed_at timestamptz not null,
  foreign key(workspace_id,task_id) references public.tasks(workspace_id,id)
);
create index completion_period_idx on public.task_completion_events(workspace_id,completed_at,company_id);
create or replace function public.record_planning_snapshot()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_timezone text; v_changed boolean;
begin
  if tg_op='INSERT' then v_changed := true;
  else v_changed := new.starts_at is distinct from old.starts_at; end if;
  if new.event_type='execution' and new.status='confirmed' and v_changed then
    select timezone into v_timezone from public.workspaces where id=new.workspace_id;
    insert into public.task_planning_snapshots(workspace_id,task_id,event_id,planned_for,company_id,project_id,priority,estimated_minutes)
    select new.workspace_id,t.id,new.id,(new.starts_at at time zone v_timezone)::date,t.company_id,t.project_id,t.priority,
      extract(epoch from (new.ends_at-new.starts_at))::integer/60
    from public.tasks t where t.workspace_id=new.workspace_id and t.id=new.task_id
    on conflict(workspace_id,event_id,planned_for) do nothing;
  end if;
  return new;
end $$;
create trigger calendar_planning_snapshot after insert or update on public.calendar_events
for each row execute function public.record_planning_snapshot();
create or replace function public.record_completion_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_changed boolean;
begin
  if tg_op='INSERT' then v_changed := true;
  else v_changed := old.status is distinct from 'done'; end if;
  if new.status='done' and v_changed then
    insert into public.task_completion_events(workspace_id,task_id,company_id,project_id,priority,due_at,completed_at)
    values(new.workspace_id,new.id,new.company_id,new.project_id,new.priority,new.due_at,coalesce(new.completed_at,now()));
  end if;
  return new;
end $$;
create trigger task_completion_snapshot after insert or update on public.tasks
for each row execute function public.record_completion_event();

-- Preserve existing Norte data without creating fictitious past plans or actual work.
insert into public.task_planning_snapshots(workspace_id,task_id,event_id,planned_for,company_id,project_id,priority,estimated_minutes,planned_at)
select c.workspace_id,t.id,c.id,(c.starts_at at time zone w.timezone)::date,t.company_id,t.project_id,t.priority,
  extract(epoch from (c.ends_at-c.starts_at))::integer/60,c.created_at
from public.calendar_events c join public.tasks t on t.workspace_id=c.workspace_id and t.id=c.task_id
join public.workspaces w on w.id=c.workspace_id where c.event_type='execution';
-- Existing completed tasks get one completion fact only if completed_at was recorded.
insert into public.task_completion_events(workspace_id,task_id,company_id,project_id,priority,due_at,completed_at)
select workspace_id,id,company_id,project_id,priority,due_at,completed_at from public.tasks
where status='done' and completed_at is not null;

alter table public.goals enable row level security;
alter table public.goal_checkins enable row level security;
alter table public.task_planning_snapshots enable row level security;
alter table public.task_completion_events enable row level security;
create policy goals_owner on public.goals for all to authenticated using(public.is_workspace_owner(workspace_id)) with check(public.is_workspace_owner(workspace_id));
create policy goal_checkins_select on public.goal_checkins for select to authenticated using(public.is_workspace_owner(workspace_id));
create policy goal_checkins_insert on public.goal_checkins for insert to authenticated with check(public.is_workspace_owner(workspace_id));
create policy planning_select on public.task_planning_snapshots for select to authenticated using(public.is_workspace_owner(workspace_id));
create policy completion_select on public.task_completion_events for select to authenticated using(public.is_workspace_owner(workspace_id));

create or replace function public.validate_goal_links()
returns trigger language plpgsql set search_path='' as $$
declare v_company uuid;
begin
  if new.project_id is not null then
    select company_id into v_company from public.projects where workspace_id=new.workspace_id and id=new.project_id;
    if not found or v_company is distinct from new.company_id then raise exception 'Projeto e empresa não correspondem'; end if;
  end if;
  return new;
end $$;
create trigger goals_validate_links before insert or update on public.goals for each row execute function public.validate_goal_links();

create or replace function public.validate_goal_checkin()
returns trigger language plpgsql set search_path='' as $$
declare v_start date; v_end date;
begin
  select starts_on,ends_on into v_start,v_end from public.goals where workspace_id=new.workspace_id and id=new.goal_id;
  if not found or new.recorded_on < v_start or new.recorded_on > v_end then raise exception 'Registro fora do período da meta'; end if;
  return new;
end $$;
create trigger goal_checkins_validate before insert on public.goal_checkins for each row execute function public.validate_goal_checkin();

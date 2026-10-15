create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu workspace',
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  timezone text not null default 'America/Fortaleza',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspaces
    where id = target_workspace_id and owner_user_id = (select auth.uid())
  );
$$;

create or replace function public.create_personal_workspace()
returns trigger language plpgsql security definer set search_path = '' as $$
declare new_workspace_id uuid;
begin
  insert into public.workspaces (owner_user_id) values (new.id) returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.create_personal_workspace();

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  segment text not null default '',
  description text not null default '',
  cnpj text check (cnpj ~ '^[0-9]{14}$'),
  color text not null default '#0c6980' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  notes text not null default '',
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, company_id, id),
  foreign key (workspace_id, company_id) references public.companies(workspace_id, id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null,
  client_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '',
  goal_text text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'done', 'archived')),
  starts_on date,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, company_id, id),
  foreign key (workspace_id, company_id) references public.companies(workspace_id, id),
  foreign key (workspace_id, company_id, client_id) references public.clients(workspace_id, company_id, id),
  check (due_on is null or starts_on is null or due_on >= starts_on)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid,
  project_id uuid,
  client_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text check (priority in ('P1', 'P2', 'P3')),
  due_at timestamptz,
  estimated_minutes integer check (estimated_minutes between 1 and 1440),
  completed_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'inbox')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, company_id) references public.companies(workspace_id, id),
  foreign key (workspace_id, company_id, project_id) references public.projects(workspace_id, company_id, id),
  foreign key (workspace_id, company_id, client_id) references public.clients(workspace_id, company_id, id),
  check (project_id is null or company_id is not null),
  check (client_id is null or company_id is not null)
);

create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  raw_text text not null check (char_length(trim(raw_text)) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'converted', 'dismissed')),
  task_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, task_id) references public.tasks(workspace_id, id),
  check ((status = 'converted' and task_id is not null) or (status <> 'converted' and task_id is null))
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  entity_type text not null check (entity_type in ('company', 'client', 'project', 'task', 'inbox_item')),
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'convert', 'dismiss')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index companies_workspace_status_idx on public.companies(workspace_id, status);
create index clients_workspace_company_idx on public.clients(workspace_id, company_id);
create index projects_workspace_company_idx on public.projects(workspace_id, company_id);
create index tasks_workspace_company_status_idx on public.tasks(workspace_id, company_id, status);
create index tasks_workspace_due_idx on public.tasks(workspace_id, due_at);
create index inbox_workspace_status_idx on public.inbox_items(workspace_id, status, created_at desc);
create index activity_workspace_created_idx on public.activity_log(workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated before update on public.workspaces for each row execute function public.set_updated_at();
create trigger companies_updated before update on public.companies for each row execute function public.set_updated_at();
create trigger clients_updated before update on public.clients for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();
create trigger inbox_updated before update on public.inbox_items for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;
alter table public.activity_log enable row level security;

create policy workspace_select on public.workspaces for select to authenticated using (owner_user_id = (select auth.uid()));
create policy workspace_update on public.workspaces for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy member_select on public.workspace_members for select to authenticated using (public.is_workspace_owner(workspace_id));

create policy company_select on public.companies for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy company_insert on public.companies for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy company_update on public.companies for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy client_select on public.clients for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy client_insert on public.clients for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy client_update on public.clients for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy project_select on public.projects for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy project_insert on public.projects for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy project_update on public.projects for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy task_select on public.tasks for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy task_insert on public.tasks for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy task_update on public.tasks for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy inbox_select on public.inbox_items for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy inbox_insert on public.inbox_items for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy inbox_update on public.inbox_items for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

create policy activity_select on public.activity_log for select to authenticated using (public.is_workspace_owner(workspace_id));

create or replace function public.convert_inbox_to_task(item_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare item public.inbox_items%rowtype;
declare new_task_id uuid;
begin
  select * into item from public.inbox_items where id = item_id and status = 'open' for update;
  if not found then raise exception 'Demanda não encontrada ou já classificada'; end if;
  insert into public.tasks (workspace_id, title, description, source)
  values (item.workspace_id, left(item.raw_text, 240),
    case when char_length(item.raw_text) > 240 then item.raw_text else '' end, 'inbox')
  returning id into new_task_id;
  update public.inbox_items set status = 'converted', task_id = new_task_id where id = item_id;
  return new_task_id;
end;
$$;
revoke all on function public.convert_inbox_to_task(uuid) from public;
grant execute on function public.convert_inbox_to_task(uuid) to authenticated;

create or replace function public.audit_business_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
declare logged_action text;
declare logged_entity text;
begin
  if actor_id is null then raise exception 'Authenticated user required for business change'; end if;
  logged_entity := case tg_table_name
    when 'companies' then 'company'
    when 'clients' then 'client'
    when 'projects' then 'project'
    when 'tasks' then 'task'
    else 'inbox_item' end;
  logged_action := case
    when tg_op = 'INSERT' then 'create'
    when tg_table_name = 'inbox_items' and new.status = 'converted' then 'convert'
    when tg_table_name = 'inbox_items' and new.status = 'dismissed' then 'dismiss'
    else 'update' end;
  insert into public.activity_log (workspace_id, actor_user_id, entity_type, entity_id, action)
  values (new.workspace_id, actor_id, logged_entity, new.id, logged_action);
  return new;
end;
$$;

create trigger companies_audit after insert or update on public.companies for each row execute function public.audit_business_change();
create trigger clients_audit after insert or update on public.clients for each row execute function public.audit_business_change();
create trigger projects_audit after insert or update on public.projects for each row execute function public.audit_business_change();
create trigger tasks_audit after insert or update on public.tasks for each row execute function public.audit_business_change();
create trigger inbox_audit after insert or update on public.inbox_items for each row execute function public.audit_business_change();

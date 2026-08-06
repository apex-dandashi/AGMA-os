-- =============================================================================
-- Phase 1b: core schema — docs/02 §2 data model + docs/03 playbook engine.
-- Every table: RLS + audit trigger (CLAUDE.md rule 1).
-- Access matrix (docs/02 §4): admin=all, strategist=all clients,
-- executor=assigned projects only, client=own rows only.
-- =============================================================================

create type public.lead_source as enum ('call', 'whatsapp', 'email', 'site');
create type public.lead_stage as enum
  ('discovery_call', 'opportunity_analysis', 'scoping', 'roadmap', 'live', 'optimize');
create type public.client_status as enum ('active', 'paused', 'archived');
create type public.scope_status as enum ('draft', 'sent', 'approved', 'rejected');
create type public.project_status as enum
  ('planning', 'active', 'paused', 'completed', 'archived');
create type public.method_phase as enum ('analyze', 'generate', 'market', 'adapt');
create type public.project_mode as enum ('recurring', 'milestone');
create type public.task_status as enum ('todo', 'in_progress', 'review', 'done', 'blocked');
create type public.approval_item_type as enum
  ('scope', 'roadmap', 'deliverable', 'report', 'task');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.message_channel as enum ('portal', 'whatsapp', 'email');
create type public.kpi_direction as enum ('up', 'down');

-- =============================================================================
-- Catalog: categories + 32 services (docs/02 services_catalog)
-- =============================================================================
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services_catalog (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Playbook engine (docs/03 schema additions)
-- =============================================================================
create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) unique,
  slug text not null unique,
  name_ar text not null,
  mode public.project_mode not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.playbooks.mode is
  'recurring = weekly/monthly cycles (performance, social, seo); milestone = fixed scope + revision caps (branding, web, strategy). docs/03 §How-this-changes.';

create table public.playbook_stages (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks (id) on delete cascade,
  method_phase public.method_phase not null,
  name_ar text not null,
  name_en text not null,
  sort int not null,
  unique (playbook_id, sort)
);

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.playbook_stages (id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  role public.user_role not null default 'executor',
  default_days int not null default 3,
  needs_client_approval boolean not null default false,
  sort int not null default 0
);

create table public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks (id) on delete cascade,
  key text not null,
  label_ar text not null,
  label_en text not null,
  unit text,
  direction public.kpi_direction not null,
  unique (playbook_id, key)
);

-- =============================================================================
-- CRM core (docs/02 §2)
-- =============================================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  sector text,
  decision_maker text,
  budget_tier text,
  status public.client_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles.client_id could not exist before clients did.
alter table public.profiles
  add column client_id uuid references public.clients (id);

comment on column public.profiles.client_id is
  'Set only for role=client: scopes every portal query via RLS.';

create or replace function public.current_client_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid() and active;
$$;

grant execute on function public.current_client_id to authenticated;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  source public.lead_source not null default 'site',
  stage public.lead_stage not null default 'discovery_call',
  owner uuid references public.profiles (id),
  notes text,
  client_id uuid references public.clients (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scopes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  service_ids uuid[] not null default '{}',
  timeline text,
  responsibilities text,
  status public.scope_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  scope_id uuid not null references public.scopes (id),
  priorities text[] not null default '{}',
  channels text[] not null default '{}',
  tools text[] not null default '{}',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Delivery (docs/02 §3.2 + docs/03)
-- =============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  roadmap_id uuid references public.roadmaps (id),
  playbook_id uuid not null references public.playbooks (id),
  name text not null,
  status public.project_status not null default 'planning',
  method_phase public.method_phase not null default 'analyze',
  mode public.project_mode not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  number int not null,
  starts_on date,
  ends_on date,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.sprints (id) on delete cascade,
  service_id uuid references public.services_catalog (id),
  template_id uuid references public.task_templates (id),
  title text not null,
  assignee uuid references public.profiles (id),
  status public.task_status not null default 'todo',
  due date,
  deliverable_url text,
  needs_client_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Executor scoping: member of a project = has a task assigned in it.
create or replace function public.is_project_member(pid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_strategist_plus()
    or exists (
      select 1
      from public.tasks t
      join public.sprints s on s.id = t.sprint_id
      where s.project_id = pid and t.assignee = auth.uid()
    );
$$;

grant execute on function public.is_project_member to authenticated;

-- =============================================================================
-- Reporting + portal surfaces (docs/02 §3.3, §3.4)
-- =============================================================================
create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  metric_date date not null,
  cpa numeric,
  roas numeric,
  hours_saved numeric,
  spend numeric,
  conversions numeric,
  custom jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, metric_date)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  period text not null,
  summary_ar text,
  pdf_url text,
  published_to_portal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  item_type public.approval_item_type not null,
  item_id uuid not null,
  status public.approval_status not null default 'pending',
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  sender uuid not null references public.profiles (id),
  body text not null,
  channel public.message_channel not null default 'portal',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- RLS + audit on everything
-- =============================================================================

-- Catalog + playbook tables: all authenticated read, admin writes.
do $$
declare t text;
begin
  foreach t in array array[
    'service_categories', 'services_catalog', 'playbooks',
    'playbook_stages', 'task_templates', 'kpi_definitions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s: authenticated read" on public.%I for select to authenticated using (true)', t, t);
    execute format(
      'create policy "%s: admin manages" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- updated_at maintenance for tables that have the column.
do $$
declare t text;
begin
  foreach t in array array[
    'service_categories', 'services_catalog', 'playbooks', 'clients', 'leads',
    'scopes', 'roadmaps', 'projects', 'sprints', 'tasks', 'metrics', 'reports',
    'approvals'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- Audit on all operational tables.
do $$
declare t text;
begin
  foreach t in array array[
    'clients', 'leads', 'scopes', 'roadmaps', 'projects', 'sprints', 'tasks',
    'metrics', 'reports', 'approvals', 'messages'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- clients
create policy "clients: strategist+ manages" on public.clients
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "clients: executor reads" on public.clients
  for select to authenticated using (public.is_team());
create policy "clients: client reads own" on public.clients
  for select to authenticated using (id = public.current_client_id());

-- leads (pipeline is strategist+ territory; clients never see leads)
create policy "leads: strategist+ manages" on public.leads
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

-- scopes (client sees own once sent — drafts stay internal)
create policy "scopes: strategist+ manages" on public.scopes
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "scopes: client reads own sent" on public.scopes
  for select to authenticated
  using (client_id = public.current_client_id() and status <> 'draft');

-- roadmaps (visible to client when parent scope is visible)
create policy "roadmaps: strategist+ manages" on public.roadmaps
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "roadmaps: client reads own" on public.roadmaps
  for select to authenticated
  using (exists (
    select 1 from public.scopes s
    where s.id = scope_id
      and s.client_id = public.current_client_id()
      and s.status <> 'draft'
  ));

-- projects
create policy "projects: strategist+ manages" on public.projects
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "projects: executor reads assigned" on public.projects
  for select to authenticated
  using (public.is_team() and public.is_project_member(id));
create policy "projects: client reads own" on public.projects
  for select to authenticated using (client_id = public.current_client_id());

-- sprints
create policy "sprints: strategist+ manages" on public.sprints
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "sprints: executor reads assigned" on public.sprints
  for select to authenticated
  using (public.is_team() and public.is_project_member(project_id));

-- tasks (executor updates own; strategist+ full)
create policy "tasks: strategist+ manages" on public.tasks
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "tasks: executor reads assigned projects" on public.tasks
  for select to authenticated
  using (public.is_team() and exists (
    select 1 from public.sprints s
    where s.id = sprint_id and public.is_project_member(s.project_id)
  ));
create policy "tasks: executor updates own" on public.tasks
  for update to authenticated
  using (public.is_team() and assignee = auth.uid())
  with check (public.is_team() and assignee = auth.uid());

-- metrics (team-facing; clients consume reports instead)
create policy "metrics: strategist+ manages" on public.metrics
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "metrics: executor reads assigned" on public.metrics
  for select to authenticated
  using (public.is_team() and public.is_project_member(project_id));

-- reports (client sees own published only)
create policy "reports: strategist+ manages" on public.reports
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "reports: executor reads assigned" on public.reports
  for select to authenticated
  using (public.is_team() and public.is_project_member(project_id));
create policy "reports: client reads own published" on public.reports
  for select to authenticated
  using (published_to_portal and exists (
    select 1 from public.projects p
    where p.id = project_id and p.client_id = public.current_client_id()
  ));

-- approvals (the portal centerpiece: client decides own pending items)
create policy "approvals: strategist+ manages" on public.approvals
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "approvals: client reads own" on public.approvals
  for select to authenticated using (client_id = public.current_client_id());
create policy "approvals: client decides own pending" on public.approvals
  for update to authenticated
  using (client_id = public.current_client_id() and status = 'pending')
  with check (client_id = public.current_client_id()
    and status in ('approved', 'rejected'));

-- Stamp decision metadata server-side, never trusting the client payload.
create or replace function public.stamp_approval_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    new.decided_at := now();
    new.decided_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger approvals_stamp_decision
  before update on public.approvals
  for each row execute function public.stamp_approval_decision();

-- =============================================================================
-- Table-level grants. This stack's default privileges give authenticated no
-- DML — policies alone are not enough. RLS remains the row gate; grants are
-- deliberately explicit per table (payment_accounts keeps its column grants,
-- audit_log stays service_role-only).
-- =============================================================================
grant select on public.flags to authenticated;  -- Phase 0 read policy lacked this

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'role_profiles',
    'service_categories', 'services_catalog', 'playbooks', 'playbook_stages',
    'task_templates', 'kpi_definitions',
    'clients', 'leads', 'scopes', 'roadmaps', 'projects', 'sprints', 'tasks',
    'metrics', 'reports', 'approvals', 'messages'
  ] loop
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- messages (structured comms thread per client, docs/02 §3.4)
create policy "messages: team manages" on public.messages
  for all to authenticated
  using (public.is_team()) with check (public.is_team() and sender = auth.uid());
create policy "messages: client reads own thread" on public.messages
  for select to authenticated using (client_id = public.current_client_id());
create policy "messages: client writes own thread" on public.messages
  for insert to authenticated
  with check (client_id = public.current_client_id() and sender = auth.uid());

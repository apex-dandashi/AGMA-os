-- =============================================================================
-- Sprint B (docs/07 + docs/08): global activities engine, Pipedrive-style
-- deal fields, tags, UTM attribution, realtime publication.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Global activities/reminders engine (docs/08 §6): one table, linkable to any
-- record. Powers CRM next-actions now; document expiries and compliance
-- renewals attach later.
-- -----------------------------------------------------------------------------
create type public.activity_kind as enum ('call', 'meeting', 'task', 'deadline', 'followup');

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  kind public.activity_kind not null default 'task',
  title text not null,
  due_at timestamptz not null,
  done_at timestamptz,
  assignee uuid references public.profiles (id) default auth.uid(),
  lead_id uuid references public.leads (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_open_due_idx on public.activities (due_at) where done_at is null;
create index activities_lead_idx on public.activities (lead_id);

alter table public.activities enable row level security;
grant select, insert, update, delete on public.activities to authenticated, service_role;

create policy "activities: team manages" on public.activities
  for all to authenticated
  using (public.is_team()) with check (public.is_team());

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();
create trigger activities_audit
  after insert or update or delete on public.activities
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Deal fields on leads (docs/08 §1): value, expected close, outcome + reason.
-- outcome is orthogonal to stage: a lead can be lost at any stage.
-- -----------------------------------------------------------------------------
create type public.lead_outcome as enum ('open', 'won', 'lost');

alter table public.leads
  add column value numeric,
  add column expected_close date,
  add column outcome public.lead_outcome not null default 'open',
  add column lost_reason text,
  add column tags text[] not null default '{}',
  add column utm jsonb not null default '{}';

alter table public.clients
  add column tags text[] not null default '{}';

comment on column public.leads.utm is
  'Attribution captured by lead-intake: utm_source/medium/campaign/term/content + referrer.';

-- -----------------------------------------------------------------------------
-- Realtime: team-shared views update live (docs/07 DoD #8).
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.activities;

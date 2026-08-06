-- =============================================================================
-- Phase 2: CRM engine additions (docs/04 §2.1) + website live-sync (docs/05 §B1)
-- =============================================================================

create type public.interaction_kind as enum ('call', 'whatsapp', 'email', 'meeting', 'note');

-- Contacts: the humans behind clients and leads (docs/04 §2.1).
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  name text not null,
  title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id is not null or lead_id is not null)
);

-- Interactions: every touch logged (calls, WhatsApp, email, meetings).
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  kind public.interaction_kind not null default 'note',
  summary text not null,
  occurred_at timestamptz not null default now(),
  logged_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (client_id is not null or lead_id is not null)
);

-- Website live-sync (docs/05 §B1): the site renders published clients
-- automatically. consent_public is the legal kill switch — never publish a
-- client logo without contract clause + this toggle.
create table public.website_clients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade unique,
  display_name_ar text not null,
  display_name_en text,
  logo_url text,
  consent_public boolean not null default false,
  published boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.website_clients.consent_public is
  'Legal requirement (docs/05 §B1): contract clause + explicit toggle before any public rendering. The anon policy requires BOTH consent_public AND published.';

-- RLS + audit + updated_at + grants
do $$
declare t text;
begin
  foreach t in array array['contacts', 'interactions', 'website_clients'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger website_clients_set_updated_at
  before update on public.website_clients
  for each row execute function public.set_updated_at();

-- contacts + interactions: strategist+ manage; executor read (client context)
create policy "contacts: strategist+ manages" on public.contacts
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "contacts: executor reads" on public.contacts
  for select to authenticated using (public.is_team());

create policy "interactions: strategist+ manages" on public.interactions
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "interactions: team logs" on public.interactions
  for insert to authenticated
  with check (public.is_team() and logged_by = auth.uid());
create policy "interactions: executor reads" on public.interactions
  for select to authenticated using (public.is_team());

-- website_clients: strategist+ manage; the PUBLIC SITE reads via anon —
-- only rows that are BOTH published AND consented.
create policy "website_clients: strategist+ manages" on public.website_clients
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

grant select (id, display_name_ar, display_name_en, logo_url, sort, published, consent_public)
  on public.website_clients to anon;

create policy "website_clients: public reads published+consented" on public.website_clients
  for select to anon
  using (published and consent_public);

-- =============================================================================
-- service_role grants. This image's default privileges also give service_role
-- no DML; it bypasses RLS but still needs table grants (found via edge function
-- 42501). Grant across all current public tables — service_role is the trusted
-- backend role by definition.
-- =============================================================================
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format(
      'grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;


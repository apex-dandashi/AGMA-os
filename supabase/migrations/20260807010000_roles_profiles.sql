-- =============================================================================
-- Phase 1a: roles, profiles, RLS helper functions, role_profiles
-- docs/02 §4 role matrix: admin / strategist / executor / client
-- =============================================================================

create type public.user_role as enum ('admin', 'strategist', 'executor', 'client');

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user. client_id FK is added in the core-schema
-- migration (clients table does not exist yet).
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'client',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'App-level user record. role drives every RLS policy (docs/02 §4).';

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profiles_audit
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger();

-- Auto-create a profile when an auth user signs up. Default role 'client';
-- admins promote team members explicitly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS helper functions. security definer → run as table owner, bypassing RLS,
-- so policies can call them without recursion.
-- -----------------------------------------------------------------------------
create or replace function public.app_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.app_role() = 'admin';
$$;

create or replace function public.is_strategist_plus()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.app_role() in ('admin', 'strategist');
$$;

create or replace function public.is_team()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.app_role() in ('admin', 'strategist', 'executor');
$$;

grant execute on function public.app_role, public.is_admin,
  public.is_strategist_plus, public.is_team to authenticated;

-- Profiles policies (defined after helpers exist).
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles: team reads all"
  on public.profiles for select
  to authenticated
  using (public.is_team());

create policy "profiles: admin manages"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- role_profiles — per-role template copy for the employee portal
-- (docs/06 §4: welcome email + signature pillar cards). Seeded in Phase 1c.
-- -----------------------------------------------------------------------------
create table public.role_profiles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  title_ar text not null,
  title_en text not null,
  pillars jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.role_profiles is
  'Role-pillar copy consumed by the employee portal generators (docs/06 §4).';

alter table public.role_profiles enable row level security;

create policy "role_profiles: authenticated read"
  on public.role_profiles for select
  to authenticated
  using (true);

create policy "role_profiles: admin manages"
  on public.role_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger role_profiles_set_updated_at
  before update on public.role_profiles
  for each row execute function public.set_updated_at();

create trigger role_profiles_audit
  after insert or update or delete on public.role_profiles
  for each row execute function public.audit_trigger();

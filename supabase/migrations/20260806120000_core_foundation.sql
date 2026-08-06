-- =============================================================================
-- Phase 0 core foundation: audit infrastructure, feature flags, payment accounts
-- Rules (CLAUDE.md): every table ships RLS + audit trigger; internal_label is
-- admin-only and must never reach any rendered output or the client portal.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Audit log — append-only record of every write on audited tables.
--    No RLS policies are defined: only service_role (bypasses RLS) and future
--    admin-scoped policies (Phase 1, once roles exist) can read it.
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor uuid default auth.uid(),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only audit trail (docs/05 §B11.1). Never update or delete rows.';

alter table public.audit_log enable row level security;

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_created_at_idx on public.audit_log (created_at);

-- -----------------------------------------------------------------------------
-- 2. Generic audit trigger — attach to every future table:
--      create trigger <t>_audit after insert or update or delete on public.<t>
--        for each row execute function public.audit_trigger();
--    Requires the table to have an `id` column.
-- -----------------------------------------------------------------------------
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (table_name, record_id, action, actor, new_data)
    values (tg_table_name, new.id::text, tg_op, auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (table_name, record_id, action, actor, old_data, new_data)
    values (tg_table_name, new.id::text, tg_op, auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_log (table_name, record_id, action, actor, old_data)
    values (tg_table_name, old.id::text, tg_op, auth.uid(), to_jsonb(old));
    return old;
  end if;
end;
$$;

-- Shared updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Feature flags — ship dark, enable per environment (docs/05 §B11.5).
-- -----------------------------------------------------------------------------
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  enabled boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flags enable row level security;

-- Anyone signed in may read flags; writes are service_role/admin only (no policy).
create policy "flags: authenticated read"
  on public.flags for select
  to authenticated
  using (true);

create trigger flags_set_updated_at
  before update on public.flags
  for each row execute function public.set_updated_at();

create trigger flags_audit
  after insert or update or delete on public.flags
  for each row execute function public.audit_trigger();

insert into public.flags (key, enabled, description) values
  ('vat_enabled', false,
   'Finance VAT mode (CLAUDE.md rule 4): off while the establishment is not VAT-registered. Flipping on enables 15% VAT + ZATCA fields; invoice layout always reserves the VAT row.')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 4. Payment accounts — 3 Al Rajhi IBANs (docs/06 §1). The client-facing
--    beneficiary is ALWAYS the establishment legal name; internal_label is
--    admin-only bookkeeping and must never be rendered anywhere.
-- -----------------------------------------------------------------------------
create table public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  iban text not null unique check (iban ~ '^SA[0-9]{22}$'),
  bank_name text not null default 'مصرف الراجحي',
  beneficiary_name text not null,
  internal_label text not null,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.payment_accounts.internal_label is
  'ADMIN-ONLY (docs/06 §1): partner-level revenue grouping. Excluded from anon/authenticated column grants; never render on documents or in the portal.';

-- At most one default account.
create unique index payment_accounts_single_default
  on public.payment_accounts (is_default)
  where is_default;

alter table public.payment_accounts enable row level security;

-- Column-level defense: even if a future policy grants SELECT, internal_label
-- stays invisible to non-admin roles. Admin access goes through service_role
-- (Phase 1 adds role-aware policies).
revoke all on table public.payment_accounts from anon, authenticated;
grant select (id, iban, bank_name, beneficiary_name, is_default, active)
  on public.payment_accounts to authenticated;

-- Row access for authenticated users: active accounts only (needed by document
-- generators' account selector from Phase 3 on).
create policy "payment_accounts: authenticated read active"
  on public.payment_accounts for select
  to authenticated
  using (active);

create trigger payment_accounts_set_updated_at
  before update on public.payment_accounts
  for each row execute function public.set_updated_at();

create trigger payment_accounts_audit
  after insert or update or delete on public.payment_accounts
  for each row execute function public.audit_trigger();

-- Seed: docs/06 §1 payment accounts table. The retired one-time IBAN
-- (SA27...1413, invoice 00052) is intentionally NOT seeded.
insert into public.payment_accounts (iban, beneficiary_name, internal_label, is_default) values
  ('SA3880000296608016343793',
   'مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية',
   'Main', true),
  ('SA3880000296608016343769',
   'مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية',
   'For A.Alghamdi', false),
  ('SA4780000001608016057099',
   'مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية',
   'For A.Elibrahim', false)
on conflict (iban) do nothing;

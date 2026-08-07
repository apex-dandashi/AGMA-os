-- =============================================================================
-- Phase 5b: Finance KSA (docs/05 §B3, docs/06 §3, docs/08 §3).
-- Invoices/credit notes ride the immutable documents engine; payments,
-- retainers, expenses, ad-spend wallets are new tables.
-- =============================================================================

-- Frozen money total on documents (set at finalize, immutable after).
alter table public.documents add column total numeric;

create or replace function public.documents_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'finalized documents are immutable — void or supersede instead';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    if new.payload::text is distinct from old.payload::text
       or new.number is distinct from old.number
       or new.type is distinct from old.type
       or new.client_id is distinct from old.client_id
       or new.scope_id is distinct from old.scope_id
       or new.version is distinct from old.version
       or new.supersedes is distinct from old.supersedes
       or new.payment_account_id is distinct from old.payment_account_id
       or new.issued_on is distinct from old.issued_on
       or new.valid_until is distinct from old.valid_until
       or new.total is distinct from old.total then
      raise exception 'finalized documents are immutable — only status may change';
    end if;
    if new.status = 'draft' then
      raise exception 'finalized documents cannot return to draft';
    end if;
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Payments (docs/08 §3): partial payments, bank-ref matching, per-account.
-- -----------------------------------------------------------------------------
create type public.payment_method as enum ('transfer', 'cash', 'card', 'other');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.documents (id),
  amount numeric not null check (amount > 0),
  paid_on date not null default current_date,
  method public.payment_method not null default 'transfer',
  bank_ref text,
  payment_account_id uuid references public.payment_accounts (id),
  note text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index payments_invoice_idx on public.payments (invoice_id);

alter table public.payments enable row level security;
grant select, insert, update, delete on public.payments to authenticated, service_role;

create policy "payments: strategist+ manages" on public.payments
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

create trigger payments_audit
  after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();

-- Guard: payments attach only to finalized invoices, never exceed the total.
create or replace function public.payments_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documents%rowtype;
  v_paid numeric;
begin
  select * into v_doc from public.documents where id = new.invoice_id;
  if v_doc.id is null or v_doc.type <> 'invoice' then
    raise exception 'payments attach to invoices only';
  end if;
  if v_doc.status = 'draft' or v_doc.number is null then
    raise exception 'invoice must be finalized before recording payments';
  end if;
  if v_doc.status = 'void' then
    raise exception 'cannot pay a void invoice';
  end if;
  select coalesce(sum(amount), 0) into v_paid
    from public.payments
   where invoice_id = new.invoice_id and id <> new.id;
  if v_doc.total is not null and v_paid + new.amount > v_doc.total then
    raise exception 'payment exceeds invoice balance (paid % of %)', v_paid, v_doc.total;
  end if;
  return new;
end;
$$;

create trigger payments_guard
  before insert or update on public.payments
  for each row execute function public.payments_guard();

-- -----------------------------------------------------------------------------
-- Recurring retainers (docs/08 §3 — agency lifeblood). Generation is manual
-- v1 (button); the Phase 6 cron automates it.
-- -----------------------------------------------------------------------------
create table public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  title text not null,
  amount numeric not null check (amount > 0),
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  payment_account_id uuid references public.payment_accounts (id),
  active boolean not null default true,
  last_generated date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_invoices enable row level security;
grant select, insert, update, delete on public.recurring_invoices to authenticated, service_role;

create policy "retainers: strategist+ manages" on public.recurring_invoices
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

create trigger recurring_invoices_set_updated_at
  before update on public.recurring_invoices
  for each row execute function public.set_updated_at();
create trigger recurring_invoices_audit
  after insert or update or delete on public.recurring_invoices
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Expenses (lite P&L input)
-- -----------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null default 'عام',
  amount numeric not null check (amount > 0),
  supplier text,
  note text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
grant select, insert, update, delete on public.expenses to authenticated, service_role;

create policy "expenses: strategist+ manages" on public.expenses
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

create trigger expenses_audit
  after insert or update or delete on public.expenses
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Ad-spend wallets (docs/05 §B3: client media budgets must never blend with
-- agency revenue). 80% alert wiring lands with Phase 6 notifications.
-- -----------------------------------------------------------------------------
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) unique,
  budget numeric not null check (budget > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  spend_date date not null default current_date,
  amount numeric not null check (amount > 0),
  campaign text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.wallet_entries enable row level security;
grant select, insert, update, delete on public.wallets, public.wallet_entries
  to authenticated, service_role;

create policy "wallets: strategist+ manages" on public.wallets
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "wallets: executor reads" on public.wallets
  for select to authenticated using (public.is_team());
create policy "wallet_entries: strategist+ manages" on public.wallet_entries
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "wallet_entries: team logs" on public.wallet_entries
  for insert to authenticated with check (public.is_team());
create policy "wallet_entries: executor reads" on public.wallet_entries
  for select to authenticated using (public.is_team());

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();
create trigger wallets_audit
  after insert or update or delete on public.wallets
  for each row execute function public.audit_trigger();
create trigger wallet_entries_audit
  after insert or update or delete on public.wallet_entries
  for each row execute function public.audit_trigger();

alter publication supabase_realtime add table public.payments;

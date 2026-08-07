-- =============================================================================
-- Phase 3: Legal Document Generator suite (docs/05 §B4, docs/06)
-- documents + gapless counters + clause library.
-- CLAUDE.md rule 3: money/legal documents are immutable — corrections via new
-- versions; sequential gapless numbering (next quote Q-00055).
-- =============================================================================

create type public.document_type as enum
  ('quote', 'sow', 'nda', 'sla', 'msa', 'amc', 'coc');
create type public.document_status as enum
  ('draft', 'sent', 'signed', 'active', 'expired', 'void');

-- -----------------------------------------------------------------------------
-- Gapless counters. Numbers are taken ONLY at finalization, atomically.
-- Seeds per docs/06 §3.1: quote 00054 and invoice 00052 exist historically.
-- -----------------------------------------------------------------------------
create table public.document_counters (
  prefix text primary key,
  next_number int not null check (next_number > 0)
);

insert into public.document_counters (prefix, next_number) values
  ('Q', 55), ('INV', 53), ('CN', 1);

alter table public.document_counters enable row level security;
-- No policies, no client grants: access only through the function below.
grant select, update on public.document_counters to service_role;

-- Atomic take-next. security definer (runs as owner) so callers never touch
-- the counters table directly; strategist+ only.
create or replace function public.next_document_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if not public.is_strategist_plus() then
    raise exception 'not allowed';
  end if;
  update public.document_counters
     set next_number = next_number + 1
   where prefix = p_prefix
   returning next_number - 1 into n;
  if n is null then
    raise exception 'unknown counter prefix %', p_prefix;
  end if;
  return p_prefix || '-' || lpad(n::text, 5, '0');
end;
$$;

grant execute on function public.next_document_number to authenticated;

-- Counters use prefix (not id) as pk, so the generic audit trigger's new.id
-- reference would fail — dedicated shim recording the prefix instead.
create or replace function public.audit_counters_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (table_name, record_id, action, actor, old_data, new_data)
  values (tg_table_name, coalesce(new.prefix, old.prefix), tg_op, auth.uid(),
          to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

create trigger document_counters_audit
  after insert or update or delete on public.document_counters
  for each row execute function public.audit_counters_trigger();

-- -----------------------------------------------------------------------------
-- Clause library (docs/05 §B4): lawyer-approved building blocks; the default
-- commercial clause set from docs/06 §3.5.
-- -----------------------------------------------------------------------------
create table public.clause_library (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  category text not null default 'general',
  title_ar text not null,
  body_ar text not null,
  sort int not null default 0,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clause_library enable row level security;
grant select, insert, update, delete on public.clause_library to authenticated, service_role;

create policy "clauses: authenticated read" on public.clause_library
  for select to authenticated using (true);
create policy "clauses: admin manages" on public.clause_library
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create trigger clause_library_set_updated_at
  before update on public.clause_library
  for each row execute function public.set_updated_at();
create trigger clause_library_audit
  after insert or update or delete on public.clause_library
  for each row execute function public.audit_trigger();

insert into public.clause_library (key, category, title_ar, body_ar, sort) values
  ('payment_terms_default', 'commercial', 'شروط الدفع',
   'دفعة أولى ٥٠٪ عند توقيع الاتفاقية، ٢٥٪ عند اعتماد التصميم، و٢٥٪ عند التسليم النهائي.', 1),
  ('quote_validity', 'commercial', 'صلاحية العرض',
   'هذا العرض صالح لمدة ٣٠ يوماً من تاريخ الإصدار.', 2),
  ('ip_transfer', 'commercial', 'الملكية الفكرية',
   'تنتقل الملكية الفكرية للأعمال المعتمدة إلى العميل بعد سداد كامل المستحقات.', 3),
  ('unapproved_concepts', 'commercial', 'التصاميم غير المعتمدة',
   'تحتفظ الوكالة بحقوق التصاميم والمفاهيم غير المعتمدة، وبحق عرض الأعمال ضمن سابقة أعمالها ما لم يُتفق كتابياً على خلاف ذلك.', 4),
  ('out_of_scope', 'commercial', 'خارج النطاق',
   'أي أعمال إضافية خارج نطاق هذا العرض تُسعَّر وتُعتمد بشكل منفصل قبل تنفيذها.', 5),
  ('confidentiality', 'legal', 'السرية',
   'يلتزم الطرفان بالحفاظ على سرية المعلومات المتبادلة وعدم الإفصاح عنها لأي طرف ثالث دون موافقة كتابية مسبقة.', 6)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Documents
-- -----------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  type public.document_type not null,
  client_id uuid not null references public.clients (id),
  scope_id uuid references public.scopes (id),
  number text unique,
  status public.document_status not null default 'draft',
  version int not null default 1,
  supersedes uuid references public.documents (id),
  payload jsonb not null default '{}',
  payment_account_id uuid references public.payment_accounts (id),
  issued_on date,
  valid_until date,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.documents is
  'Legal/commercial documents. Immutable after finalization (CLAUDE.md rule 3): payload frozen, corrections via a new version row with supersedes.';

alter table public.documents enable row level security;
grant select, insert, update, delete on public.documents to authenticated, service_role;

create policy "documents: strategist+ manages" on public.documents
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "documents: client reads own issued" on public.documents
  for select to authenticated
  using (client_id = public.current_client_id()
    and status in ('sent', 'signed', 'active'));

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
create trigger documents_audit
  after insert or update or delete on public.documents
  for each row execute function public.audit_trigger();

-- Immutability guard: once out of draft, only the status may change, along a
-- forward-only path. Finalized documents can never be deleted.
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
       or new.valid_until is distinct from old.valid_until then
      raise exception 'finalized documents are immutable — only status may change';
    end if;
    if new.status = 'draft' then
      raise exception 'finalized documents cannot return to draft';
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_guard_update
  before update on public.documents
  for each row execute function public.documents_guard();
create trigger documents_guard_delete
  before delete on public.documents
  for each row execute function public.documents_guard();

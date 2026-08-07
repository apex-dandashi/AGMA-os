-- «وضع التحرير الحر» (طلب المالك: god mode) — الشريك يستطيع تعديل أو حذف
-- أي شيء، لكن عبر تفعيل صريح مؤقت (١٥ دقيقة) مسجَّل في سجل التدقيق، حتى
-- لا تُمسح فاتورة مرقّمة بنقرة خاطئة صامتة.
--
-- ما يفتحه الوضع: جمود المستندات المعتمدة (تعديل/حذف/إرجاع لمسودة)،
-- بوابة المراجعات، بوابة الفاتورة الضريبية، تعليق التحصيل، وFlag & Hold.
-- ما لا يفتحه أبداً: سجل التدقيق (audit_log) — لا تعديل ولا حذف لأي كان،
-- وإلا فقد «الوضع الحر» نفسه دليله.

create table public.admin_overrides (
  id uuid primary key default gen_random_uuid(),  -- audit_trigger يتطلب عمود id
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_overrides is
  'تفعيل مؤقت لوضع التحرير الحر للشريك — كل تفعيل وكل تعديل تحته يبقى في سجل التدقيق';

alter table public.admin_overrides enable row level security;
grant select, insert, update, delete on public.admin_overrides to authenticated;

create policy "overrides: admin manages own" on public.admin_overrides
  for all to authenticated
  using (public.is_admin() and profile_id = auth.uid())
  with check (public.is_admin() and profile_id = auth.uid()
    and expires_at <= now() + interval '15 minutes');

create trigger admin_overrides_audit
  after insert or update or delete on public.admin_overrides
  for each row execute function public.audit_trigger();

create or replace function public.god_mode_active()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() and exists (
    select 1 from public.admin_overrides
    where profile_id = auth.uid() and expires_at > now());
$$;

-- ---------------------------------------------------------------------------
-- فتحة النجاة في الحواجز الخمسة (الجسم الأصلي كما هو + سطر أول)
-- ---------------------------------------------------------------------------

-- 1. جمود المستندات المعتمدة
create or replace function public.documents_guard()
returns trigger
language plpgsql
as $$
begin
  if public.god_mode_active() then
    return coalesce(new, old);
  end if;

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

-- 2. بوابة المراجعات
create or replace function public.document_review_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.god_mode_active() then
    return new;
  end if;
  if old.status = 'draft' and new.status = 'sent' then
    if exists (select 1 from public.document_reviews r
               where r.document_id = new.id and r.status = 'pending') then
      raise exception 'المستند بانتظار اعتماد المراجعين — لا يُعتمد ويُرقَّم قبل بتّهم';
    end if;
    if exists (select 1 from public.document_reviews r
               where r.document_id = new.id and r.status = 'rejected') then
      raise exception 'مراجعٌ رفض هذا المستند — عالج سبب الرفض ثم اطلب المراجعة من جديد';
    end if;
  end if;
  return new;
end;
$$;

-- 3. بوابة الفاتورة الضريبية
create or replace function public.invoice_tax_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.god_mode_active() then
    return new;
  end if;
  if new.type = 'invoice' and old.status = 'draft' and new.status = 'sent'
     and (new.payload ->> 'vatEnabled') = 'true'
     and not exists (select 1 from public.clients c
                     where c.id = new.client_id
                       and nullif(trim(coalesce(c.vat_number, '')), '') is not null) then
    raise exception 'لا يمكن اعتماد فاتورة ضريبية لعميل بلا رقم ضريبي — أضِفه في «بيانات العميل» أولاً';
  end if;
  return new;
end;
$$;

-- 4. تعليق التحصيل
create or replace function public.scope_collections_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.god_mode_active() then
    return new;
  end if;
  if new.status = 'sent' and old.status = 'draft'
     and exists (select 1 from public.clients c
                 where c.id = new.client_id and c.collections_hold) then
    raise exception 'أعمال هذا العميل الجديدة معلّقة بسبب فواتير متأخرة +٣٠ يوماً — سوّوا المتأخرات أو ارفعوا التعليق من بيانات العميل (للشركاء)';
  end if;
  return new;
end;
$$;

-- 5. نقاط التوقف وFlag & Hold
create or replace function public.tasks_checklist_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_key text; v_last public.checklist_runs%rowtype;
begin
  if public.god_mode_active() then
    return new;
  end if;
  if new.status = 'done' and old.status <> 'done' and new.template_id is not null then
    select checklist_key into v_key from public.task_templates where id = new.template_id;
    if v_key is not null then
      select * into v_last from public.checklist_runs
        where task_id = new.id
        order by created_at desc limit 1;
      if v_last.id is null or v_last.status = 'in_progress' then
        raise exception 'نقطة توقف: هذه المهمة تتطلب قائمة فحص «%» مكتملة قبل الإنجاز', v_key;
      end if;
      if v_last.status = 'flagged' then
        raise exception 'Flag & Hold مفعّل على هذه المهمة — عالج السبب ثم أعد الفحص';
      end if;
    end if;
  end if;
  return new;
end;
$$;

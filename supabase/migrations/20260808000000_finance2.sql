-- المالية ٢٫٠ (docs/11 §ب) — the sized adoption of the corporate finance
-- design: deferred revenue & recognition, the full dunning ladder, credit
-- limits & payment terms, the tax-invoice gate, the tax calendar, and
-- payment sessions. Profit-First allocations stay CASH-based by design;
-- recognition is a reporting layer above them.

-- ---------------------------------------------------------------------------
-- 1. Deferred revenue & recognition (IFRS 15, agency-sized)
-- ---------------------------------------------------------------------------
-- Explicit override wins; otherwise inferred at finalize:
-- retainer line («اشتراك شهري») → over_month, anything else → on_invoice.
alter table public.documents
  add column revenue_method text
    check (revenue_method is null or revenue_method in ('on_invoice', 'over_month'));

create table public.revenue_schedules (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount numeric not null,
  recognized_at date,
  created_at timestamptz not null default now()
);
create index revenue_schedules_doc_idx on public.revenue_schedules (document_id);
create index revenue_schedules_pending_idx on public.revenue_schedules (period_end)
  where recognized_at is null;

alter table public.revenue_schedules enable row level security;
create policy "revenue_schedules: team reads" on public.revenue_schedules
  for select to authenticated using (public.is_team());
create policy "revenue_schedules: admin manages" on public.revenue_schedules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.revenue_schedules to authenticated, service_role;

create or replace function public.on_invoice_finalized_revenue()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_method text;
  v_net numeric;
  v_sign numeric := 1;
begin
  if new.number is null or old.status <> 'draft' or new.status <> 'sent'
     or new.type not in ('invoice', 'credit_note') then
    return new;
  end if;
  if new.type = 'credit_note' then v_sign := -1; end if;
  -- revenue base excludes VAT
  v_net := coalesce((
    select sum((i ->> 'amount')::numeric)
    from jsonb_array_elements(new.payload -> 'items') i), 0) * v_sign;
  if v_net = 0 then return new; end if;

  v_method := coalesce(
    new.revenue_method,
    case when new.type = 'invoice' and exists (
      select 1 from jsonb_array_elements(new.payload -> 'items') i
      where i ->> 'description' = 'اشتراك شهري')
    then 'over_month' else 'on_invoice' end);

  if v_method = 'over_month' then
    insert into public.revenue_schedules (document_id, period_start, period_end, amount)
    values (new.id,
      date_trunc('month', coalesce(new.issued_on, current_date))::date,
      (date_trunc('month', coalesce(new.issued_on, current_date)) + interval '1 month - 1 day')::date,
      v_net);
  else
    insert into public.revenue_schedules
      (document_id, period_start, period_end, amount, recognized_at)
    values (new.id, coalesce(new.issued_on, current_date),
      coalesce(new.issued_on, current_date), v_net,
      coalesce(new.issued_on, current_date));
  end if;
  return new;
end;
$$;

create trigger documents_revenue_schedule
  after update on public.documents
  for each row execute function public.on_invoice_finalized_revenue();

-- Daily: recognize schedules whose service period has ended.
create or replace function public.recognize_revenue()
returns void
language sql security definer set search_path = public as $$
  update public.revenue_schedules
     set recognized_at = period_end
   where recognized_at is null and period_end <= current_date;
$$;

-- شلال الإيراد: per month — invoiced vs recognized vs still deferred.
create or replace view public.revenue_waterfall
with (security_invoker = true) as
select
  to_char(month, 'YYYY-MM') as month,
  coalesce(sum(invoiced), 0) as invoiced_net,
  coalesce(sum(recognized), 0) as recognized,
  coalesce(sum(deferred_added), 0) as deferred_added
from (
  select date_trunc('month', d.issued_on) as month,
         d.total - coalesce(((d.payload ->> 'vatAmount')::numeric), 0)
           * case when (d.payload ->> 'vatEnabled') = 'true' then 1 else 0 end as invoiced,
         null::numeric as recognized, null::numeric as deferred_added
  from public.documents d
  where d.type = 'invoice' and d.status not in ('draft', 'void') and d.issued_on is not null
  union all
  select date_trunc('month', rs.recognized_at), null, rs.amount, null
  from public.revenue_schedules rs where rs.recognized_at is not null
  union all
  select date_trunc('month', rs.created_at), null, null, rs.amount
  from public.revenue_schedules rs where rs.recognized_at is null
) x
group by month
order by month desc;

grant select on public.revenue_waterfall to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Credit limits & payment terms + collections hold
-- ---------------------------------------------------------------------------
alter table public.clients
  add column credit_limit numeric check (credit_limit is null or credit_limit >= 0),
  add column payment_terms_days integer not null default 14
    check (payment_terms_days between 0 and 90),
  add column collections_hold boolean not null default false;

comment on column public.clients.collections_hold is
  'تعليق أعمال جديدة بسبب تأخر سداد +٣٠ يوماً — يُرفع يدوياً بعد التسوية';

-- Hold blocks NEW work (sending scopes), never existing delivery.
create or replace function public.scope_collections_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sent' and old.status = 'draft'
     and exists (select 1 from public.clients c
                 where c.id = new.client_id and c.collections_hold) then
    raise exception 'أعمال هذا العميل الجديدة معلّقة بسبب فواتير متأخرة +٣٠ يوماً — سوّوا المتأخرات أو ارفعوا التعليق من بيانات العميل (للشركاء)';
  end if;
  return new;
end;
$$;

create trigger scopes_collections_guard
  before update on public.scopes
  for each row execute function public.scope_collections_guard();

-- ---------------------------------------------------------------------------
-- 3. Tax-invoice gate: no VAT invoice for a client without a VAT number
-- ---------------------------------------------------------------------------
create or replace function public.invoice_tax_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
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

create trigger documents_tax_gate
  before update on public.documents
  for each row execute function public.invoice_tax_gate();

-- ---------------------------------------------------------------------------
-- 4. Promises to pay + the full dunning ladder
-- ---------------------------------------------------------------------------
create table public.payment_promises (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.documents(id) on delete cascade,
  promised_on date not null,
  amount numeric,
  note text,
  kept boolean,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.payment_promises enable row level security;
create policy "promises: team manages" on public.payment_promises
  for all to authenticated using (public.is_team()) with check (public.is_team());
grant select, insert, update, delete on public.payment_promises to authenticated, service_role;
create trigger payment_promises_audit after insert or update or delete
  on public.payment_promises for each row execute function public.audit_trigger();

insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('invoice_upcoming', 'email', 'ar', 'تذكير ودّي: فاتورة {{number}} تستحق قريباً',
   'نذكّركم بلطف بأن الفاتورة رقم {{number}} بقيمة متبقية {{balance}} ريال تستحق بتاريخ {{due}}. للسداد بالتحويل البنكي: {{bank}} — آيبان: {{iban}}. وتجدون كشف حسابكم مرفقاً عند الطلب.', true),
  ('collection_task', 'inapp', 'ar', null,
   'مهمة تحصيل: الفاتورة {{number}} متأخرة {{days}} يوماً — تواصلوا مع العميل وسجّلوا وعد السداد', true),
  ('collection_manager', 'inapp', 'ar', null,
   'تصعيد تحصيل: فاتورة {{number}} متأخرة {{days}} يوماً على {{client}} — يحتاج تدخل مدير الحساب', true),
  ('collection_hold', 'inapp', 'ar', null,
   'عُلّقت الأعمال الجديدة لعميل {{client}} — فاتورة {{number}} متأخرة {{days}} يوماً. سوّوا المتأخرات أو قرروا خطة سداد', true),
  ('collection_legal', 'inapp', 'ar', null,
   'فاتورة {{number}} متأخرة {{days}} يوماً — مطلوب قرار: خطة سداد معتمدة أو مراجعة قانونية', true)
on conflict do nothing;

create or replace function public.run_dunning()
returns void
language plpgsql security definer set search_path = public as $$
declare r record; v_paid numeric; v_days int; v_balance numeric; v_client text;
  v_has_promise boolean;
begin
  for r in
    select d.* from public.documents d
    where d.type = 'invoice' and d.status in ('sent', 'signed', 'active')
      and d.valid_until is not null
  loop
    select coalesce(sum(amount), 0) into v_paid
      from public.payments where invoice_id = r.id;
    v_balance := coalesce(r.total, 0) - v_paid;
    if v_balance <= 0 then continue; end if;
    v_days := current_date - r.valid_until;
    select company into v_client from public.clients where id = r.client_id;
    -- an active (future, unbroken) promise pauses client-facing chasing
    select exists (select 1 from public.payment_promises p
      where p.invoice_id = r.id and p.kept is null and p.promised_on >= current_date)
      into v_has_promise;

    -- −7: gentle client email
    if v_days = -7 and not v_has_promise then
      perform public.enqueue_notification('invoice_upcoming', 'email', 'invoice_upcoming',
        jsonb_build_object('number', r.number, 'balance', v_balance::text,
          'due', r.valid_until::text,
          'bank', r.payload -> 'paymentAccount' ->> 'bankName',
          'iban', r.payload -> 'paymentAccount' ->> 'iban'),
        null, (select email from public.contacts
               where client_id = r.client_id and email is not null
               order by is_primary desc limit 1),
        r.client_id, now(), 'dun-pre7:' || r.id);
    -- +7: client email + collection task for the team
    elsif v_days = 7 then
      if not v_has_promise then
        perform public.enqueue_notification('invoice_overdue', 'email', 'invoice_overdue',
          jsonb_build_object('number', r.number, 'days', v_days::text,
            'balance', v_balance::text,
            'bank', r.payload -> 'paymentAccount' ->> 'bankName',
            'iban', r.payload -> 'paymentAccount' ->> 'iban'),
          null, (select email from public.contacts
                 where client_id = r.client_id and email is not null
                 order by is_primary desc limit 1),
          r.client_id, now(), 'dun-7:' || r.id);
      end if;
      perform public.notify_team('collection_task', 'collection_task',
        jsonb_build_object('number', r.number, 'days', v_days::text),
        r.client_id, 'dun-task7:' || r.id);
    -- +15: escalate to account manager (partners)
    elsif v_days = 15 then
      perform public.notify_team('collection_manager', 'collection_manager',
        jsonb_build_object('number', r.number, 'days', v_days::text,
          'client', coalesce(v_client, '؟')),
        r.client_id, 'dun-15:' || r.id);
    -- +30: hold new work + auto-file an issue
    elsif v_days = 30 then
      update public.clients set collections_hold = true where id = r.client_id;
      insert into public.issues (title, details, priority, client_id, auto_filed)
      values ('تحصيل متعثر: ' || coalesce(v_client, '؟'),
        'الفاتورة ' || coalesce(r.number, '؟') || ' متأخرة ٣٠ يوماً — رصيد متبقٍ '
          || v_balance || ' ريال. عُلّقت الأعمال الجديدة تلقائياً.',
        5, r.client_id, true);
      perform public.notify_team('collection_hold', 'collection_hold',
        jsonb_build_object('number', r.number, 'days', v_days::text,
          'client', coalesce(v_client, '؟')),
        r.client_id, 'dun-30:' || r.id);
    -- +45: payment plan or legal review decision
    elsif v_days = 45 then
      perform public.notify_team('collection_legal', 'collection_legal',
        jsonb_build_object('number', r.number, 'days', v_days::text),
        r.client_id, 'dun-45:' || r.id);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Tax calendar + WHT flag
-- ---------------------------------------------------------------------------
alter table public.expenses add column wht_applicable boolean not null default false;
comment on column public.expenses.wht_applicable is 'مورّد غير مقيم — استقطاع ضريبي';

insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('tax_vat_due', 'inapp', 'ar', null,
   'إقرار ضريبة القيمة المضافة عن {{period}} يستحق هذا الشهر — جهّزوا الأرقام مع المحاسب', true),
  ('tax_wht_due', 'inapp', 'ar', null,
   'يوجد مصروف لمورّد غير مقيم الشهر الماضي — إقرار الاستقطاع خلال أول ١٠ أيام من هذا الشهر', true),
  ('tax_zakat_due', 'inapp', 'ar', null,
   'مهلة إقرار الزكاة (١٢٠ يوماً بعد نهاية السنة) تنتهي ٣٠ أبريل — راجعوا المحاسب', true)
on conflict do nothing;

create or replace function public.send_tax_reminders()
returns void
language plpgsql security definer set search_path = public as $$
declare v_q text;
begin
  -- VAT: quarterly filing reminder on the 1st of Jan/Apr/Jul/Oct
  if extract(day from current_date) = 1
     and extract(month from current_date) in (1, 4, 7, 10) then
    v_q := to_char(current_date - interval '1 month', 'YYYY-"Q"Q');
    perform public.notify_team('tax_vat_due', 'tax_vat_due',
      jsonb_build_object('period', v_q), null, 'vat:' || v_q);
  end if;
  -- WHT: day 3 of month if last month had a non-resident supplier expense
  if extract(day from current_date) = 3 and exists (
    select 1 from public.expenses
    where wht_applicable
      and expense_date >= date_trunc('month', current_date - interval '1 month')
      and expense_date < date_trunc('month', current_date)) then
    perform public.notify_team('tax_wht_due', 'tax_wht_due', '{}'::jsonb,
      null, 'wht:' || to_char(current_date, 'YYYY-MM'));
  end if;
  -- Zakat: April 1st heads-up (120-day window ends April 30)
  if extract(day from current_date) = 1 and extract(month from current_date) = 4 then
    perform public.notify_team('tax_zakat_due', 'tax_zakat_due', '{}'::jsonb,
      null, 'zakat:' || to_char(current_date, 'YYYY'));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Payment sessions (adapter-ready; manual bank transfer today, PSP later)
-- ---------------------------------------------------------------------------
create table public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.documents(id) on delete cascade,
  reference text not null unique,
  amount numeric not null check (amount > 0),
  currency text not null default 'SAR',
  provider text not null default 'manual_transfer',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled')),
  checkout_url text,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.payment_sessions enable row level security;
create policy "payment_sessions: team manages" on public.payment_sessions
  for all to authenticated using (public.is_team()) with check (public.is_team());
grant select, insert, update, delete on public.payment_sessions to authenticated, service_role;
create trigger payment_sessions_audit after insert or update or delete
  on public.payment_sessions for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- 7. Daily jobs v4: v2 core + new ladder + recognition + tax calendar
--    (replaces v3's simpler overdue reminders with the full ladder)
-- ---------------------------------------------------------------------------
create or replace function public.run_daily_jobs_v4()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v2();
  perform public.run_dunning();
  perform public.recognize_revenue();
  perform public.send_tax_reminders();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v4()$$);

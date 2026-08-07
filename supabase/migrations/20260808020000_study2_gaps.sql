-- حزمة فجوات الدراسة الثانية (docs/12 §ب — البنود المعتمدة ✅):
-- نزاع الفاتورة، كشف التسرب الإيرادي، الإقفال الشهري الخفيف،
-- تطبيع البحث العربي، وتنبيهات تجديد العقود.

-- ---------------------------------------------------------------------------
-- 1. نزاع الفاتورة: حالة مستقلة توقف مطاردة العميل (لا التحصيل الداخلي)
-- ---------------------------------------------------------------------------
alter table public.documents
  add column disputed_at timestamptz,
  add column dispute_reason text;

comment on column public.documents.disputed_at is
  'فاتورة محل نزاع مع العميل — سلّم التحصيل يتوقف حتى يُحل النزاع ويُمسح الحقل';

-- run_dunning v2: same ladder, disputed invoices excluded entirely.
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
      and d.disputed_at is null
  loop
    select coalesce(sum(amount), 0) into v_paid
      from public.payments where invoice_id = r.id;
    v_balance := coalesce(r.total, 0) - v_paid;
    if v_balance <= 0 then continue; end if;
    v_days := current_date - r.valid_until;
    select company into v_client from public.clients where id = r.client_id;
    select exists (select 1 from public.payment_promises p
      where p.invoice_id = r.id and p.kept is null and p.promised_on >= current_date)
      into v_has_promise;

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
    elsif v_days = 15 then
      perform public.notify_team('collection_manager', 'collection_manager',
        jsonb_build_object('number', r.number, 'days', v_days::text,
          'client', coalesce(v_client, '؟')),
        r.client_id, 'dun-15:' || r.id);
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
    elsif v_days = 45 then
      perform public.notify_team('collection_legal', 'collection_legal',
        jsonb_build_object('number', r.number, 'days', v_days::text),
        r.client_id, 'dun-45:' || r.id);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. كشف التسرب الإيرادي: عمل منفَّذ بلا فاتورة تقابله
-- ---------------------------------------------------------------------------
create or replace view public.revenue_leakage
with (security_invoker = true) as
-- (أ) ساعات مسجلة خلال ٣٠ يوماً لعميل بلا فاتورة معتمدة خلال ٤٥ يوماً
select
  c.id as client_id,
  c.company,
  'ساعات عمل مسجلة (' || round(sum(te.minutes) / 60.0, 1)
    || ' س) خلال ٣٠ يوماً بلا فاتورة معتمدة منذ ٤٥ يوماً' as signal,
  round(sum(te.minutes / 60.0 * coalesce(pr.cost_rate_hourly, 0)), 0) as est_value
from public.time_entries te
join public.tasks t on t.id = te.task_id
join public.projects p on p.id = t.project_id
join public.clients c on c.id = p.client_id
left join public.profiles pr on pr.id = te.member
where te.entry_date > current_date - 30
  and not exists (
    select 1 from public.documents d
    where d.client_id = c.id and d.type = 'invoice'
      and d.status not in ('draft', 'void')
      and d.issued_on > current_date - 45)
group by c.id, c.company
union all
-- (ب) مشروع مكتمل لعميل بلا أي فاتورة معتمدة إطلاقاً
select
  c.id, c.company,
  'مشروع «' || p.name || '» مكتمل ولا فاتورة معتمدة لهذا العميل',
  null
from public.projects p
join public.clients c on c.id = p.client_id
where p.status = 'completed'
  and not exists (
    select 1 from public.documents d
    where d.client_id = c.id and d.type = 'invoice'
      and d.status not in ('draft', 'void'));

grant select on public.revenue_leakage to authenticated;

-- ---------------------------------------------------------------------------
-- 3. الإقفال الشهري الخفيف — قائمة «اقرأ ونفّذ» بدل إقفال دفتر أستاذ كامل
-- ---------------------------------------------------------------------------
insert into public.pause_checklists (key, name_ar, kind, items) values
  ('monthly_close', 'الإقفال الشهري الخفيف', 'read_do', '[
    {"text": "طابق رصيد البنك مع كشف الحساب — أي فرق يُفسَّر كتابةً"},
    {"text": "تأكد أن كل مصروفات الشهر مسجلة وبإيصالاتها المرفقة"},
    {"text": "أصدر فواتير الاشتراكات والمراحل المستحقة كلها"},
    {"text": "أكّد جولتي توزيع الدخل (١٠ و٢٥) إن لم تؤكدا"},
    {"text": "راجع صفحة الإيراد: هل المؤجل والمثبت منطقيان؟"},
    {"text": "راجع «منفَّذ غير مفوتر» وأصدر ما يلزم"},
    {"text": "أرسل كشف حساب لكل عميل عليه متأخرات"},
    {"text": "تحقق أن النسخة الاحتياطية الأسبوعية نجحت"},
    {"text": "سلّم المحاسب تصدير الشهر (فواتير ومصروفات CSV)"}
  ]'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. تطبيع البحث العربي: الألف والهمزات والتاء المربوطة والياء
-- ---------------------------------------------------------------------------
create or replace function public.normalize_ar(t text)
returns text language sql immutable as $$
  select translate(coalesce(t, ''), 'أإآءةى', 'ااا هي');
$$;

alter table public.clients
  add column company_norm text generated always as (public.normalize_ar(company)) stored;
alter table public.leads
  add column name_norm text generated always as (public.normalize_ar(name)) stored,
  add column company_norm text generated always as (public.normalize_ar(company)) stored;

create index clients_company_norm_trgm_idx
  on public.clients using gin (company_norm gin_trgm_ops);
create index leads_norm_trgm_idx
  on public.leads using gin (name_norm gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 5. تنبيهات تجديد/انتهاء العقود (٦٠ و٣٠ يوماً قبل الانتهاء)
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('contract_renewal', 'inapp', 'ar', null,
   'عقد «{{type}}» مع {{client}} ينتهي بعد {{days}} يوماً ({{date}}) — قرروا التجديد أو الإنهاء قبل الموعد', true)
on conflict do nothing;

create or replace function public.send_contract_renewals()
returns void
language plpgsql security definer set search_path = public as $$
declare r record; v_days int;
begin
  for r in
    select d.*, c.company from public.documents d
    join public.clients c on c.id = d.client_id
    where d.type in ('nda', 'sow', 'sla', 'msa', 'amc', 'coc')
      and d.status in ('signed', 'active')
      and d.valid_until in (current_date + 60, current_date + 30)
  loop
    v_days := r.valid_until - current_date;
    perform public.notify_team('contract_renewal', 'contract_renewal',
      jsonb_build_object('type', r.type, 'client', r.company,
        'days', v_days::text, 'date', r.valid_until::text),
      r.client_id, 'renew' || v_days || ':' || r.id);
  end loop;
end;
$$;

create or replace function public.run_daily_jobs_v5()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v4();
  perform public.send_contract_renewals();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v5()$$);

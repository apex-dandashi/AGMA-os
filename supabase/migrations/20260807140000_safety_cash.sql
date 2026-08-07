-- =============================================================================
-- Phase 6.5b (docs/10 §2.3 Gawande + §2.4 Profit First):
-- pause-point checklists with Flag & Hold, and cash discipline as architecture.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Pause checklists. kind: do_confirm gates launches; read_do are runbooks.
-- Items ≤ 9 killer items (Gawande's rule) — enforced.
-- -----------------------------------------------------------------------------
create table public.pause_checklists (
  key text primary key,
  kind text not null default 'do_confirm' check (kind in ('do_confirm', 'read_do')),
  name_ar text not null,
  items jsonb not null default '[]',
  last_caught jsonb not null default '{}',
  active boolean not null default true,
  check (jsonb_array_length(items) <= 9)
);

create type public.checklist_run_status as enum ('in_progress', 'passed', 'flagged');

create table public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  checklist_key text not null references public.pause_checklists (key),
  task_id uuid references public.tasks (id) on delete cascade,
  allocation_id uuid,
  states jsonb not null default '[]',
  status public.checklist_run_status not null default 'in_progress',
  flagged_by uuid references public.profiles (id),
  flag_reason text,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.pause_checklists enable row level security;
alter table public.checklist_runs enable row level security;
grant select on public.pause_checklists to authenticated;
grant select, insert, update, delete on public.pause_checklists to service_role;
grant select, insert, update, delete on public.checklist_runs to authenticated, service_role;

create policy "checklists: team reads" on public.pause_checklists
  for select to authenticated using (public.is_team());
create policy "runs: team manages" on public.checklist_runs
  for all to authenticated using (public.is_team()) with check (public.is_team());

create trigger checklist_runs_audit
  after insert or update or delete on public.checklist_runs
  for each row execute function public.audit_trigger();

insert into public.pause_checklists (key, kind, name_ar, items) values
  ('campaign_golive', 'do_confirm', 'إطلاق حملة إعلانية', '[
    {"text": "البكسل يطلق أحداثاً فعلياً (فحص مباشر)"},
    {"text": "سقف الميزانية اليومي مضبوط"},
    {"text": "روابط UTM على كل الإعلانات"},
    {"text": "قوائم الاستبعاد مفعّلة"},
    {"text": "اعتماد العميل للإبداعات موثّق في النظام"},
    {"text": "صفحة الهبوط < 3 ثوانٍ على الجوال"}]'),
  ('website_launch', 'do_confirm', 'إطلاق موقع', '[
    {"text": "SSL يعمل على كل النطاقات"},
    {"text": "التحويلات 301 من الروابط القديمة"},
    {"text": "Analytics + Search Console مركّبان"},
    {"text": "نموذج التواصل يصل إلى CRM (اختبار حقيقي)"},
    {"text": "إشعار الخصوصية PDPL منشور"},
    {"text": "نسخة احتياطية مأخوذة"},
    {"text": "اعتماد UAT من العميل موثّق"}]'),
  ('content_publish', 'do_confirm', 'نشر محتوى', '[
    {"text": "كل مصدر مُستشهَد به ورابطه يعمل"},
    {"text": "حقوق الصور سليمة"},
    {"text": "تدقيق لغوي عربي"},
    {"text": "مطابقة صوت العلامة"},
    {"text": "موافقة بشرية مسجّلة (لا نشر آلي)"}]'),
  ('invoice_issue', 'do_confirm', 'إصدار فاتورة', '[
    {"text": "حساب التحويل الصحيح مختار"},
    {"text": "البنود تطابق النطاق المعتمد"},
    {"text": "التسلسل الرقمي سليم"},
    {"text": "البنود المتكررة موسومة recurring"}]'),
  ('automation_deploy', 'do_confirm', 'نشر أتمتة', '[
    {"text": "اختبار UAT مسجّل"},
    {"text": "خطة التراجع rollback موثّقة"},
    {"text": "التنبيهات مربوطة"},
    {"text": "نطاق البيانات أدنى ما يمكن"}]'),
  ('allocation_ritual', 'read_do', 'طقس التوزيع (10/25)', '[
    {"text": "افتح ملخص التوزيع في النظام وتحقق من مبلغ الدخل"},
    {"text": "حوّل نسبة الربح إلى حساب الاحتياطي"},
    {"text": "حوّل مخصص الزكاة/الضريبة إلى حسابها"},
    {"text": "حوّل تعويض الشريكين إلى الحسابين الموسومين"},
    {"text": "ما تبقى يبقى للتشغيل OpEx"},
    {"text": "أكّد التوزيع في النظام (يوثّق تلقائياً)"}]'),
  ('zatca_registration_day', 'read_do', 'يوم التسجيل في ZATCA', '[
    {"text": "فعّل علم vat_enabled في النظام (فواتير جديدة فقط)"},
    {"text": "تحقق من ظهور صف الضريبة 15% في فاتورة تجريبية"},
    {"text": "حدّث الأرقام الضريبية في config/company"},
    {"text": "أبلغ العملاء النشطين برسالة معتمدة"},
    {"text": "راجع الأسعار: شاملة أم غير شاملة"}]'),
  ('security_incident', 'read_do', 'حادثة أمنية / تسريب اعتماد', '[
    {"text": "بدّل المفتاح/كلمة المرور المتسربة فوراً"},
    {"text": "راجع سجل التدقيق للوصول غير المصرح"},
    {"text": "أبطل الجلسات النشطة إن لزم"},
    {"text": "وثّق الحادثة كقضية بجذرها"},
    {"text": "قيّم واجب الإبلاغ PDPL"}]'),
  ('pdpl_deletion', 'read_do', 'طلب حذف بيانات (PDPL)', '[
    {"text": "تحقق من هوية الطالب"},
    {"text": "صدّر نسخة للسجل القانوني قبل الحذف"},
    {"text": "احذف بيانات العميل الشخصية من الجداول الحية"},
    {"text": "الوثائق المالية تبقى (التزام نظامي) — وثّق ذلك للطالب"},
    {"text": "سجّل الطلب والاستجابة"}]'),
  ('partner_absence', 'read_do', 'استمرارية غياب شريك', '[
    {"text": "المقاعد الشاغرة مؤقتاً تُسند بالاسم"},
    {"text": "صلاحيات الدفع والتحويل عند الشريك الحاضر"},
    {"text": "العملاء النشطون يُبلَّغون بقناة التواصل البديلة"},
    {"text": "طقس التوزيع لا يتوقف"}]')
on conflict do nothing;

-- Task-templates that gate on a checklist (market-phase launches)
alter table public.task_templates add column checklist_key text
  references public.pause_checklists (key);

update public.task_templates t set checklist_key = c.key
from public.playbook_stages s, public.playbooks p,
     (values
       ('performance-marketing', 'الإطلاق', 'campaign_golive'),
       ('web-digital', 'الإطلاق', 'website_launch'),
       ('seo-content', 'النشر', 'content_publish'),
       ('ai-automation', 'النشر والتشغيل', 'automation_deploy')
     ) as c(slug, stage_ar, key)
where t.stage_id = s.id and s.playbook_id = p.id
  and p.slug = c.slug and s.name_ar = c.stage_ar
  and t.sort = (select min(sort) from public.task_templates where stage_id = s.id and not needs_client_approval);

-- Gate: a checklist-bearing task cannot be marked done without a passed run.
create or replace function public.tasks_checklist_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if new.status = 'done' and old.status <> 'done' and new.template_id is not null then
    select checklist_key into v_key from public.task_templates where id = new.template_id;
    if v_key is not null and not exists (
      select 1 from public.checklist_runs
      where task_id = new.id and status = 'passed'
    ) then
      raise exception 'نقطة توقف: هذه المهمة تتطلب قائمة فحص «%» مكتملة قبل الإنجاز', v_key;
    end if;
    if exists (
      select 1 from public.checklist_runs
      where task_id = new.id and status = 'flagged'
    ) then
      raise exception 'Flag & Hold مفعّل على هذه المهمة — تُحل القضية أولاً';
    end if;
  end if;
  return new;
end;
$$;

create trigger tasks_checklist_gate
  before update on public.tasks
  for each row execute function public.tasks_checklist_gate();

-- Flag & Hold: flagging a run files an Issue and alerts the team.
create or replace function public.on_checklist_flagged()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_task text;
begin
  if new.status = 'flagged' and old.status <> 'flagged' then
    select name_ar into v_name from public.pause_checklists where key = new.checklist_key;
    select title into v_task from public.tasks where id = new.task_id;
    insert into public.issues (title, details, priority, project_id, auto_filed)
    select 'Flag & Hold: ' || coalesce(v_name, new.checklist_key),
           coalesce('المهمة: ' || v_task || E'\n', '') || 'السبب: ' || coalesce(new.flag_reason, '—'),
           4, t.project_id, true
    from public.tasks t where t.id = new.task_id;
    perform public.notify_team('flag_hold', 'flag_hold',
      jsonb_build_object('name', coalesce(v_name, new.checklist_key),
        'reason', coalesce(new.flag_reason, '—')),
      null, null);
  end if;
  return new;
end;
$$;

create trigger checklist_flag_hold
  after update on public.checklist_runs
  for each row execute function public.on_checklist_flagged();

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('flag_hold', 'inapp', 'ar', null, 'Flag & Hold على «{{name}}» — {{reason}}'),
  ('allocation_ready', 'inapp', 'ar', null,
   'طقس التوزيع جاهز: دخل الفترة SAR {{income}} — نفّذ التحويلات وأكّد')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Profit First (docs/10 §2.4). Percentages are «قرار شركاء» placeholders.
-- Income = client payments ONLY — wallet money is pass-through and NEVER
-- enters allocation math (the hard guard, §2.4.5).
-- -----------------------------------------------------------------------------
create table public.allocation_rules (
  bucket text primary key,
  name_ar text not null,
  cap_pct numeric not null check (cap_pct >= 0 and cap_pct <= 100),
  tap_pct numeric not null check (tap_pct >= 0 and tap_pct <= 100),
  sort int not null default 0
);

insert into public.allocation_rules (bucket, name_ar, cap_pct, tap_pct, sort) values
  ('profit', 'احتياطي الربح', 5, 10, 1),
  ('zakat_tax', 'الزكاة والضريبة', 3, 3, 2),
  ('owner_amer', 'تعويض الشريك — عامر (قرار شركاء)', 15, 20, 3),
  ('owner_abdulrahman', 'تعويض الشريك — عبدالرحمن (قرار شركاء)', 15, 20, 4),
  ('opex', 'التشغيل OpEx (المتبقي)', 62, 47, 5);

create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  period_start date not null,
  income numeric not null default 0,
  rows jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'skipped')),
  confirmed_by uuid references public.profiles (id),
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table public.profit_distributions (
  id uuid primary key default gen_random_uuid(),
  distributed_on date not null default current_date,
  amount_distributed numeric not null check (amount_distributed >= 0),
  amount_retained numeric not null check (amount_retained >= 0),
  note text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.allocation_rules enable row level security;
alter table public.allocations enable row level security;
alter table public.profit_distributions enable row level security;
grant select, insert, update, delete on public.allocation_rules, public.allocations,
  public.profit_distributions to authenticated, service_role;
create policy "alloc rules: team reads" on public.allocation_rules
  for select to authenticated using (public.is_team());
create policy "alloc rules: admin manages" on public.allocation_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "allocations: strategist+ manages" on public.allocations
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "distributions: admin manages" on public.profit_distributions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "distributions: team reads" on public.profit_distributions
  for select to authenticated using (public.is_team());

create trigger allocations_audit
  after insert or update or delete on public.allocations
  for each row execute function public.audit_trigger();
create trigger profit_distributions_audit
  after insert or update or delete on public.profit_distributions
  for each row execute function public.audit_trigger();

-- Generate the ritual on the 10th & 25th (called from run_daily_jobs).
create or replace function public.generate_allocation()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_last date;
  v_income numeric;
  v_rows jsonb := '[]';
  r record;
begin
  if extract(day from current_date) not in (10, 25) then return; end if;
  if exists (select 1 from public.allocations where run_date = current_date) then return; end if;

  select coalesce(max(run_date), current_date - 15) into v_last from public.allocations;
  -- HARD GUARD (§2.4.5): income = payments table only. Wallet entries are
  -- client ad money and never appear here.
  select coalesce(sum(amount), 0) into v_income
    from public.payments where paid_on > v_last and paid_on <= current_date;

  for r in select * from public.allocation_rules order by sort loop
    v_rows := v_rows || jsonb_build_object(
      'bucket', r.bucket, 'name_ar', r.name_ar, 'pct', r.cap_pct,
      'amount', round(v_income * r.cap_pct / 100, 2));
  end loop;

  insert into public.allocations (run_date, period_start, income, rows)
  values (current_date, v_last + 1, v_income, v_rows);

  perform public.notify_team('allocation_ready', 'allocation_ready',
    jsonb_build_object('income', v_income::text), null,
    'alloc:' || current_date);
end;
$$;

-- Extend the daily job (redefinition includes prior duties + allocation call).
create or replace function public.run_daily_jobs_v2()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs();
  perform public.generate_allocation();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v2()$$);

-- -----------------------------------------------------------------------------
-- Scorecard additions (docs/10 §2.2.3 rows now computable)
-- -----------------------------------------------------------------------------
insert into public.scorecard_metrics (key, name_ar, seat_id, direction, green_threshold, source, sort) values
  ('allocation_on_time', 'طقس التوزيع في موعده (1=نعم)',
    (select id from public.seats where name_en = 'Finance'), 'up', 1, 'auto', 10),
  ('vault_months', 'أشهر الخزينة (أوكسجين)',
    (select id from public.seats where name_en = 'Finance'), 'up', 3, 'auto', 11),
  ('scope_leak_sar', 'استنزاف خارج النطاق (SAR)',
    (select id from public.seats where name_en = 'Delivery'), 'down', 500, 'auto', 12),
  ('flags_raised', 'أعلام Flag & Hold (الصفر الدائم إشارة سيئة)',
    (select id from public.seats where name_en = 'Delivery'), 'up', 0, 'auto', 13)
on conflict do nothing;

-- Teach compute_scorecard the new metrics (full redefinition adds cases).
create or replace function public.compute_scorecard_extras(v_week date)
returns void
language plpgsql security definer set search_path = public as $$
declare v numeric; m record; v_green boolean;
begin
  for m in select * from public.scorecard_metrics
    where active and source = 'auto'
      and key in ('allocation_on_time', 'vault_months', 'scope_leak_sar', 'flags_raised')
  loop
    v := case m.key
      when 'allocation_on_time' then
        (select case
          when not exists (select 1 from public.allocations
            where run_date >= v_week - 21) then 1
          when exists (select 1 from public.allocations
            where run_date >= v_week - 21 and status = 'pending'
              and run_date < current_date - 2) then 0
          else 1 end)
      when 'vault_months' then
        (select case when opex_avg = 0 then 0
          else round(reserve / opex_avg, 1) end
         from
          (select coalesce(sum((r.elem ->> 'amount')::numeric), 0)
             - coalesce((select sum(amount_distributed) from public.profit_distributions), 0)
             as reserve
           from public.allocations a
           cross join lateral jsonb_array_elements(a.rows) r(elem)
           where a.status = 'confirmed' and r.elem ->> 'bucket' = 'profit') rr,
          (select coalesce(nullif(sum(amount), 0) / 3, 0) as opex_avg
           from public.expenses
           where expense_date > current_date - 90) ee)
      when 'scope_leak_sar' then
        (select coalesce(sum(te.minutes / 60.0 * coalesce(p.cost_rate_hourly, 0)), 0)
         from public.time_entries te
         join public.tasks t on t.id = te.task_id
         join public.profiles p on p.id = te.member
         where te.entry_date >= v_week - 7 and te.entry_date < v_week
           and t.template_id is null)
      when 'flags_raised' then
        (select count(*) from public.checklist_runs
         where status = 'flagged'
           and created_at >= v_week - 7 and created_at < v_week)
      else null end;
    if v is null then continue; end if;
    v_green := case m.direction
      when 'up' then v >= coalesce(m.green_threshold, 0)
      when 'down' then v <= coalesce(m.green_threshold, 0) end;
    insert into public.scorecard_entries (metric_key, week_start, value, is_green)
    values (m.key, v_week, v, v_green)
    on conflict (metric_key, week_start)
      do update set value = excluded.value, is_green = excluded.is_green,
                    computed_at = now();
  end loop;
end;
$$;

create or replace function public.compute_scorecard_v2()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.compute_scorecard();
  perform public.compute_scorecard_extras(date_trunc('week', now())::date);
end;
$$;

select cron.unschedule('agma-scorecard');
select cron.schedule('agma-scorecard', '0 4 * * 0',
  $$select public.compute_scorecard_v2()$$);

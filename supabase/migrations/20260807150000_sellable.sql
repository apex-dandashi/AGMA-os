-- Phase 6.5c — sellable by design (docs/10 §2.1 + §2.5)
-- TVR filter, service packages, playbook versioning + documentation grades,
-- experiments (Innovation → Quantification → Orchestration), executed_by +
-- EMT classification, owner-independence metrics, incentive plan stub.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.documentation_grade as enum ('A', 'B', 'C');
create type public.experiment_status as enum ('proposed', 'running', 'won', 'lost');
create type public.emt_class as enum ('entrepreneur', 'manager', 'technician');
create type public.package_terms as enum ('upfront_100', 'split_50_25_25', 'monthly');

-- ---------------------------------------------------------------------------
-- 2. TVR scores on the catalog (Teachable / Valuable / Repeatable, 1–5)
--    Unscored (null) = not yet reviewed in a quarterly session.
-- ---------------------------------------------------------------------------
alter table public.services_catalog
  add column tvr_teachable smallint check (tvr_teachable between 1 and 5),
  add column tvr_valuable smallint check (tvr_valuable between 1 and 5),
  add column tvr_repeatable smallint check (tvr_repeatable between 1 and 5);

-- ---------------------------------------------------------------------------
-- 3. Playbook documentation grades + versioning (the franchise prototype)
--    Grade C = undocumented = cannot be sold as a package.
-- ---------------------------------------------------------------------------
alter table public.playbooks
  add column documentation_grade public.documentation_grade not null default 'C',
  add column doc_gaps text;

create table public.playbook_versions (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks(id) on delete cascade,
  version text not null,
  changelog text not null,
  evidence_url text,
  experiment_id uuid,
  released_by uuid references public.profiles(id) default auth.uid(),
  released_at timestamptz not null default now(),
  unique (playbook_id, version)
);

alter table public.playbook_versions enable row level security;
create policy "playbook_versions: authenticated read" on public.playbook_versions
  for select to authenticated using (true);
create policy "playbook_versions: strategist+ manages" on public.playbook_versions
  to authenticated using (public.is_strategist_plus()) with check (public.is_strategist_plus());
grant select, insert, update, delete on public.playbook_versions to authenticated, service_role;
create trigger playbook_versions_audit after insert or update or delete
  on public.playbook_versions for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- 4. Service packages — «منهجية أجما™» productized
--    Seeded inactive: activation requires graded (non-C) playbooks and the
--    partner pricing decision (قرار شركاء).
-- ---------------------------------------------------------------------------
create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ar text not null,
  name_en text not null,
  tagline_ar text,
  description_ar text,
  service_ids uuid[] not null default '{}',
  playbook_ids uuid[] not null default '{}',
  base_price numeric check (base_price is null or base_price >= 0),
  timeline_weeks integer check (timeline_weeks is null or timeline_weeks > 0),
  options jsonb not null default '[]'::jsonb,
  payment_terms public.package_terms not null default 'upfront_100',
  active boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_packages enable row level security;
create policy "service_packages: authenticated read" on public.service_packages
  for select to authenticated using (true);
create policy "service_packages: admin manages" on public.service_packages
  to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.service_packages to authenticated, service_role;
create trigger service_packages_audit after insert or update or delete
  on public.service_packages for each row execute function public.audit_trigger();
create trigger service_packages_set_updated_at before update
  on public.service_packages for each row execute function public.set_updated_at();

-- Grade-C playbooks cannot back an active package (Gerber/Warrillow rule).
create or replace function public.package_activation_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_bad text;
begin
  if new.active then
    select p.name_ar into v_bad
    from public.playbooks p
    where p.id = any(new.playbook_ids) and p.documentation_grade = 'C'
    limit 1;
    if v_bad is not null then
      raise exception 'لا يمكن تفعيل الباقة: دليل «%» بدرجة توثيق C — وثّقه أولاً (grade C cannot be sold)', v_bad;
    end if;
    if new.base_price is null then
      raise exception 'لا يمكن تفعيل الباقة بدون سعر معتمد (قرار شركاء)';
    end if;
  end if;
  return new;
end;
$$;

create trigger service_packages_activation_guard
  before insert or update on public.service_packages
  for each row execute function public.package_activation_guard();

-- Seeds — proven demand only (quote 00054 = Launch Kit already).
insert into public.service_packages
  (key, name_ar, name_en, tagline_ar, description_ar, service_ids, playbook_ids,
   timeline_weeks, options, payment_terms, sort)
values
  ('launch_kit', 'باقة الانطلاق', 'Launch Kit',
   'منهجية أجما™ مطبّقة على الانطلاق الرقمي',
   'هوية بصرية + ملف تعريفي + موقع إلكتروني مع النطاق والاستضافة — النطاق الثابت المُثبت من الطلب الفعلي (عرض السعر 00054). السعر النهائي قرار شركاء.',
   (select coalesce(array_agg(id), '{}') from public.services_catalog
      where slug in ('logo-identity', 'brand-guidelines', 'websites')),
   (select coalesce(array_agg(id), '{}') from public.playbooks
      where slug in ('branding-creative', 'web-digital')),
   6,
   '[{"key": "option_1", "name_ar": "الخيار الأول: موقع تعريفي"},
     {"key": "option_2", "name_ar": "الخيار الثاني: موقع متكامل بلوحة إدارة"}]'::jsonb,
   'upfront_100', 1),
  ('growth_retainer', 'باقة النمو الشهرية', 'Growth Retainer',
   'منهجية أجما™ مطبّقة على النمو المستمر',
   'إدارة أداء إعلاني + محتوى شهري (إعلانات مدفوعة، إدارة حسابات، محتوى بالذكاء الاصطناعي). فوترة مقدَّمة شهرياً. السعر النهائي قرار شركاء.',
   (select coalesce(array_agg(id), '{}') from public.services_catalog
      where slug in ('paid-social', 'google-ads', 'social-management', 'ai-content')),
   (select coalesce(array_agg(id), '{}') from public.playbooks
      where slug in ('performance-marketing', 'social-media', 'seo-content')),
   null,
   '[]'::jsonb,
   'monthly', 2),
  ('ai_starter', 'باقة بداية الذكاء', 'AI Starter',
   'منهجية أجما™ مطبّقة على أتمتة الأعمال',
   'أتمتة سير عمل واحدة + روبوت محادثة — مدخل المنشآت إلى القدرات الذكية. السعر النهائي قرار شركاء.',
   (select coalesce(array_agg(id), '{}') from public.services_catalog
      where slug in ('workflow-automation', 'chatbots')),
   (select coalesce(array_agg(id), '{}') from public.playbooks
      where slug in ('ai-automation')),
   4,
   '[]'::jsonb,
   'upfront_100', 3);

-- ---------------------------------------------------------------------------
-- 5. The "say no" mechanism: custom scope requires a reason + premium
-- ---------------------------------------------------------------------------
alter table public.scopes
  add column package_id uuid references public.service_packages(id),
  add column why_no_package_fit text,
  add column custom_premium_pct numeric not null default 0 check (custom_premium_pct >= 0);

create or replace function public.scope_custom_reason_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'draft' and new.package_id is null
     and coalesce(trim(new.why_no_package_fit), '') = '' then
    raise exception 'النطاق المخصص يتطلب سبب عدم ملاءمة الباقات قبل الإرسال — السوق يصمّم منتجاتنا القادمة';
  end if;
  return new;
end;
$$;

create trigger scopes_custom_reason_guard
  before insert or update on public.scopes
  for each row execute function public.scope_custom_reason_guard();

-- ---------------------------------------------------------------------------
-- 6. Experiments — Innovation → Quantification → Orchestration
--    Win with a playbook → automatic version release + team notification.
--    Loss → documented anyway. Nothing improves by vibes.
-- ---------------------------------------------------------------------------
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  hypothesis text not null,
  metric_key text,
  baseline numeric,
  target numeric,
  result numeric,
  duration_weeks integer check (duration_weeks is null or duration_weeks > 0),
  status public.experiment_status not null default 'proposed',
  playbook_id uuid references public.playbooks(id),
  issue_id uuid references public.issues(id),
  decision_note text,
  started_at date,
  ended_at date,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experiments enable row level security;
create policy "experiments: team read" on public.experiments
  for select to authenticated using (public.is_team());
create policy "experiments: strategist+ manages" on public.experiments
  to authenticated using (public.is_strategist_plus()) with check (public.is_strategist_plus());
grant select, insert, update, delete on public.experiments to authenticated, service_role;
create trigger experiments_audit after insert or update or delete
  on public.experiments for each row execute function public.audit_trigger();
create trigger experiments_set_updated_at before update
  on public.experiments for each row execute function public.set_updated_at();

create or replace function public.on_experiment_decided()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_last text;
  v_next text;
  v_major int; v_minor int;
begin
  if new.status in ('won', 'lost') and old.status not in ('won', 'lost') then
    if new.ended_at is null then new.ended_at := current_date; end if;

    if new.status = 'won' and new.playbook_id is not null then
      select version into v_last from public.playbook_versions
        where playbook_id = new.playbook_id
        order by released_at desc limit 1;
      if v_last is null then
        v_next := '1.1.0';
      else
        v_major := split_part(v_last, '.', 1)::int;
        v_minor := split_part(v_last, '.', 2)::int;
        v_next := v_major || '.' || (v_minor + 1) || '.0';
      end if;
      insert into public.playbook_versions (playbook_id, version, changelog, experiment_id, released_by)
      values (new.playbook_id, v_next,
        'تجربة «' || new.title || '» نجحت: ' || coalesce(new.decision_note, new.hypothesis),
        new.id, coalesce(auth.uid(), new.created_by));
    end if;

    perform public.notify_team('experiment_decided', 'experiment_decided',
      jsonb_build_object(
        'title', new.title,
        'status', case when new.status = 'won' then 'نجحت' else 'خسرت' end,
        'note', coalesce(new.decision_note, '')),
      null, 'experiment:' || new.id);
  end if;
  return new;
end;
$$;

create trigger experiments_on_decided
  before update on public.experiments
  for each row execute function public.on_experiment_decided();

insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('experiment_decided', 'inapp', 'ar', 'حُسمت تجربة: {{title}}',
   'التجربة «{{title}}» {{status}}. {{note}} — التغييرات الرابحة تُرقّي الدليل تلقائياً، والخاسرة تُوثَّق كي لا تتكرر.', true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 7. executed_by + EMT classification (the Technician-trap gauge)
-- ---------------------------------------------------------------------------
alter table public.tasks add column executed_by uuid references public.profiles(id);
alter table public.task_templates add column emt_class public.emt_class not null default 'technician';

create or replace function public.task_stamp_executor()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'done' and old.status is distinct from 'done'
     and new.executed_by is null then
    new.executed_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_executor
  before update on public.tasks
  for each row execute function public.task_stamp_executor();

-- ---------------------------------------------------------------------------
-- 8. Key-people incentive plan (stub — activated at first senior hire)
-- ---------------------------------------------------------------------------
create table public.incentive_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  pool_pct numeric not null check (pool_pct > 0 and pool_pct <= 100),
  vesting_years integer not null default 3,
  starts_on date,
  notes text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incentive_plans enable row level security;
create policy "incentive_plans: admin only" on public.incentive_plans
  to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.incentive_plans to authenticated, service_role;
create trigger incentive_plans_audit after insert or update or delete
  on public.incentive_plans for each row execute function public.audit_trigger();
create trigger incentive_plans_set_updated_at before update
  on public.incentive_plans for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. Owner-independence + package-mix scorecard metrics
-- ---------------------------------------------------------------------------
insert into public.scorecard_metrics (key, name_ar, seat_id, direction, green_threshold, source, sort) values
  ('package_revenue_pct', 'نسبة إيراد الباقات %',
   (select id from public.seats where name_en = 'Sales'), 'up', 50, 'auto', 14),
  ('owner_technician_pct', 'نسبة عمل الشركاء التنفيذي %',
   (select id from public.seats where name_en = 'Integrator'), 'down', 40, 'auto', 15),
  ('delivery_by_team_pct', 'نسبة التسليم بغير الشركاء %',
   (select id from public.seats where name_en = 'Integrator'), 'up', 60, 'auto', 16)
on conflict (key) do nothing;

create or replace function public.compute_scorecard_sellable(v_week date)
returns void
language plpgsql security definer set search_path = public as $$
declare v numeric; m record; v_green boolean;
begin
  for m in select * from public.scorecard_metrics
    where active and source = 'auto'
      and key in ('package_revenue_pct', 'owner_technician_pct', 'delivery_by_team_pct')
  loop
    v := case m.key
      when 'package_revenue_pct' then
        (select case when coalesce(sum(pay.amount), 0) = 0 then 0
           else round(100.0 * sum(pay.amount) filter (where s.package_id is not null)
                / sum(pay.amount), 1) end
         from public.payments pay
         join public.documents d on d.id = pay.invoice_id
         left join public.scopes s on s.id = d.scope_id
         where pay.paid_on > current_date - 90)
      when 'owner_technician_pct' then
        (select case when count(*) = 0 then 0
           else round(100.0 * count(*) filter
                  (where coalesce(tt.emt_class, 'technician') = 'technician')
                / count(*), 1) end
         from public.tasks t
         join public.profiles p on p.id = t.executed_by and p.role = 'admin'
         left join public.task_templates tt on tt.id = t.template_id
         where t.status = 'done' and t.updated_at > now() - interval '90 days')
      when 'delivery_by_team_pct' then
        (select case when count(*) = 0 then 0
           else round(100.0 * count(*) filter (where p.role <> 'admin') / count(*), 1) end
         from public.tasks t
         join public.profiles p on p.id = t.executed_by
         where t.status = 'done' and t.updated_at > now() - interval '90 days')
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

create or replace function public.compute_scorecard_v3()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.compute_scorecard_v2();
  perform public.compute_scorecard_sellable(date_trunc('week', now())::date);
end;
$$;

select cron.unschedule('agma-scorecard');
select cron.schedule('agma-scorecard', '0 4 * * 0',
  $$select public.compute_scorecard_v3()$$);

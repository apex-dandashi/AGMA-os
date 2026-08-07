-- =============================================================================
-- Phase 6.5a: the OS-core (docs/10 §2.1–2.2) — V/TO, seats, primary aims,
-- rocks (hard 5-cap), issues+IDS, self-computing scorecard + Sunday digest,
-- meeting records. Placeholder seeds marked «قرار شركاء» await the partner
-- session (docs/10 Part 5).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- V/TO — one living record (docs/10 §2.2.1)
-- -----------------------------------------------------------------------------
create table public.vision (
  id int primary key default 1 check (id = 1),
  core_values jsonb not null default '[]',
  core_focus jsonb not null default '{}',
  ten_year_target text,
  three_year_picture text,
  one_year_plan text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.vision (id, core_values, core_focus, ten_year_target)
values (1,
  '["(قرار شركاء) قيمة ١", "(قرار شركاء) قيمة ٢", "(قرار شركاء) قيمة ٣"]',
  '{"purpose": "(مسودة للنقاش) نمنح المنشآت السعودية قدرات تسويق مبنية بالذكاء الاصطناعي", "niche": "(مسودة) المنشآت الصغيرة والمتوسطة في مرحلة التحديث"}',
  '(قرار شركاء) الهدف العشري');

alter table public.vision enable row level security;
grant select, update on public.vision to authenticated;
grant select, insert, update, delete on public.vision to service_role;
create policy "vision: team reads" on public.vision
  for select to authenticated using (public.is_team());
create policy "vision: admin edits" on public.vision
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger vision_audit
  after insert or update or delete on public.vision
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Primary aims — private per partner (docs/10 §2.1.1). Owner-only, full stop.
-- -----------------------------------------------------------------------------
create table public.primary_aims (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  statement text not null default '',
  shared_excerpt text,
  updated_at timestamptz not null default now()
);

alter table public.primary_aims enable row level security;
grant select, insert, update on public.primary_aims to authenticated;
grant select, insert, update, delete on public.primary_aims to service_role;
create policy "aims: owner only" on public.primary_aims
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
-- deliberately NO audit trigger: the statement is private to its owner;
-- audit_log is team-invisible but service-role-readable, so we keep the
-- deepest personal record out of it entirely.

-- -----------------------------------------------------------------------------
-- Seats — the org chart as data, before people (docs/10 §2.1.2)
-- -----------------------------------------------------------------------------
create table public.seats (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null unique,
  roles jsonb not null default '[]',
  measurables jsonb not null default '[]',
  holder uuid references public.profiles (id),
  reports_to uuid references public.seats (id),
  sort int not null default 0
);

alter table public.seats enable row level security;
grant select, insert, update, delete on public.seats to authenticated, service_role;
create policy "seats: team reads" on public.seats
  for select to authenticated using (public.is_team());
create policy "seats: admin manages" on public.seats
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger seats_audit
  after insert or update or delete on public.seats
  for each row execute function public.audit_trigger();

insert into public.seats (name_ar, name_en, roles, sort) values
  ('صاحب الرؤية', 'Visionary',
   '["الاتجاه الاستراتيجي", "العلاقات الكبرى", "الابتكار", "ثقافة الشركة", "القرارات المصيرية"]', 1),
  ('المُنفِّذ الأول', 'Integrator',
   '["تشغيل الشركة يومياً", "إزالة العوائق", "مساءلة المقاعد", "إدارة الإيقاع الأسبوعي", "جودة البلاي بوكس"]', 2),
  ('المبيعات', 'Sales',
   '["المسار من الاهتمام إلى التوقيع", "عروض الأسعار", "الباقات", "متابعة المحتملين", "أسباب الفوز والخسارة"]', 3),
  ('التسويق', 'Marketing',
   '["تسويق AGMA نفسها", "المحتوى والموقع", "توليد الطلب", "العلامة", "الإسناد التسويقي"]', 4),
  ('التسليم', 'Delivery',
   '["تنفيذ المشاريع", "بوابات الاعتماد", "رضا العملاء", "الالتزام بالمواعيد", "جودة المخرجات"]', 5),
  ('المالية', 'Finance',
   '["الفوترة والتحصيل", "طقس التوزيع 10/25", "الخزينة", "الامتثال الزكوي", "هوامش المشاريع"]', 6);

-- -----------------------------------------------------------------------------
-- Rocks — 90-day priorities, hard cap of 5 per owner per quarter (docs/10 §2.2.6)
-- -----------------------------------------------------------------------------
create type public.rock_status as enum ('on_track', 'off_track', 'done', 'dropped');

create table public.rocks (
  id uuid primary key default gen_random_uuid(),
  quarter text not null check (quarter ~ '^\d{4}-Q[1-4]$'),
  owner uuid not null references public.profiles (id),
  title text not null,
  success_criteria text,
  linked_project uuid references public.projects (id),
  status public.rock_status not null default 'on_track',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rocks enable row level security;
grant select, insert, update, delete on public.rocks to authenticated, service_role;
create policy "rocks: team reads" on public.rocks
  for select to authenticated using (public.is_team());
create policy "rocks: owner manages own" on public.rocks
  for all to authenticated
  using (public.is_team() and owner = auth.uid())
  with check (public.is_team() and owner = auth.uid());
create policy "rocks: admin manages" on public.rocks
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger rocks_set_updated_at
  before update on public.rocks
  for each row execute function public.set_updated_at();
create trigger rocks_audit
  after insert or update or delete on public.rocks
  for each row execute function public.audit_trigger();

create or replace function public.rocks_cap_guard()
returns trigger
language plpgsql as $$
declare n int;
begin
  select count(*) into n from public.rocks
    where owner = new.owner and quarter = new.quarter
      and status in ('on_track', 'off_track')
      and id <> new.id;
  if n >= 5 then
    raise exception 'EOS rule: max 5 rocks per person per quarter — finish or drop one first';
  end if;
  return new;
end;
$$;

create trigger rocks_cap
  before insert on public.rocks
  for each row execute function public.rocks_cap_guard();

-- -----------------------------------------------------------------------------
-- Issues + IDS (docs/10 §2.2.4): anyone files; root cause required to solve;
-- recurrence auto-links and reopens context.
-- -----------------------------------------------------------------------------
create type public.issue_status as enum ('identified', 'discussing', 'solved', 'dropped');

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text,
  raised_by uuid references public.profiles (id) default auth.uid(),
  priority int not null default 3 check (priority between 1 and 5),
  status public.issue_status not null default 'identified',
  root_cause text,
  original_id uuid references public.issues (id),
  client_id uuid references public.clients (id),
  project_id uuid references public.projects (id),
  document_id uuid references public.documents (id),
  auto_filed boolean not null default false,
  solved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.issues enable row level security;
grant select, insert, update, delete on public.issues to authenticated, service_role;
create policy "issues: team manages" on public.issues
  for all to authenticated
  using (public.is_team()) with check (public.is_team());
create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();
create trigger issues_audit
  after insert or update or delete on public.issues
  for each row execute function public.audit_trigger();

create or replace function public.issues_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_prior uuid;
begin
  if tg_op = 'UPDATE' and new.status = 'solved' and old.status <> 'solved' then
    if new.root_cause is null or length(trim(new.root_cause)) < 5 then
      raise exception 'IDS rule: solving requires a root cause, not a symptom note';
    end if;
    new.solved_at := now();
  end if;
  if tg_op = 'INSERT' then
    -- recurrence: same title solved before → link the lineage
    select id into v_prior from public.issues
      where status = 'solved' and lower(trim(title)) = lower(trim(new.title))
      order by solved_at desc limit 1;
    if v_prior is not null then
      new.original_id := v_prior;
      new.priority := least(5, new.priority + 1);
    end if;
  end if;
  return new;
end;
$$;

create trigger issues_guard
  before insert or update on public.issues
  for each row execute function public.issues_guard();

-- -----------------------------------------------------------------------------
-- Scorecard (docs/10 §2.2.3): metrics owned by SEATS, auto-computed weekly.
-- -----------------------------------------------------------------------------
create type public.metric_direction as enum ('up', 'down');

create table public.scorecard_metrics (
  key text primary key,
  name_ar text not null,
  seat_id uuid references public.seats (id),
  direction public.metric_direction not null default 'up',
  green_threshold numeric,
  source text not null default 'auto' check (source in ('auto', 'manual')),
  sort int not null default 0,
  active boolean not null default true
);

create table public.scorecard_entries (
  metric_key text not null references public.scorecard_metrics (key),
  week_start date not null,
  value numeric,
  is_green boolean,
  computed_at timestamptz not null default now(),
  primary key (metric_key, week_start)
);

alter table public.scorecard_metrics enable row level security;
alter table public.scorecard_entries enable row level security;
grant select, insert, update, delete on public.scorecard_metrics, public.scorecard_entries
  to authenticated, service_role;
create policy "metrics: team reads" on public.scorecard_metrics
  for select to authenticated using (public.is_team());
create policy "metrics: admin manages" on public.scorecard_metrics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "entries: team reads" on public.scorecard_entries
  for select to authenticated using (public.is_team());
create policy "entries: admin manages" on public.scorecard_entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.scorecard_metrics (key, name_ar, seat_id, direction, green_threshold, source, sort) values
  ('cash_collected', 'النقد المحصَّل (SAR)',
    (select id from public.seats where name_en = 'Finance'), 'up', 0, 'auto', 1),
  ('pipeline_value', 'قيمة المسار المفتوح (SAR)',
    (select id from public.seats where name_en = 'Sales'), 'up', 0, 'auto', 2),
  ('new_leads', 'عملاء محتملون جدد',
    (select id from public.seats where name_en = 'Sales'), 'up', 3, 'auto', 3),
  ('proposals_sent', 'عروض أسعار مُرسلة',
    (select id from public.seats where name_en = 'Sales'), 'up', 2, 'auto', 4),
  ('approval_lag_h', 'متوسط تأخر الاعتمادات (ساعة)',
    (select id from public.seats where name_en = 'Delivery'), 'down', 48, 'auto', 5),
  ('on_time_tasks_pct', 'الإنجاز في الموعد %',
    (select id from public.seats where name_en = 'Delivery'), 'up', 85, 'auto', 6),
  ('overdue_ar', 'ذمم متأخرة (SAR)',
    (select id from public.seats where name_en = 'Finance'), 'down', 0, 'auto', 7),
  ('overdue_tasks', 'مهام متأخرة',
    (select id from public.seats where name_en = 'Delivery'), 'down', 3, 'auto', 8),
  ('nps', 'رضا العملاء (NPS) — يدوي',
    (select id from public.seats where name_en = 'Delivery'), 'up', 50, 'manual', 9);
-- green_threshold = 0 rows are «قرار شركاء» targets pending the partner session.

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('scorecard_digest', 'inapp', 'ar', null,
   'النتائج الأسبوعية: {{greens}} أخضر · {{reds}} أحمر{{red_list}}'),
  ('scorecard_digest', 'email', 'ar', 'النتائج الأسبوعية — {{greens}} أخضر · {{reds}} أحمر',
   'صباح الخير،<br><br>نتائج الأسبوع: <b>{{greens}} أخضر · {{reds}} أحمر</b><br>{{red_list}}<br><br>التفاصيل في نظام التشغيل → النتائج.')
on conflict do nothing;

create or replace function public.compute_scorecard()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_week date := date_trunc('week', now())::date; -- ISO Monday start
  m record;
  v numeric;
  v_green boolean;
  v_prev boolean;
  v_reds int := 0;
  v_greens int := 0;
  v_red_list text := '';
begin
  for m in select * from public.scorecard_metrics where active and source = 'auto' loop
    v := case m.key
      when 'cash_collected' then
        (select coalesce(sum(amount), 0) from public.payments
          where paid_on >= v_week - 7 and paid_on < v_week)
      when 'pipeline_value' then
        (select coalesce(sum(value), 0) from public.leads where outcome = 'open')
      when 'new_leads' then
        (select count(*) from public.leads
          where created_at >= v_week - 7 and created_at < v_week)
      when 'proposals_sent' then
        (select count(*) from public.documents
          where type = 'quote' and number is not null
            and issued_on >= v_week - 7 and issued_on < v_week)
      when 'approval_lag_h' then
        (select coalesce(round(avg(extract(epoch from now() - created_at) / 3600)), 0)
          from public.approvals where status = 'pending')
      when 'on_time_tasks_pct' then
        (select case when count(*) = 0 then 100
          else round(100.0 * count(*) filter (where due is null or updated_at::date <= due) / count(*))
          end
          from public.tasks where status = 'done'
            and updated_at >= v_week - 7 and updated_at < v_week)
      when 'overdue_ar' then
        (select coalesce(sum(d.total - coalesce(p.paid, 0)), 0)
          from public.documents d
          left join (select invoice_id, sum(amount) paid from public.payments group by 1) p
            on p.invoice_id = d.id
          where d.type = 'invoice' and d.status in ('sent', 'signed', 'active')
            and d.valid_until < current_date and d.total > coalesce(p.paid, 0))
      when 'overdue_tasks' then
        (select count(*) from public.tasks
          where status <> 'done' and due is not null and due < current_date)
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

    if v_green then v_greens := v_greens + 1;
    else
      v_reds := v_reds + 1;
      v_red_list := v_red_list || '<br>• ' || m.name_ar || ': ' || v::text;
      -- two consecutive reds → auto-file an issue (docs/10 §2.2.3)
      select is_green into v_prev from public.scorecard_entries
        where metric_key = m.key and week_start = v_week - 7;
      if v_prev is false then
        insert into public.issues (title, details, priority, auto_filed)
        select 'مؤشر أحمر أسبوعين: ' || m.name_ar,
               'القيمة الحالية ' || v::text || ' — الهدف ' || coalesce(m.green_threshold::text, '؟'),
               4, true
        where not exists (
          select 1 from public.issues
          where auto_filed and status in ('identified', 'discussing')
            and title = 'مؤشر أحمر أسبوعين: ' || m.name_ar);
      end if;
    end if;
  end loop;

  -- Sunday digest to admins (docs/10 Part 3), email queued if key exists
  perform public.notify_team('scorecard_digest', 'scorecard_digest',
    jsonb_build_object('greens', v_greens::text, 'reds', v_reds::text,
      'red_list', v_red_list),
    null, 'digest:' || v_week);
end;
$$;

-- Sunday 07:00 Riyadh = 04:00 UTC Sunday
select cron.schedule('agma-scorecard', '0 4 * * 0',
  $$select public.compute_scorecard()$$);

-- -----------------------------------------------------------------------------
-- Meetings + 7-day to-dos (docs/10 §2.2.5)
-- -----------------------------------------------------------------------------
create type public.meeting_kind as enum ('l10', 'quarterly', 'annual');

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  kind public.meeting_kind not null default 'l10',
  held_on date not null default current_date,
  rating int check (rating between 1 and 10),
  headlines text,
  created_at timestamptz not null default now()
);

create table public.meeting_todos (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings (id) on delete set null,
  title text not null,
  owner uuid references public.profiles (id) default auth.uid(),
  due date not null default current_date + 7,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;
alter table public.meeting_todos enable row level security;
grant select, insert, update, delete on public.meetings, public.meeting_todos
  to authenticated, service_role;
create policy "meetings: team manages" on public.meetings
  for all to authenticated using (public.is_team()) with check (public.is_team());
create policy "todos: team manages" on public.meeting_todos
  for all to authenticated using (public.is_team()) with check (public.is_team());
create trigger meetings_audit
  after insert or update or delete on public.meetings
  for each row execute function public.audit_trigger();

alter publication supabase_realtime add table public.issues;
alter publication supabase_realtime add table public.rocks;

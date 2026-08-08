-- المرحلة ١٠ (docs/05 B10 + B11.6/11 + docs/09): بوابة الموظف (تعيين ومغادرة
-- آلية) + صحة العملاء الأسبوعية تغذي المؤشرات + ترقية الملخص الأسبوعي
-- (صخور + قضايا + نص واتساب) — كلها تركب على محركات موجودة: الإشعارات،
-- المؤشرات، role_profiles، وWhatsApp dispatcher.

-- =============================================================================
-- ١) بوابة الموظف — دورة الحياة على profiles نفسها (لا جداول HR موازية)
-- =============================================================================

-- عناصر التجهيز وخطة الأسبوع الأول لكل دور (docs/06 §4 — كانت pillars فقط)
alter table public.role_profiles
  add column if not exists provisioning_items jsonb not null default '[]',
  add column if not exists welcome_plan_ar text;

update public.role_profiles set
  provisioning_items = '[
    {"key":"email","label":"إنشاء بريد @agma.com.sa"},
    {"key":"tools","label":"دعوات الأدوات: Google Workspace · نظام AGMA OS"},
    {"key":"finance_access","label":"صلاحيات المالية والحوكمة (مدير النظام فقط)"},
    {"key":"vault","label":"مشاركة كلمات المرور عبر مدير كلمات مرور — لا رسائل"}
  ]'::jsonb,
  welcome_plan_ar = 'أسبوعك الأول: تعرّف على النظام من مركز المساعدة (أيقونة ؟)، راجع دليل النظام كاملاً، ثم اجلس مع الشريك على الرؤية V/TO في تبويب «النظام».'
  where role_key = 'admin';

update public.role_profiles set
  provisioning_items = '[
    {"key":"email","label":"إنشاء بريد @agma.com.sa"},
    {"key":"tools","label":"دعوات الأدوات: Google Workspace · نظام AGMA OS"},
    {"key":"crm","label":"جولة على المسار والعملاء الحاليين"},
    {"key":"playbooks","label":"قراءة كتيبات الخدمات (playbooks) المعتمدة"}
  ]'::jsonb,
  welcome_plan_ar = 'أسبوعك الأول: افهم منهجية AGMA من دليل النظام، راجع مسار المبيعات والعملاء النشطين، واحضر أول اجتماع أسبوعي L10.'
  where role_key = 'strategist';

update public.role_profiles set
  provisioning_items = '[
    {"key":"email","label":"إنشاء بريد @agma.com.sa"},
    {"key":"tools","label":"دعوات الأدوات: Google Workspace · نظام AGMA OS"},
    {"key":"playbooks","label":"قراءة كتيبات الخدمات التي سينفذها"},
    {"key":"shadow","label":"مرافقة زميل في أول مشروع (تظليل)"}
  ]'::jsonb,
  welcome_plan_ar = 'أسبوعك الأول: شاشة «يومي» هي بيتك — مهامك كلها فيها. اقرأ كتيبات خدماتك، وسلّم أول مهمة صغيرة قبل نهاية الأسبوع.'
  where role_key = 'executor';

-- قوائم التعيين والمغادرة — عناصر jsonb مع مهل زمنية (نداءات ٣٠/٦٠/٩٠)
create table public.staff_checklists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('onboarding', 'offboarding')),
  items jsonb not null default '[]',
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, kind)
);

comment on table public.staff_checklists is
  'دورة حياة الموظف (docs/05 B10): items [{key,label,due_days?,done,done_by,done_at}] — عناصر ٣٠/٦٠/٩٠ تحمل due_days وينبّه عنها العمل اليومي.';

alter table public.staff_checklists enable row level security;
grant select, insert, update, delete on public.staff_checklists to authenticated, service_role;
create policy "staff checklists: admin manages" on public.staff_checklists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff checklists: member reads own" on public.staff_checklists
  for select to authenticated using (profile_id = auth.uid());
create trigger staff_checklists_updated
  before update on public.staff_checklists
  for each row execute function public.set_updated_at();
create trigger staff_checklists_audit
  after insert or update or delete on public.staff_checklists
  for each row execute function public.audit_trigger();

-- سجل العهد (أجهزة وأدوات بيد الموظف)
create table public.equipment_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  item text not null check (char_length(trim(item)) between 2 and 200),
  notes text,
  given_at date not null default current_date,
  returned_at date,
  created_at timestamptz not null default now()
);

alter table public.equipment_log enable row level security;
grant select, insert, update, delete on public.equipment_log to authenticated, service_role;
create policy "equipment: admin manages" on public.equipment_log
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "equipment: member reads own" on public.equipment_log
  for select to authenticated using (profile_id = auth.uid());
create trigger equipment_log_audit
  after insert or update or delete on public.equipment_log
  for each row execute function public.audit_trigger();

-- قوالب رسائل الموظف الجديد
insert into public.notification_templates (key, channel, locale, subject, body) values
  ('staff_welcome', 'inapp', 'ar', null,
   'حياك الله في AGMA يا {{name}} 🎉 دورك: {{role_title}}. قائمة تجهيزك جاهزة في «الفريق»، وخطة أسبوعك الأول في بريدك.'),
  ('staff_welcome', 'email', 'ar', 'أهلاً بك في فريق AGMA — {{role_title}}',
   'حياك الله {{name}} 👋<br><br>انضممت لفريق AGMA بدور <b>{{role_title}}</b>.<br><br><b>ركائز دورك:</b><br>{{pillars}}<br><br><b>خطة أسبوعك الأول:</b><br>{{welcome_plan}}<br><br>سجّل دخولك إلى <a href="https://ops.agma.com.sa">ops.agma.com.sa</a> — كل شيء يبدأ من هناك، ومركز المساعدة (أيقونة ؟) يجاوب أسئلتك.'),
  ('staff_checkin', 'inapp', 'ar', null,
   'موعد متابعة {{days}} يوماً للزميل {{name}} — اجلسوا معه: كيف الرحلة؟ ما الذي يعيقه؟'),
  ('staff_offboarding', 'inapp', 'ar', null,
   'بدأت مغادرة {{name}} — قائمة المغادرة أُنشئت في «الفريق»: سحب الصلاحيات، إعادة العهد، التسليم.')
on conflict do nothing;

-- دورة الحياة: تفعيل عضو فريق ← قائمة تعيين + ترحيب؛ تعطيله ← قائمة مغادرة
create or replace function public.staff_lifecycle()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_rp record;
  v_items jsonb;
  v_pillars text;
begin
  -- تعيين: عضو فريق نشط بلا قائمة تعيين (يشمل قبول الدعوة وأول تفعيل)
  if new.role <> 'client' and new.active
     and not exists (select 1 from public.staff_checklists
                     where profile_id = new.id and kind = 'onboarding') then
    select * into v_rp from public.role_profiles where role_key = new.role::text;
    -- عناصر الدور + الثوابت: التعهد بالسلوك، التوقيع، ونداءات ٣٠/٦٠/٩٠
    v_items := coalesce(v_rp.provisioning_items, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('key', 'coc', 'label', 'الإقرار بميثاق السلوك المهني'),
      jsonb_build_object('key', 'signature', 'label', 'رفع التوقيع + تركيب توقيع البريد من «ملفي الشخصي»'),
      jsonb_build_object('key', 'checkin_30', 'label', 'جلسة متابعة ٣٠ يوماً', 'due_days', 30),
      jsonb_build_object('key', 'checkin_60', 'label', 'جلسة متابعة ٦٠ يوماً', 'due_days', 60),
      jsonb_build_object('key', 'checkin_90', 'label', 'جلسة متابعة ٩٠ يوماً', 'due_days', 90));
    insert into public.staff_checklists (profile_id, kind, items)
    values (new.id, 'onboarding', v_items);

    select string_agg('• ' || (p->>'title_ar') || ': ' || coalesce(p->>'desc_ar', ''), '<br>')
      into v_pillars from jsonb_array_elements(coalesce(v_rp.pillars, '[]'::jsonb)) p;
    perform public.enqueue_notification('staff_welcome', 'inapp', 'staff_welcome',
      jsonb_build_object('name', coalesce(new.full_name, new.email),
        'role_title', coalesce(v_rp.title_ar, new.role::text)),
      new.id, null, null, now(), 'welcome:' || new.id);
    perform public.enqueue_notification('staff_welcome', 'email', 'staff_welcome',
      jsonb_build_object('name', coalesce(new.full_name, new.email),
        'role_title', coalesce(v_rp.title_ar, new.role::text),
        'pillars', coalesce(v_pillars, '—'),
        'welcome_plan', coalesce(v_rp.welcome_plan_ar, 'نرتبها معك أول يوم.')),
      new.id, new.email, null, now(), 'welcome-mail:' || new.id);
  end if;

  -- مغادرة: تعطيل عضو فريق كان نشطاً ← قائمة مغادرة (مرآة docs/05 B10)
  if tg_op = 'UPDATE' and old.active and not new.active and new.role <> 'client'
     and not exists (select 1 from public.staff_checklists
                     where profile_id = new.id and kind = 'offboarding') then
    insert into public.staff_checklists (profile_id, kind, items) values (new.id, 'offboarding',
      '[
        {"key":"access","label":"سحب الصلاحيات: البريد · الأدوات · تدوير كلمات المرور المشتركة"},
        {"key":"equipment","label":"استلام العهد وإقفال سجلها"},
        {"key":"handover","label":"استلام مستند التسليم (المشاريع الجارية + جهات الاتصال)"},
        {"key":"exit","label":"مقابلة المغادرة وتوثيق أسبابها"}
      ]'::jsonb);
    perform public.notify_team('staff_offboarding', 'staff_offboarding',
      jsonb_build_object('name', coalesce(new.full_name, new.email)),
      null, 'offboard:' || new.id);
  end if;
  return new;
end;
$$;

create trigger profiles_staff_lifecycle
  after insert or update of active, role on public.profiles
  for each row execute function public.staff_lifecycle();

-- نداءات ٣٠/٦٠/٩٠ من العمل اليومي القائم (v2 → v3 بنفس أسلوب safety_cash)
create or replace function public.staff_checkin_nudges()
returns void
language plpgsql security definer set search_path = public as $$
declare c record; it jsonb;
begin
  for c in select sc.*, p.full_name, p.email from public.staff_checklists sc
           join public.profiles p on p.id = sc.profile_id
           where sc.kind = 'onboarding' and sc.status = 'open' loop
    for it in select * from jsonb_array_elements(c.items) loop
      if (it->>'due_days') is not null and coalesce((it->>'done')::boolean, false) = false
         and c.created_at::date + (it->>'due_days')::int = current_date then
        perform public.notify_team('staff_checkin', 'staff_checkin',
          jsonb_build_object('days', it->>'due_days',
            'name', coalesce(c.full_name, c.email)),
          null, 'checkin:' || c.profile_id || ':' || (it->>'due_days'));
      end if;
    end loop;
  end loop;
end;
$$;

create or replace function public.run_daily_jobs_v3()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v2();
  perform public.staff_checkin_nudges();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v3()$$);

-- =============================================================================
-- ٢) صحة العملاء (docs/05 B11.6) — أسبوعية، تغذي المؤشرات ولوحة العملاء
-- =============================================================================

create table public.client_health (
  client_id uuid not null references public.clients (id) on delete cascade,
  week_start date not null,
  score int not null check (score between 0 and 100),
  band text not null check (band in ('green', 'amber', 'red')),
  components jsonb not null default '{}',
  computed_at timestamptz not null default now(),
  primary key (client_id, week_start)
);

comment on table public.client_health is
  'مؤشر خطر الفقد المبكر: سرعة الاعتماد + انضباط الدفع + التفاعل + رضا CSAT — يُحسب أحداً مع المؤشرات. للفريق فقط، لا يظهر للعميل أبداً.';

alter table public.client_health enable row level security;
grant select, insert, update, delete on public.client_health to authenticated, service_role;
create policy "client health: team reads" on public.client_health
  for select to authenticated using (public.is_team());

create or replace function public.compute_client_health()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_week date := date_trunc('week', now())::date;
  c record;
  s_approvals numeric; s_payments numeric; s_engagement numeric; s_csat numeric;
  v_lag numeric; v_overdue numeric; v_billed numeric; v_last timestamptz; v_days int;
  v_score int; v_band text; v_parts jsonb;
begin
  for c in select id, created_at from public.clients where status = 'active' loop
    -- سرعة الاعتماد: متوسط ساعات البت آخر ٩٠ يوماً (فوري=100، ≥١٤ يوماً=0)
    select avg(extract(epoch from decided_at - created_at) / 3600) into v_lag
      from public.approvals
      where client_id = c.id and decided_at is not null
        and created_at > now() - interval '90 days';
    s_approvals := case when v_lag is null then null
      else greatest(0, least(100, round(100 - (v_lag / 336.0) * 100))) end;

    -- انضباط الدفع: نسبة المتأخر من إجمالي المفوتر (لا متأخر=100)
    select coalesce(sum(d.total - coalesce(p.paid, 0)) filter
             (where d.valid_until < current_date and d.total > coalesce(p.paid, 0)), 0),
           coalesce(sum(d.total), 0)
      into v_overdue, v_billed
      from public.documents d
      left join (select invoice_id, sum(amount) paid from public.payments group by 1) p
        on p.invoice_id = d.id
      where d.client_id = c.id and d.type = 'invoice'
        and d.status in ('sent', 'signed', 'active');
    s_payments := case when v_billed = 0 then null
      else greatest(0, round(100 - (v_overdue / v_billed) * 100)) end;

    -- التفاعل: أيام منذ آخر أثر للعميل في البوابة (رسائل/دعم/اعتماد/نموذج)
    select greatest(
      (select max(ms.created_at) from public.messages ms where ms.client_id = c.id),
      (select max(sm.created_at) from public.support_messages sm
         join public.support_threads st on st.id = sm.thread_id
         where st.client_id = c.id),
      (select max(ap.decided_at) from public.approvals ap where ap.client_id = c.id),
      (select max(fr.created_at) from public.form_responses fr
         join public.form_requests r on r.id = fr.request_id
         where r.client_id = c.id)
    ) into v_last;
    -- بلا أي أثر: نقيس من عمر العميل نفسه — الجديد لا يُعاقب، والصامت طويلاً يحمرّ
    v_days := coalesce(extract(day from now() - v_last)::int,
                       extract(day from now() - c.created_at)::int);
    s_engagement := greatest(0, least(100, 100 - (v_days - 7) * 4)); -- أسبوع سماح ثم −٤/يوم

    -- رضا CSAT: آخر تقييم (ممتاز=100 … دون المتوقع=0)
    select case fr.answers->>'satisfaction'
        when 'ممتاز — فاق التوقعات' then 100 when 'جيد جداً' then 80
        when 'جيد' then 60 when 'مقبول' then 40 when 'دون المتوقع' then 10
        else null end
      into s_csat
      from public.form_responses fr
      join public.form_requests r on r.id = fr.request_id
      join public.forms f on f.id = r.form_id
      where r.client_id = c.id and f.system_key = 'csat'
      order by fr.created_at desc limit 1;

    -- المتوسط على المتوافر فقط — عميل جديد بلا فواتير لا يُعاقب
    select round(avg(x)) into v_score from unnest(array[
      s_approvals, s_payments, s_engagement, s_csat]) x where x is not null;
    v_score := coalesce(v_score, 50);
    v_band := case when v_score >= 75 then 'green'
                   when v_score >= 50 then 'amber' else 'red' end;
    v_parts := jsonb_strip_nulls(jsonb_build_object(
      'approvals', s_approvals, 'payments', s_payments,
      'engagement', s_engagement, 'csat', s_csat));

    insert into public.client_health (client_id, week_start, score, band, components)
    values (c.id, v_week, v_score, v_band, v_parts)
    on conflict (client_id, week_start)
      do update set score = excluded.score, band = excluded.band,
                    components = excluded.components, computed_at = now();
  end loop;
end;
$$;

insert into public.scorecard_metrics (key, name_ar, seat_id, direction, green_threshold, source, sort) values
  ('client_health_avg', 'متوسط صحة العملاء',
    (select id from public.seats where name_en = 'Delivery'), 'up', 75, 'auto', 20)
on conflict do nothing;

-- =============================================================================
-- ٣) المؤشرات + الملخص v2: صحة العملاء تُحسب أولاً، والملخص يضم الصخور
--    وأهم القضايا، مع نص خالٍ من HTML يصلح لواتساب (docs/09 §B11.11)
-- =============================================================================

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
  v_q text := to_char(now(), 'YYYY') || '-Q' || to_char(now(), 'Q');
  v_rocks text;
  v_issues text;
begin
  perform public.compute_client_health();

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
      when 'client_health_avg' then
        (select coalesce(round(avg(score)), 0) from public.client_health
          where week_start = v_week)
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
      v_red_list := v_red_list || E'\n• ' || m.name_ar || ': ' || v::text;
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

  -- سطر الصخور: عدّ حالات ربع السنة الحالي
  select 'الصخور: ' || count(*) filter (where status = 'on_track') || ' على المسار · '
         || count(*) filter (where status = 'off_track') || ' متعثرة · '
         || count(*) filter (where status = 'done') || ' منجزة'
    into v_rocks from public.rocks where quarter = v_q;
  if v_rocks is null or v_rocks = '' then v_rocks := 'الصخور: لا صخور لهذا الربع بعد'; end if;

  -- أهم ٣ قضايا مفتوحة بالأولوية
  select string_agg(E'\n• ' || title, '' order by priority desc, created_at)
    into v_issues from (
      select title, priority, created_at from public.issues
      where status in ('identified', 'discussing')
      order by priority desc, created_at limit 3) t;
  v_issues := coalesce('أهم القضايا المفتوحة:' || v_issues, 'لا قضايا مفتوحة 🎉');

  -- Sunday digest to admins (docs/10 Part 3), email queued if key exists
  perform public.notify_team('scorecard_digest', 'scorecard_digest',
    jsonb_build_object('greens', v_greens::text, 'reds', v_reds::text,
      'red_list', v_red_list,
      'red_list_html', replace(v_red_list, E'\n', '<br>'),
      'rocks_line', v_rocks, 'issues_line', v_issues,
      'issues_html', replace(v_issues, E'\n', '<br>')),
    null, 'digest:' || v_week);
end;
$$;

-- الملخص الأسبوعي: الشركة في رسالة واحدة — نص عادي (inapp/واتساب) وHTML للبريد
update public.notification_templates set
  body = E'النتائج الأسبوعية: {{greens}} أخضر · {{reds}} أحمر{{red_list}}\n{{rocks_line}}\n{{issues_line}}'
  where key = 'scorecard_digest' and channel = 'inapp';
update public.notification_templates set
  body = 'صباح الخير،<br><br>نتائج الأسبوع: <b>{{greens}} أخضر · {{reds}} أحمر</b>{{red_list_html}}<br><br>{{rocks_line}}<br><br>{{issues_html}}<br><br>التفاصيل في نظام التشغيل → النتائج.'
  where key = 'scorecard_digest' and channel = 'email';

-- =============================================================================
-- ٤) دليل النظام — التوثيق يُشحن مع الميزة (قرار المالك 2026-08-08)
-- =============================================================================

insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل النظام: بوابة الموظف — التعيين والمغادرة',
  E'## عند تعيين عضو فريق جديد\nبمجرد دعوته من «الفريق» وقبوله الدعوة يعمل النظام تلقائياً:\n\n- تُنشأ **قائمة تجهيز** بحسب دوره (بريد، أدوات، كتيبات، إقرار السلوك المهني) تظهر في «الفريق» لمدير النظام وفي «ملفي الشخصي» للعضو نفسه.\n- يصله **ترحيب** داخل النظام وبريد يحوي ركائز دوره وخطة أسبوعه الأول.\n- تُجدول **جلسات متابعة ٣٠/٦٠/٩٠ يوماً** — يذكّر النظام الإدارة في موعدها.\n\n## توقيع البريد الموحد\nمن «ملفي الشخصي» يولّد كل عضو توقيع بريد HTML بهوية AGMA (الاسم، الدور، الجوال) مع تعليمات التركيب لكل برنامج بريد — هوية واحدة، لا توقيعات عشوائية.\n\n## العهد\nمدير النظام يسجل العهد (جهاز، أداة) على العضو من «الفريق»، ويقفلها عند الإرجاع.\n\n## عند المغادرة\nتعطيل الحساب ينشئ تلقائياً **قائمة مغادرة**: سحب الصلاحيات وتدوير كلمات المرور المشتركة، استلام العهد، مستند التسليم، ومقابلة المغادرة. لا يكتمل الملف إلا بإقفالها كلها.',
  'دليل النظام', 'internal', true
),
(
  'دليل النظام: التحليلات وصحة العملاء والملخص الأسبوعي',
  E'## صحة العملاء\nكل أسبوع يحسب النظام لكل عميل نشط درجة من ١٠٠ من أربعة مكونات: سرعة اعتماد التسليمات، انضباط سداد الفواتير، تفاعله مع البوابة، وآخر تقييم رضا CSAT. النطاقات: أخضر ≥٧٥، أصفر ≥٥٠، أحمر أقل. الأحمر يعني خطر فقد مبكر — تحرك قبل أن يتصل هو.\n\nالدرجات تظهر في تبويب **«التحليلات»** ومتوسطها مؤشر أسبوعي في لوحة النتائج. هذه المعلومة داخلية بحتة ولا تظهر للعميل أبداً.\n\n## لوحة التحليلات\nتبويب «التحليلات» يجمع: النقد المحصل شهرياً، قيمة مسار المبيعات، صحة العملاء بالنطاقات، وأحمال الفريق — الأرقام تُقرأ من مصادرها مباشرة فلا تتعارض مع أي شاشة أخرى.\n\n## الملخص الأسبوعي\nالأحد ٧ صباحاً يصل الإدارة ملخص: المؤشرات (الأحمر أولاً)، حالة صخور الربع، وأهم ٣ قضايا مفتوحة — داخل النظام وبالبريد، وعبر واتساب فور تفعيل مزود الإرسال. مؤشر أحمر أسبوعين متتاليين يفتح قضية تلقائياً في IDS.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

-- المرحلة ١١ — إقفال الديون المؤجلة (2026-09-04): أتمتة دورات المشاريع
-- الدورية (مؤجلة منذ 3.5C)، وإكمال وعد الإجازات من المرحلة ١٠.
-- المشروع الدوري (سوشال/سيو/أداء/علاقات) يفتح دورته الجديدة بنفسه:
-- سبرنت مرقّم + مهام مراحل التشغيل من الكتيب — بلا صفحة بيضاء كل شهر.

-- =============================================================================
-- ١) إيقاع الدورة على المشروع — NULL = الأتمتة متوقفة (آمن للمشاريع القائمة)
-- =============================================================================
alter table public.projects
  add column if not exists cycle_weeks int
    check (cycle_weeks is null or cycle_weeks in (1, 2, 4)),
  add column if not exists next_cycle_on date;

comment on column public.projects.cycle_weeks is
  'إيقاع الدورة للمشاريع الدورية: ١/٢/٤ أسابيع — NULL يعطل الفتح الآلي. يُضبط من بطاقة المشروع.';

-- فتح دورة واحدة: سبرنت جديد + استنساخ مهام مراحل التشغيل (توليد/تسويق/تكيّف)
create or replace function public.open_project_cycle(p_project uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_proj public.projects%rowtype;
  v_weeks int;
  v_sprint uuid;
  v_num int;
  v_start date := current_date;
  v_end date;
  v_tpl record;
  v_due date;
  v_count int := 0;
begin
  select * into v_proj from public.projects where id = p_project;
  if v_proj.id is null then raise exception 'مشروع غير موجود'; end if;
  if v_proj.mode <> 'recurring' then
    raise exception 'الدورات للمشاريع الدورية فقط — هذا مشروع مراحل';
  end if;
  v_weeks := coalesce(v_proj.cycle_weeks, 4);
  v_end := v_start + v_weeks * 7 - 1;

  select coalesce(max(number), 0) + 1 into v_num
    from public.sprints where project_id = p_project;
  insert into public.sprints (project_id, number, starts_on, ends_on, goal)
  values (p_project, v_num, v_start, v_end,
          'دورة ' || v_num || ' — ' || to_char(v_start, 'YYYY-MM-DD'))
  returning id into v_sprint;

  -- مهام التشغيل المتكررة: مراحل التوليد والتسويق والتكيّف من كتيب المشروع
  -- (التحليل يحدث مرة عند التأسيس ولا يتكرر كل دورة)
  v_due := v_start;
  for v_tpl in
    select t.*, s.id as sid from public.task_templates t
    join public.playbook_stages s on s.id = t.stage_id
    where s.playbook_id = v_proj.playbook_id
      and s.method_phase in ('generate', 'market', 'adapt')
    order by s.sort, t.sort
  loop
    v_due := least(v_due + make_interval(days => v_tpl.default_days), v_end)::date;
    insert into public.tasks
      (project_id, sprint_id, stage_id, template_id, title, due,
       needs_client_approval, sort)
    values
      (p_project, v_sprint, v_tpl.sid, v_tpl.id,
       v_tpl.title_ar || ' — دورة ' || v_num, v_due,
       v_tpl.needs_client_approval, v_tpl.sort);
    v_count := v_count + 1;
  end loop;

  update public.projects
    set next_cycle_on = v_start + v_weeks * 7
    where id = p_project;

  perform public.notify_team('cycle_opened', 'cycle_opened',
    jsonb_build_object('project', v_proj.name, 'num', v_num::text,
      'tasks', v_count::text),
    v_proj.client_id, 'cycle:' || p_project || ':' || v_num);

  return v_sprint;
end;
$$;

-- الاستدعاء اليدوي «افتح دورة الآن» للفريق القيادي
create or replace function public.open_cycle_now(p_project uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_strategist_plus() then
    raise exception 'فتح الدورات لمدير العمليات فأعلى';
  end if;
  return public.open_project_cycle(p_project);
end;
$$;
grant execute on function public.open_cycle_now to authenticated;
revoke execute on function public.open_project_cycle from public, anon, authenticated;

-- الفتح الآلي اليومي: كل مشروع دوري نشط استحقت دورته
create or replace function public.cycle_rollover()
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.projects
           where mode = 'recurring' and status = 'active'
             and cycle_weeks is not null
             and next_cycle_on is not null
             and next_cycle_on <= current_date loop
    perform public.open_project_cycle(r.id);
  end loop;
end;
$$;

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('cycle_opened', 'inapp', 'ar', null,
   'فُتحت الدورة {{num}} لمشروع «{{project}}» — {{tasks}} مهمة تشغيل جديدة جاهزة في المشروع')
on conflict do nothing;

create or replace function public.run_daily_jobs_v5()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v4();
  perform public.cycle_rollover();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v5()$$);

-- =============================================================================
-- ٢) استيراد CSV: مصدر صادق للعملاء المحتملين المستوردين من جداول قديمة
-- =============================================================================
alter type public.lead_source add value if not exists 'import';

-- =============================================================================
-- ٣) دليل النظام — مع الشحنة
-- =============================================================================
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل الدورات والإجازات والاستيراد',
  E'## دورات المشاريع الدورية\nالمشروع الدوري (سوشال، سيو، أداء، علاقات عامة) يفتح دورته الجديدة تلقائياً: من بطاقة المشروع فعّل الإيقاع (أسبوع/أسبوعين/شهر) — وكل استحقاق يُنشئ النظام سبرنتاً مرقّماً بمهام مراحل التشغيل من الكتيب (التوليد والتسويق والتكيّف — التحليل يحدث مرة عند التأسيس فقط) مع إشعار للفريق. وزر «افتح دورة الآن» لفتح فوري خارج الجدول (مدير العمليات فأعلى).\n\n## الإجازات\nمن «الفريق ← الإجازات»: كل عضو يسجل إجازته بنفسه (سنوية/مرضية/بلا راتب/أخرى) ومدير النظام يعدل ويحذف. من في إجازة اليوم يظهر بشارة «في إجازة» على صفه — فيعرف الجميع من غائب قبل الإسناد.\n\n## استيراد CSV\nمن المسار: زر «استيراد CSV» يستقبل ملف عملاء محتملين (عمود name إلزامي + company وvalue اختياريان)، ومن العملاء ملف عملاء (عمود company إلزامي + city). معاينة قبل الإدخال، والمكرر بالاسم يُتخطى — للانتقال من جداولك القديمة بدقائق.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

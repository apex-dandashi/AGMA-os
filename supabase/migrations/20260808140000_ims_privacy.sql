-- docs/15 — نواة IMS الجزء ب: طبقة PDPL التشغيلية + سجل AI + تنبيهات v6
--
--   processing_activities  سجل أنشطة المعالجة (ROPA) بالحد الأدنى النظامي
--   data_subject_requests  طلبات أصحاب البيانات: مهلة ٣٠ يوماً آلية + تمديد ٣٠
--   privacy_breaches       تسريب البيانات: عداد ٧٢ ساعة من العلم + تصعيد فوري
--   ai_systems             سجل أنظمة الذكاء الاصطناعي (أجما AI-Native — من اليوم)
--   run_daily_jobs_v6      مهل DSAR وساعة التسريب واستحقاق الالتزامات
--                          وانتهاء الأدلة ومواعيد مراجعة الضوابط

-- ---------------------------------------------------------------------------
-- 1. سجل أنشطة المعالجة (ROPA)
-- ---------------------------------------------------------------------------
create type public.pdpl_legal_basis as enum
  ('consent', 'contract', 'legal_obligation', 'vital_interest',
   'public_interest', 'legitimate_interest');

create table public.processing_activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  agma_role text not null default 'controller'
    check (agma_role in ('controller', 'processor', 'joint')),
  purpose text not null,
  legal_basis public.pdpl_legal_basis not null,
  data_subjects text,
  data_categories text,
  sensitive_data boolean not null default false,
  systems text,
  storage_location text,
  recipients text,
  processors text,
  cross_border boolean not null default false,
  cross_border_note text,
  retention text,
  security_measures text,
  dpia_required boolean not null default false,
  dpia_note text,
  status text not null default 'active'
    check (status in ('active', 'ended')),
  ended_on date,
  last_review_on date,
  next_review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.processing_activities is
  'ROPA — اللائحة: سجل مكتوب محدث طوال المعالجة و٥ سنوات بعد انتهائها؛ لا يُحذف نشاط منتهٍ، يُعلَّم ended';

-- DPIA يتحدد آلياً من المؤشرات لا من رأي الموظف وحده
create or replace function public.ropa_dpia_trigger()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.sensitive_data or new.cross_border then
    new.dpia_required := true;
    new.dpia_note := coalesce(new.dpia_note,
      'وجوب آلي: بيانات حساسة أو نقل خارجي — يلزم تقييم أثر موثق قبل التشغيل');
  end if;
  return new;
end;
$$;

create trigger processing_activities_dpia
  before insert or update on public.processing_activities
  for each row execute function public.ropa_dpia_trigger();

-- ---------------------------------------------------------------------------
-- 2. طلبات أصحاب البيانات (DSAR)
-- ---------------------------------------------------------------------------
create type public.dsar_kind as enum
  ('access', 'copy', 'correction', 'destruction',
   'consent_withdrawal', 'complaint', 'other');
create type public.dsar_status as enum
  ('received', 'identity_verification', 'in_progress', 'responded', 'closed', 'rejected');

create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  kind public.dsar_kind not null,
  subject_name text not null,
  contact text,
  channel text,
  details text,
  client_id uuid references public.clients (id),
  received_at timestamptz not null default now(),
  statutory_due_on date not null default current_date + 30,  -- يضبطها المشغل من received_at
  identity_verified_at timestamptz,
  extended boolean not null default false,
  extended_due_on date,
  extension_reason text,
  subject_notified_of_extension_at timestamptz,
  status public.dsar_status not null default 'received',
  response_summary text,
  responded_at timestamptz,
  owner uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- المهلة النظامية ٣٠ يوماً من الاستلام (بتوقيت الرياض) — تُحسب آلياً ولا تُدخل يدوياً
create or replace function public.dsar_set_deadline()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.statutory_due_on := (new.received_at at time zone 'Asia/Riyadh')::date + 30;
  return new;
end;
$$;

create trigger dsar_set_deadline
  before insert on public.data_subject_requests
  for each row execute function public.dsar_set_deadline();

-- التمديد ٣٠ يوماً كحد أقصى وبمسوغ مكتوب وإبلاغ صاحب البيانات
create or replace function public.dsar_extension_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.extended and not old.extended then
    if coalesce(trim(new.extension_reason), '') = '' then
      raise exception 'التمديد يتطلب مسوغاً مكتوباً وإبلاغ صاحب البيانات قبل انتهاء المهلة الأصلية';
    end if;
    new.extended_due_on := coalesce(new.extended_due_on, new.statutory_due_on + 30);
    if new.extended_due_on > new.statutory_due_on + 30 then
      raise exception 'التمديد النظامي ٣٠ يوماً إضافية كحد أقصى';
    end if;
  end if;
  if new.status in ('responded', 'closed') and old.status not in ('responded', 'closed') then
    new.responded_at := coalesce(new.responded_at, now());
  end if;
  return new;
end;
$$;

create trigger dsar_extension_guard
  before update on public.data_subject_requests
  for each row execute function public.dsar_extension_guard();

-- ---------------------------------------------------------------------------
-- 3. تسريب البيانات الشخصية (منفصل عن الحادث الأمني ومرتبط به)
-- ---------------------------------------------------------------------------
create table public.privacy_breaches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  nonconformity_id uuid references public.nonconformities (id),
  aware_at timestamptz not null default now(),
  authority_deadline_at timestamptz not null default now() + interval '72 hours',
  data_categories text,
  subjects_estimate int,
  sensitive_data boolean not null default false,
  harm_likely boolean,
  containment text,
  risk_assessment text,
  authority_notification_required boolean,
  authority_notified_at timestamptz,
  subjects_notification_required boolean,
  subjects_notified_at timestamptz,
  corrective_actions text,
  status text not null default 'open'
    check (status in ('open', 'assessed', 'notified', 'closed')),
  owner uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.privacy_breaches.authority_deadline_at is
  'اللائحة: إشعار الجهة خلال ٧٢ ساعة من العلم عند احتمال الضرر — يُحسب آلياً من aware_at';

-- المهلة تُحسب من لحظة العلم دائماً (حتى عند تسجيل الحادث متأخراً أو تصحيح aware_at)
create or replace function public.breach_set_deadline()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.authority_deadline_at := new.aware_at + interval '72 hours';
  return new;
end;
$$;

create trigger privacy_breaches_deadline
  before insert or update of aware_at on public.privacy_breaches
  for each row execute function public.breach_set_deadline();

-- ---------------------------------------------------------------------------
-- 4. سجل أنظمة الذكاء الاصطناعي
-- ---------------------------------------------------------------------------
create table public.ai_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  model text,
  purpose text,
  internal_or_external text not null default 'external'
    check (internal_or_external in ('internal', 'external')),
  personal_data boolean not null default false,
  client_confidential boolean not null default false,
  automated_decision boolean not null default false,
  human_review boolean not null default true,
  cross_border boolean not null default true,
  approved boolean not null default false,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  risk_note text,
  prohibited_uses text,
  last_review_on date,
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- الاعتماد قرار شريك ويُختم باسمه
create or replace function public.ai_approval_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not old.approved then
    if not public.is_admin() then
      raise exception 'اعتماد نظام ذكاء اصطناعي جديد قرارُ شريك — خاصة إن لمس بيانات شخصية أو سرية عميل';
    end if;
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;
  return new;
end;
$$;

create trigger ai_systems_approval_guard
  before update on public.ai_systems
  for each row execute function public.ai_approval_guard();

-- ---------------------------------------------------------------------------
-- 5. RLS + منح + تدقيق — الخصوصية أضيق: إدارتها للشريك والخصوصية والقانوني
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'processing_activities', 'data_subject_requests', 'privacy_breaches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
    execute format(
      'create policy "%s: privacy leads manage" on public.%I for all to authenticated
         using (public.is_admin() or public.app_role() in (''dpo'', ''legal''))
         with check (public.is_admin() or public.app_role() in (''dpo'', ''legal''))', t, t);
    execute format(
      'create policy "%s: governance reads" on public.%I for select to authenticated
         using (public.is_strategist_plus() or public.app_role() in (''dpo'', ''auditor''))', t, t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()', t, t);
    execute format(
      'create trigger %I_updated before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.ai_systems enable row level security;
grant select, insert, update, delete on public.ai_systems to authenticated, service_role;
create policy "ai_systems: strategist+ manages" on public.ai_systems
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "ai_systems: team reads" on public.ai_systems
  for select to authenticated using (public.is_team());
create trigger ai_systems_audit after insert or update or delete on public.ai_systems
  for each row execute function public.audit_trigger();
create trigger ai_systems_updated before update on public.ai_systems
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. الإشعارات: تسريبٌ جديد يصعّد فوراً للشريك ومسؤول الخصوصية والقانوني
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('privacy_breach_opened', 'inapp', 'ar', null,
   'تسريب بيانات «{{title}}» — ساعة الـ٧٢ تعمل: الموعد النظامي {{deadline}}. قيّم الضرر وقرر الإشعار.', true),
  ('privacy_breach_clock', 'inapp', 'ar', null,
   'تذكير تسريب «{{title}}»: بقي {{hours}} ساعة على مهلة إشعار الجهة — لم يُسجل قرار بعد.', true),
  ('dsar_deadline', 'inapp', 'ar', null,
   'طلب صاحب بيانات ({{kind}}) من «{{subject}}»: بقي {{days}} يوماً على المهلة النظامية.', true),
  ('dsar_overdue', 'inapp', 'ar', null,
   'تجاوز نظامي: طلب «{{subject}}» تخطى مهلته! عالجه فوراً ووثق سبب التأخر.', true),
  ('obligation_due', 'inapp', 'ar', null,
   'التزام تنظيمي مستحق خلال {{days}} يوماً: {{law}} — {{summary}}', true),
  ('control_review_due', 'inapp', 'ar', null,
   'ضابط «{{title}}» ({{ref}}) حان موعد مراجعته — حدّث الحالة والدليل.', true)
on conflict do nothing;

create or replace function public.notify_governance(
  p_event text, p_template text, p_payload jsonb, p_dedupe_prefix text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.profiles
    where role in ('admin', 'dpo', 'legal') and active
  loop
    perform public.enqueue_notification(
      p_event, 'inapp', p_template, p_payload, r.id, null, null, now(),
      case when p_dedupe_prefix is null then null
           else p_dedupe_prefix || ':' || r.id end);
  end loop;
end;
$$;

create or replace function public.on_privacy_breach_opened()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_governance('privacy_breach', 'privacy_breach_opened',
    jsonb_build_object('title', new.title,
      'deadline', to_char(new.authority_deadline_at at time zone 'Asia/Riyadh',
                          'YYYY-MM-DD HH24:MI')),
    'breach-open:' || new.id);
  return new;
end;
$$;

create trigger privacy_breaches_notify
  after insert on public.privacy_breaches
  for each row execute function public.on_privacy_breach_opened();

-- ---------------------------------------------------------------------------
-- 7. المهام اليومية v6
-- ---------------------------------------------------------------------------
create or replace function public.run_ims_alerts()
returns void
language plpgsql security definer set search_path = public as $$
declare r record; v_days int; v_hours int;
begin
  -- DSAR: تنبيه عند 15 و7 و3 و1 يوماً متبقياً، وتجاوز
  for r in select * from public.data_subject_requests
    where status not in ('responded', 'closed', 'rejected')
  loop
    v_days := coalesce(r.extended_due_on, r.statutory_due_on) - current_date;
    if v_days in (15, 7, 3, 1) then
      perform public.notify_governance('dsar', 'dsar_deadline',
        jsonb_build_object('kind', r.kind::text, 'subject', r.subject_name,
                           'days', v_days::text),
        'dsar-d' || v_days || ':' || r.id);
    elsif v_days < 0 then
      perform public.notify_governance('dsar', 'dsar_overdue',
        jsonb_build_object('subject', r.subject_name),
        'dsar-over:' || r.id || ':' || current_date);
    end if;
  end loop;

  -- ساعة التسريب: ما دام مفتوحاً بلا قرار إشعار
  for r in select * from public.privacy_breaches
    where status = 'open' and authority_notified_at is null
  loop
    v_hours := greatest(0, (extract(epoch from (r.authority_deadline_at - now())) / 3600)::int);
    perform public.notify_governance('privacy_breach', 'privacy_breach_clock',
      jsonb_build_object('title', r.title, 'hours', v_hours::text),
      'breach-clock:' || r.id || ':' || current_date);
  end loop;

  -- الالتزامات المستحقة خلال ٣٠ يوماً
  for r in select * from public.legal_obligations
    where applicable and status <> 'met'
      and next_due_on is not null
      and next_due_on - current_date in (30, 7)
  loop
    perform public.notify_governance('obligation', 'obligation_due',
      jsonb_build_object('days', (r.next_due_on - current_date)::text,
                         'law', r.law, 'summary', r.summary_ar),
      'oblig:' || r.id || ':' || r.next_due_on);
  end loop;

  -- الضوابط: حان موعد المراجعة أو انتهت صلاحية دليلها
  update public.ims_controls c set status = 'review_required'
   where c.applicable and c.status = 'implemented'
     and c.next_review_on is not null and c.next_review_on <= current_date;

  for r in select c.* from public.ims_controls c
    where c.applicable and c.next_review_on = current_date + 14
  loop
    perform public.notify_governance('control', 'control_review_due',
      jsonb_build_object('title', r.title_ar, 'ref', r.ref_code),
      'ctrl-rev:' || r.id || ':' || r.next_review_on);
  end loop;
end;
$$;

create or replace function public.run_daily_jobs_v6()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v5();
  perform public.run_ims_alerts();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v6()$$);

-- ---------------------------------------------------------------------------
-- 8. بذور: أنظمة AI المستخدمة فعلاً + أول أنشطة المعالجة
-- ---------------------------------------------------------------------------
insert into public.ai_systems
  (name, provider, model, purpose, personal_data, client_confidential,
   human_review, risk_note) values
  ('Claude (تشغيل النظام والتطوير)', 'Anthropic', 'Claude',
   'تطوير المنصة وأتمتة العمليات الداخلية', false, false, true,
   'لا تُدخل بيانات عملاء شخصية في المحادثات؛ الأسرار في Vault لا في السياق'),
  ('نماذج توليد المحتوى', 'متعدد', null,
   'مسودات محتوى تسويقي للعملاء', false, true, true,
   'مراجعة بشرية إلزامية قبل أي نشر؛ سرية موجزات العملاء'),
  ('أتمتة سير العمل', 'داخلي + مزودون', null,
   'تشغيل آلي للمهام والتنبيهات داخل AGMA OS', true, false, true,
   'بيانات التشغيل تشمل أسماء جهات الاتصال — ضمن ROPA');

insert into public.processing_activities
  (name, purpose, legal_basis, data_subjects, data_categories,
   systems, storage_location, retention, security_measures, next_review_on) values
  ('إدارة علاقات العملاء (CRM)',
   'إدارة العملاء المحتملين والحاليين وتنفيذ العقود',
   'contract', 'ممثلو العملاء وجهات الاتصال',
   'الاسم، الجوال، البريد، المسمى، سجل التواصل',
   'AGMA OS (Supabase)', 'سحابة Supabase — ap-south-1',
   'طوال العلاقة + ٥ سنوات للمستندات المالية',
   'RLS بالأدوار + MFA + تشفير نقل وتخزين + سجل تدقيق', current_date + 365),
  ('الفوترة والتحصيل',
   'إصدار الفواتير والمتابعة والتحصيل وفق المتطلبات الضريبية',
   'legal_obligation', 'ممثلو العملاء',
   'بيانات الفوترة، السجل التجاري، الرقم الضريبي',
   'AGMA OS', 'سحابة Supabase',
   'المتطلب الضريبي (سنوات) — لا حذف قبل انقضائه',
   'قيود المُفوتر + جمود المستندات + تدقيق', current_date + 365),
  ('نموذج تواصل الموقع',
   'استقبال طلبات العملاء المحتملين من agma.com.sa',
   'consent', 'زوار الموقع المتواصلون',
   'الاسم، الجوال، البريد، نص الطلب',
   'الموقع ← AGMA OS (lead-intake)', 'سحابة Supabase',
   'حتى انتفاء الغرض أو طلب الحذف',
   'تحقق مدخلات + حد معدل + RLS', current_date + 365);

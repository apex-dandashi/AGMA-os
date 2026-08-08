-- docs/16 — الطبقة العامة: صوت العميل (شكاوى + تقييم) والتوظيف.
--
--   complaints           حالة رسمية برقم CMP + مسار + SLA + تصعيد آلي
--   feedback_entries     تقييم خفيف (يجوز مجهولاً — تقليل بيانات)
--   career_departments   أقسام أجما الثمانية + الدعم
--   career_roles         كتالوج الأدوار (يعرض عاماً المنشور فقط)
--   career_jobs          الوظائف — بوابة نشر تفرض ضوابط وزارة الموارد
--   career_applications  الطلبات وشبكة المواهب (بلا حقول تمييزية)
--
-- الكتابة العامة عبر edge function بخدمة service_role حصراً؛ الجمهور يقرأ
-- الوظائف المنشورة فقط.

-- ---------------------------------------------------------------------------
-- 1. الشكاوى
-- ---------------------------------------------------------------------------
create type public.complaint_status as enum
  ('received', 'triage', 'assigned', 'in_progress', 'waiting_customer',
   'resolution_proposed', 'resolved', 'closed', 'duplicate', 'withdrawn');

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  complainant_type text not null default 'client'
    check (complainant_type in ('client', 'prospect', 'supplier', 'partner', 'visitor', 'other')),
  name text,
  email text,
  phone text,
  organization text,
  is_current_client boolean,
  client_id uuid references public.clients (id),
  category text not null,
  subject text not null,
  description text not null,
  incident_date date,
  channel text,
  desired_resolution text,
  confidential_flag boolean not null default false,
  severity text not null default 'normal' check (severity in ('normal', 'high', 'critical')),
  status public.complaint_status not null default 'received',
  assigned_to uuid references public.profiles (id),
  first_response_due_at timestamptz,
  first_response_at timestamptz,
  resolution_due_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  root_cause text,
  resolution text,
  privacy_incident_flag boolean not null default false,
  security_incident_flag boolean not null default false,
  linked_breach_id uuid references public.privacy_breaches (id),
  linked_ncr_id uuid references public.nonconformities (id),
  privacy_notice_version text not null default 'v1',
  source_page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.complaints is
  'docs/16: شكوى = حالة رسمية برقم ومسار وSLA داخلي (سياسة خدمة، لا وعد نظامي). الملاحظات الخفيفة في feedback_entries.';

-- عدّاد الرقم المرجعي CMP-2026-00001
insert into public.document_counters (prefix, next_number) values ('CMP', 1)
on conflict (prefix) do nothing;

create or replace function public.next_complaint_reference()
returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.document_counters set next_number = next_number + 1
   where prefix = 'CMP' returning next_number - 1 into n;
  return 'CMP-' || to_char(now() at time zone 'Asia/Riyadh', 'YYYY')
         || '-' || lpad(n::text, 5, '0');
end;
$$;

-- SLA الافتراضي: رد بشري أول خلال يوم عمل، حل خلال ٥ — قابلة للتعديل لكل حالة
create or replace function public.complaint_defaults()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.public_reference is null or new.public_reference = '' then
    new.public_reference := public.next_complaint_reference();
  end if;
  new.first_response_due_at := coalesce(new.first_response_due_at, now() + interval '1 day');
  new.resolution_due_at := coalesce(new.resolution_due_at, now() + interval '5 days');
  -- تصنيف الخصوصية/الأمن يرفع الأعلام
  if new.category in ('privacy', 'الخصوصية والبيانات الشخصية') then
    new.privacy_incident_flag := true;
    new.severity := 'critical';
  elsif new.category in ('security', 'الأمن السيبراني') then
    new.security_incident_flag := true;
    new.severity := 'high';
  end if;
  return new;
end;
$$;

create trigger complaints_defaults
  before insert on public.complaints
  for each row execute function public.complaint_defaults();

-- التصعيد الآلي بعد الإدراج: تسريب مرتبط (ساعة الـ٧٢) أو عدم مطابقة أمني +
-- إشعار الحوكمة دائماً
create or replace function public.complaint_escalations()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if new.privacy_incident_flag then
    insert into public.privacy_breaches (title, data_categories, containment)
    values ('بلاغ خصوصية عبر الموقع: ' || new.subject,
            'حسب وصف البلاغ ' || new.public_reference,
            'قيد التقييم — فُتح آلياً من شكوى عامة')
    returning id into v_id;
    update public.complaints set linked_breach_id = v_id where id = new.id;
  elsif new.security_incident_flag then
    insert into public.nonconformities (source, title, severity, description)
    values ('incident', 'بلاغ أمني عبر الموقع: ' || new.subject, 'major',
            'المرجع ' || new.public_reference || ' — ' || left(new.description, 500))
    returning id into v_id;
    update public.complaints set linked_ncr_id = v_id where id = new.id;
  end if;

  perform public.notify_team('complaint', 'complaint_received',
    jsonb_build_object('ref', new.public_reference, 'category', new.category,
                       'subject', new.subject),
    null, 'cmp:' || new.id);
  return new;
end;
$$;

create trigger complaints_escalations
  after insert on public.complaints
  for each row execute function public.complaint_escalations();

-- ---------------------------------------------------------------------------
-- 2. التقييم الخفيف
-- ---------------------------------------------------------------------------
create table public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  rating int not null check (rating between 1 and 5),
  aspect text,
  positive_comment text,
  improvement_comment text,
  contact_permission boolean not null default false,
  name text,
  email text,
  client_id uuid references public.clients (id),
  privacy_notice_version text not null default 'v1',
  source_page text,
  created_at timestamptz not null default now()
);

comment on table public.feedback_entries is
  'docs/16: تقييم سريع — يجوز مجهولاً (تقليل بيانات PDPL). الاسم/البريد فقط عند إذن التواصل.';

-- ---------------------------------------------------------------------------
-- 3. التوظيف: الأقسام والكتالوج والوظائف والطلبات
-- ---------------------------------------------------------------------------
create table public.career_departments (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null unique,
  sort int not null default 0
);

create table public.career_roles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.career_departments (id),
  title_ar text not null,
  title_en text,
  portfolio_label text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.career_roles is
  'كتالوج الأدوار الداخلي — ليس وظائف شاغرة؛ العام يرى الوظائف المنشورة فقط وشبكة المواهب تختار من الكتالوج';

create table public.career_jobs (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.career_roles (id),
  slug text not null unique,
  public_title_ar text not null,
  description_ar text,
  responsibilities text,
  qualification text,
  skills text,
  experience_requirement text,
  employment_type text default 'دوام كامل',
  work_model text,
  location text default 'الرياض',
  working_hours text,
  benefits text,
  salary_min numeric,
  salary_max numeric,
  official_occupation_code text,
  localization_review text not null default 'pending'
    check (localization_review in ('pending', 'cleared', 'restricted')),
  open_date date,
  close_date date,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published', 'paused', 'closed', 'archived')),
  published_at timestamptz,
  questions jsonb,  -- بنوك الأسئلة حسب الدور (🟡 docs/16 — تُفعَّل عند أول نشر)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- بوابة النشر: ضوابط إعلان الشواغر (وزارة الموارد البشرية) تُفرض من القاعدة
create or replace function public.career_job_publish_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if not public.is_admin() and public.app_role() <> 'hr' then
      raise exception 'نشر الوظائف للشريك وشؤون الفريق';
    end if;
    if coalesce(trim(new.official_occupation_code), '') = '' then
      raise exception 'لا نشر بلا رمز التصنيف السعودي الموحد للمهن — ضوابط وزارة الموارد البشرية';
    end if;
    if coalesce(trim(new.description_ar), '') = '' or coalesce(trim(new.responsibilities), '') = ''
       or coalesce(trim(new.qualification), '') = '' or coalesce(trim(new.skills), '') = ''
       or coalesce(trim(new.experience_requirement), '') = '' then
      raise exception 'إعلان الوظيفة يتطلب: وصفاً ومهاماً ومؤهلاً ومهارات وخبرة — أكمل الحقول الناقصة';
    end if;
    if new.work_model is null or new.working_hours is null or coalesce(trim(new.benefits), '') = '' then
      raise exception 'حدد طبيعة العمل وساعاته والمزايا قبل النشر';
    end if;
    if new.open_date is null or new.close_date is null or new.close_date <= new.open_date then
      raise exception 'حدد فترة فتح وإغلاق الإعلان (الإغلاق بعد الفتح)';
    end if;
    if new.localization_review = 'pending' then
      raise exception 'راجع انطباق قرارات التوطين (مهن التسويق موطّنة منذ أبريل 2026) وحدّث حالة المراجعة';
    end if;
    if new.localization_review = 'restricted' then
      raise exception 'هذه المهنة مقيدة توطيناً — راجع الضوابط قبل أي نشر';
    end if;
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger career_jobs_publish_gate
  before update on public.career_jobs
  for each row execute function public.career_job_publish_gate();

create table public.career_applications (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  job_id uuid references public.career_jobs (id),
  role_id uuid references public.career_roles (id),  -- شبكة المواهب: دور بلا وظيفة
  full_name text not null,
  email text not null,
  phone text,
  city text,
  experience_level text,
  work_model_pref text,
  start_availability text,
  arabic_level text,
  english_level text,
  salary_range text,      -- نطاق متوقع، لا راتب سابق
  portfolio_url text,
  linkedin_url text,
  accommodations_needed text,  -- لا يدخل أي تقييم
  cover_note text,
  talent_pool_consent boolean not null default false,
  talent_pool_until date,      -- ١٢ شهراً عند الموافقة (سياسة)
  privacy_notice_version text not null default 'v1',
  status text not null default 'applied'
    check (status in ('applied', 'prescreen', 'shortlisted', 'assessment',
                      'interview', 'offer', 'hired', 'rejected', 'withdrawn', 'talent_pool')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.document_counters (prefix, next_number) values ('APP', 1)
on conflict (prefix) do nothing;

create or replace function public.career_application_defaults()
returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if new.public_reference is null or new.public_reference = '' then
    update public.document_counters set next_number = next_number + 1
     where prefix = 'APP' returning next_number - 1 into n;
    new.public_reference := 'APP-' || to_char(now() at time zone 'Asia/Riyadh', 'YYYY')
                            || '-' || lpad(n::text, 5, '0');
  end if;
  if new.talent_pool_consent then
    new.talent_pool_until := coalesce(new.talent_pool_until, current_date + 365);
  end if;
  return new;
end;
$$;

create trigger career_applications_defaults
  before insert on public.career_applications
  for each row execute function public.career_application_defaults();

-- إشعار شؤون الفريق والشريك بكل طلب جديد
create or replace function public.on_application_received()
returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.profiles where role in ('admin', 'hr') and active loop
    perform public.enqueue_notification('application', 'inapp', 'application_received',
      jsonb_build_object('ref', new.public_reference, 'name', new.full_name),
      r.id, null, null, now(), 'app:' || new.id || ':' || r.id);
  end loop;
  return new;
end;
$$;

create trigger career_applications_notify
  after insert on public.career_applications
  for each row execute function public.on_application_received();

-- ---------------------------------------------------------------------------
-- 4. RLS + المنح
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'complaints', 'feedback_entries', 'career_departments', 'career_roles',
    'career_jobs', 'career_applications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- صوت العميل: الإدارة التشغيلية تدير، والحوكمة تقرأ
create policy "complaints: strategist+ manages" on public.complaints
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "complaints: governance reads" on public.complaints
  for select to authenticated
  using (public.app_role() in ('auditor', 'dpo', 'collections'));
create policy "feedback: team reads" on public.feedback_entries
  for select to authenticated using (public.is_team());
create policy "feedback: strategist+ manages" on public.feedback_entries
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

-- التوظيف: hr والشريك يديران؛ الفريق يقرأ؛ الجمهور يرى المنشور فقط
create policy "career_departments: team reads" on public.career_departments
  for select to authenticated using (true);
create policy "career_departments: hr manages" on public.career_departments
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');
create policy "career_roles: team reads" on public.career_roles
  for select to authenticated using (true);
create policy "career_roles: hr manages" on public.career_roles
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');
create policy "career_jobs: hr manages" on public.career_jobs
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');
create policy "career_jobs: team reads" on public.career_jobs
  for select to authenticated using (public.is_team());
create policy "career_applications: hr manages" on public.career_applications
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');

-- الجمهور (anon): الوظائف المنشورة غير المنتهية فقط + الكتالوج النشط للمواهب
grant select on public.career_jobs, public.career_roles, public.career_departments to anon;
create policy "career_jobs: public sees published" on public.career_jobs
  for select to anon
  using (status = 'published' and (close_date is null or close_date >= current_date));
create policy "career_roles: public sees active" on public.career_roles
  for select to anon using (active);
create policy "career_departments: public reads" on public.career_departments
  for select to anon using (true);

-- ---------------------------------------------------------------------------
-- 5. قوالب الإشعارات + الإغلاق التلقائي للوظائف المنتهية (v7)
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('complaint_received', 'inapp', 'ar', null,
   'شكوى جديدة {{ref}} ({{category}}): «{{subject}}» — الرد الأول خلال يوم عمل.', true),
  ('complaint_sla_breach', 'inapp', 'ar', null,
   'تجاوز SLA: شكوى {{ref}} بلا {{what}} — عالجها فوراً.', true),
  ('application_received', 'inapp', 'ar', null,
   'طلب توظيف جديد {{ref}} من {{name}} — راجعه في الفريق ← التوظيف.', true)
on conflict do nothing;

create or replace function public.run_public_layer_jobs()
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- إغلاق آلي للوظائف المنتهية (ضوابط الإعلان: فترة محددة)
  update public.career_jobs set status = 'closed'
   where status = 'published' and close_date < current_date;

  -- تنبيهات تجاوز SLA للشكاوى المفتوحة
  for r in select * from public.complaints
    where status not in ('resolved', 'closed', 'duplicate', 'withdrawn')
  loop
    if r.first_response_at is null and r.first_response_due_at < now() then
      perform public.notify_team('complaint', 'complaint_sla_breach',
        jsonb_build_object('ref', r.public_reference, 'what', 'رد أول'),
        null, 'cmp-sla1:' || r.id || ':' || current_date);
    elsif r.resolved_at is null and r.resolution_due_at < now() then
      perform public.notify_team('complaint', 'complaint_sla_breach',
        jsonb_build_object('ref', r.public_reference, 'what', 'حل'),
        null, 'cmp-sla2:' || r.id || ':' || current_date);
    end if;
  end loop;

  -- شبكة المواهب: انتهاء مدة الموافقة → إخفاء هوية (تقليل بيانات)
  update public.career_applications
     set full_name = 'محذوف (انتهت الموافقة)', email = '', phone = null,
         portfolio_url = null, linkedin_url = null, cover_note = null,
         accommodations_needed = null, status = 'withdrawn'
   where status = 'talent_pool' and talent_pool_until < current_date;
end;
$$;

create or replace function public.run_daily_jobs_v7()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v6();
  perform public.run_public_layer_jobs();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v7()$$);

-- ---------------------------------------------------------------------------
-- 6. بذور: الأقسام والأدوار الممثلة (٢٤ دوراً — الإضافة من الإعدادات)
-- ---------------------------------------------------------------------------
insert into public.career_departments (name_ar, sort) values
  ('الذكاء الاصطناعي والأتمتة', 1), ('التسويق الأدائي والإعلانات', 2),
  ('السيو والمحتوى', 3), ('السوشال ميديا والمجتمعات', 4),
  ('الهوية والتصميم', 5), ('الويب والمنتجات الرقمية', 6),
  ('الاستراتيجية والاستشارات', 7), ('العلاقات العامة والإعلام', 8),
  ('خدمة العملاء والتسليم', 9), ('العمليات والدعم', 10);

with d as (select id, name_ar from public.career_departments)
insert into public.career_roles (department_id, title_ar, title_en, portfolio_label)
select d.id, r.ar, r.en, r.pf from d join (values
  ('الذكاء الاصطناعي والأتمتة', 'مهندس ذكاء اصطناعي / نماذج لغوية', 'AI/LLM Engineer', 'GitHub / معمارية / عرض عملي'),
  ('الذكاء الاصطناعي والأتمتة', 'مهندس وكلاء ذكاء اصطناعي', 'AI Agent Engineer', 'GitHub / معمارية / عرض عملي'),
  ('الذكاء الاصطناعي والأتمتة', 'أخصائي أتمتة سير العمل', 'Automation Specialist', 'أمثلة Workflows'),
  ('التسويق الأدائي والإعلانات', 'أخصائي إعلانات Meta', 'Meta Ads Specialist', 'دراسة حالة مموهة'),
  ('التسويق الأدائي والإعلانات', 'أخصائي Google Ads', 'Google Ads Specialist', 'دراسة حالة مموهة'),
  ('التسويق الأدائي والإعلانات', 'أخصائي تتبع وتحليلات', 'Tracking & Analytics Specialist', 'دراسة حالة'),
  ('السيو والمحتوى', 'أخصائي سيو تقني', 'Technical SEO Specialist', 'فحص / دراسة حالة'),
  ('السيو والمحتوى', 'أخصائي سيو عربي', 'Arabic SEO Specialist', 'فحص / دراسة حالة'),
  ('السيو والمحتوى', 'كاتب محتوى عربي', 'Arabic Copywriter', 'نماذج كتابة'),
  ('السيو والمحتوى', 'كاتب محتوى ثنائي اللغة', 'Bilingual Copywriter', 'نماذج كتابة'),
  ('السوشال ميديا والمجتمعات', 'مدير منصات تواصل', 'Social Media Manager', 'حسابات أدرتها'),
  ('السوشال ميديا والمجتمعات', 'صانع محتوى', 'Content Creator', 'أعمالك المنشورة'),
  ('السوشال ميديا والمجتمعات', 'مدير مجتمع', 'Community Manager', 'أمثلة إدارة'),
  ('الهوية والتصميم', 'مصمم جرافيك أول', 'Senior Graphic Designer', 'Behance / معرض أعمال'),
  ('الهوية والتصميم', 'مصمم هوية بصرية', 'Brand Designer', 'Behance / معرض أعمال'),
  ('الهوية والتصميم', 'مصمم موشن جرافيك', 'Motion Designer', 'Reel'),
  ('الويب والمنتجات الرقمية', 'مطور واجهات', 'Frontend Developer', 'GitHub / مشاريع حية'),
  ('الويب والمنتجات الرقمية', 'مطور متاجر (سلة / زد / Shopify)', 'E-Commerce Developer', 'GitHub / متاجر حية'),
  ('الويب والمنتجات الرقمية', 'مصمم UI/UX', 'UI/UX Designer', 'معرض أعمال / حالة دراسية'),
  ('الاستراتيجية والاستشارات', 'استشاري استراتيجية تسويق', 'Marketing Strategy Consultant', 'نموذج استراتيجية معقّم'),
  ('العلاقات العامة والإعلام', 'أخصائي علاقات إعلامية', 'Media Relations Specialist', 'تغطيات حققتها'),
  ('خدمة العملاء والتسليم', 'مدير حسابات عملاء', 'Account Manager', null),
  ('خدمة العملاء والتسليم', 'مدير مشاريع رقمية', 'Digital Project Manager', null),
  ('العمليات والدعم', 'محاسب', 'Accountant', null)
) as r(dept, ar, en, pf) on r.dept = d.name_ar;

-- docs/15 — نواة نظام الإدارة المتكامل (IMS Phase 1، الجزء أ):
--
--   ims_frameworks     المعايير والأنظمة مُصدَّرة (لا Hardcode لإصدار)
--   ims_controls       الضوابط: انطباق، نمط تنفيذ، حالة، مالك، مواعيد مراجعة
--   control_mappings   ضابط واحد ← عدة معايير (المبدأ: عملية واحدة، أدلة واحدة)
--   evidence (+m2m)    مركز الأدلة بصلاحية زمنية — الدليل الواحد يثبت عدة متطلبات
--   risks              سجل مخاطر موحد + حارس: قبول الحرج/العالي للشريك فقط
--   legal_obligations  السجل القانوني والتنظيمي بمواعيد استحقاق
--   nonconformities    عدم المطابقة وCAPA — لا إغلاق بلا تحقق فعالية، والمتحقق ≠ المالك

-- ---------------------------------------------------------------------------
-- 1. المعايير المُصدَّرة
-- ---------------------------------------------------------------------------
create type public.framework_status as enum ('active', 'planned', 'superseded');
create type public.control_impl_mode as enum
  ('system_enforced', 'workflow_enforced', 'automated_evidence',
   'manual_evidence', 'external_technical', 'organizational',
   'contractual', 'not_applicable');
create type public.control_status as enum
  ('implemented', 'partial', 'required', 'review_required', 'not_applicable');

create table public.ims_frameworks (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  name_ar text not null,
  kind text not null check (kind in ('standard', 'regulation')),
  certifiable boolean not null default false,
  status public.framework_status not null default 'active',
  applicability_note text,
  effective_from date,
  superseded_on date,
  notes text,
  created_at timestamptz not null default now(),
  unique (key, version)
);

comment on table public.ims_frameworks is
  'docs/15: المعايير والأنظمة بإصداراتها — الإصدار الجديد صف جديد يتعايش مع القديم، لا استبدال بنيوي';

create table public.ims_controls (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.ims_frameworks (id) on delete cascade,
  ref_code text not null,
  title_ar text not null,
  requirement_ar text,
  applicable boolean not null default true,
  applicability_reason text,
  implementation_mode public.control_impl_mode not null default 'manual_evidence',
  status public.control_status not null default 'required',
  implementation_note text,
  owner_role public.user_role,
  review_months int not null default 12,
  last_reviewed_on date,
  next_review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (framework_id, ref_code)
);

create table public.control_mappings (
  id uuid primary key default gen_random_uuid(),
  source_control_id uuid not null references public.ims_controls (id) on delete cascade,
  framework_id uuid not null references public.ims_frameworks (id) on delete cascade,
  mapped_ref text not null,
  note text,
  unique (source_control_id, framework_id, mapped_ref)
);

-- ---------------------------------------------------------------------------
-- 2. مركز الأدلة
-- ---------------------------------------------------------------------------
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'record'
    check (kind in ('record', 'report', 'screenshot', 'log', 'attestation', 'system')),
  source text not null default 'manual' check (source in ('manual', 'auto')),
  details text,
  period_from date,
  period_to date,
  valid_until date,
  owner uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

comment on table public.evidence is
  'docs/15: الدليل الواحد يثبت عدة ضوابط (evidence_controls) — الملفات عبر attachments (entity=evidence)';

create table public.evidence_controls (
  evidence_id uuid not null references public.evidence (id) on delete cascade,
  control_id uuid not null references public.ims_controls (id) on delete cascade,
  primary key (evidence_id, control_id)
);

-- ---------------------------------------------------------------------------
-- 3. سجل المخاطر الموحد
-- ---------------------------------------------------------------------------
create type public.risk_category as enum
  ('business', 'quality', 'security', 'privacy', 'continuity',
   'ai', 'compliance', 'supplier', 'project');
create type public.risk_treatment as enum ('mitigate', 'avoid', 'transfer', 'accept');
create type public.risk_status as enum ('open', 'treating', 'accepted', 'closed');

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  category public.risk_category not null,
  title text not null,
  cause text,
  consequence text,
  likelihood int not null check (likelihood between 1 and 5),
  impact int not null check (impact between 1 and 5),
  inherent_score int generated always as (likelihood * impact) stored,
  existing_controls text,
  residual_likelihood int check (residual_likelihood between 1 and 5),
  residual_impact int check (residual_impact between 1 and 5),
  residual_score int generated always as
    (coalesce(residual_likelihood, likelihood) * coalesce(residual_impact, impact)) stored,
  owner uuid references public.profiles (id) default auth.uid(),
  treatment public.risk_treatment,
  treatment_plan text,
  due_on date,
  status public.risk_status not null default 'open',
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  acceptance_reason text,
  next_review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- قبول خطر متبقٍّ عالٍ (≥12) أو حرج (≥20) للشريك حصراً، بمسوغ مكتوب
create or replace function public.risk_acceptance_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_residual int;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    -- الأعمدة المولدة غير متاحة داخل مشغل before — نحسبها مباشرة
    v_residual := coalesce(new.residual_likelihood, new.likelihood)
                * coalesce(new.residual_impact, new.impact);
    if v_residual >= 12 and not public.is_admin() then
      raise exception 'قبول خطر عالٍ أو حرج قرارُ شريك — ارفعه للشريك مع مسوغ القبول';
    end if;
    if coalesce(trim(new.acceptance_reason), '') = '' then
      raise exception 'اكتب مسوغ قبول الخطر — القبول بلا مسوغ لا يصمد أمام مدقق';
    end if;
    new.accepted_by := auth.uid();
    new.accepted_at := now();
  end if;
  return new;
end;
$$;

create trigger risks_acceptance_guard
  before update on public.risks
  for each row execute function public.risk_acceptance_guard();

-- ---------------------------------------------------------------------------
-- 4. السجل القانوني والتنظيمي
-- ---------------------------------------------------------------------------
create table public.legal_obligations (
  id uuid primary key default gen_random_uuid(),
  law text not null,
  authority text,
  summary_ar text not null,
  applicable boolean not null default true,
  applicability_reason text,
  owner_role public.user_role not null default 'admin',
  frequency text,
  next_due_on date,
  status text not null default 'open' check (status in ('open', 'met', 'at_risk')),
  last_review_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. عدم المطابقة وCAPA
-- ---------------------------------------------------------------------------
create type public.ncr_status as enum
  ('open', 'containment', 'root_cause', 'action_plan',
   'implementation', 'effectiveness_review', 'closed');

create table public.nonconformities (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'internal'
    check (source in ('complaint', 'audit', 'incident', 'delivery', 'supplier', 'internal')),
  title text not null,
  description text,
  severity text not null default 'minor' check (severity in ('minor', 'major', 'critical')),
  status public.ncr_status not null default 'open',
  containment text,
  root_cause_method text,
  root_cause text,
  action_plan text,
  owner uuid references public.profiles (id) default auth.uid(),
  due_on date,
  effectiveness_note text,
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  client_id uuid references public.clients (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- القفل المزدوج: لا إغلاق بلا تحقق فعالية موثق، والمتحقق ليس مالك الإجراء
create or replace function public.ncr_close_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    if coalesce(trim(new.effectiveness_note), '') = '' then
      raise exception 'لا يُغلق الإجراء التصحيحي بمجرد التنفيذ — وثّق التحقق من الفعالية أولاً';
    end if;
    if auth.uid() = new.owner then
      raise exception 'مالك الإجراء لا يتحقق من فعاليته بنفسه — يعتمد الإغلاق شخص آخر';
    end if;
    new.verified_by := auth.uid();
    new.verified_at := now();
  end if;
  return new;
end;
$$;

create trigger nonconformities_close_guard
  before update on public.nonconformities
  for each row execute function public.ncr_close_guard();

-- ---------------------------------------------------------------------------
-- 6. RLS + منح + تدقيق (نمط النظام: لا DML افتراضياً)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'ims_frameworks', 'ims_controls', 'control_mappings',
    'evidence', 'evidence_controls', 'risks', 'legal_obligations',
    'nonconformities'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
    -- الإدارة التشغيلية تدير؛ كل الفريق (ومنه المدقق والخصوصية) يقرأ
    execute format(
      'create policy "%s: strategist+ manages" on public.%I for all to authenticated
         using (public.is_strategist_plus()) with check (public.is_strategist_plus())', t, t);
    execute format(
      'create policy "%s: team reads" on public.%I for select to authenticated
         using (public.is_team())', t, t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

create trigger ims_controls_updated before update on public.ims_controls
  for each row execute function public.set_updated_at();
create trigger risks_updated before update on public.risks
  for each row execute function public.set_updated_at();
create trigger legal_obligations_updated before update on public.legal_obligations
  for each row execute function public.set_updated_at();
create trigger nonconformities_updated before update on public.nonconformities
  for each row execute function public.set_updated_at();

-- evidence_controls بلا عمود id — مشغل التدقيق يتطلب id، نكتفي بتدقيق الطرفين
drop trigger if exists evidence_controls_audit on public.evidence_controls;

-- ---------------------------------------------------------------------------
-- 7. البذور: المعايير
-- ---------------------------------------------------------------------------
insert into public.ims_frameworks
  (key, version, name_ar, kind, certifiable, status, applicability_note) values
  ('ISO9001', '2015+Amd1:2024', 'إدارة الجودة', 'standard', true, 'active',
   'الإصدار القادم (متوقع 2026) يُضاف صفاً جديداً مع ترحيل الربط — لا إعادة بناء'),
  ('ISO27001', '2022+Amd1:2024', 'أمن المعلومات', 'standard', true, 'active', null),
  ('PDPL', '1445 + اللوائح', 'حماية البيانات الشخصية السعودي', 'regulation', false, 'active',
   'إلزام تنظيمي عند معالجة بيانات شخصية — ليس شهادة'),
  ('NCNICC', '1:2025', 'ضوابط الأمن السيبراني للمنشآت غير الحرجة', 'regulation', false, 'planned',
   'استرشادي حتى تعميم الهيئة أو قرار طوعي — Applicability تُقيَّم ولا تُفترض'),
  ('ISO42001', '2023', 'إدارة الذكاء الاصطناعي', 'standard', true, 'planned',
   'سجل أنظمة AI يبدأ الآن؛ النظام الكامل Phase 3');

-- ---------------------------------------------------------------------------
-- 8. البذور: ضوابط بحالات صادقة (ما يفرضه النظام فعلاً مقابل المطلوب)
-- ---------------------------------------------------------------------------
with fw as (select id, key from public.ims_frameworks)
insert into public.ims_controls
  (framework_id, ref_code, title_ar, requirement_ar, implementation_mode,
   status, implementation_note, owner_role, review_months)
select fw.id, c.ref, c.title, c.req, c.mode::public.control_impl_mode,
       c.st::public.control_status, c.note, c.owner::public.user_role, c.months
from fw join (values
  -- أمن المعلومات — ما يفرضه النظام
  ('ISO27001', 'IAM-01', 'التحكم بالوصول حسب الدور وأدنى صلاحية',
   'صلاحيات مفصلة بالأدوار وفصل مهام مفروض من قاعدة البيانات',
   'system_enforced', 'implemented',
   'RLS على كل الجداول + ١٣ دوراً + فصل المُفوتر والطالب≠المعتمد', 'admin', 12),
  ('ISO27001', 'IAM-02', 'المصادقة متعددة العوامل',
   'MFA إلزامي لكل حسابات الفريق', 'system_enforced', 'implemented',
   'TOTP إجباري عند أول دخول', 'admin', 12),
  ('ISO27001', 'IAM-03', 'المراجعة الدورية للصلاحيات',
   'مراجعة موثقة كل ٦ أشهر لكل الحسابات وأدوارها', 'manual_evidence', 'required',
   'تُنفذ من صفحة الفريق وتوثق دليلاً في مركز الأدلة', 'admin', 6),
  ('ISO27001', 'LOG-01', 'سجل تدقيق غير قابل للتعديل',
   'كل تغيير حساس مسجل بفاعله ووقته ولا يُحذف من الواجهة',
   'system_enforced', 'implemented',
   'audit_log append-only — محصّن حتى في وضع التحرير الحر (مُثبت بالاختبار)', 'admin', 12),
  ('ISO27001', 'BCK-01', 'النسخ الاحتياطي',
   'نسخ يومية مع الاحتفاظ', 'external_technical', 'implemented',
   'Supabase Pro يومي، احتفاظ ٧ أيام', 'admin', 12),
  ('ISO27001', 'BCK-02', 'اختبار الاستعادة الدوري',
   'استعادة فعلية موثقة كل ربع — النسخ بلا اختبار استعادة ليس دليلاً',
   'manual_evidence', 'required', 'يوثق دليلاً بتاريخ ونتيجة', 'admin', 3),
  ('ISO27001', 'CRY-01', 'التشفير في النقل والتخزين',
   'TLS لكل الاتصالات وتشفير التخزين', 'external_technical', 'implemented',
   'Supabase/HTTPS افتراضياً؛ الأسرار في Vault لا في الكود', 'admin', 12),
  ('ISO27001', 'SEC-01', 'إدارة الحوادث الأمنية',
   'تسجيل وتصنيف واحتواء وجذر وإجراء تصحيحي', 'workflow_enforced', 'partial',
   'الحوادث عبر عدم المطابقة (مصدر: حادث)؛ تسريب البيانات له مساره الخاص', 'admin', 12),
  ('ISO27001', 'DEV-01', 'التطوير الآمن',
   'مراجعة تغييرات، لا أسرار في المستودع، فحص التبعيات', 'organizational', 'partial',
   'قواعد CLAUDE.md + مراجعة الفروع؛ فحص آلي للتبعيات لاحقاً', 'admin', 12),
  -- الجودة — ما تفرضه المنصة من مسارات
  ('ISO9001', 'QMS-01', 'مراجعة متطلبات العميل قبل الالتزام',
   'نطاق موثق ومعتمد قبل عرض السعر', 'workflow_enforced', 'implemented',
   'النطاقات (Scopes) ثم عرض من النطاق ثم بوابة الاعتماد', 'strategist', 12),
  ('ISO9001', 'QMS-02', 'مراجعة المخرجات قبل التسليم',
   'فحص داخلي موثق قبل إرسال أي مخرج للعميل', 'workflow_enforced', 'implemented',
   'قوائم الفحص Flag & Hold — الأحدث يحكم، والمعلّم يوقف الإنجاز', 'pm', 12),
  ('ISO9001', 'QMS-03', 'اعتماد العميل الموثق',
   'إثبات قبول العميل للمخرجات', 'workflow_enforced', 'partial',
   'محضر الاستلام والقبول في مكتبة العقود؛ اعتماد بوابة العميل في المرحلة ٧', 'pm', 12),
  ('ISO9001', 'QMS-04', 'الشكاوى والإجراء التصحيحي',
   'شكوى ← تحقيق ← رد ← CAPA بفعالية متحقق منها', 'workflow_enforced', 'implemented',
   'عدم المطابقة (مصدر: شكوى) بقفل التحقق من الفعالية', 'strategist', 12),
  ('ISO9001', 'QMS-05', 'المراجعة الإدارية الدورية',
   'اجتماع إداري دوري بمدخلات ومقررات موثقة', 'workflow_enforced', 'implemented',
   'الاجتماع الأسبوعي L10 والربعي في النظام ← الاجتماعات', 'admin', 12),
  ('ISO9001', 'QMS-06', 'قياس الأداء بمؤشرات',
   'مؤشرات معرفة بمصدر بيانات واتجاه', 'system_enforced', 'implemented',
   'المؤشرات الأسبوعية (Scorecard) — ١٦ مؤشراً آلياً ويدوياً', 'admin', 12),
  ('ISO9001', 'QMS-07', 'التحكم بالوثائق',
   'إصدارات واعتماد وقفل ومنع التعديل بعد النفاذ', 'system_enforced', 'implemented',
   'documents: تجميد واعتماد وترقيم ونسخ متسلسلة — مُثبت بالاختبارات', 'admin', 12),
  ('ISO9001', 'QMS-08', 'الدروس المستفادة',
   'توثيق ما نتعلمه بعد المشاريع والحوادث', 'manual_evidence', 'required',
   'توثق في التحسين (نظام التشغيل) وتربط دليلاً', 'strategist', 6),
  -- PDPL — الطبقة المبنية في هذه الجولة
  ('PDPL', 'PDPL-01', 'سجل أنشطة المعالجة ROPA',
   'سجل مكتوب محدث طوال المعالجة و٥ سنوات بعدها', 'workflow_enforced', 'implemented',
   'processing_activities في الحوكمة ← الخصوصية', 'dpo', 12),
  ('PDPL', 'PDPL-02', 'حقوق أصحاب البيانات بمهلة نظامية',
   '٣٠ يوماً + تمديد ٣٠ بمسوغ وإبلاغ', 'system_enforced', 'implemented',
   'DSAR بمهلة محسوبة آلياً وتنبيهات 15/23/27/29', 'dpo', 12),
  ('PDPL', 'PDPL-03', 'الإبلاغ عن التسرب خلال ٧٢ ساعة',
   'من لحظة العلم عند احتمال الضرر', 'system_enforced', 'implemented',
   'privacy_breaches بعداد آلي وتصعيد فوري', 'dpo', 12),
  ('PDPL', 'PDPL-04', 'عقود المعالجة DPA',
   'اتفاق معالجة بالمحتوى النظامي مع كل معالج', 'contractual', 'implemented',
   'قالب DPA في مكتبة العقود (docs/13) ببنودها النظامية', 'legal', 12),
  ('PDPL', 'PDPL-05', 'التسويق المباشر بموافقة وإيقاف',
   'موافقة + آلية إيقاف سهلة + هوية مرسل واضحة', 'contractual', 'partial',
   'بند في العقود؛ محرك الموافقات التشغيلي مع بوابة العميل', 'dpo', 12),
  ('PDPL', 'PDPL-06', 'تقييم تعيين مسؤول حماية البيانات',
   'تقييم موثق في الأداة الحكومية', 'organizational', 'required',
   'قرار شركاء — الدور موجود في النظام (dpo@)', 'admin', 12),
  ('PDPL', 'PDPL-07', 'النقل خارج المملكة بضوابطه',
   'مسوغ وآلية وتقييم مخاطر عند الانطباق', 'workflow_enforced', 'partial',
   'حقل النقل في ROPA؛ ورقة SCC عند أول نقل فعلي (docs/14)', 'dpo', 12),
  -- الذكاء الاصطناعي — السجل من الآن
  ('ISO42001', 'AI-01', 'سجل أنظمة الذكاء الاصطناعي',
   'حصر كل استخدام AI بمزوده وبياناته ومراجعته البشرية', 'workflow_enforced', 'implemented',
   'ai_systems في الحوكمة ← الذكاء الاصطناعي', 'admin', 6),
  ('ISO42001', 'AI-02', 'بوابة اعتماد قبل تشغيل AI جديد',
   'تسجيل وتقييم بيانات واعتماد قبل الإنتاج', 'workflow_enforced', 'implemented',
   'حقل الاعتماد في السجل + بند AI في العقود يمنع بيانات العميل لمزود غير معتمد', 'admin', 6),
  ('ISO42001', 'AI-03', 'مراجعة بشرية للمخرجات الجوهرية',
   'Human oversight موثق حيث يلزم', 'organizational', 'partial',
   'بند تعاقدي + حقل في السجل؛ Evaluations رسمية في Phase 3', 'admin', 6)
) as c(fkey, ref, title, req, mode, st, note, owner, months)
  on c.fkey = fw.key;

-- ربط متعدد المعايير: مراجعة الصلاحيات تخدم ثلاثة أطر (مثال المبدأ)
insert into public.control_mappings (source_control_id, framework_id, mapped_ref, note)
select c.id, f2.id, m.ref, m.note
from public.ims_controls c
join public.ims_frameworks f1 on f1.id = c.framework_id and f1.key = 'ISO27001'
join (values
  ('IAM-01', 'PDPL', 'أمن البيانات', 'التحكم بالوصول ضمن التدابير النظامية'),
  ('IAM-01', 'NCNICC', 'إدارة الهوية والصلاحيات', null),
  ('IAM-02', 'NCNICC', 'MFA', 'إلزامية للدخول عن بعد'),
  ('IAM-03', 'PDPL', 'أمن البيانات', null),
  ('IAM-03', 'NCNICC', 'مراجعة الوصول الدورية', null),
  ('LOG-01', 'NCNICC', 'سجلات الأحداث', null),
  ('LOG-01', 'PDPL', 'إثبات الامتثال', null),
  ('BCK-01', 'NCNICC', 'النسخ الاحتياطي', null),
  ('BCK-02', 'NCNICC', 'فحص قدرة الاستعادة', null)
) as m(src, fkey, ref, note) on m.src = c.ref_code
join public.ims_frameworks f2 on f2.key = m.fkey;

-- ---------------------------------------------------------------------------
-- 9. البذور: الالتزامات القانونية الدنيا
-- ---------------------------------------------------------------------------
insert into public.legal_obligations
  (law, authority, summary_ar, owner_role, frequency, next_due_on) values
  ('نظام حماية البيانات الشخصية', 'سدايا',
   'تحديث سجل أنشطة المعالجة والاحتفاظ به ٥ سنوات بعد انتهاء كل نشاط',
   'dpo', 'مستمر + مراجعة سنوية', current_date + 90),
  ('لائحة PDPL التنفيذية', 'سدايا',
   'الاستجابة لطلبات أصحاب البيانات خلال ٣٠ يوماً (+٣٠ بمسوغ)',
   'dpo', 'عند كل طلب', null),
  ('لائحة PDPL التنفيذية', 'سدايا',
   'إشعار الجهة خلال ٧٢ ساعة من العلم بتسرب يحتمل الضرر',
   'dpo', 'عند الحادث', null),
  ('متطلبات الفوترة', 'هيئة الزكاة والضريبة والجمارك',
   'فوترة متوافقة (QR المرحلة الأولى) وإقرار ضريبة القيمة المضافة ربعياً',
   'cfo', 'ربعي', current_date + 60),
  ('السجل التجاري', 'وزارة التجارة',
   'تجديد السجل التجاري 1009127528 قبل انتهائه',
   'admin', 'سنوي', current_date + 180),
  ('مراجعة الصلاحيات', 'سياسة داخلية (ISO 27001 IAM-03)',
   'مراجعة موثقة لحسابات الفريق وأدوارها كل ٦ أشهر',
   'admin', 'نصف سنوي', current_date + 180);

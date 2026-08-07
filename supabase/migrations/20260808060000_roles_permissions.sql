-- الأدوار التخصصية وصلاحياتها + اعتمادات المستندات (طلب المالك).
--
-- الخريطة:
--   admin (شريك)          كل شيء
--   cfo (مدير مالي)       كل التشغيل + المالية الحساسة (توزيع الدخل، الحسابات
--                          البنكية) — دون إدارة الفريق والأدوار
--   accountant (محاسب)    التشغيل المالي (فواتير، دفعات، مصروفات) + قراءة
--                          التوزيعات — دون تأكيد الجولات أو الحسابات البنكية
--   legal (قانوني/محامٍ)  كل التشغيل + إدارة مكتبة البنود القانونية
--   auditor (مدقق حوكمة)  قراءة شاملة لكل شيء — بلا أي صلاحية مالية أو إدارية
--   strategist/executor/client كما هي

-- ---------------------------------------------------------------------------
-- 1. تحديث دوال الصلاحيات
-- ---------------------------------------------------------------------------
create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in
    ('admin', 'strategist', 'executor', 'cfo', 'accountant', 'legal', 'auditor');
$$;

-- «إدارة تشغيلية»: يدير السجلات التشغيلية (عملاء، مستندات، مشاريع…)
create or replace function public.is_strategist_plus()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in ('admin', 'strategist', 'cfo', 'accountant', 'legal');
$$;

-- المالية الحساسة: توزيع الدخل وتأكيد الجولات والحسابات البنكية
create or replace function public.is_finance_lead()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in ('admin', 'cfo');
$$;

create or replace function public.is_legal_lead()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in ('admin', 'legal');
$$;

-- ---------------------------------------------------------------------------
-- 2. إعادة توجيه السياسات الحساسة
-- ---------------------------------------------------------------------------
drop policy "allocations: admin manages" on public.allocations;
create policy "allocations: finance lead manages" on public.allocations
  for all to authenticated
  using (public.is_finance_lead()) with check (public.is_finance_lead());

drop policy "distributions: admin manages" on public.profit_distributions;
create policy "distributions: finance lead manages" on public.profit_distributions
  for all to authenticated
  using (public.is_finance_lead()) with check (public.is_finance_lead());

drop policy "payment_accounts: admin manages" on public.payment_accounts;
create policy "payment_accounts: finance lead manages" on public.payment_accounts
  for all to authenticated
  using (public.is_finance_lead()) with check (public.is_finance_lead());
drop policy "payment_accounts: admin reads all" on public.payment_accounts;
create policy "payment_accounts: finance lead reads all" on public.payment_accounts
  for select to authenticated using (public.is_finance_lead());

create or replace view public.payment_accounts_admin as
  select * from public.payment_accounts where public.is_finance_lead();

drop policy "clauses: admin manages" on public.clause_library;
create policy "clauses: legal lead manages" on public.clause_library
  for all to authenticated
  using (public.is_legal_lead()) with check (public.is_legal_lead());

drop policy "alloc rules: admin manages" on public.allocation_rules;
create policy "alloc rules: finance lead manages" on public.allocation_rules
  for all to authenticated
  using (public.is_finance_lead()) with check (public.is_finance_lead());

-- ---------------------------------------------------------------------------
-- 3. اعتمادات المستندات: المحامي/المدقق/المدير المالي/الشريك يعتمدون
-- ---------------------------------------------------------------------------
create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_role public.user_role not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid references public.profiles(id) default auth.uid(),
  reviewer uuid references public.profiles(id),
  note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index document_reviews_doc_idx on public.document_reviews (document_id);
create index document_reviews_pending_idx on public.document_reviews (reviewer_role)
  where status = 'pending';

alter table public.document_reviews enable row level security;
create policy "doc_reviews: team reads" on public.document_reviews
  for select to authenticated using (public.is_team());
create policy "doc_reviews: managers request" on public.document_reviews
  for insert to authenticated with check (public.is_strategist_plus());
-- يقرر من يحمل الدور المطلوب (أو الشريك)
create policy "doc_reviews: role decides" on public.document_reviews
  for update to authenticated
  using (public.app_role() = reviewer_role or public.is_admin())
  with check (public.app_role() = reviewer_role or public.is_admin());
create policy "doc_reviews: requester or admin deletes pending" on public.document_reviews
  for delete to authenticated
  using ((requested_by = auth.uid() or public.is_admin()) and status = 'pending');
grant select, insert, update, delete on public.document_reviews to authenticated, service_role;
create trigger document_reviews_audit after insert or update or delete
  on public.document_reviews for each row execute function public.audit_trigger();

-- لا اعتماد وترقيم لمستند عليه مراجعة معلقة أو مرفوضة
create or replace function public.document_review_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'draft' and new.status = 'sent' then
    if exists (select 1 from public.document_reviews r
               where r.document_id = new.id and r.status = 'pending') then
      raise exception 'المستند بانتظار اعتماد المراجعين — لا يُعتمد ويُرقَّم قبل بتّهم';
    end if;
    if exists (select 1 from public.document_reviews r
               where r.document_id = new.id and r.status = 'rejected') then
      raise exception 'مراجعٌ رفض هذا المستند — عالج سبب الرفض ثم اطلب المراجعة من جديد';
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_review_gate
  before update on public.documents
  for each row execute function public.document_review_gate();

-- إشعارات: الطلب يُشعر حاملي الدور؛ القرار يُشعر الطالب
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('review_requested', 'inapp', 'ar', null,
   'مطلوب اعتمادك ({{role}}): مستند {{doc}} لعميل {{client}} — راجعه من صفحة المستندات', true),
  ('review_decided', 'inapp', 'ar', null,
   '{{reviewer}} {{decision}} مستند {{doc}}{{note}}', true)
on conflict do nothing;

create or replace function public.on_review_requested()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_doc text; v_client text; r record;
declare v_role_ar text;
begin
  select coalesce(d.number, d.type::text), c.company into v_doc, v_client
    from public.documents d join public.clients c on c.id = d.client_id
   where d.id = new.document_id;
  v_role_ar := case new.reviewer_role
    when 'legal' then 'المستشار القانوني'
    when 'cfo' then 'المدير المالي'
    when 'accountant' then 'المحاسب'
    when 'auditor' then 'المدقق'
    when 'admin' then 'الشريك'
    else new.reviewer_role::text end;
  for r in select id from public.profiles
    where role = new.reviewer_role and active
  loop
    perform public.enqueue_notification('review_requested', 'inapp', 'review_requested',
      jsonb_build_object('role', v_role_ar, 'doc', coalesce(v_doc, '؟'),
        'client', coalesce(v_client, '؟')),
      r.id, null, null, now(), 'review:' || new.id || ':' || r.id);
  end loop;
  return new;
end;
$$;

create trigger document_reviews_notify_request
  after insert on public.document_reviews
  for each row execute function public.on_review_requested();

create or replace function public.on_review_decided()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_doc text; v_reviewer text;
begin
  if new.status in ('approved', 'rejected') and old.status = 'pending'
     and new.requested_by is not null then
    select coalesce(number, type::text) into v_doc from public.documents where id = new.document_id;
    select coalesce(full_name, email) into v_reviewer from public.profiles where id = new.reviewer;
    perform public.enqueue_notification('review_decided', 'inapp', 'review_decided',
      jsonb_build_object('reviewer', coalesce(v_reviewer, '؟'),
        'decision', case when new.status = 'approved' then 'اعتمد' else 'رفض' end,
        'doc', coalesce(v_doc, '؟'),
        'note', case when coalesce(new.note, '') = '' then '' else ' — ' || new.note end),
      new.requested_by, null, null, now(), 'decided:' || new.id);
  end if;
  return new;
end;
$$;

create trigger document_reviews_notify_decision
  after update on public.document_reviews
  for each row execute function public.on_review_decided();

-- ---------------------------------------------------------------------------
-- 4. حسابات الأدوار (قابلة للتعديل لاحقاً من صفحة الفريق)
--    كلمات المرور غير قابلة للاستخدام — تُعيَّن عبر «استعادة كلمة المرور».
-- ---------------------------------------------------------------------------
do $$
declare
  v record;
begin
  for v in select * from (values
    ('cfo@agma.com.sa',        'cfo'::public.user_role,        'المدير المالي'),
    ('accountant@agma.com.sa', 'accountant'::public.user_role, 'المحاسب'),
    ('legal@agma.com.sa',      'legal'::public.user_role,      'المستشار القانوني'),
    ('auditor@agma.com.sa',    'auditor'::public.user_role,    'مدقق الحوكمة')
  ) as t(email, role, name)
  loop
    if not exists (select 1 from auth.users where email = v.email) then
      insert into auth.users (id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at)
      values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', v.email,
        extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{}', now(), now());
    end if;
    update public.profiles
       set role = v.role, full_name = v.name, active = true
     where email = v.email;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. المدقق يقرأ كل شيء (قراءة فقط) — مسارات قراءة صريحة حيث كانت القراءة
--    حكراً على الإدارة التشغيلية
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'documents', 'expenses', 'leads', 'payments', 'recurring_invoices',
    'roadmaps', 'scopes', 'contacts', 'interactions', 'wallets', 'wallet_entries'
  ] loop
    execute format(
      'create policy "%s: auditor reads" on public.%I for select to authenticated using (public.app_role() = ''auditor'')',
      t, t);
  end loop;
end $$;

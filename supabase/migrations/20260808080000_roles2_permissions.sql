-- إكمال الأدوار من مراجع docs/11–13، بمنطق فصل المهام وبحجم الوكالة:
--
--   sales (مدير مبيعات)     المسار والعملاء والعروض والعقود والمشاريع —
--                            لا يعتمد فاتورة ولا يسجل دفعة أو مصروفاً
--   pm (مدير مشاريع)        مثل مدير العمليات في التشغيل — نفس قيد المبيعات مالياً
--   collections (محصّل)     يقرأ الفواتير والعملاء، يسجل الدفعات والوعود
--                            والتواصل — لا شطب ولا اعتماد ولا مصروفات
--   hr (شؤون الفريق)        بيانات الفريق (مسمى، تكلفة/س، إجازات) —
--                            لا يغيّر الأدوار ولا التفعيل (حارس على مستوى الصف)
--   dpo (مسؤول الخصوصية)    قراءة بيانات الأشخاص وسجل التدقيق — بلا كتابة
--
-- خرائط المراجع المتعمدة: أمين الخزينة والضريبة → cfo/accountant ·
-- GL Accountant → المحاسب الخارجي (فلسفة النظام) · Security Admin → شريك.

-- ---------------------------------------------------------------------------
-- 1. الدوال
-- ---------------------------------------------------------------------------
create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in
    ('admin', 'strategist', 'executor', 'cfo', 'accountant', 'legal', 'auditor',
     'sales', 'pm', 'collections', 'hr', 'dpo');
$$;

-- الإدارة التشغيلية (عملاء، مستندات، مشاريع…)
create or replace function public.is_strategist_plus()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in
    ('admin', 'strategist', 'cfo', 'accountant', 'legal', 'sales', 'pm');
$$;

-- «مُفوتر»: يعتمد ويرقّم الفواتير ويسجل المصروفات والاشتراكات
create or replace function public.is_biller()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in ('admin', 'cfo', 'accountant', 'strategist');
$$;

-- ---------------------------------------------------------------------------
-- 2. الفصل المالي: المبيعات/المشاريع لا يفوترون ولا يقبضون
-- ---------------------------------------------------------------------------
drop policy "payments: strategist+ manages" on public.payments;
create policy "payments: biller or collections manages" on public.payments
  for all to authenticated
  using (public.is_biller() or public.app_role() = 'collections')
  with check (public.is_biller() or public.app_role() = 'collections');

drop policy "expenses: strategist+ manages" on public.expenses;
create policy "expenses: biller manages" on public.expenses
  for all to authenticated
  using (public.is_biller()) with check (public.is_biller());

drop policy "retainers: strategist+ manages" on public.recurring_invoices;
create policy "retainers: biller manages" on public.recurring_invoices
  for all to authenticated
  using (public.is_biller()) with check (public.is_biller());

-- ترقيم الفواتير والإشعارات الدائنة للمفوترين فقط؛ العروض والعقود تبقى
-- للإدارة التشغيلية (المبيعات يرقّم عروضه).
create or replace function public.next_document_number(p_prefix text)
returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_strategist_plus() then
    raise exception 'not allowed';
  end if;
  if p_prefix in ('INV', 'CN') and not public.is_biller() then
    raise exception 'اعتماد الفواتير وترقيمها للمفوترين (الشريك، المدير المالي، المحاسب، مدير العمليات) — المبيعات تطلبها ولا تعتمدها';
  end if;
  update public.document_counters
     set next_number = next_number + 1
   where prefix = p_prefix
   returning next_number - 1 into n;
  if n is null then
    raise exception 'unknown counter prefix %', p_prefix;
  end if;
  return p_prefix || '-' || lpad(n::text, 5, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. حِزم قراءة المحصّل والخصوصية (على نمط المدقق)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['documents', 'payments', 'leads', 'recurring_invoices'] loop
    execute format(
      'create policy "%s: collections reads" on public.%I for select to authenticated using (public.app_role() = ''collections'')',
      t, t);
  end loop;
  foreach t in array array['documents', 'leads'] loop
    execute format(
      'create policy "%s: dpo reads" on public.%I for select to authenticated using (public.app_role() = ''dpo'')',
      t, t);
  end loop;
end $$;
-- clients/contacts/interactions للجميع قراءةً عبر سياسات الفريق القائمة.

-- سجل التدقيق: المدقق ومسؤول الخصوصية والشريك يقرؤونه من التطبيق
grant select on public.audit_log to authenticated;
create policy "audit_log: governance reads" on public.audit_log
  for select to authenticated
  using (public.app_role() in ('admin', 'auditor', 'dpo'));

-- ---------------------------------------------------------------------------
-- 4. شؤون الفريق: يدير بيانات HR ولا يمس الأدوار أو التفعيل
-- ---------------------------------------------------------------------------
create or replace function public.profiles_sensitive_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and not public.is_admin() then
    raise exception 'تغيير الدور أو التفعيل للشريك فقط';
  end if;
  return new;
end;
$$;

create trigger profiles_sensitive_guard
  before update on public.profiles
  for each row execute function public.profiles_sensitive_guard();

create policy "profiles: hr manages team data" on public.profiles
  for update to authenticated
  using (public.app_role() = 'hr' and role <> 'client')
  with check (public.app_role() = 'hr');

drop policy "leaves: admin manages" on public.leaves;
create policy "leaves: admin or hr manages" on public.leaves
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');

-- ---------------------------------------------------------------------------
-- 5. الحسابات (قابلة للتعديل من الفريق؛ كلمة المرور عبر الاستعادة)
-- ---------------------------------------------------------------------------
do $$
declare v record;
begin
  for v in select * from (values
    ('sales@agma.com.sa',       'sales'::public.user_role,       'مدير المبيعات'),
    ('pm@agma.com.sa',          'pm'::public.user_role,          'مدير المشاريع'),
    ('collections@agma.com.sa', 'collections'::public.user_role, 'مسؤول التحصيل'),
    ('hr@agma.com.sa',          'hr'::public.user_role,          'شؤون الفريق'),
    ('dpo@agma.com.sa',         'dpo'::public.user_role,         'مسؤول الخصوصية')
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

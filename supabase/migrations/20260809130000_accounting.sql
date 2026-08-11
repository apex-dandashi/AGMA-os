-- المحاسبة الكاملة (طلب المالك 2026-08-09): دليل حسابات سعودي مصغر + قيود
-- مزدوجة يفرض توازنها قيد قاعدة مؤجل + ترحيل تلقائي من الفواتير والدفعات
-- والمصروفات + ميزان مراجعة + إقرار ضريبة القيمة المضافة (ZATCA) —
-- المحاسب يرى دفتراً حقيقياً لا مجرد قوائم.

-- =============================================================================
-- ١) دليل الحسابات
-- =============================================================================
create table public.chart_of_accounts (
  code text primary key check (code ~ '^\d{4}$'),
  name_ar text not null,
  kind text not null check (kind in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_code text references public.chart_of_accounts (code),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.chart_of_accounts (code, name_ar, kind, parent_code) values
  ('1000', 'الأصول', 'asset', null),
  ('1100', 'النقد وما في حكمه', 'asset', '1000'),
  ('1110', 'البنك — التشغيل', 'asset', '1100'),
  ('1200', 'الذمم المدينة (عملاء)', 'asset', '1000'),
  ('1300', 'ضريبة مدخلات قابلة للخصم', 'asset', '1000'),
  ('2000', 'الالتزامات', 'liability', null),
  ('2100', 'الذمم الدائنة (موردون)', 'liability', '2000'),
  ('2200', 'ضريبة القيمة المضافة المستحقة', 'liability', '2000'),
  ('2300', 'إيراد مؤجل', 'liability', '2000'),
  ('3000', 'حقوق الملكية', 'equity', null),
  ('3100', 'رأس المال', 'equity', '3000'),
  ('3200', 'أرباح مبقاة', 'equity', '3000'),
  ('3300', 'توزيعات الشركاء', 'equity', '3000'),
  ('4000', 'الإيرادات', 'revenue', null),
  ('4100', 'إيراد خدمات', 'revenue', '4000'),
  ('4200', 'خصومات وإشعارات دائنة', 'revenue', '4000'),
  ('5000', 'المصروفات', 'expense', null),
  ('5100', 'رواتب ومستقلون', 'expense', '5000'),
  ('5200', 'اشتراكات وأدوات', 'expense', '5000'),
  ('5300', 'إعلانات وتسويق', 'expense', '5000'),
  ('5400', 'عمولات بنكية ورسوم', 'expense', '5000'),
  ('5500', 'مشتريات عامة', 'expense', '5000'),
  ('5600', 'ضيافة وتنقل', 'expense', '5000'),
  ('5700', 'رسوم حكومية', 'expense', '5000'),
  ('5900', 'مصروفات أخرى', 'expense', '5000')
on conflict do nothing;

-- =============================================================================
-- ٢) القيود — التوازن يفرضه قيد مؤجل حتى نهاية المعاملة
-- =============================================================================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  memo text not null check (char_length(trim(memo)) between 2 and 300),
  source text not null default 'manual'
    check (source in ('manual', 'invoice', 'credit_note', 'payment', 'expense')),
  source_id uuid,
  posted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  account_code text not null references public.chart_of_accounts (code),
  debit numeric not null default 0 check (debit >= 0),
  credit numeric not null default 0 check (credit >= 0),
  check (debit = 0 or credit = 0)
);
create index journal_lines_entry on public.journal_lines (entry_id);
create index journal_lines_account on public.journal_lines (account_code);

create or replace function public.journal_balance_check()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_entry uuid; v_diff numeric;
begin
  v_entry := coalesce(new.entry_id, old.entry_id);
  select coalesce(sum(debit), 0) - coalesce(sum(credit), 0) into v_diff
    from public.journal_lines where entry_id = v_entry;
  if v_diff <> 0 then
    raise exception 'القيد غير متوازن: فرق % ريال — مجموع المدين يجب أن يساوي الدائن', v_diff;
  end if;
  return null;
end;
$$;

create constraint trigger journal_lines_balanced
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row execute function public.journal_balance_check();

-- من يرى الدفتر: مدير النظام، المالي، المحاسب، المدقق (قراءة رقابية)
create or replace function public.is_accounting()
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() in ('admin', 'cfo', 'accountant', 'auditor');
$$;

alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
grant select, insert, update, delete on
  public.chart_of_accounts, public.journal_entries, public.journal_lines
  to authenticated, service_role;

create policy "coa: accounting reads" on public.chart_of_accounts
  for select to authenticated using (public.is_accounting());
create policy "coa: finance manages" on public.chart_of_accounts
  for all to authenticated using (public.is_finance_lead()) with check (public.is_finance_lead());
create policy "je: accounting reads" on public.journal_entries
  for select to authenticated using (public.is_accounting());
create policy "je: billers post manual" on public.journal_entries
  for insert to authenticated
  with check (public.is_biller() and source = 'manual' and posted_by = auth.uid());
create policy "jl: accounting reads" on public.journal_lines
  for select to authenticated using (public.is_accounting());
create policy "jl: billers post" on public.journal_lines
  for insert to authenticated
  with check (public.is_biller() and exists (
    select 1 from public.journal_entries e
    where e.id = journal_lines.entry_id and e.source = 'manual'));
-- لا تعديل ولا حذف لقيد مرحّل — التصحيح بقيد عكسي (عرف محاسبي)
create trigger journal_entries_audit
  after insert or update or delete on public.journal_entries
  for each row execute function public.audit_trigger();

-- =============================================================================
-- ٣) الترحيل التلقائي — كل حركة مالية تصير قيداً موزوناً
-- =============================================================================
create or replace function public.expense_account(p_category text)
returns text language sql immutable as $$
  select case p_category
    when 'رواتب ومستقلون' then '5100'
    when 'اشتراكات وأدوات' then '5200'
    when 'إعلانات' then '5300'
    when 'مشتريات' then '5500'
    when 'ضيافة وتنقل' then '5600'
    when 'حكومي' then '5700'
    else '5900' end;
$$;

create or replace function public.post_payment_je()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_je uuid;
begin
  insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
  values (new.paid_on, 'تحصيل دفعة عميل', 'payment', new.id, new.created_by)
  on conflict (source, source_id) do nothing
  returning id into v_je;
  if v_je is not null then
    insert into public.journal_lines (entry_id, account_code, debit, credit) values
      (v_je, '1110', new.amount, 0),
      (v_je, '1200', 0, new.amount);
  end if;
  return new;
end;
$$;
create trigger payments_post_je
  after insert on public.payments
  for each row execute function public.post_payment_je();

create or replace function public.post_expense_je()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_je uuid;
begin
  insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
  values (new.expense_date, 'مصروف: ' || coalesce(new.note, new.category), 'expense', new.id, new.created_by)
  on conflict (source, source_id) do nothing
  returning id into v_je;
  if v_je is not null then
    insert into public.journal_lines (entry_id, account_code, debit, credit) values
      (v_je, public.expense_account(new.category), new.amount, 0),
      (v_je, '1110', 0, new.amount);
  end if;
  return new;
end;
$$;
create trigger expenses_post_je
  after insert on public.expenses
  for each row execute function public.post_expense_je();

-- فاتورة مرقمة (sent) ← مدين ذمم بالكامل، دائن إيراد + ضريبة مخرجات
create or replace function public.post_invoice_je()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_je uuid; v_vat numeric; v_net numeric;
begin
  if new.number is null or new.status <> 'sent' or old.status <> 'draft'
     or new.type not in ('invoice', 'credit_note') then
    return new;
  end if;
  v_vat := case when (new.payload->>'vatEnabled')::boolean
    then coalesce((new.payload->>'vatAmount')::numeric, 0) else 0 end;
  v_net := coalesce(new.total, 0) - v_vat;
  insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
  values (coalesce(new.issued_on, current_date),
    case when new.type = 'invoice' then 'فاتورة ' else 'إشعار دائن ' end || new.number,
    new.type::text, new.id, new.created_by)
  on conflict (source, source_id) do nothing
  returning id into v_je;
  if v_je is null then return new; end if;
  if new.type = 'invoice' then
    insert into public.journal_lines (entry_id, account_code, debit, credit) values
      (v_je, '1200', coalesce(new.total, 0), 0),
      (v_je, '4100', 0, v_net);
    if v_vat > 0 then
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, '2200', 0, v_vat);
    end if;
  else
    insert into public.journal_lines (entry_id, account_code, debit, credit) values
      (v_je, '4200', v_net, 0),
      (v_je, '1200', 0, coalesce(new.total, 0));
    if v_vat > 0 then
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, '2200', v_vat, 0);
    end if;
  end if;
  return new;
end;
$$;
create trigger documents_post_je
  after update on public.documents
  for each row execute function public.post_invoice_je();

-- =============================================================================
-- ٤) التقارير — ميزان المراجعة وإقرار الضريبة (دوال definer بحارس دور)
-- =============================================================================
create or replace function public.trial_balance(p_to date default current_date)
returns table (code text, name_ar text, kind text, debits numeric, credits numeric, balance numeric)
language sql stable security definer set search_path = public as $$
  select a.code, a.name_ar, a.kind,
         coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0),
         coalesce(sum(l.debit), 0) - coalesce(sum(l.credit), 0)
  from public.chart_of_accounts a
  left join public.journal_lines l on l.account_code = a.code
  left join public.journal_entries e on e.id = l.entry_id and e.entry_date <= p_to
  where a.active and public.is_accounting()
  group by a.code, a.name_ar, a.kind
  having coalesce(sum(case when e.id is not null then l.debit end), 0) <> 0
      or coalesce(sum(case when e.id is not null then l.credit end), 0) <> 0
  order by a.code;
$$;

create or replace function public.vat_return(p_from date, p_to date)
returns table (output_vat numeric, input_vat numeric, net_due numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(case when l.account_code = '2200' then l.credit - l.debit end), 0),
    coalesce(sum(case when l.account_code = '1300' then l.debit - l.credit end), 0),
    coalesce(sum(case when l.account_code = '2200' then l.credit - l.debit end), 0)
      - coalesce(sum(case when l.account_code = '1300' then l.debit - l.credit end), 0)
  from public.journal_lines l
  join public.journal_entries e on e.id = l.entry_id
  where e.entry_date between p_from and p_to and public.is_accounting();
$$;

revoke execute on function public.trial_balance, public.vat_return from public, anon;

-- =============================================================================
-- ٥) ترحيل التاريخ القائم — الدفاتر تبدأ كاملة لا من الصفر
-- =============================================================================
do $$
declare r record; v_je uuid; v_vat numeric; v_net numeric;
begin
  for r in select * from public.documents
    where type in ('invoice', 'credit_note') and number is not null
      and status in ('sent', 'signed', 'active') loop
    v_vat := case when (r.payload->>'vatEnabled')::boolean
      then coalesce((r.payload->>'vatAmount')::numeric, 0) else 0 end;
    v_net := coalesce(r.total, 0) - v_vat;
    insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
    values (coalesce(r.issued_on, r.created_at::date),
      case when r.type = 'invoice' then 'فاتورة ' else 'إشعار دائن ' end || r.number,
      r.type::text, r.id, r.created_by)
    on conflict (source, source_id) do nothing
    returning id into v_je;
    if v_je is null then continue; end if;
    if r.type = 'invoice' then
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, '1200', coalesce(r.total, 0), 0), (v_je, '4100', 0, v_net);
      if v_vat > 0 then insert into public.journal_lines (entry_id, account_code, debit, credit)
        values (v_je, '2200', 0, v_vat); end if;
    else
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, '4200', v_net, 0), (v_je, '1200', 0, coalesce(r.total, 0));
      if v_vat > 0 then insert into public.journal_lines (entry_id, account_code, debit, credit)
        values (v_je, '2200', v_vat, 0); end if;
    end if;
  end loop;

  for r in select * from public.payments loop
    insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
    values (r.paid_on, 'تحصيل دفعة عميل', 'payment', r.id, r.created_by)
    on conflict (source, source_id) do nothing
    returning id into v_je;
    if v_je is not null then
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, '1110', r.amount, 0), (v_je, '1200', 0, r.amount);
    end if;
  end loop;

  for r in select * from public.expenses loop
    insert into public.journal_entries (entry_date, memo, source, source_id, posted_by)
    values (r.expense_date, 'مصروف: ' || coalesce(r.note, r.category), 'expense', r.id, r.created_by)
    on conflict (source, source_id) do nothing
    returning id into v_je;
    if v_je is not null then
      insert into public.journal_lines (entry_id, account_code, debit, credit)
      values (v_je, public.expense_account(r.category), r.amount, 0),
             (v_je, '1110', 0, r.amount);
    end if;
  end loop;
end $$;

-- =============================================================================
-- ٦) بوابة الفاتورة الضريبية v2 — المبسطة B2C تُعتمد بلا رقم ضريبي للعميل
--    (ZATCA: الفاتورة المبسطة تحمل الضريبة لكنها لا تُعرّف المشتري برقمه —
--    كانت البوابة القديمة تحجبها، وهي أصل شكوى المالك «فواتير بدون رقم ضريبي»)
-- =============================================================================
create or replace function public.invoice_tax_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.god_mode_active() then
    return new;
  end if;
  if new.type = 'invoice' and old.status = 'draft' and new.status = 'sent'
     and (new.payload ->> 'vatEnabled') = 'true'
     and coalesce(new.payload ->> 'taxKind', 'standard') = 'standard'
     and not exists (select 1 from public.clients c
                     where c.id = new.client_id
                       and nullif(trim(coalesce(c.vat_number, '')), '') is not null) then
    raise exception 'الفاتورة الضريبية القياسية B2B تتطلب رقماً ضريبياً للعميل — أضِفه في «بيانات العميل»، أو بدّل الفاتورة إلى «مبسطة B2C» من زر النوع';
  end if;
  return new;
end;
$$;

-- =============================================================================
-- ٧) دليل النظام — مع الشحنة
-- =============================================================================
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل المحاسبة: الدفتر والقيود وإقرار الضريبة',
  E'## كيف تُمسك الدفاتر؟\nكل حركة مالية في النظام تتحول **قيداً مزدوجاً موزوناً تلقائياً**: الفاتورة المرقمة (مدين ذمم العملاء ← دائن إيراد + ضريبة مخرجات)، الدفعة (مدين البنك ← دائن الذمم)، المصروف (مدين حساب مصروفه ← دائن البنك)، والإشعار الدائن يعكس. القاعدة نفسها ترفض أي قيد غير متوازن.\n\n## دليل الحسابات\nدليل سعودي مصغر بأكواد من أربع خانات (أصول 1xxx، التزامات 2xxx، حقوق ملكية 3xxx، إيرادات 4xxx، مصروفات 5xxx) يديره المدير المالي — وتصنيفات المصروفات في الشاشات تربط بحساباتها تلقائياً.\n\n## القيود اليدوية\nللمحاسب من تبويب «المحاسبة»: قيد بسطرين أو أكثر (إهلاك، تسويات، رواتب مستحقة…) — لا يُحفظ إلا متوازناً، والقيد المرحّل لا يُعدل: التصحيح بقيد عكسي.\n\n## التقارير\n**ميزان المراجعة** حتى أي تاريخ، و**إقرار ضريبة القيمة المضافة** لأي فترة (مخرجات − مدخلات = الصافي المستحق لهيئة الزكاة والضريبة والجمارك). الدفتر يراه: مدير النظام، المالي، المحاسب، والمدقق (قراءة فقط).',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

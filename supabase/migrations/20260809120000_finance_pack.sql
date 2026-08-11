-- حزمة المالية ١ (طلب المالك 2026-08-09): محول عملة للاشتراكات والباقات +
-- مشتريات بحوكمة عروض الأسعار (فوق ١٠٠٠ ريال ← عرضان أو استثناء معتمد).
-- (نوع الفاتورة الضريبية B2B/B2C يعيش في payload المستند — بلا تغيير مخطط.)

-- =============================================================================
-- ١) أسعار الصرف — الدولار مربوط بـ ٣٫٧٥ (مؤسسة النقد)، قابل للتحديث
-- =============================================================================
create table public.fx_rates (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  rate_to_sar numeric not null check (rate_to_sar > 0),
  updated_at timestamptz not null default now()
);

insert into public.fx_rates (code, rate_to_sar) values
  ('SAR', 1), ('USD', 3.75), ('EUR', 4.05), ('AED', 1.02)
on conflict do nothing;

alter table public.fx_rates enable row level security;
grant select, insert, update, delete on public.fx_rates to authenticated, service_role;
create policy "fx: team reads" on public.fx_rates
  for select to authenticated using (public.is_team());
create policy "fx: finance updates" on public.fx_rates
  for update to authenticated
  using (exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'cfo')))
  with check (exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'cfo')));
create trigger fx_rates_updated
  before update on public.fx_rates
  for each row execute function public.set_updated_at();

-- =============================================================================
-- ٢) المشتريات — عرضا سعر على الأقل فوق ١٠٠٠ ريال، والاستثناء يعتمده
--    مدير النظام أو المدير المالي بسبب موثق (docs/10: لا صرف بالانطباعات)
-- =============================================================================
create type public.purchase_status as enum
  ('pending', 'approved', 'rejected', 'purchased');

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  vendor text,
  amount numeric not null check (amount > 0),
  currency text not null default 'SAR' references public.fx_rates (code),
  -- عروض الأسعار المقارنة: [{vendor, amount, note}]
  quotes jsonb not null default '[]',
  exception_reason text,
  status public.purchase_status not null default 'pending',
  requested_by uuid not null default auth.uid() references public.profiles (id),
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  expense_id uuid references public.expenses (id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.purchases is
  'طلبات الشراء: فوق ١٠٠٠ ريال (بالمكافئ SAR) يفرض المحفز عرضي سعر مقارنين أو سبب استثناء — والاعتماد لمدير النظام/المالي فقط (RLS).';

create or replace function public.purchase_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_sar numeric;
begin
  if new.status = 'approved' and old.status = 'pending' then
    select new.amount * coalesce(r.rate_to_sar, 1) into v_sar
      from (select 1) x left join public.fx_rates r on r.code = new.currency;
    if v_sar > 1000
       and coalesce(jsonb_array_length(new.quotes), 0) < 2
       and coalesce(trim(new.exception_reason), '') = '' then
      raise exception 'المشتريات فوق ١٠٠٠ ريال تتطلب عرضي سعر مقارنين على الأقل — أو سبب استثناء موثقاً';
    end if;
    new.decided_by := auth.uid();
    new.decided_at := now();
  end if;
  if new.status = 'rejected' and old.status = 'pending' then
    new.decided_by := auth.uid();
    new.decided_at := now();
  end if;
  -- الشراء الفعلي يسجل مصروفاً تلقائياً بالمكافئ الريالي — مرة واحدة
  if new.status = 'purchased' and old.status = 'approved' and new.expense_id is null then
    insert into public.expenses (expense_date, category, amount, supplier, note, created_by)
    select current_date, 'مشتريات',
           round(new.amount * coalesce(r.rate_to_sar, 1), 2),
           coalesce(new.vendor, '—'),
           new.title || case when new.currency <> 'SAR'
             then ' (' || new.amount || ' ' || new.currency || ')' else '' end,
           auth.uid()
      from (select 1) x left join public.fx_rates r on r.code = new.currency
      returning id into new.expense_id;
  end if;
  return new;
end;
$$;

create trigger purchases_guard
  before update on public.purchases
  for each row execute function public.purchase_guard();

alter table public.purchases enable row level security;
grant select, insert, update, delete on public.purchases to authenticated, service_role;
create policy "purchases: team reads" on public.purchases
  for select to authenticated using (public.is_team());
create policy "purchases: team requests" on public.purchases
  for insert to authenticated
  with check (public.is_team() and requested_by = auth.uid() and status = 'pending');
create policy "purchases: requester edits own pending" on public.purchases
  for update to authenticated
  using (requested_by = auth.uid() and status = 'pending'
         and exists (select 1 from public.profiles p
           where p.id = auth.uid() and p.role not in ('admin', 'cfo')))
  with check (status = 'pending');
create policy "purchases: finance decides" on public.purchases
  for update to authenticated
  using (exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'cfo')))
  with check (exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'cfo')));
create trigger purchases_updated
  before update on public.purchases
  for each row execute function public.set_updated_at();
create trigger purchases_audit
  after insert or update or delete on public.purchases
  for each row execute function public.audit_trigger();

-- =============================================================================
-- ٣) دليل النظام — التوثيق مع الشحنة
-- =============================================================================
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل المالية: أنواع الفواتير والمشتريات ومحول العملة',
  E'## الفاتورة الضريبية والمبسطة (ZATCA)\nالنظام يميز نوعين: **قياسية B2B** لعميل له رقم ضريبي (يظهر رقمه على الفاتورة إلزاماً) و**مبسطة B2C** بلا رقم ضريبي للعميل. النوع يُضبط تلقائياً من ملف العميل، وتبدله من زر النوع على المسودة قبل الترقيم — التحويل لقياسية يتطلب إدخال الرقم الضريبي في ملف العميل أولاً. رمز QR وفق المرحلة الأولى يظهر على كل فاتورة مرقمة.\n\n## المشتريات\nأي عضو يرفع طلب شراء (العنوان، المورد، المبلغ بعملته). **فوق ١٠٠٠ ريال بالمكافئ**: أرفق عرضي سعر مقارنين على الأقل، أو اكتب سبب استثناء واضحاً — والقاعدة يفرضها النظام نفسه عند الاعتماد. الاعتماد والرفض لمدير النظام والمدير المالي فقط. عند «تم الشراء» يسجل النظام المصروف تلقائياً بالمكافئ الريالي.\n\n## محول العملة\nالدولار مربوط بـ ٣٫٧٥ ريال (يورو ودرهم مضافان) — المحول في تبويب المشتريات لحساب الاشتراكات والباقات الأجنبية فوراً، والأسعار يحدثها المدير المالي عند الحاجة.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

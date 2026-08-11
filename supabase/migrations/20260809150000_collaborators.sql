-- شؤون المنفذين والمتعاونين (طلب المالك 2026-08-09): المطورون والمصممون
-- والمصورون والمستقلون الذين لا يحتاجون حسابات دخول — سجل كامل: التخصص،
-- الأسعار، NDA، الإسنادات بجودتها، ومدفوعاتهم تصب في المصروفات والدفتر.

create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  specialty text not null check (char_length(trim(specialty)) between 2 and 60),
  phone text,
  email text,
  city text,
  rate_type text not null default 'per_project'
    check (rate_type in ('hourly', 'per_project', 'monthly')),
  rate numeric check (rate is null or rate >= 0),
  currency text not null default 'SAR' references public.fx_rates (code),
  nda_signed_on date,
  portfolio_url text,
  rating int check (rating between 1 and 5),
  status text not null default 'active'
    check (status in ('active', 'paused', 'blacklisted')),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.collaborators is
  'المنفذون بلا حسابات نظام (مستقلون وشركاء إنتاج) — منفصلون تماماً عن profiles؛ من يحتاج دخولاً فعلياً يُدعى من «الفريق» كعضو.';

create table public.collaborator_assignments (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 200),
  agreed_amount numeric not null check (agreed_amount >= 0),
  currency text not null default 'SAR' references public.fx_rates (code),
  due date,
  status text not null default 'assigned'
    check (status in ('assigned', 'delivered', 'paid', 'cancelled')),
  quality_rating int check (quality_rating between 1 and 5),
  expense_id uuid references public.expenses (id),
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- الدفع يسجل مصروف «رواتب ومستقلون» بالمكافئ الريالي (والقيد يترحل تلقائياً)
create or replace function public.collab_payment_expense()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status <> 'paid' and new.expense_id is null then
    insert into public.expenses (expense_date, category, amount, supplier, note, created_by)
    select current_date, 'رواتب ومستقلون',
           round(new.agreed_amount * coalesce(r.rate_to_sar, 1), 2),
           (select c.full_name from public.collaborators c where c.id = new.collaborator_id),
           'إسناد: ' || new.title, auth.uid()
      from (select 1) x left join public.fx_rates r on r.code = new.currency
      returning id into new.expense_id;
    -- تقييم الجودة إلزامي مع الدفع — لا دفع بلا حكم على الجودة
    if new.quality_rating is null then
      raise exception 'قيّم جودة التسليم (١–٥) قبل تعليم الإسناد مدفوعاً';
    end if;
  end if;
  return new;
end;
$$;

create trigger collab_assignments_payment
  before update on public.collaborator_assignments
  for each row execute function public.collab_payment_expense();

-- تقييم المتعاون = متوسط جودة إسناداته المدفوعة (يتحدث تلقائياً)
create or replace function public.collab_rating_rollup()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.collaborators set rating = sub.avg_r
  from (select collaborator_id, round(avg(quality_rating))::int avg_r
        from public.collaborator_assignments
        where quality_rating is not null
        group by collaborator_id) sub
  where collaborators.id = sub.collaborator_id
    and collaborators.id = coalesce(new.collaborator_id, old.collaborator_id);
  return null;
end;
$$;

create trigger collab_assignments_rating
  after insert or update or delete on public.collaborator_assignments
  for each row execute function public.collab_rating_rollup();

alter table public.collaborators enable row level security;
alter table public.collaborator_assignments enable row level security;
grant select, insert, update, delete on
  public.collaborators, public.collaborator_assignments to authenticated, service_role;

create policy "collabs: team reads" on public.collaborators
  for select to authenticated using (public.is_team());
create policy "collabs: leads manage" on public.collaborators
  for all to authenticated
  using (public.app_role() in ('admin', 'strategist', 'pm', 'hr'))
  with check (public.app_role() in ('admin', 'strategist', 'pm', 'hr'));
create policy "collab asg: team reads" on public.collaborator_assignments
  for select to authenticated using (public.is_team());
create policy "collab asg: leads manage" on public.collaborator_assignments
  for all to authenticated
  using (public.app_role() in ('admin', 'strategist', 'pm', 'hr'))
  with check (public.app_role() in ('admin', 'strategist', 'pm', 'hr'));

create trigger collaborators_updated
  before update on public.collaborators
  for each row execute function public.set_updated_at();
create trigger collab_assignments_updated
  before update on public.collaborator_assignments
  for each row execute function public.set_updated_at();
create trigger collaborators_audit
  after insert or update or delete on public.collaborators
  for each row execute function public.audit_trigger();

-- دليل النظام — مع الشحنة
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل المنفذين والمتعاونين: المستقلون وشركاء الإنتاج',
  E'## من هم؟\nالمطورون والمصممون والمصورون والمونتيرية والكتّاب الذين ننفذ بهم دون أن يحتاجوا حسابات دخول للنظام — سجلهم في «الفريق ← المنفذون والمتعاونون». من يحتاج دخولاً فعلياً يُدعى عضواً عادياً.\n\n## الملف\nلكل متعاون: تخصصه، طريقة تسعيره (بالساعة/بالمشروع/شهري) وعملته، توقيع NDA بتاريخه، رابط أعماله، وحالته (نشط/متوقف/محظور). **لا تُسند عملاً لمن لم يوقع NDA** إن كان سيطلع على أي بيانات عميل.\n\n## الإسنادات\nكل عمل يُسند بعنوان ومبلغ متفق وموعد، ويمر: مُسند ← مُسلّم ← مدفوع. **الدفع يتطلب تقييم الجودة (١–٥) إلزاماً** — التقييمات تتراكم متوسطاً على ملف المتعاون فتعرف مع من تكرر. وعند الدفع يتسجل المصروف (رواتب ومستقلون) بالمكافئ الريالي ويترحل قيده المحاسبي تلقائياً.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

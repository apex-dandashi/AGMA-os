-- ذيل المرحلة ٧ (مخطط B5): محرك Drop Forms — نماذج بلا كود يبنيها الفريق
-- ويرسلها للعملاء، وكل تعبئة تهبط صفوفاً منظمة قابلة للتحليل (لا PDF ضائعة).
-- والـ Onboarding يركب عليه: نموذج استقبال نظامي يُطلب تلقائياً لحظة توقيع
-- العقد ويُشعر العميل في بوابته.

-- ---------- النماذج -----------------------------------------------------------
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 200),
  description text,
  -- [{key, label, type, required, options?, hint?}] — الأنواع في واجهة العرض
  fields jsonb not null default '[]',
  is_system boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.forms is
  'محرك Drop Forms (B5): استقبال العملاء، موجزات الحملات، الاستبيانات — الفريق يبني والعميل يعبي والبيانات صفوف قابلة للتحليل';

create table public.form_requests (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  client_id uuid not null references public.clients (id),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  due_on date,
  requested_by uuid references public.profiles (id) default auth.uid(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- لا طلبان معلقان لنفس النموذج ونفس العميل
create unique index form_requests_pending_uq
  on public.form_requests (form_id, client_id) where status = 'pending';

create table public.form_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.form_requests (id) on delete cascade,
  form_id uuid not null references public.forms (id),
  client_id uuid not null references public.clients (id),
  respondent uuid not null references public.profiles (id) default auth.uid(),
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.forms enable row level security;
alter table public.form_requests enable row level security;
alter table public.form_responses enable row level security;
grant select, insert, update, delete on public.forms to authenticated;
grant select, insert, update on public.form_requests to authenticated;
grant select, insert on public.form_responses to authenticated;
grant all on public.forms, public.form_requests, public.form_responses to service_role;

-- الفريق يدير كل شيء
create policy "forms: team manages" on public.forms
  for all to authenticated using (public.is_team()) with check (public.is_team());
create policy "form requests: team manages" on public.form_requests
  for all to authenticated using (public.is_team()) with check (public.is_team());
create policy "form responses: team reads" on public.form_responses
  for select to authenticated using (public.is_team());

-- العميل: يرى نماذج طلباته الفعالة، وطلباته، وإجاباته — ويعبي مرة لكل طلب معلق
create policy "forms: client sees requested" on public.forms
  for select to authenticated using (status = 'active' and exists (
    select 1 from public.form_requests r
    -- التأهيل الصريح إلزامي: id غير المؤهلة تنحاز لعمود r.id داخل الاستعلام الفرعي
    where r.form_id = forms.id and r.client_id = public.current_client_id()));
create policy "form requests: client own" on public.form_requests
  for select to authenticated using (client_id = public.current_client_id());
create policy "form responses: client own" on public.form_responses
  for select to authenticated using (client_id = public.current_client_id());
create policy "form responses: client submits" on public.form_responses
  for insert to authenticated with check (
    respondent = auth.uid()
    and client_id = public.current_client_id()
    and exists (
      select 1 from public.form_requests r
      where r.id = form_responses.request_id
        and r.client_id = public.current_client_id()
        and r.status = 'pending'
        and r.form_id = form_responses.form_id));

create trigger forms_updated
  before update on public.forms
  for each row execute function public.set_updated_at();
create trigger forms_audit
  after insert or update or delete on public.forms
  for each row execute function public.audit_trigger();
create trigger form_responses_audit
  after insert on public.form_responses
  for each row execute function public.audit_trigger();

-- النموذج النظامي (الاستقبال) محمي من الحذف
create or replace function public.guard_system_form()
returns trigger
language plpgsql as $$
begin
  if old.is_system then
    raise exception 'نموذج نظامي — عدّل حقوله لكن لا يُحذف';
  end if;
  return old;
end;
$$;

create trigger forms_system_guard
  before delete on public.forms
  for each row execute function public.guard_system_form();

-- ---------- مرفقات النماذج (خاص) ----------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('form-uploads', 'form-uploads', false, 15728640)
on conflict (id) do nothing;

create policy "form uploads: client writes own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'form-uploads'
    and (storage.foldername(name))[1] = public.current_client_id()::text);
create policy "form uploads: client reads own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'form-uploads'
    and (storage.foldername(name))[1] = public.current_client_id()::text);
create policy "form uploads: team reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'form-uploads' and public.is_team());

-- ---------- الإشعارات ----------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('form_request_new', 'inapp', 'ar', null,
   'نموذج بانتظاركم: «{{title}}» — عبّئوه من بوابتكم ← نماذج، يساعدنا نخدمكم أدق وأسرع.', true),
  ('form_response_in', 'inapp', 'ar', null,
   '{{client}} عبّأ نموذج «{{title}}» — راجع الإجابات في النماذج.', true)
on conflict do nothing;

create or replace function public.on_form_request()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' then
    perform public.enqueue_notification('forms', 'inapp', 'form_request_new',
      jsonb_build_object('title', (select title from public.forms where id = new.form_id)),
      p.id, null, new.client_id, now(), 'frm-req:' || new.id || ':' || p.id)
    from public.profiles p
    where p.role = 'client' and p.client_id = new.client_id and p.active;
  end if;
  return new;
end;
$$;

create trigger form_requests_notify
  after insert on public.form_requests
  for each row execute function public.on_form_request();

create or replace function public.on_form_response()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.form_requests
     set status = 'completed', completed_at = now()
   where id = new.request_id;
  perform public.notify_team('forms', 'form_response_in',
    jsonb_build_object(
      'title', (select title from public.forms where id = new.form_id),
      'client', (select company from public.clients where id = new.client_id)),
    new.client_id, 'frm-res:' || new.id);
  return new;
end;
$$;

create trigger form_responses_after
  after insert on public.form_responses
  for each row execute function public.on_form_response();

-- ---------- الاستقبال الآلي عند توقيع العقد ------------------------------------
create or replace function public.on_contract_signed_onboarding()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_form uuid;
begin
  if new.status = 'signed' and old.status is distinct from 'signed'
     and new.type in ('service', 'retainer', 'msa', 'sow') then
    select id into v_form from public.forms
      where is_system and status = 'active' limit 1;
    if v_form is not null and not exists (
      select 1 from public.form_requests
      where form_id = v_form and client_id = new.client_id
    ) then
      insert into public.form_requests (form_id, client_id, requested_by)
      values (v_form, new.client_id, null);
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_signed_onboarding
  after update on public.documents
  for each row execute function public.on_contract_signed_onboarding();

-- ---------- بذرة نموذج الاستقبال ------------------------------------------------
insert into public.forms (title, description, is_system, status, fields) values (
  'استقبال عميل جديد — نبدأ صح',
  E'أهلاً بكم في AGMA! هذا النموذج يجمع ما نحتاجه لننطلق بدقة — ١٠ دقائق منكم توفر أسابيع من التخمين.\n\n🔒 مهم: لا تكتبوا أي كلمات مرور هنا إطلاقاً — الوصول للحسابات نرتبه لاحقاً بقناة آمنة.',
  true, 'active',
  '[
    {"key":"about","label":"نبذة عن شركتكم ومنتجاتكم/خدماتكم","type":"textarea","required":true,"hint":"من أنتم؟ ماذا تبيعون؟ ما الذي يميزكم؟"},
    {"key":"audience","label":"جمهوركم المستهدف","type":"textarea","required":true,"hint":"من عميلكم المثالي؟ أعمار، مدن، اهتمامات، B2B أم B2C"},
    {"key":"competitors","label":"أبرز ٣ منافسين (أسماء أو روابط)","type":"textarea","required":true},
    {"key":"goals","label":"أهدافكم من التسويق خلال ٦ أشهر","type":"textarea","required":true,"hint":"مبيعات؟ وعي بالعلامة؟ عملاء محتملون؟ أرقام إن أمكن"},
    {"key":"budget_channels","label":"القنوات التي جربتموها سابقاً ونتائجها","type":"textarea","required":false},
    {"key":"brand_assets","label":"ملف الهوية أو الشعار","type":"file","required":false,"hint":"شعار بجودة عالية، دليل الهوية إن وجد — أو ضعوا رابطاً في الحقل التالي"},
    {"key":"assets_links","label":"روابط أصول أخرى (درايف، موقع، حسابات)","type":"textarea","required":false},
    {"key":"channels","label":"حساباتكم الحالية على المنصات","type":"multi","required":false,"options":["إنستغرام","تيك توك","سناب شات","إكس","لينكدإن","يوتيوب","قوقل بزنس","لا يوجد بعد"]},
    {"key":"contact_name","label":"ممثلكم الأساسي معنا (الاسم)","type":"text","required":true},
    {"key":"contact_phone","label":"جواله","type":"phone","required":true},
    {"key":"pref_meet","label":"الوقت المفضل للاجتماعات","type":"select","required":false,"options":["صباحاً (٩-١٢)","ظهراً (١٢-٣)","عصراً (٣-٦)","مساءً (٦-٩)"]},
    {"key":"notes","label":"أي شيء آخر تودون أن نعرفه؟","type":"textarea","required":false}
  ]'::jsonb
)
on conflict do nothing;

-- آراء العملاء للموقع (تدقيق التحويل 2026-09-04، فجوة الإثبات الاجتماعي):
-- تقييم CSAT الذي أذن صاحبه بالاقتباس يتحول ترشيحاً هنا — الفريق يراجع
-- وينشر، والموقع يعرض المنشور فقط. لا رأي مخترع ولا نشر بلا إذن موثق.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (char_length(trim(quote)) between 10 and 600),
  author_company text,
  source text not null default 'csat' check (source in ('csat', 'manual')),
  source_response uuid references public.form_responses (id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.testimonials is
  'شهادات العملاء المعروضة في الموقع: تُلتقط تلقائياً من CSAT (إذن الاقتباس + نص الرأي) بحالة غير منشورة — النشر قرار فريق من الحوكمة ← صوت العميل. الموقع يقرأ المنشور فقط.';

alter table public.testimonials enable row level security;
grant select, insert, update, delete on public.testimonials to authenticated, service_role;
grant select on public.testimonials to anon;
create policy "testimonials: public reads published" on public.testimonials
  for select to anon using (published);
create policy "testimonials: team reads all" on public.testimonials
  for select to authenticated using (public.is_team());
create policy "testimonials: leads manage" on public.testimonials
  for all to authenticated
  using (public.is_admin() or public.is_strategist_plus())
  with check (public.is_admin() or public.is_strategist_plus());
create trigger testimonials_audit
  after insert or update or delete on public.testimonials
  for each row execute function public.audit_trigger();

-- الالتقاط الآلي من CSAT: إذن «نعم» + رأي مكتوب ← ترشيح غير منشور
create or replace function public.capture_testimonial()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_company text; v_consent text; v_quote text; v_key text;
begin
  select f.system_key into v_key
    from public.forms f join public.form_requests r on r.form_id = f.id
    where r.id = new.request_id;
  if v_key is distinct from 'csat' then return new; end if;

  v_consent := new.answers ->> 'testimonial';
  v_quote := trim(coalesce(new.answers ->> 'quote', ''));
  if v_consent not in ('نعم', 'yes', 'true') or char_length(v_quote) < 10 then
    return new;
  end if;
  select c.company into v_company from public.clients c where c.id = new.client_id;

  insert into public.testimonials (quote, author_company, source, source_response)
  values (v_quote, v_company, 'csat', new.id);

  perform public.notify_team('testimonial_pending', 'testimonial_pending',
    jsonb_build_object('company', coalesce(v_company, 'عميل')),
    new.client_id, 'testi:' || new.id);
  return new;
end;
$$;

create trigger form_responses_testimonial
  after insert on public.form_responses
  for each row execute function public.capture_testimonial();

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('testimonial_pending', 'inapp', 'ar', null,
   'رأي جديد بإذن نشر من «{{company}}» — راجعه وانشره من الحوكمة ← صوت العميل ليظهر في الموقع')
on conflict do nothing;

-- دليل النظام — مع الشحنة
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل شهادات العملاء في الموقع',
  E'## من أين تأتي؟\nحين يكمل العميل تقييم CSAT ويجيب «نعم» على إذن الاقتباس ويكتب رأيه بصيغته — يلتقطه النظام تلقائياً **ترشيحاً غير منشور** ويصل إشعار للإدارة.\n\n## النشر\nمن الحوكمة ← صوت العميل: راجع النص (سلامة لغوية، لا معلومات حساسة) ثم انشره — يظهر فوراً في قسم «قالوا عنا» بالموقع باسم شركة العميل. إلغاء النشر بضغطة متى شئت.\n\n## القاعدة\nلا يُعرض رأي بلا إذن موثق في النظام، ولا يُحرر جوهر كلام العميل — التصحيح الإملائي فقط. الصدق أثمن من الإبهار.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

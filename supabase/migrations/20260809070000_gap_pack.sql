-- حزمة الثغرات الصغيرة (docs/17): مفاتيح نظامية للنماذج + CSAT آلي عند
-- اكتمال المشروع (يركب على محرك Drop Forms) — G1/G2 في الواجهات.

-- ---------- مفتاح نظامي مميز (كان is_system وحيداً — صار عندنا نموذجان) -------
alter table public.forms add column if not exists system_key text unique;
update public.forms set system_key = 'onboarding' where is_system and system_key is null;

-- استهداف الاستقبال بالمفتاح لا بـ limit 1
create or replace function public.on_contract_signed_onboarding()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_form uuid;
begin
  if new.status = 'signed' and old.status is distinct from 'signed'
     and new.type in ('service', 'retainer', 'msa', 'sow') then
    select id into v_form from public.forms
      where system_key = 'onboarding' and status = 'active';
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

-- ---------- نموذج رضا العميل CSAT ---------------------------------------------
insert into public.forms (title, description, is_system, system_key, status, fields) values (
  'رأيكم يهمنا — تقييم المشروع',
  E'اكتمل مشروعكم مع AGMA 🎉 دقيقتان من وقتكم تصنعان فرقاً حقيقياً في طريقة خدمتنا لكم.',
  true, 'csat', 'active',
  '[
    {"key":"satisfaction","label":"ما مدى رضاكم عن نتيجة المشروع؟","type":"select","required":true,"options":["ممتاز — فاق التوقعات","جيد جداً","جيد","مقبول","دون المتوقع"]},
    {"key":"communication","label":"كيف تقيمون التواصل والمتابعة خلال المشروع؟","type":"select","required":true,"options":["ممتاز","جيد جداً","جيد","يحتاج تحسيناً"]},
    {"key":"best","label":"أكثر شيء أعجبكم في التجربة","type":"textarea","required":false},
    {"key":"improve","label":"شيء واحد لو حسّناه لكانت تجربتكم أفضل","type":"textarea","required":true,"hint":"صراحتكم هدية — هذا ما نبني عليه"},
    {"key":"nps","label":"هل ترشحون AGMA لشريك أو صديق؟","type":"select","required":true,"options":["حتماً نعم","على الأغلب نعم","ربما","على الأغلب لا"]},
    {"key":"testimonial","label":"هل تسمحون باقتباس رأيكم في موقعنا؟","type":"yesno","required":false},
    {"key":"quote","label":"إن سمحتم — اكتبوا الرأي بصيغتكم","type":"textarea","required":false}
  ]'::jsonb
)
on conflict do nothing;

-- عند اكتمال المشروع: اطلب CSAT (طلب معلق واحد كحد أقصى لكل عميل)
create or replace function public.on_project_completed_csat()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_form uuid;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select id into v_form from public.forms
      where system_key = 'csat' and status = 'active';
    if v_form is not null then
      insert into public.form_requests (form_id, client_id, requested_by)
      values (v_form, new.client_id, null)
      on conflict do nothing; -- فهرس التفرد الجزئي يمنع طلباً معلقاً ثانياً
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_completed_csat
  after update on public.projects
  for each row execute function public.on_project_completed_csat();

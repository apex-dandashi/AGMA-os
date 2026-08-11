-- SOPs + السياسات لكل وحدة (طلب المالك 2026-08-09): وثيقة حوكمة واحدة لكل
-- إجراء/سياسة بمالك ومراجعة دورية ونسخ — وتفعيلها ينشرها تلقائياً في قاعدة
-- المعرفة فيجيب عنها المساعد (لا توثيق في مكانين).

create table public.gov_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sop', 'policy')),
  module text not null check (char_length(trim(module)) between 2 and 60),
  title text not null check (char_length(trim(title)) between 3 and 200),
  body_md text not null,
  owner_role text not null default 'admin',
  version int not null default 1,
  review_due date not null default current_date + 180,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  kb_article_id uuid references public.kb_articles (id) on delete set null,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gov_documents is
  'SOPs وسياسات كل وحدة: التفعيل ينشرها كمقال معرفة داخلي (المساعد يجيب عنها)، تعديل النص يرفع النسخة، وللمراجعة الدورية تذكير يومي عند الاستحقاق.';

alter table public.gov_documents enable row level security;
grant select, insert, update, delete on public.gov_documents to authenticated, service_role;
create policy "gov docs: team reads" on public.gov_documents
  for select to authenticated using (public.is_team());
create policy "gov docs: leads manage" on public.gov_documents
  for all to authenticated
  using (public.is_admin() or public.is_legal_lead() or public.is_strategist_plus())
  with check (public.is_admin() or public.is_legal_lead() or public.is_strategist_plus());
create trigger gov_documents_audit
  after insert or update or delete on public.gov_documents
  for each row execute function public.audit_trigger();

-- النسخة ترتفع مع تعديل النص + المزامنة مع قاعدة المعرفة عند التفعيل
create or replace function public.gov_doc_sync()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_kb uuid; v_title text;
begin
  if tg_op = 'UPDATE' and new.body_md is distinct from old.body_md then
    new.version := old.version + 1;
  end if;
  new.updated_at := now();

  v_title := case when new.kind = 'sop' then 'إجراء: ' else 'سياسة: ' end || new.title;
  if new.status = 'active' then
    if new.kb_article_id is null then
      insert into public.kb_articles (title, body_md, category, audience, published)
      values (v_title, new.body_md, 'السياسات والإجراءات', 'internal', true)
      returning id into v_kb;
      new.kb_article_id := v_kb;
    else
      update public.kb_articles
        set title = v_title, body_md = new.body_md, published = true
        where id = new.kb_article_id;
    end if;
  elsif new.status = 'retired' and new.kb_article_id is not null then
    update public.kb_articles set published = false where id = new.kb_article_id;
  end if;
  return new;
end;
$$;

create trigger gov_documents_sync
  before insert or update on public.gov_documents
  for each row execute function public.gov_doc_sync();

-- تذكير المراجعة الدورية ضمن العمل اليومي (v3 ← v4)
create or replace function public.gov_review_nudges()
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from public.gov_documents
           where status = 'active' and review_due <= current_date loop
    perform public.notify_team('gov_review_due', 'gov_review_due',
      jsonb_build_object('title', r.title,
        'kind', case when r.kind = 'sop' then 'إجراء' else 'سياسة' end),
      null, 'govrev:' || r.id || ':' || r.review_due);
  end loop;
end;
$$;

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('gov_review_due', 'inapp', 'ar', null,
   'استحقت المراجعة الدورية: {{kind}} «{{title}}» — راجعها في الحوكمة ← السياسات والإجراءات وحدّث تاريخ مراجعتها')
on conflict do nothing;

create or replace function public.run_daily_jobs_v4()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v3();
  perform public.gov_review_nudges();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v4()$$);

-- بذور: أهم الإجراءات والسياسات القائمة فعلاً في النظام (تُفعّل فوراً)
insert into public.gov_documents (kind, module, title, body_md, owner_role, status) values
('sop', 'المالية', 'إصدار فاتورة',
 E'1. أنشئ الفاتورة من عرض السعر المعتمد (المالية ← الفواتير) — لا فواتير من الصفر.\n2. تحقق من نوعها: **قياسية B2B** (رقم العميل الضريبي إلزامي) أو **مبسطة B2C**.\n3. راجع البنود مقابل النطاق المعتمد — أي زيادة تحتاج اعتماد نطاق جديداً.\n4. أكمل فحص التوقف: الحساب البنكي الصحيح، الترقيم، التكرار إن وُجد.\n5. «اعتماد وترقيم» (محاسب أو أعلى) — الرقم لا يُسترد والقيد المحاسبي يترحل تلقائياً.\n6. أرسلها للعميل من بوابته وتابع من أعمار الذمم.',
 'accountant', 'active'),
('sop', 'المشتريات', 'طلب شراء',
 E'1. ارفع الطلب من المالية ← المشتريات (الوصف، المورد، المبلغ بعملته).\n2. **فوق ١٠٠٠ ريال بالمكافئ**: أرفق عرضي سعر مقارنين — أو سبب استثناء موثقاً (مورد وحيد، عقد قائم…).\n3. الاعتماد لمدير النظام أو المدير المالي حصراً.\n4. بعد الشراء الفعلي علّم «تم الشراء» — المصروف والقيد يتسجلان تلقائياً بالمكافئ الريالي.',
 'cfo', 'active'),
('sop', 'المشاريع', 'إطلاق حملة إعلانية',
 E'1. تأكد أن مهمة الإطلاق ضمن كتيب الخدمة وأن النطاق معتمد من العميل.\n2. أكمل **فحص التوقف** كاملاً: البكسل يعمل، سقف الميزانية مضبوط، UTM موحدة، الاستهداف مراجع، المحفظة الإعلانية مغطاة.\n3. لا إطلاق بفحص ناقص — النظام يوثق كل بند بالفاحص والوقت.\n4. بعد الإطلاق: راقب أول ٤٨ ساعة وسجل القراءة الأولى في المشروع.',
 'pm', 'active'),
('policy', 'الأمان', 'كلمات المرور والوصول',
 E'- التحقق بخطوتين (MFA) إلزامي لكل حسابات الفريق — النظام يفرضه عند الدخول.\n- كلمات المرور المشتركة عبر مدير كلمات مرور فقط — **ممنوع** إرسالها في الدردشة أو البريد أو النماذج إطلاقاً.\n- الصلاحيات بحسب الدور وبالحد الأدنى — طلبات الرفع لمدير النظام بسبب مكتوب.\n- عند مغادرة أي عضو: قائمة المغادرة تفرض سحب الوصول وتدوير كل كلمة مرور مشتركة قبل الإقفال.',
 'admin', 'active'),
('policy', 'العملاء', 'التواصل والاعتمادات',
 E'- قناة العميل الرسمية بوابته: التسليمات والاعتمادات والدعم كلها موثقة فيها.\n- لا وعود خارج النطاق المعتمد — أي طلب إضافي يتحول عرض نطاق جديداً.\n- مهلة ردنا على رسائل العملاء: يوم عمل كحد أقصى، والدعم بحسب تصنيف القسم.\n- محتوى العميل لا يُنشر إلا بمراجعة بشرية موثقة واعتماده هو — بلا استثناء (مفروض في القاعدة).',
 'strategist', 'active'),
('policy', 'الذكاء الاصطناعي', 'الاستخدام المسؤول داخلياً',
 E'- مخرجات الذكاء مسودات تحتاج مراجعة بشرية قبل أي عين خارجية — القاعدة مفروضة تقنياً في المحتوى.\n- لا تلصق بيانات عملاء حساسة في أدوات ذكاء خارج منظومتنا المعتمدة.\n- النماذج المجانية قد تتدرب على المدخلات — تصلح للعام (مدونة، أفكار) لا لبيانات العملاء.\n- أفصح للعميل عن استخدام الذكاء في خدمته متى سأل — الصدق سياسة.',
 'admin', 'active')
on conflict do nothing;

-- دليل النظام: كيف تدار السياسات والإجراءات نفسها
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل الحوكمة: SOPs والسياسات',
  E'## أين تعيش؟\nالحوكمة ← تبويب «السياسات والإجراءات»: وثيقة لكل إجراء تشغيل قياسي (SOP) أو سياسة، مصنفة بوحدتها (المالية، المشاريع، الأمان…) وبمالك من الأدوار وتاريخ مراجعة دورية.\n\n## دورة الحياة\nمسودة ← **نشطة** (تُنشر تلقائياً في قاعدة المعرفة فيجيب عنها المساعد فوراً) ← متقاعدة (تُسحب من المعرفة). تعديل النص يرفع رقم النسخة تلقائياً، واستحقاق المراجعة يذكّر الإدارة يومياً حتى التحديث.\n\n## القاعدة\nكل عملية متكررة تستحق SOP — إن شرحتها مرتين، وثّقها. والسياسات تُكتب قصيرة قاطعة: ما المسموح، ما الممنوع، ومن يقرر الاستثناء.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

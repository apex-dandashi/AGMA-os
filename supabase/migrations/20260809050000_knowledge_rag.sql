-- المرحلة ٩ (مخطط B6/B7): قاعدة المعرفة + مساعد RAG بثلاث واجهات.
-- التضمينات: gte-small المدمج في بيئة دوال Supabase (384 بعداً، مجاني بلا مفاتيح).
-- العقيدة: المساعد يجيب من المعرفة المعتمدة فقط ويستشهد بمصدره؛ وإن لم يجد
-- ثقةً كافية يسلّم لبشري (طلب دعم في البوابة / التقاط عميل محتمل في الموقع).

create extension if not exists vector;

-- ---------- مقالات المعرفة ----------------------------------------------------
create type public.kb_audience as enum ('public', 'client', 'internal');

create table public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 200),
  body_md text not null,
  category text not null default 'عام',
  audience public.kb_audience not null default 'public',
  published boolean not null default false,
  indexed_at timestamptz,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.kb_articles is
  'قاعدة معرفة AGMA: مصدر أجوبة المساعد الذكي (موقع/بوابة/واتساب لاحقاً). audience يحكم من يصله المحتوى عبر المساعد؛ internal للفريق فقط';

alter table public.kb_articles enable row level security;
grant select on public.kb_articles to anon;
grant select, insert, update, delete on public.kb_articles to authenticated;
grant all on public.kb_articles to service_role;

create policy "kb: public reads published public" on public.kb_articles
  for select to anon using (published and audience = 'public');
create policy "kb: clients read published public+client" on public.kb_articles
  for select to authenticated
  using (published and audience in ('public', 'client'));
create policy "kb: team manages" on public.kb_articles
  for all to authenticated using (public.is_team()) with check (public.is_team());

create trigger kb_articles_updated
  before update on public.kb_articles
  for each row execute function public.set_updated_at();
create trigger kb_articles_audit
  after insert or update or delete on public.kb_articles
  for each row execute function public.audit_trigger();

-- أي تعديل للنص يلغي الفهرسة حتى يعاد بناؤها
create or replace function public.kb_dirty()
returns trigger
language plpgsql as $$
begin
  if new.body_md is distinct from old.body_md
     or new.title is distinct from old.title
     or new.audience is distinct from old.audience
     or new.published is distinct from old.published then
    new.indexed_at := null;
  end if;
  return new;
end;
$$;

create trigger kb_articles_dirty
  before update on public.kb_articles
  for each row execute function public.kb_dirty();

-- ---------- الأجزاء المفهرسة ---------------------------------------------------
create table public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid not null references public.kb_articles (id) on delete cascade,
  seq int not null,
  content text not null,
  embedding vector(384) not null
);

create index kb_chunks_kb_idx on public.kb_chunks (kb_id);

-- لا وصول مباشر لغير الخادم — المساعد يقرأها بدور الخدمة فقط
alter table public.kb_chunks enable row level security;
grant all on public.kb_chunks to service_role;

-- ---------- البحث الدلالي ------------------------------------------------------
create or replace function public.match_kb_chunks(
  p_embedding vector(384),
  p_count int default 5,
  p_audiences public.kb_audience[] default array['public']::public.kb_audience[]
) returns table (
  kb_id uuid, title text, category text, content text, similarity float
)
language sql stable security definer set search_path = public as $$
  select c.kb_id, a.title, a.category, c.content,
         1 - (c.embedding <=> p_embedding) as similarity
  from public.kb_chunks c
  join public.kb_articles a on a.id = c.kb_id
  where a.published and a.audience = any (p_audiences)
  order by c.embedding <=> p_embedding
  limit p_count;
$$;

revoke execute on function public.match_kb_chunks from public, anon, authenticated;

-- ---------- سجل محادثات المساعد (البوت جهاز إدخال للـ CRM) ---------------------
create table public.assistant_logs (
  id uuid primary key default gen_random_uuid(),
  surface text not null check (surface in ('site', 'portal', 'whatsapp')),
  session_key text,
  client_id uuid references public.clients (id),
  question text not null,
  answer text,
  confident boolean not null default true,
  cited uuid[],
  created_at timestamptz not null default now()
);

comment on table public.assistant_logs is
  'كل سؤال وجواب للمساعد بواجهاته — وقود تحسين المعرفة (الأسئلة غير الواثقة = مقالات ناقصة)';

alter table public.assistant_logs enable row level security;
grant select on public.assistant_logs to authenticated;
grant all on public.assistant_logs to service_role;
create policy "assistant logs: team reads" on public.assistant_logs
  for select to authenticated using (public.is_team());

-- ---------- بذرة معرفة أولى (يحررها الفريق من الواجهة) --------------------------
insert into public.kb_articles (title, body_md, category, audience, published) values
('ما هي AGMA وماذا تقدم؟',
E'AGMA — وكالة جيل الذكاء الاصطناعي — وكالة تسويق سعودية مقرها الرياض، مبنية بالذكاء الاصطناعي من الداخل.\n\nخدماتنا الأساسية:\n- الاستشارات الاستراتيجية وبناء خطط النمو\n- التسويق الأدائي وإدارة الإعلانات المدفوعة\n- السيو وصناعة المحتوى\n- إدارة السوشال ميديا والمجتمعات\n- تطوير الويب والمنصات الرقمية\n- الأتمتة وحلول الذكاء الاصطناعي للأعمال\n- الهوية والتصميم الإبداعي\n\nنعمل مع الأعمال الطموحة في السعودية والخليج، ولكل عميل بوابة خاصة يتابع منها مشاريعه ومستنداته وفواتيره لحظياً.',
'عن AGMA', 'public', true),
('كيف أتواصل مع AGMA أو أطلب عرض سعر؟',
E'ثلاث طرق سريعة:\n\n1. **مكالمة استراتيجية مجانية**: من صفحة تواصل معنا في agma.com.sa — نرد خلال يوم عمل.\n2. **فحص موقعك مجاناً**: أداة فحص المواقع في قسم الأدوات تعطيك تقريراً فورياً ويتواصل معك فريقنا بالتوصيات.\n3. **عملاؤنا الحاليون**: من بوابتك اضغط تبويب الدعم وافتح طلباً للقسم المختص — يصل الفريق فوراً.\n\nعروض الأسعار تُبنى على نطاق عمل واضح تعتمده قبل أي التزام، ولا توجد رسوم مفاجئة.',
'التواصل والمبيعات', 'public', true),
('كيف أستخدم بوابة العميل؟',
E'بوابتك على ops.agma.com.sa/portal — دخول برابط يصلك على بريدك المسجل، بلا كلمات مرور.\n\nماذا تجد فيها؟\n- **نظرة عامة**: ما ينتظر قرارك (اعتمادات وتواقيع) وتقدم مشاريعك\n- **المخرجات**: التصاميم والأعمال — علّق على أي نقطة من التصميم بالضغط عليها، واعتمد أو اطلب تعديلات\n- **المستندات**: عقودك وعروضك — وقّع إلكترونياً من الجوال\n- **الفواتير والدفع**: فواتيرك وحالة سدادها وبيانات التحويل البنكي\n- **الدعم**: افتح طلباً للقسم المختص (مشاريع، مالية، قانوني، تقني) وتحاور لحظياً\n- **المحتوى**: اعتمد المحتوى المجدول لحساباتك قبل نشره',
'بوابة العميل', 'public', true),
('ما سياسة الرد على الشكاوى والدعم؟',
E'نلتزم بسياسة خدمة واضحة:\n\n- **الشكاوى الرسمية** (agma.com.sa/complaints): إشعار استلام فوري برقم مرجعي، ورد أول خلال **يوم عمل**، وحل أو خطة حل خلال **٥ أيام عمل**.\n- **طلبات الدعم من البوابة**: توجه تلقائياً للقسم المختص ويصل إشعارها للفريق فوراً.\n- شكاوى الخصوصية والبيانات تعامل بمسار خاص وفق نظام حماية البيانات الشخصية السعودي (PDPL).\n\nيمكنك تتبع شكواك في أي وقت برقمها المرجعي من نفس الصفحة.',
'السياسات', 'public', true),
('كيف تعمل الفوترة والدفع؟',
E'- الفواتير ضريبية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ضريبة القيمة المضافة ١٥٪ مبينة بوضوح).\n- تصلك الفاتورة في بوابتك وعلى بريدك، ومعها بيانات الحساب البنكي (الآيبان) للتحويل.\n- عند التحويل أرفق رقم الفاتورة في وصف الحوالة ليتم ربط السداد تلقائياً.\n- لا تُحفظ أي بيانات بطاقات لدى AGMA إطلاقاً.\n- للاستفسار عن فاتورة: تبويب الدعم في بوابتك ← قسم الفواتير والمالية.',
'السياسات', 'public', true)
on conflict do nothing;

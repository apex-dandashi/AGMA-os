-- «حصة الذكاء» (2026-09-05): أداة مجانية على الموقع تقيس هل تذكر محركات
-- الذكاء الاصطناعي علامة الزائر حين يسأل عميلٌ سؤالَ شراء في قطاعه ومدينته.
-- توصية المقارنة المعيارية: تسمية منتج الظهور في محركات الذكاء العربي
-- وأداة قياس تقود إلى باقة «قيادة السوق». كل فحص يُسجَّل هنا (بلا بيانات
-- شخصية: العلامة والقطاع والمدينة وبصمة IP مجزّأة) ليقرأه الفريق في المسار.

create table public.ai_visibility_checks (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  sector text not null,
  city text not null,
  website text,
  questions jsonb not null default '[]',      -- [{q, mentioned, brands[]}]
  mentions int not null default 0,
  total int not null default 0,
  score int not null default 0,               -- 0..100
  competitors jsonb not null default '[]',    -- [{name, count}]
  model text,
  caller_hash text,
  created_at timestamptz not null default now()
);

comment on table public.ai_visibility_checks is
  'فحوصات أداة «حصة الذكاء» العامة: هل تذكر محركات الذكاء العلامة عند أسئلة الشراء. تُكتب من دالة ai-visibility (service role) فقط؛ الفريق يقرأها كإشارات اهتمام.';

create index ai_visibility_checks_created_idx on public.ai_visibility_checks (created_at desc);

alter table public.ai_visibility_checks enable row level security;
grant select on public.ai_visibility_checks to authenticated;
grant all on public.ai_visibility_checks to service_role;
create policy "ai visibility: team reads" on public.ai_visibility_checks
  for select to authenticated using (public.is_team());

-- دليل النظام (قاعدة docs-with-ship)
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل أداة «حصة الذكاء» (الظهور في محركات الذكاء)',
  E'## ما هي\n«حصة الذكاء» أداة مجانية على agma.com.sa/ai-visibility: الزائر يكتب اسم علامته وقطاعه ومدينته، فنطرح على نموذج ذكاء اصطناعي ستة أسئلة شراء يطرحها عميل حقيقي في ذلك القطاع (مثل «أفضل عيادة أسنان في الرياض؟») ونفحص هل ذُكرت علامته في الأجوبة، ومن ذُكر من منافسيه.\n\n## القراءة الصحيحة للنتيجة\n- النسبة = عدد الأسئلة التي ذُكرت فيها العلامة ÷ ٦. قياس لحظي من نموذج واحد؛ لا يُقدَّم كحقيقة دائمة.\n- التقرير الكامل (ضمن باقة قيادة السوق أو كخدمة GEO منفردة) يقيس ٣ نماذج و٣٠ سؤالاً ويعيد القياس شهرياً.\n\n## أين تظهر البيانات\n- كل فحص يُسجَّل في ai_visibility_checks (العلامة، القطاع، المدينة، النتيجة، المنافسون). لا اسم ولا جوال هناك.\n- إذا طلب الزائر التقرير الكامل يصل كعميل محتمل عادي عبر lead-intake ومعه ملخص فحصه في حقل الخدمات.\n\n## البيع\n- نتيجة منخفضة = فرصة لخدمة تحسين الظهور في محركات الذكاء (GEO) وباقة قيادة السوق.\n- نتيجة عالية = فرصة لحمايتها بالسيو والمحتوى المستمر.\n- لا نعد بنسبة ظهور محددة؛ نعد بقياس شهري وتحسين موثق.\n\n## الحدود\n- ٦ فحوصات في الساعة لكل زائر. الاسم والقطاع والمدينة فقط، لا روابط تُتَّبع.\n- الدالة تعمل على طبقة LLM المشتركة (Anthropic ← Gemini ← OpenRouter) بنفس مفاتيح المساعد.',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

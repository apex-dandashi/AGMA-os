-- محرك التقييم الديناميكي (docs/16 — طلب المالك تفعيله الآن):
--   سؤال واحد يُخزن مرة: نصه وخياراته عامة، ودرجاته عمود محجوب عن الجمهور
--   (منح أعمدة كنمط payment_accounts) — الدرجة تُحسب في القاعدة عند الإدراج
--   ولا تصل أي نقاط إلى المتصفح إطلاقاً.
--   بنية: COMMON (ثقافة مهنية) + بنك تخصصي لكل دور (career_roles.assessment_bank).

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  bank text not null,
  sort int not null default 0,
  text_ar text not null,
  options jsonb not null,   -- [{"v":"A","label":"..."}] — عام
  scores jsonb not null,    -- {"A":0,"B":2,...} — لا يُمنح للجمهور
  created_at timestamptz not null default now()
);

alter table public.assessment_questions enable row level security;
grant select, insert, update, delete on public.assessment_questions
  to authenticated, service_role;
-- الجمهور: الأعمدة العامة فقط — عمود الدرجات غير ممنوح أصلاً
grant select (id, bank, sort, text_ar, options) on public.assessment_questions to anon;
create policy "questions: public reads" on public.assessment_questions
  for select to anon using (true);
create policy "questions: team reads" on public.assessment_questions
  for select to authenticated using (public.is_team());
create policy "questions: hr manages" on public.assessment_questions
  for all to authenticated
  using (public.is_admin() or public.app_role() = 'hr')
  with check (public.is_admin() or public.app_role() = 'hr');
create trigger assessment_questions_audit
  after insert or update or delete on public.assessment_questions
  for each row execute function public.audit_trigger();

alter table public.career_roles add column assessment_bank text;
alter table public.career_applications
  add column answers jsonb,
  add column score int,
  add column score_max int;

-- الدرجة تُحسب داخل القاعدة عند وصول الطلب — لا ثقة بأي حساب من المتصفح
create or replace function public.score_application()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_bank text; v_score int := 0; v_max int := 0; r record;
begin
  if new.answers is null or new.answers = '{}'::jsonb then
    return new;
  end if;
  select cr.assessment_bank into v_bank
    from public.career_roles cr
   where cr.id = coalesce(new.role_id,
     (select role_id from public.career_jobs j where j.id = new.job_id));
  for r in select q.id, q.scores from public.assessment_questions q
    where q.bank = 'COMMON' or q.bank = v_bank
  loop
    v_max := v_max + (select max((v.value)::int) from jsonb_each_text(r.scores) v);
    v_score := v_score + coalesce((r.scores ->> (new.answers ->> r.id::text))::int, 0);
  end loop;
  new.score := v_score;
  new.score_max := v_max;
  return new;
end;
$$;

create trigger career_applications_score
  before insert on public.career_applications
  for each row execute function public.score_application();

-- ---------------------------------------------------------------------------
-- ربط الأدوار المزروعة ببنوكها
-- ---------------------------------------------------------------------------
update public.career_roles set assessment_bank = b.bank
from (values
  ('AI/LLM Engineer', 'AI-LLM'), ('AI Agent Engineer', 'AI-LLM'),
  ('Automation Specialist', 'AUTOMATION'),
  ('Meta Ads Specialist', 'PAID-SOCIAL'), ('Google Ads Specialist', 'PPC'),
  ('Tracking & Analytics Specialist', 'CRO-ANALYTICS'),
  ('Technical SEO Specialist', 'SEO'), ('Arabic SEO Specialist', 'SEO'),
  ('Arabic Copywriter', 'CONTENT'), ('Bilingual Copywriter', 'CONTENT'),
  ('Social Media Manager', 'SOCIAL'), ('Content Creator', 'SOCIAL'),
  ('Community Manager', 'COMMUNITY'),
  ('Senior Graphic Designer', 'CREATIVE'), ('Brand Designer', 'CREATIVE'),
  ('Motion Designer', 'MOTION'),
  ('Frontend Developer', 'ENGINEERING'), ('E-Commerce Developer', 'ENGINEERING'),
  ('UI/UX Designer', 'UX-PRODUCT'),
  ('Marketing Strategy Consultant', 'STRATEGY'),
  ('Media Relations Specialist', 'PR'),
  ('Account Manager', 'ACCOUNT'), ('Digital Project Manager', 'PROJECT')
) as b(en, bank) where career_roles.title_en = b.en;

-- ---------------------------------------------------------------------------
-- البذور: الأسئلة (من docs/16 — الدراسة السادسة حرفياً)
-- خيار الدرجة ٤ هو الإجابة المهنية الناضجة؛ التوزيع يكشف الأنماط لا يخدعها.
-- ---------------------------------------------------------------------------
create or replace function public._seed_q(
  p_bank text, p_sort int, p_text text, p_opts text[], p_scores int[]
) returns void language plpgsql as $$
declare v_options jsonb := '[]'; v_scores jsonb := '{}'; i int;
begin
  for i in 1..array_length(p_opts, 1) loop
    v_options := v_options || jsonb_build_object('v', chr(64 + i), 'label', p_opts[i]);
    v_scores := v_scores || jsonb_build_object(chr(64 + i), p_scores[i]);
  end loop;
  insert into public.assessment_questions (bank, sort, text_ar, options, scores)
  values (p_bank, p_sort, p_text, v_options, v_scores);
end;
$$;

select public._seed_q('COMMON', 1,
  'عندما تواجه مهمة لم تنفذها سابقاً، ما أقرب أسلوب لك؟',
  array['أنتظر شخصاً يشرح لي كل الخطوات',
        'أبحث بسرعة وأنفذ أول حل أجده',
        'أفهم الهدف والقيود، أبحث، أبني فرضية، أختبر ثم أوثق النتيجة',
        'أستخدم الذكاء الاصطناعي وأرسل أول مخرج ينتجه'],
  array[0, 2, 4, 1]);
select public._seed_q('COMMON', 2,
  'كيف تستخدم أدوات الذكاء الاصطناعي في عملك؟',
  array['لا أستخدمها',
        'أستخدمها فقط لتسريع الكتابة',
        'أستخدمها للبحث والتفكير والتنفيذ مع التحقق البشري',
        'أعتمد على مخرجاتها دون مراجعة إذا بدت صحيحة'],
  array[0, 2, 4, 1]);
select public._seed_q('COMMON', 3,
  'إذا اكتشفت خطأ في تسليم تم إرساله للعميل، ماذا تفعل؟',
  array['أصلحه بصمت',
        'أنتظر حتى يكتشفه العميل',
        'أحدد الأثر، أبلغ المسؤول، أصحح الخطأ وأوثق سبب حدوثه ومنع تكراره',
        'أبحث عن الشخص المسؤول عنه'],
  array[2, 0, 4, 0]);

select public._seed_q('AI-LLM', 1,
  'ما أول قرار تتخذه قبل اختيار نموذج لغوي؟',
  array['اختيار أشهر نموذج',
        'فهم حالة الاستخدام والدقة المطلوبة والبيانات والتكلفة والاستجابة والمخاطر',
        'اختيار النموذج الأكبر دائماً',
        'اختيار الأرخص'],
  array[0, 4, 1, 1]);
select public._seed_q('AI-LLM', 2,
  'وكيل ذكاء اصطناعي يعطي إجابات مقنعة لكنها غير صحيحة. أفضل معالجة؟',
  array['زيادة Temperature',
        'تغيير تصميم الواجهة',
        'بناء مجموعة تقييم ثم تحسين Grounding/Retrieval/Prompts/Guardrails وقياس النتيجة',
        'إضافة عبارة «قد أخطئ»'],
  array[0, 0, 4, 1]);
select public._seed_q('AI-LLM', 3,
  'متى يكون RAG أكثر منطقية؟',
  array['عندما يحتاج النظام معرفة خاصة ومتغيرة يمكن استرجاعها من مصادر موثوقة',
        'في جميع التطبيقات',
        'فقط عندما لا يوجد API',
        'فقط لتقليل تكلفة التصميم'],
  array[4, 0, 0, 0]);
select public._seed_q('AI-LLM', 4,
  'كيف تتعامل مع بيانات العميل الحساسة في الـPrompt؟',
  array['أرسلها لأي API إذا كان أسرع',
        'أقلل البيانات، أراجع شروط المعالجة والأمن، وأستخدم معمارية معتمدة',
        'أحذف اسم العميل فقط',
        'لا توجد مشكلة لأن الذكاء الاصطناعي آمن دائماً'],
  array[0, 4, 1, 0]);

select public._seed_q('AUTOMATION', 1,
  'قبل أتمتة عملية يدوية، ماذا تفعل؟',
  array['أبني Workflow فوراً',
        'أوثق الوضع الحالي وأحدد المشغّل والمدخلات والاستثناءات والمالك والمخرج',
        'أنقل كل الخطوات كما هي',
        'أستخدم أكبر عدد ممكن من الأدوات'],
  array[0, 4, 2, 0]);
select public._seed_q('AUTOMATION', 2,
  'واجهة خارجية فشلت أثناء التشغيل. ماذا يجب أن يحدث؟',
  array['يتوقف الـWorkflow دون إشعار',
        'إعادة محاولة عشوائية إلى ما لا نهاية',
        'سياسة إعادة محاولة + معالجة أخطاء + سجلات + تنبيه + Idempotency عند الحاجة',
        'تجاهل الخطأ'],
  array[0, 1, 4, 0]);
select public._seed_q('AUTOMATION', 3,
  'ما أهم شيء في أتمتة ناجحة؟',
  array['عدد الخطوات',
        'شكل المخطط',
        'الاعتمادية والمراقبة وقابلية الصيانة والنتيجة التجارية',
        'استخدام أحدث أداة'],
  array[0, 0, 4, 1]);
select public._seed_q('AUTOMATION', 4,
  'بيانات دخلت مرتين بسبب إعادة المحاولة. ما المفهوم الذي تبحث عنه؟',
  array['CSS', 'Idempotency / إزالة التكرار', 'SEO', 'الضغط'],
  array[0, 4, 0, 0]);

select public._seed_q('PAID-SOCIAL', 1,
  'ارتفع معدل النقر وانخفض معدل التحويل. ما أول تفسير تختبره؟',
  array['الحملة ممتازة لأن النقر ارتفع',
        'عدم تطابق الإعلان أو الجمهور مع صفحة الهبوط أو جودة الزيارات',
        'نضاعف الميزانية مباشرة',
        'نوقف التتبع'],
  array[0, 4, 0, 0]);
select public._seed_q('PAID-SOCIAL', 2,
  'كيف تختبر تصميماً إعلانياً جديداً؟',
  array['أغيّر الجمهور والميزانية والتصميم معاً',
        'أثبّت المتغيرات للعزل وأقارن وفق فرضية واضحة',
        'أختار الأجمل فقط',
        'أشغّله يوماً واحداً دائماً'],
  array[0, 4, 0, 0]);
select public._seed_q('PAID-SOCIAL', 3,
  'ما الذي يهم أكثر عند تقييم حملة توليد عملاء؟',
  array['الإعجابات', 'مرات الظهور',
        'التكلفة وجودة العملاء والتحويل لفرص مؤهلة وإيراد',
        'المتابعون'],
  array[0, 0, 4, 0]);
select public._seed_q('PAID-SOCIAL', 4,
  'التكرار مرتفع والأداء يتراجع؛ الاحتمال الأقرب؟',
  array['إجهاد إبداعي (Creative Fatigue)', 'مشكلة SEO', 'خلل خادم', 'مشكلة هوية'],
  array[4, 0, 0, 0]);

select public._seed_q('PPC', 1,
  'أي عبارة بحث تستحق أن تكون كلمة سلبية غالباً؟',
  array['كلمة ذات نية عالية ومتطابقة مع الخدمة',
        'كلمة غير مرتبطة بالخدمة وتستهلك الإنفاق',
        'كلمة العلامة التجارية',
        'كلمة ذات معدل تحويل مرتفع'],
  array[0, 4, 0, 0]);
select public._seed_q('PPC', 2,
  'نقرات جيدة لكن لا تحويلات. من أين تبدأ؟',
  array['زيادة تكلفة النقرة',
        'مراجعة التتبع ثم نية البحث وصفحة الهبوط',
        'تغيير الشعار',
        'حذف كل الكلمات'],
  array[0, 4, 0, 0]);
select public._seed_q('PPC', 3,
  'ما الذي تقيسه بجانب عائد الإنفاق الإعلاني ROAS؟',
  array['الربحية والهامش والأثر الإضافي بحسب الحالة',
        'الإعجابات', 'عدد الإعلانات فقط', 'حجم الخط'],
  array[4, 0, 0, 0]);
select public._seed_q('PPC', 4,
  'المطابقة الواسعة تناسب أكثر عندما؟',
  array['لا يوجد تتبع تحويل',
        'توجد إشارات وتتبع جيد واستراتيجية مزايدة مناسبة ومراقبة لعبارات البحث',
        'الميزانية غير محدودة فقط',
        'دائماً'],
  array[0, 4, 1, 0]);

select public._seed_q('CRO-ANALYTICS', 1,
  'صفحة هبوط تستقبل زيارات كبيرة ولا تحوّل. أول خطوة؟',
  array['إعادة التصميم بالكامل فوراً',
        'تحديد القمع وبيانات السلوك ومناطق التسرب وبناء فرضية',
        'إضافة حركة وتأثيرات',
        'زيادة الإعلانات'],
  array[0, 4, 0, 0]);
select public._seed_q('CRO-ANALYTICS', 2,
  'اختبار A/B يجب أن يبدأ بـ؟',
  array['تخمين بصري', 'فرضية ومقياس نجاح واضح', 'النسخة «ب» أجمل', 'عدة تغييرات عشوائية'],
  array[0, 4, 0, 0]);
select public._seed_q('CRO-ANALYTICS', 3,
  'أرقام GA4 وCRM مختلفة. الأفضل؟',
  array['إجبار الرقمين على التطابق',
        'فهم الإسناد والهوية والتوقيت وتعريف مصدر الحقيقة',
        'حذف CRM',
        'استخدام رقم GA4 دائماً'],
  array[0, 4, 0, 0]);
select public._seed_q('CRO-ANALYTICS', 4,
  'الحدث المهم في GTM؟',
  array['يُسمّى دون معيار',
        'يجب أن يعكس فعلاً تجارياً وله تسمية وData Layer واضحان',
        'كل نقرة تصبح تحويلاً',
        'لا نحتاج توثيقاً'],
  array[0, 4, 0, 0]);

select public._seed_q('SEO', 1,
  'صفحة قوية لم تعد تظهر رغم عدم تغير المحتوى. أين تبدأ؟',
  array['كتابة خمس مقالات',
        'الفهرسة التقنية والزحف والإجراءات اليدوية وتغييرات القالب والداخلية ثم نية البحث',
        'شراء روابط خلفية مباشرة',
        'تغيير الشعار'],
  array[0, 4, 0, 0]);
select public._seed_q('SEO', 2,
  'متى تكون كلمة بحجم بحث أقل أفضل؟',
  array['عندما تكون نيتها التجارية وملاءمتها أعلى', 'أبداً', 'عندما تكون أطول فقط', 'إذا كانت بالإنجليزية'],
  array[4, 0, 1, 0]);
select public._seed_q('SEO', 3,
  'أفضل استراتيجية محتوى؟',
  array['نشر أكبر عدد من المقالات',
        'خريطة مواضيع ونوايا مرتبطة بالعرض ورحلة العميل والسلطة الموضوعية',
        'نسخ المنافس',
        'مخرجات ذكاء اصطناعي دون تحرير'],
  array[0, 4, 0, 0]);
select public._seed_q('SEO', 4,
  'ما الفرق في البحث بالذكاء الاصطناعي (AI Search)؟',
  array['لا فرق إطلاقاً',
        'يتطلب أيضاً وضوح الكيانات والمحتوى والإجابات والمصداقية والبنية القابلة للفهم',
        'الكلمات المفتاحية لم تعد مهمة نهائياً',
        'يكفي Schema'],
  array[0, 4, 1, 1]);

select public._seed_q('CONTENT', 1,
  'أول خطوة قبل كتابة صفحة خدمة؟',
  array['اختيار كلمات جميلة',
        'فهم الجمهور والنية والعرض والاعتراضات ودعوة الفعل',
        'توليد النص بالذكاء الاصطناعي',
        'كتابة ألفي كلمة'],
  array[0, 4, 0, 0]);
select public._seed_q('CONTENT', 2,
  'نسخة إعلانية ممتازة لكنها لا تحقق تحويلاً. ماذا تفعل؟',
  array['أصر أنها ممتازة',
        'أختبر تطابق الرسالة مع السوق والعرض ودعوة الفعل وسياق صفحة الهبوط',
        'أطيلها',
        'أضيف رموزاً تعبيرية'],
  array[0, 4, 0, 0]);
select public._seed_q('CONTENT', 3,
  'الذكاء الاصطناعي أنشأ معلومة غير مؤكدة.',
  array['ننشرها إذا بدت منطقية',
        'نتحقق من مصدر موثوق أو نحذف الادعاء',
        'نغير صياغتها فقط',
        'ننسبها للذكاء الاصطناعي'],
  array[0, 4, 1, 0]);
select public._seed_q('CONTENT', 4,
  'أفضل Brief للمحتوى يحتوي؟',
  array['العنوان فقط',
        'الهدف والجمهور والنية والرسالة والإثبات ودعوة الفعل والنبرة والقيود',
        'عدد الكلمات فقط',
        'كلمات المنافس فقط'],
  array[0, 4, 0, 0]);

select public._seed_q('SOCIAL', 1,
  'منشور حصل على وصول كبير دون أي أثر تجاري. التفسير؟',
  array['ناجح دائماً',
        'نقيّم الهدف والجمهور وجودة التفاعل والأفعال اللاحقة',
        'نضاعف نفس المنشور',
        'نوقف المحتوى'],
  array[0, 4, 0, 0]);
select public._seed_q('SOCIAL', 2,
  'كيف تختار المنصة؟',
  array['الأكثر شهرة',
        'بناءً على الجمهور والسلوك والهدف ونوع المحتوى',
        'تيك توك دائماً',
        'كل المنصات بنفس المحتوى'],
  array[0, 4, 0, 0]);
select public._seed_q('SOCIAL', 3,
  'تعليق سلبي منطقي من عميل.',
  array['نحذفه', 'ندافع عن الشركة',
        'نعترف بالمشكلة ونرد باحترام وننقل التفاصيل للقناة المناسبة',
        'نتجاهله'],
  array[0, 0, 4, 1]);
select public._seed_q('SOCIAL', 4,
  'ترند مشهور لكنه لا يناسب العلامة.',
  array['نستخدمه مهما كان', 'نقيّم ملاءمته للعلامة أولاً', 'ننسخه', 'نستخدمه بعد أسبوع'],
  array[0, 4, 0, 0]);

select public._seed_q('COMMUNITY', 1,
  'رسالة غاضبة وصلت في الخاص.',
  array['قالب رد عام',
        'نفهم الحالة ونعترف بالمشكلة ونجمع الحد الأدنى من التفاصيل ونصعّدها حسب الاتفاق',
        'لقطة شاشة داخلية للضحك',
        'لا نرد'],
  array[0, 4, 0, 0]);
select public._seed_q('COMMUNITY', 2,
  'ما أهم مؤشر للمجتمع؟',
  array['المتابعون فقط',
        'جودة وتكرار المشاركة وسلامة المجتمع وارتباطها بالهدف',
        'عدد المنشورات',
        'عدد الرموز التعبيرية'],
  array[0, 4, 0, 0]);
select public._seed_q('COMMUNITY', 3,
  'متى تصعّد تعليقاً؟',
  array['لا نصعّد شيئاً',
        'عند مخاطر سمعة أو قانون أو سلامة أو خصوصية أو عميل حساس وفق مصفوفة',
        'أي تعليق سلبي',
        'فقط إذا انتشر'],
  array[0, 4, 1, 1]);
select public._seed_q('COMMUNITY', 4,
  'كيف تحافظ على صوت العلامة؟',
  array['نسخ ولصق نفس الرد',
        'إرشادات + سياق + حكم بشري',
        'ردود آلية بالكامل',
        'كل موظف بأسلوبه'],
  array[0, 4, 1, 0]);

select public._seed_q('CREATIVE', 1,
  'وصلك Brief ضعيف من العميل.',
  array['نبدأ التصميم',
        'نحوّله إلى Brief إبداعي واضح بالأهداف والجمهور والرسالة والقيود',
        'ننسخ منافساً',
        'نسأل عن اللون المفضل فقط'],
  array[0, 4, 0, 0]);
select public._seed_q('CREATIVE', 2,
  'تصميم جميل لكنه لا يحقق الهدف.',
  array['التصميم ناجح لأنه جميل',
        'التصميم وسيلة ويجب أن يخدم التسلسل البصري والرسالة والفعل',
        'نضيف حركة',
        'نزيد الألوان'],
  array[0, 4, 0, 0]);
select public._seed_q('CREATIVE', 3,
  'كيف تقدم الاتجاهات الإبداعية للعميل؟',
  array['صور دون شرح',
        'أربط كل اتجاه بالاستراتيجية والسبب والتطبيق',
        'أقول: هذا الذي أحببناه',
        'أعرض عشرين خياراً'],
  array[0, 4, 0, 0]);
select public._seed_q('CREATIVE', 4,
  'ملاحظة من العميل تناقض نظام الهوية.',
  array['ننفذها بصمت',
        'نفهم هدفه ونوضح الأثر ونقترح بديلاً يحقق الغرض',
        'نرفضها',
        'نشتكي داخلياً'],
  array[0, 4, 1, 0]);

select public._seed_q('MOTION', 1,
  'قبل إنتاج فيديو حملة؟',
  array['الحركة مباشرة',
        'الهدف ثم الجمهور ثم النص ثم القصة المصورة ثم خطة الإنتاج',
        'اختيار الموسيقى',
        'الانتقالات'],
  array[0, 4, 0, 0]);
select public._seed_q('MOTION', 2,
  'الفيديو ممتاز بصرياً لكن الاحتفاظ بالمشاهدين ضعيف.',
  array['لا مشكلة',
        'نراجع الخطاف والإيقاع والبنية وسياق المنصة',
        'نزيد الدقة',
        'نكبّر الشعار'],
  array[0, 4, 0, 0]);
select public._seed_q('MOTION', 3,
  'أفضل مسار للمراجعات؟',
  array['رسائل واتساب',
        'مراجعة بإصدارات مع توقيت الملاحظة والمعتمد والحالة',
        'ملاحظات صوتية فقط',
        'ملفات مختلفة دون تسمية'],
  array[0, 4, 0, 0]);
select public._seed_q('MOTION', 4,
  'حقوق الموسيقى والمواد؟',
  array['ليست مسؤولية الإنتاج',
        'يجب التحقق من الترخيص وحقوق الاستخدام قبل النشر',
        'أي شيء على الإنترنت مجاني',
        'فقط للتلفزيون'],
  array[0, 4, 0, 0]);

select public._seed_q('UX-PRODUCT', 1,
  'أول خطوة في تصميم منتج جديد؟',
  array['فتح Figma',
        'فهم المستخدم والمشكلة والهدف والسياق والقيود',
        'اختيار UI Kit',
        'تصميم الصفحة الرئيسية'],
  array[0, 4, 0, 0]);
select public._seed_q('UX-PRODUCT', 2,
  'صاحب مصلحة يطلب ميزة دون دليل.',
  array['نبنيها',
        'نفهم المشكلة ونختبر الافتراض ونحدد القيمة والتكلفة',
        'نرفضها',
        'نضعها في قائمة الانتظار للأبد'],
  array[0, 4, 1, 1]);
select public._seed_q('UX-PRODUCT', 3,
  'هدف نظام التصميم (Design System)؟',
  array['جعل كل الشاشات متطابقة فقط',
        'الاتساق وقابلية التوسع وتسريع التصميم والتطوير بقواعد واضحة',
        'اختيار ألوان',
        'إلغاء المصممين'],
  array[0, 4, 0, 0]);
select public._seed_q('UX-PRODUCT', 4,
  'كيف تتأكد من جودة التجربة؟',
  array['رأي المصمم', 'بحث واختبار وبيانات حسب المرحلة', 'رأي المدير', 'Behance'],
  array[0, 4, 0, 0]);

select public._seed_q('ENGINEERING', 1,
  'ميزة تعمل محلياً وفشلت في الإنتاج. البداية؟',
  array['إعادة كتابة النظام',
        'السجلات والبيئة والنشر والتبعيات والمراقبة',
        'تغيير الإطار',
        'إخفاء الخطأ'],
  array[0, 4, 0, 0]);
select public._seed_q('ENGINEERING', 2,
  'ماذا تفضل في المعمارية؟',
  array['الأكثر تعقيداً',
        'أبسط معمارية تلبي المتطلبات وقابلة للصيانة والتوسع المطلوب',
        'Microservices دائماً',
        'أحدث إطار'],
  array[0, 4, 1, 0]);
select public._seed_q('ENGINEERING', 3,
  'أين تُحفظ المفاتيح والأسرار؟',
  array['في الكود المصدري',
        'إدارة بيئة وأسرار بصلاحيات مناسبة',
        'في الواجهة',
        'في README'],
  array[0, 4, 0, 0]);
select public._seed_q('ENGINEERING', 4,
  'قبل الدمج (Merge)؟',
  array['«يعمل عندي» يكفي',
        'مراجعة واختبارات وفحوص أمان وقبول مناسبة',
        'دمج مباشرة',
        'إزالة الاختبارات لتسريع النشر'],
  array[0, 4, 0, 0]);

select public._seed_q('STRATEGY', 1,
  'عميل يقول: «نريد انتشاراً». أول رد؟',
  array['نبدأ بالمؤثرين',
        'نحدد ماذا يعني النجاح تجارياً ولمن ومتى وكيف يقاس',
        'نزيد المنشورات',
        'نشتري وصولاً'],
  array[0, 4, 0, 0]);
select public._seed_q('STRATEGY', 2,
  'الاستراتيجية الجيدة تحتوي؟',
  array['قائمة أفكار',
        'تشخيص وخيارات وأولويات وأفعال ومقاييس',
        'عرض تقديمي جميل',
        'أكبر عدد من القنوات'],
  array[0, 4, 0, 0]);
select public._seed_q('STRATEGY', 3,
  'منافس يقدم أسعاراً أقل.',
  array['نخفض السعر',
        'نحلل التموضع والقيمة والشرائح واقتصاديات الوحدة قبل الرد',
        'نقلده',
        'نتجاهله دائماً'],
  array[0, 4, 0, 0]);
select public._seed_q('STRATEGY', 4,
  'متى ترفض توصية يحبها العميل؟',
  array['أبداً',
        'إذا تعارضت مع الدليل أو المخاطر أو الهدف، مع شرح بديل أفضل',
        'دائماً',
        'حسب المزاج'],
  array[0, 4, 0, 0]);

select public._seed_q('PR', 1,
  'خبر سلبي بدأ ينتشر. أول خطوة؟',
  array['إصدار بيان طويل مباشرة',
        'التحقق من الوقائع وتقييم الأثر والتصعيد ورد مؤقت عند الحاجة',
        'حذف التعليقات',
        'مهاجمة المصدر'],
  array[0, 4, 0, 0]);
select public._seed_q('PR', 2,
  'البيان الصحفي الجيد؟',
  array['مدح الشركة',
        'زاوية خبرية ووقائع موثقة ورسالة واضحة ومواد إعلامية قابلة للاستخدام',
        'أكبر عدد كلمات',
        'اقتباسات كثيرة'],
  array[0, 4, 0, 0]);
select public._seed_q('PR', 3,
  'صحفي يسأل سؤالاً لا تعرف إجابته.',
  array['أخمّن',
        'أقول إنني سأتحقق وأعود بمعلومة معتمدة',
        'لا أرد أبداً',
        'أحوّل الموضوع'],
  array[0, 4, 0, 1]);
select public._seed_q('PR', 4,
  'كيف تقيس العلاقات العامة؟',
  array['عدد القصاصات فقط',
        'الوصول والجودة ونفاذ الرسالة والانطباع والهدف التجاري حسب الحملة',
        'الإعجابات',
        'AVE فقط في كل حالة'],
  array[0, 4, 0, 1]);

select public._seed_q('ACCOUNT', 1,
  'العميل يطلب عملاً خارج النطاق ويقول «بسيط».',
  array['ننفذه دائماً',
        'نفهم الحاجة ثم نوثق التغيير وأثره على الوقت والتكلفة عند الحاجة',
        'نرفض فوراً',
        'نتجاهل'],
  array[0, 4, 1, 0]);
select public._seed_q('ACCOUNT', 2,
  'مشروع متأخر بسبب اعتماد العميل.',
  array['نتحمل المسؤولية كاملة',
        'نوثق الاعتماد المعلق وأثره ونحدّث الجدول ونتواصل مبكراً',
        'ننتظر',
        'نلوم العميل في المجموعة'],
  array[0, 4, 0, 0]);
select public._seed_q('ACCOUNT', 3,
  'خدمة العملاء الممتازة؟',
  array['قول نعم دائماً',
        'وضوح وملكية وتوقع مخاطر وإدارة توقعات وقيمة',
        'سرعة الرد فقط',
        'اجتماعات كثيرة'],
  array[0, 4, 1, 0]);
select public._seed_q('ACCOUNT', 4,
  'العميل غاضب.',
  array['ندافع',
        'نستمع ونفصل الوقائع عن الانفعال ونحدد مسؤول الإجراء والموعد',
        'نحوّله للمدير فوراً دون فهم',
        'نتجاهل'],
  array[0, 4, 1, 0]);

select public._seed_q('PROJECT', 1,
  'مهمة حرجة تأخرت.',
  array['نخفيها حتى الاجتماع',
        'نحدد الأثر والاعتماديات والخيارات ونصعّد مبكراً',
        'نضيف أشخاصاً دائماً',
        'نغير الموعد دون توثيق'],
  array[0, 4, 1, 0]);
select public._seed_q('PROJECT', 2,
  'ما هو زحف النطاق (Scope Creep)؟',
  array['كل طلب جديد',
        'توسع غير معتمد في المتطلبات يؤثر على النطاق والوقت والتكلفة',
        'كل ملاحظة',
        'كل خلل'],
  array[0, 4, 0, 0]);
select public._seed_q('PROJECT', 3,
  'سجل المخاطر يفيد؟',
  array['بعد وقوع المشكلة',
        'بتحديد المخاطر واحتمالها وأثرها ومالكها وخطة تخفيفها قبل وقوعها',
        'المشاريع الحكومية فقط',
        'للتدقيق فقط'],
  array[0, 4, 0, 0]);
select public._seed_q('PROJECT', 4,
  'إغلاق المشروع؟',
  array['إرسال آخر ملف',
        'قبول وإغلاق مالي وتسليم ودروس مستفادة وسجلات',
        'الفاتورة فقط',
        'اجتماع'],
  array[0, 4, 0, 0]);

drop function public._seed_q(text, int, text, text[], int[]);

-- =============================================================================
-- Phase 1c: catalog seeds — 8 categories, 32 services, 8 playbooks with
-- stages/task templates/KPIs (docs/03), role_profiles (docs/06 §4).
-- AR names sourced from the live site where present; docs/03 is the canonical
-- service list (site divergences noted in docs/PROGRESS.md).
-- =============================================================================

-- 8 categories (AR names = live site section titles)
insert into public.service_categories (slug, name_ar, name_en, sort) values
  ('ai-automation',        'الذكاء الاصطناعي والأتمتة',   'AI & Automation', 1),
  ('performance-marketing','التسويق الأدائي والإعلانات',  'Performance Marketing', 2),
  ('seo-content',          'السيو والمحتوى',              'SEO & Content', 3),
  ('social-media',         'السوشال ميديا والمجتمعات',    'Social & Communities', 4),
  ('branding-creative',    'الهوية والتصميم الإبداعي',    'Branding & Creative', 5),
  ('web-digital',          'الويب والمنتجات الرقمية',     'Web & Digital Products', 6),
  ('strategy-consulting',  'الاستراتيجية والاستشارات',    'Strategy & Consulting', 7),
  ('pr-media',             'العلاقات العامة والإعلام',    'PR & Media', 8)
on conflict (slug) do nothing;

-- 32 services (docs/03 category service lists)
insert into public.services_catalog (category_id, slug, name_ar, name_en, sort)
select c.id, v.slug, v.ar, v.en, v.ord
from (values
  -- AI & Automation (5)
  ('ai-automation', 'ai-agents',            'بناء وكلاء AI متخصصين',                        'Custom AI Agents', 1),
  ('ai-automation', 'workflow-automation',  'أتمتة العمليات (Workflow)',                    'Workflow Automation', 2),
  ('ai-automation', 'chatbots',             'روبوتات المحادثة الذكية',                      'AI Chatbots', 3),
  ('ai-automation', 'geo',                  'التصدر في محركات البحث الذكية (GEO)',          'Generative Engine Optimization (GEO)', 4),
  ('ai-automation', 'predictive-analytics', 'التحليلات التنبؤية',                           'Predictive Analytics', 5),
  -- Performance Marketing (4)
  ('performance-marketing', 'paid-social',  'إعلانات السوشال المدفوعة',                     'Paid Social Ads', 1),
  ('performance-marketing', 'google-ads',   'إعلانات جوجل',                                 'Google Ads', 2),
  ('performance-marketing', 'programmatic', 'الإعلانات البرمجية',                           'Programmatic Advertising', 3),
  ('performance-marketing', 'cro',          'تحسين معدل التحويل',                           'Conversion Rate Optimization (CRO)', 4),
  -- SEO & Content (4)
  ('seo-content', 'seo-audit',    'تدقيق سيو شامل',            'Technical SEO Audit', 1),
  ('seo-content', 'arabic-seo',   'سيو عربي متخصص',            'Arabic SEO', 2),
  ('seo-content', 'ai-content',   'إنتاج المحتوى بالـ AI',     'AI-Accelerated Content Production', 3),
  ('seo-content', 'copywriting',  'الكتابة الإعلانية',         'Creative Copywriting', 4),
  -- Social & Communities (4)
  ('social-media', 'social-management',    'إدارة السوشال ميديا',        'Social Media Management', 1),
  ('social-media', 'influencer-marketing', 'التسويق عبر المؤثرين',       'KOL & Influencer Marketing', 2),
  ('social-media', 'social-strategy',      'استراتيجية السوشال ميديا',   'Social Media Strategy', 3),
  ('social-media', 'community-management', 'إدارة المجتمعات الرقمية',    'Community Management', 4),
  -- Branding & Creative (5)
  ('branding-creative', 'brand-strategy',   'استراتيجية العلامة',              'Brand Strategy', 1),
  ('branding-creative', 'logo-identity',    'تصميم الشعار والهوية',            'Logo & Visual Identity Design', 2),
  ('branding-creative', 'brand-guidelines', 'دليل الهوية البصرية',             'Brand Guidelines Book', 3),
  ('branding-creative', 'motion-graphics',  'الموشن جرافيك والإنتاج المرئي',   'Motion Graphics & Animation', 4),
  ('branding-creative', 'packaging-print',  'تصميم التغليف والمطبوعات',        'Packaging & Print Design', 5),
  -- Web & Digital Products (4)
  ('web-digital', 'websites',      'تصميم وتطوير المواقع',      'Website Design & Development', 1),
  ('web-digital', 'ecommerce',     'المتاجر الإلكترونية',       'E-commerce (Salla, Zid, Shopify)', 2),
  ('web-digital', 'ux-design',     'تصميم واجهات التطبيقات',    'App UI/UX Design', 3),
  ('web-digital', 'landing-pages', 'صفحات الهبوط واختبارات A/B','Landing Pages & A/B Testing', 4),
  -- Strategy & Consulting (3)
  ('strategy-consulting', 'marketing-strategy',        'الاستراتيجية التسويقية الشاملة',    'Full Marketing Strategy', 1),
  ('strategy-consulting', 'transformation-consulting', 'استشارات التحول الرقمي والـ AI',    'Digital & AI Transformation Consulting', 2),
  ('strategy-consulting', 'market-research',           'أبحاث ودراسات السوق',               'Market Research', 3),
  -- PR & Media (3)
  ('pr-media', 'pr-media-management', 'العلاقات العامة وإدارة الإعلام', 'PR & Media Management', 1),
  ('pr-media', 'media-buying',        'الشراء الإعلامي',                'Media Buying', 2),
  ('pr-media', 'event-marketing',     'تسويق الفعاليات',                'Event Marketing', 3)
) as v(cat, slug, ar, en, ord)
join public.service_categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- 8 playbooks (mode per docs/03 §How-this-changes; ai/pr assignments noted in PROGRESS)
insert into public.playbooks (category_id, slug, name_ar, mode)
select c.id, c.slug, c.name_ar, v.mode::public.project_mode
from (values
  ('ai-automation', 'milestone'),
  ('performance-marketing', 'recurring'),
  ('seo-content', 'recurring'),
  ('social-media', 'recurring'),
  ('branding-creative', 'milestone'),
  ('web-digital', 'milestone'),
  ('strategy-consulting', 'milestone'),
  ('pr-media', 'recurring')
) as v(slug, mode)
join public.service_categories c on c.slug = v.slug
on conflict (slug) do nothing;

-- Stages (docs/03 workflow tables, order preserved)
insert into public.playbook_stages (playbook_id, method_phase, name_ar, name_en, sort)
select p.id, v.phase::public.method_phase, v.ar, v.en, v.ord
from (values
  ('ai-automation', 'analyze',  'تدقيق العمليات',          'Process audit', 1),
  ('ai-automation', 'analyze',  'دراسة الجدوى',            'Feasibility', 2),
  ('ai-automation', 'generate', 'البناء والتطوير',         'Build', 3),
  ('ai-automation', 'market',   'النشر والتشغيل',          'Deploy', 4),
  ('ai-automation', 'adapt',    'المراقبة والتوسع',        'Monitor & scale', 5),

  ('performance-marketing', 'analyze',  'تدقيق الحسابات والجمهور', 'Account & audience audit', 1),
  ('performance-marketing', 'generate', 'بناء الحملات',            'Campaign build', 2),
  ('performance-marketing', 'market',   'الإطلاق',                 'Launch', 3),
  ('performance-marketing', 'adapt',    'التحسين الأسبوعي',        'Optimize (weekly cycle)', 4),

  ('seo-content', 'analyze',  'التدقيق الشامل',        'Full audit', 1),
  ('seo-content', 'analyze',  'استراتيجية المحتوى',    'Content strategy', 2),
  ('seo-content', 'generate', 'الإنتاج',               'Production', 3),
  ('seo-content', 'market',   'النشر',                 'Publish', 4),
  ('seo-content', 'adapt',    'التتبع والتحديث',       'Rank & refresh', 5),

  ('social-media', 'analyze',  'تدقيق الحضور الرقمي',  'Presence audit', 1),
  ('social-media', 'generate', 'التقويم الشهري',       'Content calendar', 2),
  ('social-media', 'market',   'النشر والتفاعل',       'Publish & engage', 3),
  ('social-media', 'adapt',    'المراجعة الشهرية',     'Review', 4),

  ('branding-creative', 'analyze',  'الاستكشاف',   'Discovery', 1),
  ('branding-creative', 'generate', 'التصورات',    'Concepts', 2),
  ('branding-creative', 'generate', 'التطوير',     'Refinement', 3),
  ('branding-creative', 'market',   'التسليم',     'Delivery', 4),
  ('branding-creative', 'adapt',    'التوسع',      'Extension', 5),

  ('web-digital', 'analyze',  'اكتشاف تجربة المستخدم', 'UX discovery', 1),
  ('web-digital', 'generate', 'التصميم',               'Design', 2),
  ('web-digital', 'generate', 'التطوير',               'Build', 3),
  ('web-digital', 'market',   'الإطلاق',               'Launch', 4),
  ('web-digital', 'adapt',    'التحسين',               'Optimize', 5),

  ('strategy-consulting', 'analyze',  'البحث والتحليل',      'Research', 1),
  ('strategy-consulting', 'generate', 'بناء الاستراتيجية',   'Strategy build', 2),
  ('strategy-consulting', 'market',   'التسليم والتفعيل',    'Handover', 3),
  ('strategy-consulting', 'adapt',    'المراجعة الربعية',    'Quarterly review', 4),

  ('pr-media', 'analyze',  'تدقيق السمعة',         'Reputation audit', 1),
  ('pr-media', 'generate', 'الرسائل الإعلامية',    'Messaging', 2),
  ('pr-media', 'market',   'التنفيذ',              'Execute', 3),
  ('pr-media', 'adapt',    'القياس',               'Measure', 4)
) as v(slug, phase, ar, en, ord)
join public.playbooks p on p.slug = v.slug
on conflict (playbook_id, sort) do nothing;

-- Task templates: docs/03 key tasks split per stage; approval gates become
-- needs_client_approval=true rows. role: strategy/analysis → strategist,
-- production/build → executor. default_days are starting estimates.
insert into public.task_templates
  (stage_id, title_ar, title_en, role, default_days, needs_client_approval, sort)
select s.id, v.ar, v.en, v.role::public.user_role, v.days, v.gate, v.ord
from (values
  -- ai-automation / 1 Process audit
  ('ai-automation', 1, 'رسم خرائط العمليات اليدوية والمتكررة', 'Map manual/repetitive workflows', 'strategist', 4, false, 1),
  ('ai-automation', 1, 'قياس الساعات المستهلكة لكل عملية', 'Quantify hours spent per process', 'strategist', 2, false, 2),
  ('ai-automation', 1, 'اعتماد قائمة أهداف الأتمتة', 'Automation targets list sign-off', 'strategist', 1, true, 3),
  -- ai-automation / 2 Feasibility
  ('ai-automation', 2, 'فحص الوصول إلى البيانات', 'Data access check', 'executor', 2, false, 1),
  ('ai-automation', 2, 'اختيار الأدوات والتقنيات', 'Tool selection', 'strategist', 2, false, 2),
  ('ai-automation', 2, 'تقدير العائد على الاستثمار', 'ROI estimate', 'strategist', 2, false, 3),
  -- ai-automation / 3 Build
  ('ai-automation', 3, 'تطوير الوكيل/البوت/التدفق', 'Agent/bot/flow development', 'executor', 10, false, 1),
  ('ai-automation', 3, 'تصميم الموجهات والمنطق', 'Prompt & logic design', 'executor', 4, false, 2),
  ('ai-automation', 3, 'الاختبار الداخلي', 'Internal testing', 'executor', 3, false, 3),
  -- ai-automation / 4 Deploy
  ('ai-automation', 4, 'النشر على بيئة التجربة', 'Staging deployment', 'executor', 2, false, 1),
  ('ai-automation', 4, 'اعتماد اختبار القبول (UAT)', 'Client UAT sign-off', 'strategist', 3, true, 2),
  ('ai-automation', 4, 'اعتماد الإطلاق للإنتاج', 'Production go-live approval', 'strategist', 1, true, 3),
  ('ai-automation', 4, 'تدريب فريق العميل', 'Client team training', 'executor', 2, false, 4),
  -- ai-automation / 5 Monitor & scale
  ('ai-automation', 5, 'تتبع دقة النظام', 'Accuracy tracking', 'executor', 5, false, 1),
  ('ai-automation', 5, 'معالجة الحالات الاستثنائية', 'Edge-case fixes', 'executor', 5, false, 2),
  ('ai-automation', 5, 'التوسع للعملية التالية', 'Expand to next process', 'strategist', 3, false, 3),

  -- performance-marketing / 1 Audit
  ('performance-marketing', 1, 'فحص البكسل والتتبع', 'Pixel/tracking check', 'executor', 2, false, 1),
  ('performance-marketing', 1, 'تحليل شرائح الجمهور', 'Audience segments analysis', 'strategist', 3, false, 2),
  ('performance-marketing', 1, 'تحليل إعلانات المنافسين', 'Competitor ad intel', 'strategist', 2, false, 3),
  -- performance-marketing / 2 Build
  ('performance-marketing', 2, 'اعتماد الخطة الإعلامية والميزانية', 'Media plan & budget approval', 'strategist', 2, true, 1),
  ('performance-marketing', 2, 'إنتاج المواد الإبداعية', 'Creative production', 'executor', 5, false, 2),
  ('performance-marketing', 2, 'اعتماد المواد الإبداعية', 'Creatives approval', 'strategist', 1, true, 3),
  ('performance-marketing', 2, 'كتابة نسخ الإعلانات', 'Copy variants', 'executor', 2, false, 4),
  ('performance-marketing', 2, 'هيكلة الحملات ومواءمة صفحات الهبوط', 'Campaign structure & landing alignment', 'executor', 3, false, 5),
  -- performance-marketing / 3 Launch
  ('performance-marketing', 3, 'ضبط وتيرة الميزانية', 'Budget pacing setup', 'executor', 1, false, 1),
  ('performance-marketing', 3, 'تفعيل اختبارات A/B', 'A/B structure live', 'executor', 1, false, 2),
  ('performance-marketing', 3, 'التحقق من التتبع', 'Tracking verified', 'executor', 1, false, 3),
  -- performance-marketing / 4 Optimize
  ('performance-marketing', 4, 'إيقاف الإعلانات الضعيفة', 'Kill weak variants', 'executor', 1, false, 1),
  ('performance-marketing', 4, 'توسيع الإعلانات الرابحة', 'Scale winners', 'executor', 1, false, 2),
  ('performance-marketing', 4, 'اعتماد إعادة توزيع الميزانية', 'Budget reallocation approval', 'strategist', 1, true, 3),
  ('performance-marketing', 4, 'اختبارات تحسين التحويل', 'CRO tests', 'executor', 3, false, 4),

  -- seo-content / 1 Full audit
  ('seo-content', 1, 'الزحف التقني الشامل', 'Technical crawl', 'executor', 3, false, 1),
  ('seo-content', 1, 'بحث الكلمات المفتاحية العربية', 'Arabic keyword research', 'strategist', 4, false, 2),
  ('seo-content', 1, 'تحليل فجوات المنافسين', 'Competitor gap analysis', 'strategist', 3, false, 3),
  -- seo-content / 2 Content strategy
  ('seo-content', 2, 'اعتماد خطة الكلمات والمواضيع', 'Keyword/topic plan approval', 'strategist', 1, true, 1),
  ('seo-content', 2, 'بناء العناقيد الموضوعية', 'Topic clusters', 'strategist', 3, false, 2),
  ('seo-content', 2, 'اعتماد تقويم المحتوى', 'Content calendar approval', 'strategist', 1, true, 3),
  ('seo-content', 2, 'تحديد أهداف الظهور في محركات الذكاء (GEO)', 'GEO visibility targets', 'strategist', 2, false, 4),
  -- seo-content / 3 Production
  ('seo-content', 3, 'مقالات بمسودة AI وتحرير بشري', 'AI-drafted + human-edited articles', 'executor', 10, false, 1),
  ('seo-content', 3, 'اعتماد دفعة المحتوى الشهرية', 'Monthly content batch approval', 'strategist', 2, true, 2),
  ('seo-content', 3, 'إصلاحات On-page', 'On-page fixes', 'executor', 3, false, 3),
  ('seo-content', 3, 'الربط الداخلي', 'Internal linking', 'executor', 2, false, 4),
  -- seo-content / 4 Publish
  ('seo-content', 4, 'النشر عبر نظام إدارة المحتوى', 'CMS publishing', 'executor', 2, false, 1),
  ('seo-content', 4, 'الفهرسة والتوزيع', 'Indexing & distribution', 'executor', 2, false, 2),
  -- seo-content / 5 Rank & refresh
  ('seo-content', 5, 'تتبع الترتيب', 'Rank tracking', 'executor', 2, false, 1),
  ('seo-content', 5, 'قائمة تحديث المحتوى', 'Content refresh queue', 'executor', 3, false, 2),
  ('seo-content', 5, 'توسيع العناقيد الجديدة', 'New cluster expansion', 'strategist', 3, false, 3),

  -- social-media / 1 Presence audit
  ('social-media', 1, 'فحص صحة الحسابات', 'Account health check', 'executor', 2, false, 1),
  ('social-media', 1, 'تحليل الجمهور والمنافسين', 'Audience & competitor benchmarking', 'strategist', 3, false, 2),
  ('social-media', 1, 'اعتماد الاستراتيجية وصوت العلامة', 'Strategy & voice approval', 'strategist', 2, true, 3),
  -- social-media / 2 Content calendar
  ('social-media', 2, 'اعتماد التقويم الشهري', 'Monthly calendar approval', 'strategist', 2, true, 1),
  ('social-media', 2, 'إنتاج التصاميم والنصوص', 'Design + copy production', 'executor', 7, false, 2),
  ('social-media', 2, 'اعتماد قائمة المؤثرين', 'Influencer selections approval', 'strategist', 2, true, 3),
  -- social-media / 3 Publish & engage
  ('social-media', 3, 'جدولة النشر', 'Scheduled posting', 'executor', 1, false, 1),
  ('social-media', 3, 'التفاعل اليومي مع المجتمع', 'Daily community engagement', 'executor', 20, false, 2),
  ('social-media', 3, 'تفعيل حملات المؤثرين', 'Influencer activations', 'executor', 5, false, 3),
  -- social-media / 4 Review
  ('social-media', 4, 'تحليل التفاعل', 'Engagement analysis', 'strategist', 2, false, 1),
  ('social-media', 4, 'تجارب صيغ جديدة', 'Format experiments', 'executor', 2, false, 2),
  ('social-media', 4, 'تقويم الشهر القادم من البيانات', 'Next month calendar from data', 'strategist', 2, false, 3),

  -- branding-creative / 1 Discovery
  ('branding-creative', 1, 'استبيان العلامة التجارية', 'Brand questionnaire', 'strategist', 2, false, 1),
  ('branding-creative', 1, 'تدقيق بصري للسوق والمنافسين', 'Market/competitor visual audit', 'strategist', 3, false, 2),
  ('branding-creative', 1, 'اعتماد التموضع', 'Positioning approval', 'strategist', 2, true, 3),
  -- branding-creative / 2 Concepts
  ('branding-creative', 2, 'تطوير 2–3 اتجاهات للهوية', '2–3 identity directions', 'executor', 7, false, 1),
  ('branding-creative', 2, 'اعتماد الاتجاه الإبداعي', 'Concept direction approval (1 of 3)', 'strategist', 2, true, 2),
  -- branding-creative / 3 Refinement
  ('branding-creative', 3, 'تطوير الاتجاه المختار', 'Develop chosen direction', 'executor', 5, false, 1),
  ('branding-creative', 3, 'جولات المراجعة (بحد أقصى 2)', 'Revision rounds (capped at 2)', 'executor', 4, false, 2),
  ('branding-creative', 3, 'اعتماد الهوية النهائية', 'Final identity approval', 'strategist', 2, true, 3),
  -- branding-creative / 4 Delivery
  ('branding-creative', 4, 'إعداد دليل الهوية الكامل', 'Full guideline document', 'executor', 5, false, 1),
  ('branding-creative', 4, 'اعتماد دليل الهوية', 'Guideline doc approval', 'strategist', 1, true, 2),
  ('branding-creative', 4, 'حزمة الأصول والتطبيقات', 'Asset package & applications', 'executor', 3, false, 3),
  -- branding-creative / 5 Extension
  ('branding-creative', 5, 'تطبيقات جديدة مع نمو العلامة', 'New applications as brand scales', 'executor', 5, false, 1),

  -- web-digital / 1 UX discovery
  ('web-digital', 1, 'مسارات المستخدم وخريطة الموقع', 'User flows & sitemap', 'strategist', 3, false, 1),
  ('web-digital', 1, 'المتطلبات التقنية وأهداف الأداء', 'Tech requirements & performance targets', 'strategist', 2, false, 2),
  ('web-digital', 1, 'اعتماد خريطة الموقع والهيكل', 'Sitemap & wireframes approval', 'strategist', 2, true, 3),
  -- web-digital / 2 Design
  ('web-digital', 2, 'تصميم الهيكل (Wireframes)', 'Wireframes', 'executor', 4, false, 1),
  ('web-digital', 2, 'تصميم الواجهات', 'UI design', 'executor', 7, false, 2),
  ('web-digital', 2, 'اعتماد التصميم', 'UI design approval', 'strategist', 2, true, 3),
  -- web-digital / 3 Build
  ('web-digital', 3, 'التطوير البرمجي', 'Development', 'executor', 15, false, 1),
  ('web-digital', 3, 'إعداد CMS/المتجر وإدخال المحتوى', 'CMS/store setup & content entry', 'executor', 4, false, 2),
  ('web-digital', 3, 'فحص الجودة (أجهزة + سرعة)', 'QA (devices + speed)', 'executor', 3, false, 3),
  -- web-digital / 4 Launch
  ('web-digital', 4, 'اعتماد اختبار القبول قبل الإطلاق', 'Pre-launch UAT approval', 'strategist', 2, true, 1),
  ('web-digital', 4, 'DNS والاستضافة', 'DNS/hosting', 'executor', 1, false, 2),
  ('web-digital', 4, 'تركيب التحليلات والبكسل', 'Analytics + pixel install', 'executor', 1, false, 3),
  ('web-digital', 4, 'اعتماد الإطلاق', 'Go-live approval', 'strategist', 1, true, 4),
  -- web-digital / 5 Optimize
  ('web-digital', 5, 'اختبارات A/B على صفحات الهبوط', 'A/B tests on landing pages', 'executor', 5, false, 1),
  ('web-digital', 5, 'تحسينات معدل التحويل', 'CRO iterations', 'executor', 5, false, 2),
  ('web-digital', 5, 'الصيانة الدورية', 'Maintenance', 'executor', 2, false, 3),

  -- strategy-consulting / 1 Research
  ('strategy-consulting', 1, 'أبحاث السوق', 'Market research', 'strategist', 5, false, 1),
  ('strategy-consulting', 1, 'تحليل المنافسين', 'Competitor analysis', 'strategist', 3, false, 2),
  ('strategy-consulting', 1, 'تقييم القدرات الداخلية', 'Internal capability assessment', 'strategist', 3, false, 3),
  ('strategy-consulting', 1, 'اعتماد نتائج البحث', 'Research findings approval', 'strategist', 2, true, 4),
  -- strategy-consulting / 2 Strategy build
  ('strategy-consulting', 2, 'التموضع ومزيج القنوات', 'Positioning & channel mix', 'strategist', 4, false, 1),
  ('strategy-consulting', 2, 'نموذج الميزانية', 'Budget model', 'strategist', 2, false, 2),
  ('strategy-consulting', 2, 'خارطة طريق التحول', 'Transformation roadmap', 'strategist', 3, false, 3),
  ('strategy-consulting', 2, 'اعتماد وثيقة الاستراتيجية', 'Strategy document approval', 'strategist', 2, true, 4),
  -- strategy-consulting / 3 Handover
  ('strategy-consulting', 3, 'عرض الاستراتيجية', 'Strategy presentation', 'strategist', 1, false, 1),
  ('strategy-consulting', 3, 'إحاطة فرق التنفيذ', 'Execution briefing', 'strategist', 1, false, 2),
  -- strategy-consulting / 4 Quarterly review
  ('strategy-consulting', 4, 'مراجعة المؤشرات مقابل الخطة', 'KPI review vs. plan', 'strategist', 2, false, 1),
  ('strategy-consulting', 4, 'اعتماد تعديلات الاستراتيجية', 'Quarterly revisions approval', 'strategist', 1, true, 2),

  -- pr-media / 1 Reputation audit
  ('pr-media', 1, 'مسح الحضور الإعلامي', 'Media presence scan', 'executor', 3, false, 1),
  ('pr-media', 1, 'تحليل الانطباع العام', 'Sentiment analysis', 'strategist', 2, false, 2),
  ('pr-media', 1, 'بناء قائمة الوسائل الإعلامية', 'Media list building', 'executor', 3, false, 3),
  -- pr-media / 2 Messaging
  ('pr-media', 2, 'اعتماد الرسائل وقائمة الإعلام', 'Messaging & media list approval', 'strategist', 2, true, 1),
  ('pr-media', 2, 'إعداد المواد الصحفية وزوايا القصص', 'Press materials & story angles', 'executor', 4, false, 2),
  ('pr-media', 2, 'تصور الفعاليات', 'Event concepts', 'strategist', 3, false, 3),
  ('pr-media', 2, 'اعتماد ميزانية الشراء الإعلامي', 'Media buy budget approval', 'strategist', 1, true, 4),
  ('pr-media', 2, 'اعتماد تصور الفعالية', 'Event concept approval', 'strategist', 1, true, 5),
  -- pr-media / 3 Execute
  ('pr-media', 3, 'التواصل الصحفي', 'Press outreach', 'executor', 5, false, 1),
  ('pr-media', 3, 'تنفيذ الشراء الإعلامي', 'Media buys', 'executor', 3, false, 2),
  ('pr-media', 3, 'تفعيل الفعاليات', 'Event activation', 'executor', 5, false, 3),
  -- pr-media / 4 Measure
  ('pr-media', 4, 'تتبع التغطية الإعلامية', 'Coverage tracking', 'executor', 2, false, 1),
  ('pr-media', 4, 'قياس تحول الانطباع', 'Sentiment shift', 'strategist', 2, false, 2),
  ('pr-media', 4, 'قياس عائد الفعاليات', 'Event ROI', 'strategist', 2, false, 3)
) as v(slug, stage_ord, ar, en, role, days, gate, ord)
join public.playbooks p on p.slug = v.slug
join public.playbook_stages s on s.playbook_id = p.id and s.sort = v.stage_ord
on conflict do nothing;

-- KPI definitions (docs/03 KPI lines per playbook)
insert into public.kpi_definitions (playbook_id, key, label_ar, label_en, unit, direction)
select p.id, v.key, v.ar, v.en, v.unit, v.dir::public.kpi_direction
from (values
  ('ai-automation', 'hours_saved',          'الساعات الموفرة شهرياً',        'Hours saved/month', 'hour', 'up'),
  ('ai-automation', 'task_accuracy',        'دقة المهام',                    'Task accuracy', '%', 'up'),
  ('ai-automation', 'processes_automated',  'العمليات المؤتمتة',             'Processes automated', 'count', 'up'),
  ('ai-automation', 'response_time',        'زمن الاستجابة',                 'Response time', 'min', 'down'),

  ('performance-marketing', 'cpa',             'تكلفة الاستحواذ',        'CPA', 'SAR', 'down'),
  ('performance-marketing', 'roas',            'العائد على الإنفاق',     'ROAS', 'x', 'up'),
  ('performance-marketing', 'ctr',             'معدل النقر',             'CTR', '%', 'up'),
  ('performance-marketing', 'conversion_rate', 'معدل التحويل',           'Conversion rate', '%', 'up'),
  ('performance-marketing', 'spend_vs_budget', 'الإنفاق مقابل الميزانية','Spend vs. budget', 'SAR', 'down'),

  ('seo-content', 'organic_traffic', 'الزيارات العضوية',              'Organic traffic', 'count', 'up'),
  ('seo-content', 'keyword_top10',   'كلمات في المراكز العشرة الأولى','Top-10 keyword count', 'count', 'up'),
  ('seo-content', 'ai_citations',    'الاستشهادات في محركات الذكاء',  'AI-engine citations', 'count', 'up'),
  ('seo-content', 'indexed_pages',   'الصفحات المفهرسة',              'Indexed pages', 'count', 'up'),

  ('social-media', 'engagement_rate', 'معدل التفاعل',      'Engagement rate', '%', 'up'),
  ('social-media', 'follower_growth', 'نمو المتابعين',     'Follower growth', 'count', 'up'),
  ('social-media', 'reach',           'الوصول',            'Reach', 'count', 'up'),
  ('social-media', 'response_time',   'زمن الاستجابة',     'Response time', 'hour', 'down'),
  ('social-media', 'influencer_roi',  'عائد المؤثرين',     'Influencer ROI', 'x', 'up'),

  ('branding-creative', 'on_time_delivery', 'الالتزام بمواعيد التسليم', 'On-time delivery', '%', 'up'),
  ('branding-creative', 'revision_rounds',  'جولات المراجعة المستخدمة', 'Revision rounds used', 'count', 'down'),
  ('branding-creative', 'asset_adoption',   'تبني الأصول',              'Asset adoption', '%', 'up'),

  ('web-digital', 'lcp',             'سرعة التحميل (LCP)',   'Page speed (LCP)', 's', 'down'),
  ('web-digital', 'conversion_rate', 'معدل التحويل',         'Conversion rate', '%', 'up'),
  ('web-digital', 'ab_velocity',     'وتيرة اختبارات A/B',   'A/B test velocity', 'count', 'up'),
  ('web-digital', 'uptime',          'التوافرية',            'Uptime', '%', 'up'),

  ('strategy-consulting', 'milestones_hit',      'معالم الخطة المنجزة',      'Roadmap milestones hit', '%', 'up'),
  ('strategy-consulting', 'strategy_conversion', 'تحول الاستراتيجية لمشاريع','Strategy-to-execution conversion', '%', 'up'),

  ('pr-media', 'media_mentions', 'الذكر الإعلامي',         'Media mentions', 'count', 'up'),
  ('pr-media', 'sentiment',      'مؤشر الانطباع',          'Sentiment score', 'score', 'up'),
  ('pr-media', 'share_of_voice', 'حصة الصوت',              'Share of voice', '%', 'up'),
  ('pr-media', 'event_leads',    'حضور وعملاء الفعاليات',  'Event attendance/leads', 'count', 'up')
) as v(slug, key, ar, en, unit, dir)
join public.playbooks p on p.slug = v.slug
on conflict (playbook_id, key) do nothing;

-- role_profiles (docs/06 §4: strategist/executor/finance/admin templates +
-- the existing Key Accounts Manager production template)
insert into public.role_profiles (role_key, title_ar, title_en, pillars) values
  ('admin', 'مدير النظام', 'Administrator', '[
    {"title_ar": "الحوكمة", "title_en": "Governance", "desc_ar": "إدارة الصلاحيات والامتثال عبر النظام"},
    {"title_ar": "التمكين", "title_en": "Enablement", "desc_ar": "تهيئة الفريق والأدوات للإنجاز"},
    {"title_ar": "الرؤية الشاملة", "title_en": "Oversight", "desc_ar": "متابعة الأداء والمخاطر على مستوى الوكالة"}]'),
  ('strategist', 'استراتيجي تسويق', 'Marketing Strategist', '[
    {"title_ar": "التحليل", "title_en": "Analysis", "desc_ar": "قراءة السوق والبيانات لبناء القرار"},
    {"title_ar": "التخطيط", "title_en": "Planning", "desc_ar": "تحويل الأهداف إلى خطط قابلة للتنفيذ"},
    {"title_ar": "قيادة العملاء", "title_en": "Client Leadership", "desc_ar": "إدارة العلاقة والاعتمادات مع العميل"}]'),
  ('executor', 'منفذ حملات', 'Campaign Executor', '[
    {"title_ar": "الإنتاج", "title_en": "Production", "desc_ar": "تنفيذ المهام والتسليمات بجودة عالية"},
    {"title_ar": "السرعة", "title_en": "Velocity", "desc_ar": "دورات تنفيذ قصيرة ومنضبطة"},
    {"title_ar": "الدقة", "title_en": "Precision", "desc_ar": "التزام بالمعايير والتفاصيل"}]'),
  ('finance', 'مسؤول مالي', 'Finance Officer', '[
    {"title_ar": "الفوترة", "title_en": "Invoicing", "desc_ar": "إصدار ومتابعة الفواتير والتحصيل"},
    {"title_ar": "الامتثال", "title_en": "Compliance", "desc_ar": "الالتزام بمتطلبات الزكاة والضريبة"},
    {"title_ar": "الربحية", "title_en": "Profitability", "desc_ar": "متابعة هوامش المشاريع والعملاء"}]'),
  ('key_accounts_manager', 'مدير الحسابات الرئيسية', 'Key Accounts Manager', '[
    {"title_ar": "العلاقات", "title_en": "Relationships", "desc_ar": "بناء شراكات طويلة الأمد مع العملاء"},
    {"title_ar": "النمو", "title_en": "Growth", "desc_ar": "تنمية حسابات العملاء وفرص التوسع"},
    {"title_ar": "التنسيق", "title_en": "Coordination", "desc_ar": "ربط فرق التنفيذ باحتياجات العميل"}]')
on conflict (role_key) do nothing;

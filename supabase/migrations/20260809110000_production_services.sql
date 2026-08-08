-- قانون المالك L12 (2026-08-09): لدينا دائماً خدمات مساندة (تصوير، مونتاج،
-- تصميم…) وكل شاشة اختيار خدمات تتيح إضافة حرة — لا قوائم مغلقة أبداً.

-- ١) تصنيف الإنتاج والخدمات المساندة — كان الغائب الوحيد عن الكتالوج
insert into public.service_categories (slug, name_ar, name_en, sort)
values ('production-support', 'الإنتاج والخدمات المساندة', 'Production & Support', 9)
on conflict (slug) do nothing;

insert into public.services_catalog (category_id, slug, name_ar, name_en, sort)
select c.id, v.slug, v.ar, v.en, v.ord
from (values
  ('photography',      'التصوير الفوتوغرافي',        'Photography',              1),
  ('video-production', 'تصوير وإنتاج الفيديو',        'Video Production',         2),
  ('video-editing',    'المونتاج وما بعد الإنتاج',    'Editing & Post-Production', 3),
  ('voice-over',       'التعليق الصوتي والصوتيات',    'Voice-over & Audio',       4),
  ('ad-design',        'تصميم الإعلانات والمواد اليومية', 'Ad & Daily Creatives',  5)
) as v(slug, ar, en, ord)
cross join (select id from public.service_categories where slug = 'production-support') c
on conflict (slug) do nothing;

-- ٢) خدمات حرة في النطاق — أي خدمة خارج الكتالوج تُكتب نصاً ولا تضيع
alter table public.scopes
  add column if not exists extra_services text[] not null default '{}';

comment on column public.scopes.extra_services is
  'خدمات خارج الكتالوج تُضاف نصاً حراً (L12) — تدخل المسودة وعرض السعر كسطور كاملة.';

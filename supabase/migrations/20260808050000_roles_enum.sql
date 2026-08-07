-- الأدوار التخصصية (طلب المالك): مدير مالي، محاسب، مستشار قانوني، مدقق حوكمة.
-- Enum extension must be its own migration.
alter type public.user_role add value if not exists 'cfo';
alter type public.user_role add value if not exists 'accountant';
alter type public.user_role add value if not exists 'legal';
alter type public.user_role add value if not exists 'auditor';

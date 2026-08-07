-- إكمال طاقم الأدوار من مراجع docs/11–13 (طلب المالك: «افترض الباقي بالمنطق»)
alter type public.user_role add value if not exists 'sales';
alter type public.user_role add value if not exists 'pm';
alter type public.user_role add value if not exists 'collections';
alter type public.user_role add value if not exists 'hr';
alter type public.user_role add value if not exists 'dpo';

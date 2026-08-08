-- AGMA Live: دالة عدّ مهام cron (لا يمكن قراءة cron.job بمفتاح الخدمة عبر
-- PostgREST مباشرة — schema غير معروض) + config.toml للدالة العامة.

create or replace function public.count_cron_jobs()
returns int
language sql security definer set search_path = public as $$
  select count(*)::int from cron.job where active;
$$;

grant execute on function public.count_cron_jobs() to service_role;

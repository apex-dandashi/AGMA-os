-- جولة التكاملات P0 (رأي المالك المعتمد): مراقبة مواقع العملاء وSSL بلا
-- خادم — الفحص تنفذه دالة الحافة site-monitor ويستدعيها cron عبر pg_net،
-- والنتائج هنا، والإنذارات عبر محرك الإشعارات القائم.

create table public.client_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  label text,                      -- «موقع أجما» عند client_id فارغ (مواقعنا)
  url text not null unique,
  active boolean not null default true,
  last_status int,
  last_response_ms int,
  last_checked_at timestamptz,
  ssl_expires_on date,
  last_error text,
  down_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.client_sites is
  'مراقبة مواقع العملاء (docs/17 جولة التكاملات): حالة HTTP وزمن الاستجابة وانتهاء SSL — فحص كل ٦ ساعات من site-monitor';

alter table public.client_sites enable row level security;
grant select, insert, update, delete on public.client_sites to authenticated, service_role;
create policy "client_sites: strategist+ manages" on public.client_sites
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());
create policy "client_sites: team reads" on public.client_sites
  for select to authenticated using (public.is_team());
create trigger client_sites_audit
  after insert or update or delete on public.client_sites
  for each row execute function public.audit_trigger();
create trigger client_sites_updated
  before update on public.client_sites
  for each row execute function public.set_updated_at();

-- إنذاران: سقوط الموقع، واقتراب انتهاء الشهادة
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('site_down', 'inapp', 'ar', null,
   'موقع {{label}} لا يستجيب ({{url}}) — الحالة {{status}}. تحقق فوراً.', true),
  ('site_ssl_expiring', 'inapp', 'ar', null,
   'شهادة SSL لموقع {{label}} تنتهي خلال {{days}} يوماً ({{url}}) — جدّدها قبل الانقطاع.', true)
on conflict do nothing;

create or replace function public.site_alerts()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_days int;
begin
  -- سقوط جديد (كان سليماً وصار ≥400 أو فشل اتصال)
  if (new.last_status is null or new.last_status >= 400)
     and coalesce(old.last_status, 200) < 400 then
    new.down_since := now();
    perform public.notify_team('site_monitor', 'site_down',
      jsonb_build_object('label', coalesce(new.label, new.url), 'url', new.url,
        'status', coalesce(new.last_status::text, new.last_error, 'فشل الاتصال')),
      new.client_id, 'site-down:' || new.id || ':' || current_date);
  elsif new.last_status is not null and new.last_status < 400 then
    new.down_since := null;
  end if;

  if new.ssl_expires_on is not null then
    v_days := new.ssl_expires_on - current_date;
    if v_days in (30, 14, 7, 3, 1) then
      perform public.notify_team('site_monitor', 'site_ssl_expiring',
        jsonb_build_object('label', coalesce(new.label, new.url), 'url', new.url,
          'days', v_days::text),
        new.client_id, 'site-ssl:' || new.id || ':' || v_days);
    end if;
  end if;
  return new;
end;
$$;

create trigger client_sites_alerts
  before update on public.client_sites
  for each row execute function public.site_alerts();

-- استدعاء الفحص كل ٦ ساعات — الدالة لا تقبل مدخلات (تفحص المسجل فقط)
-- فلا خطر من كونها عامة، ومحدودة المعدل داخلياً.
select cron.schedule('agma-site-monitor', '15 */6 * * *',
  $$select net.http_post(
      url := 'https://gjaheqlgheizvebvakfd.supabase.co/functions/v1/site-monitor',
      body := '{}'::jsonb,
      headers := '{"content-type":"application/json"}'::jsonb)$$);

-- بذرة أولى: موقعا أجما نفسها (مثال حي للمالك)
insert into public.client_sites (label, url) values
  ('موقع أجما الرئيسي', 'https://agma.com.sa'),
  ('نظام أجما', 'https://ops.agma.com.sa')
on conflict (url) do nothing;

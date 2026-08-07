-- =============================================================================
-- Phase 6: Notification engine (docs/05 §B8) — one event-driven service.
-- Channels: inapp (live now) · email (auto-activates when the SendGrid key
-- lands in Vault) · whatsapp (schema-ready; Twilio activation deferred by
-- owner decision). Rule 6: all cross-module side effects flow through here.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

create type public.notification_channel as enum ('inapp', 'email', 'whatsapp');
create type public.notification_status as enum
  ('queued', 'sent', 'failed', 'skipped', 'cancelled');

-- -----------------------------------------------------------------------------
-- Template registry (docs/05 §B8). {{placeholders}} filled from payload.
-- WhatsApp rows carry approved=false until Meta approves the real templates.
-- -----------------------------------------------------------------------------
create table public.notification_templates (
  key text not null,
  channel public.notification_channel not null,
  locale text not null default 'ar',
  subject text,
  body text not null,
  approved boolean not null default true,
  active boolean not null default true,
  primary key (key, channel, locale)
);

alter table public.notification_templates enable row level security;
grant select on public.notification_templates to authenticated;
grant select, insert, update, delete on public.notification_templates to service_role;
create policy "templates: team reads" on public.notification_templates
  for select to authenticated using (public.is_team());

insert into public.notification_templates (key, channel, locale, subject, body) values
  ('invoice_issued', 'email', 'ar', 'فاتورة جديدة {{number}} — {{brand}}',
   'مرحباً {{recipient}}،<br><br>صدرت فاتورتكم رقم <b dir="ltr">{{number}}</b> بقيمة <b dir="ltr">SAR {{total}}</b>، مستحقة بتاريخ {{due}}.<br>بيانات التحويل: {{bank}} · <span dir="ltr">{{iban}}</span><br><br>«بإذن الله إلى تعاونٍ مثمر»<br>{{brand}}'),
  ('invoice_issued', 'inapp', 'ar', null,
   'صدرت الفاتورة {{number}} لـ {{client}} بقيمة SAR {{total}}'),
  ('invoice_due_soon', 'email', 'ar', 'تذكير: فاتورة {{number}} تستحق غداً',
   'تذكير ودّي — فاتورة <b dir="ltr">{{number}}</b> بقيمة <b dir="ltr">SAR {{balance}}</b> تستحق غداً {{due}}.<br>بيانات التحويل: {{bank}} · <span dir="ltr">{{iban}}</span>'),
  ('invoice_overdue', 'email', 'ar', 'فاتورة {{number}} متأخرة السداد',
   'فاتورة <b dir="ltr">{{number}}</b> بقيمة متبقية <b dir="ltr">SAR {{balance}}</b> تجاوزت تاريخ الاستحقاق {{due}}. نقدّر تسويتها في أقرب وقت.'),
  ('invoice_overdue', 'inapp', 'ar', null,
   'الفاتورة {{number}} ({{client}}) متأخرة — المتبقي SAR {{balance}}'),
  ('approval_pending_48h', 'email', 'ar', 'بانتظار اعتمادكم — {{item}}',
   'مرحباً {{recipient}}، ما زال {{item}} بانتظار اعتمادكم منذ يومين. رأيكم يحرّك العمل — نقدّر لكم الاطلاع.'),
  ('approval_pending_48h', 'inapp', 'ar', null,
   'اعتماد {{item}} لـ {{client}} معلّق منذ 48 ساعة'),
  ('task_overdue', 'inapp', 'ar', null,
   'لديك {{count}} مهمة متأخرة — أقدمها: {{title}}'),
  ('wallet_80', 'inapp', 'ar', null,
   'محفظة {{client}} الإعلانية بلغت {{pct}}% من الميزانية'),
  ('retainer_generated', 'inapp', 'ar', null,
   'وُلدت فاتورة اشتراك «{{title}}» لـ {{client}} — راجعها واعتمدها'),
  ('quote_expired', 'inapp', 'ar', null,
   'انتهت صلاحية عرض السعر {{number}} ({{client}})')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Queue + send log (one table: a notification IS its log row)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  channel public.notification_channel not null,
  template_key text not null,
  locale text not null default 'ar',
  recipient_profile uuid references public.profiles (id),
  recipient_email text,
  recipient_phone text,
  client_id uuid references public.clients (id),
  payload jsonb not null default '{}',
  dedupe_key text,
  status public.notification_status not null default 'queued',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  error text,
  request_id bigint,
  created_at timestamptz not null default now()
);

create unique index notifications_dedupe_idx
  on public.notifications (dedupe_key) where dedupe_key is not null and status = 'queued';
create index notifications_due_idx on public.notifications (scheduled_for)
  where status = 'queued';
create index notifications_inbox_idx on public.notifications (recipient_profile, read_at)
  where channel = 'inapp';

alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

create policy "notifications: team reads log" on public.notifications
  for select to authenticated using (public.is_team());
create policy "notifications: recipient marks read" on public.notifications
  for update to authenticated
  using (recipient_profile = auth.uid())
  with check (recipient_profile = auth.uid());

create trigger notifications_audit
  after insert or update or delete on public.notifications
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Enqueue helper (security definer — triggers and jobs call this)
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_notification(
  p_event text,
  p_channel public.notification_channel,
  p_template text,
  p_payload jsonb,
  p_recipient_profile uuid default null,
  p_recipient_email text default null,
  p_client_id uuid default null,
  p_scheduled_for timestamptz default now(),
  p_dedupe text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (event_key, channel, template_key, payload, recipient_profile,
     recipient_email, client_id, scheduled_for, dedupe_key)
  values
    (p_event, p_channel, p_template, p_payload, p_recipient_profile,
     p_recipient_email, p_client_id, p_scheduled_for, p_dedupe)
  on conflict (dedupe_key) where dedupe_key is not null and status = 'queued'
  do nothing;
exception when unique_violation then
  null; -- concurrent dedupe race — fine
end;
$$;

-- Broadcast an in-app notification to every strategist+.
create or replace function public.notify_team(
  p_event text, p_template text, p_payload jsonb, p_client uuid default null,
  p_dedupe_prefix text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.profiles
    where role in ('admin', 'strategist') and active
  loop
    perform public.enqueue_notification(
      p_event, 'inapp', p_template, p_payload, r.id, null, p_client, now(),
      case when p_dedupe_prefix is null then null
           else p_dedupe_prefix || ':' || r.id end);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Event triggers
-- -----------------------------------------------------------------------------

-- Invoice finalized → email client's primary contact + in-app to team.
create or replace function public.on_invoice_finalized()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_contact public.contacts%rowtype;
  v_company text;
  v_payload jsonb;
begin
  if new.type <> 'invoice' or old.status <> 'draft' or new.status <> 'sent' then
    return new;
  end if;
  select company into v_company from public.clients where id = new.client_id;
  select * into v_contact from public.contacts
    where client_id = new.client_id and email is not null
    order by is_primary desc, created_at limit 1;

  v_payload := jsonb_build_object(
    'number', new.number,
    'total', coalesce(new.total, 0)::text,
    'due', coalesce(new.valid_until::text, ''),
    'client', coalesce(v_company, ''),
    'recipient', coalesce(v_contact.name, v_company, ''),
    'brand', 'AGMA · جيل الذكاء الاصطناعي',
    'bank', coalesce(new.payload -> 'paymentAccount' ->> 'bankName', ''),
    'iban', coalesce(new.payload -> 'paymentAccount' ->> 'iban', ''));

  if v_contact.email is not null then
    perform public.enqueue_notification(
      'invoice_issued', 'email', 'invoice_issued', v_payload,
      null, v_contact.email, new.client_id);
  end if;
  perform public.notify_team('invoice_issued', 'invoice_issued', v_payload, new.client_id);
  return new;
end;
$$;

create trigger documents_invoice_notify
  after update on public.documents
  for each row execute function public.on_invoice_finalized();

-- Approval created → schedule the 48h nudge; approval decided → cancel it.
create or replace function public.on_approval_created()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_company text;
  v_contact public.contacts%rowtype;
  v_item text;
begin
  select company into v_company from public.clients where id = new.client_id;
  select * into v_contact from public.contacts
    where client_id = new.client_id and email is not null
    order by is_primary desc, created_at limit 1;
  v_item := case new.item_type
    when 'scope' then 'نطاق العمل'
    when 'roadmap' then 'خارطة الطريق'
    when 'report' then 'التقرير'
    when 'deliverable' then 'التسليم'
    else 'البند' end;

  if v_contact.email is not null then
    perform public.enqueue_notification(
      'approval_pending_48h', 'email', 'approval_pending_48h',
      jsonb_build_object('recipient', v_contact.name, 'item', v_item, 'client', v_company),
      null, v_contact.email, new.client_id,
      now() + interval '48 hours', 'nudge:' || new.id);
  end if;
  perform public.enqueue_notification(
    'approval_pending_48h', 'inapp', 'approval_pending_48h',
    jsonb_build_object('item', v_item, 'client', coalesce(v_company, '')),
    null, null, new.client_id,
    now() + interval '48 hours', 'nudge-team:' || new.id);
  return new;
end;
$$;

create trigger approvals_nudge_schedule
  after insert on public.approvals
  for each row execute function public.on_approval_created();

create or replace function public.on_approval_decided()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status <> 'pending' then
    update public.notifications set status = 'cancelled'
      where status = 'queued'
        and dedupe_key in ('nudge:' || new.id, 'nudge-team:' || new.id);
  end if;
  return new;
end;
$$;

create trigger approvals_nudge_cancel
  after update on public.approvals
  for each row execute function public.on_approval_decided();

-- -----------------------------------------------------------------------------
-- Daily jobs (docs/05 §B8 wired events) — pg_cron, 06:00 UTC = 09:00 KSA
-- -----------------------------------------------------------------------------
create or replace function public.run_daily_jobs()
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_paid numeric;
  v_pct int;
begin
  -- 1. Expire quotes past validity (guard permits sent→expired).
  update public.documents set status = 'expired'
    where type = 'quote' and status = 'sent'
      and valid_until is not null and valid_until < current_date;

  -- 2. Retainer auto-generation on their day of month.
  for r in
    select ri.*, c.company from public.recurring_invoices ri
    join public.clients c on c.id = ri.client_id
    where ri.active
      and ri.day_of_month = extract(day from current_date)
      and (ri.last_generated is null
           or date_trunc('month', ri.last_generated) < date_trunc('month', current_date))
  loop
    insert into public.documents (type, client_id, payment_account_id, payload)
    select 'invoice', r.client_id, coalesce(r.payment_account_id, pa.id),
      jsonb_build_object(
        'kind', 'invoice', 'number', null,
        'issueDateAr', to_char(current_date, 'DD/MM/YYYY'),
        'city', 'الرياض',
        'recipientName', r.company,
        'projectName', r.title,
        'items', jsonb_build_array(jsonb_build_object(
          'title', r.title, 'description', 'اشتراك شهري', 'amount', r.amount)),
        'vatEnabled', false,
        'paymentAccount', jsonb_build_object(
          'iban', pa.iban, 'bankName', pa.bank_name,
          'beneficiaryName', pa.beneficiary_name))
    from public.payment_accounts pa
    where pa.id = coalesce(r.payment_account_id,
      (select id from public.payment_accounts where is_default limit 1));

    update public.recurring_invoices set last_generated = current_date where id = r.id;
    perform public.notify_team('retainer_generated', 'retainer_generated',
      jsonb_build_object('title', r.title, 'client', r.company), r.client_id,
      'retainer:' || r.id || ':' || to_char(current_date, 'YYYY-MM'));
  end loop;

  -- 3. Invoices due tomorrow → client email reminder.
  for r in
    select d.*, c.company from public.documents d
    join public.clients c on c.id = d.client_id
    where d.type = 'invoice' and d.status in ('sent', 'signed', 'active')
      and d.valid_until = current_date + 1
  loop
    select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = r.id;
    if v_paid < coalesce(r.total, 0) then
      perform public.enqueue_notification(
        'invoice_due_soon', 'email', 'invoice_due_soon',
        jsonb_build_object('number', r.number,
          'balance', (coalesce(r.total, 0) - v_paid)::text,
          'due', r.valid_until::text,
          'bank', r.payload -> 'paymentAccount' ->> 'bankName',
          'iban', r.payload -> 'paymentAccount' ->> 'iban'),
        null,
        (select email from public.contacts
          where client_id = r.client_id and email is not null
          order by is_primary desc limit 1),
        r.client_id, now(), 'due-soon:' || r.id);
    end if;
  end loop;

  -- 4. Overdue invoices → weekly-deduped client email + team in-app.
  for r in
    select d.*, c.company from public.documents d
    join public.clients c on c.id = d.client_id
    where d.type = 'invoice' and d.status in ('sent', 'signed', 'active')
      and d.valid_until is not null and d.valid_until < current_date
  loop
    select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = r.id;
    if v_paid < coalesce(r.total, 0) then
      perform public.enqueue_notification(
        'invoice_overdue', 'email', 'invoice_overdue',
        jsonb_build_object('number', r.number,
          'balance', (coalesce(r.total, 0) - v_paid)::text,
          'due', r.valid_until::text),
        null,
        (select email from public.contacts
          where client_id = r.client_id and email is not null
          order by is_primary desc limit 1),
        r.client_id, now(),
        'overdue:' || r.id || ':' || to_char(current_date, 'IYYY-IW'));
      perform public.notify_team('invoice_overdue', 'invoice_overdue',
        jsonb_build_object('number', r.number, 'client', r.company,
          'balance', (coalesce(r.total, 0) - v_paid)::text),
        r.client_id, 'overdue-team:' || r.id || ':' || to_char(current_date, 'IYYY-IW'));
    end if;
  end loop;

  -- 5. Task-overdue per assignee (daily dedupe).
  for r in
    select assignee, count(*) as n, min(title) as title
    from public.tasks
    where status not in ('done') and due is not null and due < current_date
      and assignee is not null
    group by assignee
  loop
    perform public.enqueue_notification(
      'task_overdue', 'inapp', 'task_overdue',
      jsonb_build_object('count', r.n::text, 'title', r.title),
      r.assignee, null, null, now(),
      'task-overdue:' || r.assignee || ':' || current_date);
  end loop;

  -- 6. Wallets crossing 80% (once per wallet per threshold).
  for r in
    select w.id, w.budget, c.company, coalesce(sum(e.amount), 0) as spent
    from public.wallets w
    join public.clients c on c.id = w.client_id
    left join public.wallet_entries e on e.wallet_id = w.id
    group by w.id, w.budget, c.company
  loop
    v_pct := floor(r.spent / r.budget * 100);
    if v_pct >= 80 then
      perform public.notify_team('wallet_80', 'wallet_80',
        jsonb_build_object('client', r.company, 'pct', v_pct::text),
        null, 'wallet80:' || r.id);
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Dispatcher — pg_net + Vault. Skips gracefully until secrets exist:
--   select vault.create_secret('<SENDGRID KEY>', 'sendgrid_api_key');
-- Quiet hours (docs/05 §B8): client-facing sends only 08:00–20:00 Riyadh.
-- -----------------------------------------------------------------------------
create or replace function public.render_template(p_body text, p_payload jsonb)
returns text
language plpgsql immutable as $$
declare k text; v text; result text := p_body;
begin
  for k, v in select key, value #>> '{}' from jsonb_each(p_payload) loop
    result := replace(result, '{{' || k || '}}', coalesce(v, ''));
  end loop;
  return result;
end;
$$;

create or replace function public.dispatch_notifications()
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
  t record;
  v_key text;
  v_req bigint;
  v_hour int := extract(hour from now() at time zone 'Asia/Riyadh');
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'sendgrid_api_key' limit 1;

  for r in
    select * from public.notifications
    where status = 'queued' and scheduled_for <= now()
    order by scheduled_for limit 50
  loop
    if r.channel = 'inapp' then
      update public.notifications
        set status = 'sent', sent_at = now() where id = r.id;
      continue;
    end if;

    -- quiet hours for outbound client channels
    if v_hour < 8 or v_hour >= 20 then
      continue; -- stays queued; next cron inside the window sends it
    end if;

    if r.channel = 'email' then
      if v_key is null then
        continue; -- no key yet: keep queued until Vault is configured
      end if;
      select * into t from public.notification_templates
        where key = r.template_key and channel = 'email'
          and locale = r.locale and active limit 1;
      if t.key is null or r.recipient_email is null then
        update public.notifications
          set status = 'skipped', error = 'no template or recipient' where id = r.id;
        continue;
      end if;
      select net.http_post(
        url := 'https://api.sendgrid.com/v3/mail/send',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || v_key,
          'Content-Type', 'application/json'),
        body := jsonb_build_object(
          'personalizations', jsonb_build_array(jsonb_build_object(
            'to', jsonb_build_array(jsonb_build_object('email', r.recipient_email)))),
          'from', jsonb_build_object('email', 'care@agma.com.sa',
            'name', 'AGMA · جيل الذكاء الاصطناعي'),
          'subject', public.render_template(coalesce(t.subject, 'AGMA'), r.payload),
          'content', jsonb_build_array(jsonb_build_object(
            'type', 'text/html',
            'value', public.render_template(t.body, r.payload)))))
      into v_req;
      update public.notifications
        set status = 'sent', sent_at = now(), request_id = v_req where id = r.id;
    elsif r.channel = 'whatsapp' then
      -- Owner decision: Twilio activation deferred until post-build.
      update public.notifications
        set status = 'skipped', error = 'whatsapp channel not activated' where id = r.id;
    end if;
  end loop;
end;
$$;

-- Schedules (idempotent)
select cron.schedule('agma-dispatch', '*/5 * * * *',
  $$select public.dispatch_notifications()$$);
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs()$$);

alter publication supabase_realtime add table public.notifications;

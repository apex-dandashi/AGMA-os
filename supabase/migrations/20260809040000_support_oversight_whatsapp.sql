-- طلب المالك (2026-08-08): شات دعم من بوابة العميل موجه للأقسام المختصة +
-- إشراف كامل لمدير النظام على كل المحادثات (بآلية منفصلة معلنة) + حق الرد
-- بدل المختص + بنية تنبيهات واتساب حسب الدور.

-- ---------- أقسام الدعم -------------------------------------------------------
create type public.support_department as enum
  ('general', 'projects', 'finance', 'legal', 'technical');

-- أي الأدوار يخدم كل قسم (مدير النظام والاستراتيجي يريان الكل عبر السياسات)
create or replace function public.dept_roles(p_dept public.support_department)
returns public.user_role[]
language sql immutable as $$
  select case p_dept
    when 'projects' then array['pm', 'executor']::public.user_role[]
    when 'finance' then array['accountant', 'cfo', 'collections']::public.user_role[]
    when 'legal' then array['legal', 'dpo']::public.user_role[]
    when 'technical' then array['executor', 'pm']::public.user_role[]
    else array['sales', 'pm']::public.user_role[]
  end;
$$;

create or replace function public.serves_dept(p_dept public.support_department)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active
      and (role = any (public.dept_roles(p_dept))
           or role in ('admin', 'strategist'))
  );
$$;

-- ---------- محادثات الدعم -----------------------------------------------------
create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  department public.support_department not null default 'general',
  subject text not null check (char_length(trim(subject)) between 3 and 200),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid not null references public.profiles (id) default auth.uid(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.support_threads is
  'دعم العملاء من البوابة: كل محادثة لقسم مختص؛ مدير النظام والاستراتيجي يريان الكل (إشراف معلن) ويحق لهما الرد بدل المختص';

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  sender uuid not null references public.profiles (id) default auth.uid(),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index support_messages_thread_idx on public.support_messages (thread_id, created_at);
create index support_threads_client_idx on public.support_threads (client_id, last_message_at desc);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
grant select, insert, update on public.support_threads to authenticated;
grant select, insert on public.support_messages to authenticated;
grant all on public.support_threads, public.support_messages to service_role;

-- العميل: محادثات منشأته فقط
create policy "support threads: client own" on public.support_threads
  for select to authenticated using (client_id = public.current_client_id());
create policy "support threads: client opens" on public.support_threads
  for insert to authenticated
  with check (client_id = public.current_client_id() and created_by = auth.uid());
-- الفريق: قسم اختصاصه (والمدير/الاستراتيجي الكل عبر serves_dept)
create policy "support threads: dept team" on public.support_threads
  for select to authenticated using (public.serves_dept(department));
create policy "support threads: dept team updates" on public.support_threads
  for update to authenticated
  using (public.serves_dept(department)) with check (public.serves_dept(department));

create policy "support msgs: client own thread" on public.support_messages
  for select to authenticated using (exists (
    select 1 from public.support_threads t
    where t.id = thread_id and t.client_id = public.current_client_id()));
create policy "support msgs: client sends" on public.support_messages
  for insert to authenticated with check (sender = auth.uid() and exists (
    select 1 from public.support_threads t
    where t.id = thread_id and t.client_id = public.current_client_id()
      and t.status = 'open'));
create policy "support msgs: dept team reads" on public.support_messages
  for select to authenticated using (exists (
    select 1 from public.support_threads t
    where t.id = thread_id and public.serves_dept(t.department)));
create policy "support msgs: dept team sends" on public.support_messages
  for insert to authenticated with check (sender = auth.uid() and exists (
    select 1 from public.support_threads t
    where t.id = thread_id and public.serves_dept(t.department)));

create trigger support_threads_updated
  before update on public.support_threads
  for each row execute function public.set_updated_at();
create trigger support_threads_audit
  after insert or update on public.support_threads
  for each row execute function public.audit_trigger();

-- رسالة جديدة تحدّث توقيت المحادثة
create or replace function public.on_support_message()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_t public.support_threads%rowtype; v_sender_role public.user_role;
begin
  update public.support_threads set last_message_at = now() where id = new.thread_id;
  select * into v_t from public.support_threads where id = new.thread_id;
  select role into v_sender_role from public.profiles where id = new.sender;

  if v_sender_role = 'client' then
    -- إشعار فريق القسم (والمدير ضمنه دائماً)
    perform public.enqueue_notification('support', 'inapp', 'support_client_msg',
      jsonb_build_object('subject', v_t.subject,
        'client', (select company from public.clients where id = v_t.client_id)),
      p.id, null, v_t.client_id, now(), 'sup-c:' || new.id || ':' || p.id)
    from public.profiles p
    where p.active and (p.role = any (public.dept_roles(v_t.department))
                        or p.role in ('admin', 'strategist'));
  else
    -- رد الفريق ← إشعار حسابات العميل في بوابته
    perform public.enqueue_notification('support', 'inapp', 'support_team_reply',
      jsonb_build_object('subject', v_t.subject),
      p.id, null, v_t.client_id, now(), 'sup-t:' || new.id || ':' || p.id)
    from public.profiles p
    where p.role = 'client' and p.client_id = v_t.client_id and p.active;
  end if;
  return new;
end;
$$;

create trigger support_messages_after
  after insert on public.support_messages
  for each row execute function public.on_support_message();

insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('support_client_msg', 'inapp', 'ar', null,
   'رسالة دعم جديدة من {{client}}: «{{subject}}» — رد من الدردشة ← الدعم.', true),
  ('support_team_reply', 'inapp', 'ar', null,
   'رد فريق AGMA على طلبكم «{{subject}}» — راجعوه في بوابتكم ← الدعم.', true)
on conflict do nothing;

-- ---------- إشراف مدير النظام (آلية منفصلة معلنة) ----------------------------
-- المدير يرى كل دردشة الفريق (بما فيها الخاصة) من تبويب «الإشراف» —
-- سياسة صريحة موثقة هنا؛ الفريق يعلم أنها خاصية إدارية معلنة.
create policy "chat: admin oversight" on public.team_chat
  for select to authenticated using (public.is_admin());

-- ---------- قراءة/غير مقروء ---------------------------------------------------
create table public.chat_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_key text not null, -- 'general' | 'dm:<uuid>' | 'support:<uuid>'
  last_read_at timestamptz not null default now(),
  primary key (user_id, thread_key)
);
alter table public.chat_reads enable row level security;
grant select, insert, update on public.chat_reads to authenticated;
grant all on public.chat_reads to service_role;
create policy "reads: own" on public.chat_reads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- واتساب حسب الدور --------------------------------------------------
alter table public.profiles add column if not exists whatsapp_enabled boolean not null default true;
alter table public.notifications add column if not exists whatsapp_sent_at timestamptz;

comment on column public.profiles.whatsapp_enabled is
  'تنبيهات واتساب لإشعارات النظام الموجهة لهذا العضو — تتطلب رقم جوال في الملف الشخصي وربط Meta (أسرار الدوال)';

-- المرسل كل ٥ دقائق (يخرج بصمت إن لم تكن مفاتيح Meta مهيأة)
select cron.schedule('agma-whatsapp-dispatch', '*/5 * * * *',
  $$select net.http_post(
      url := 'https://gjaheqlgheizvebvakfd.supabase.co/functions/v1/whatsapp-dispatch',
      body := '{}'::jsonb,
      headers := '{"content-type":"application/json"}'::jsonb)$$);

-- بث لحظي للدعم
alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.support_threads;

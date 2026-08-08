-- اعتمادات المخرجات بالإصدارات + التعليق البصري (WOW شريحة ٢+، طلب المالك):
--   deliverable ← إصدارات مرقّمة (V1، V2…) ← تعليقات مثبتة على نقاط الصورة
--   (pin_x/pin_y نِسب 0-1) ← قرار العميل عبر دالة مقيدة (اعتماد أو طلب
--   تعديلات بملاحظة إلزامية). دلو صور خاص بمسار العميل حتى يقرأ ملفاته فقط.

create type public.deliverable_status as enum
  ('draft', 'pending_client', 'changes_requested', 'approved');

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_id uuid not null references public.clients (id),
  title text not null,
  status public.deliverable_status not null default 'draft',
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  version_number int not null,
  file_path text not null,
  note text,
  decision text check (decision in ('approved', 'changes')),
  decision_note text,
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (deliverable_id, version_number)
);

create table public.deliverable_comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  author uuid not null references public.profiles (id) default auth.uid(),
  body text not null,
  pin_x numeric check (pin_x between 0 and 1),
  pin_y numeric check (pin_y between 0 and 1),
  created_at timestamptz not null default now()
);

comment on table public.deliverable_comments is
  'تعليق عام (pin فارغ) أو مثبت على نقطة من الصورة (نسب 0-1) — التعليق البصري يريح الطرفين من «عدّل الشعار اللي فوق يمين»';

-- دلو الصور: مسار كل ملف يبدأ بمعرف العميل — فريقنا يدير، والعميل يقرأ مساره
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deliverables', 'deliverables', false, 10 * 1024 * 1024,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "deliverables bucket: team manages" on storage.objects
  for all to authenticated
  using (bucket_id = 'deliverables' and public.is_team())
  with check (bucket_id = 'deliverables' and public.is_team());
create policy "deliverables bucket: client reads own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'deliverables'
         and (storage.foldername(name))[1] = public.current_client_id()::text);

-- RLS الجداول
do $$
declare t text;
begin
  foreach t in array array['deliverables', 'deliverable_versions', 'deliverable_comments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

create policy "deliverables: team manages" on public.deliverables
  for all to authenticated
  using (public.is_team()) with check (public.is_team());
create policy "deliverables: client reads own sent" on public.deliverables
  for select to authenticated
  using (client_id = public.current_client_id() and status <> 'draft');

create policy "dlv_versions: team manages" on public.deliverable_versions
  for all to authenticated
  using (public.is_team()) with check (public.is_team());
create policy "dlv_versions: client reads own" on public.deliverable_versions
  for select to authenticated
  using (exists (select 1 from public.deliverables d
                 where d.id = deliverable_id
                   and d.client_id = public.current_client_id()
                   and d.status <> 'draft'));

create policy "dlv_comments: team manages" on public.deliverable_comments
  for all to authenticated
  using (public.is_team()) with check (public.is_team());
create policy "dlv_comments: client reads own" on public.deliverable_comments
  for select to authenticated
  using (exists (select 1 from public.deliverable_versions v
                 join public.deliverables d on d.id = v.deliverable_id
                 where v.id = version_id
                   and d.client_id = public.current_client_id()
                   and d.status <> 'draft'));
create policy "dlv_comments: client writes own" on public.deliverable_comments
  for insert to authenticated
  with check (author = auth.uid()
    and exists (select 1 from public.deliverable_versions v
                join public.deliverables d on d.id = v.deliverable_id
                where v.id = version_id
                  and d.client_id = public.current_client_id()
                  and d.status = 'pending_client'));

create trigger deliverables_updated before update on public.deliverables
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- قرار العميل — دالة مقيدة: أحدث إصدار، حالة معلقة، وملاحظة إلزامية للتعديل
-- ---------------------------------------------------------------------------
create or replace function public.client_decide_deliverable(
  p_version uuid, p_decision text, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_ver public.deliverable_versions%rowtype; v_dlv public.deliverables%rowtype;
begin
  select * into v_ver from public.deliverable_versions where id = p_version;
  if v_ver.id is null then raise exception 'الإصدار غير موجود'; end if;
  select * into v_dlv from public.deliverables where id = v_ver.deliverable_id;
  if v_dlv.client_id is distinct from public.current_client_id() then
    raise exception 'هذا المخرج ليس من مخرجاتكم';
  end if;
  if v_dlv.status <> 'pending_client' then
    raise exception 'القرار متاح للمخرجات المعروضة عليكم حالياً فقط';
  end if;
  if v_ver.version_number <> (select max(version_number)
      from public.deliverable_versions where deliverable_id = v_dlv.id) then
    raise exception 'القرار على أحدث إصدار فقط';
  end if;
  if p_decision not in ('approved', 'changes') then
    raise exception 'قرار غير معروف';
  end if;
  if p_decision = 'changes' and coalesce(trim(p_note), '') = '' then
    raise exception 'اذكر التعديلات المطلوبة — ملاحظة واحدة توفر جولة كاملة';
  end if;

  update public.deliverable_versions
     set decision = p_decision, decision_note = nullif(trim(p_note), ''),
         decided_by = auth.uid(), decided_at = now()
   where id = p_version;
  update public.deliverables
     set status = case when p_decision = 'approved'
                       then 'approved'::public.deliverable_status
                       else 'changes_requested'::public.deliverable_status end
   where id = v_dlv.id;

  perform public.notify_team('deliverable', 'deliverable_decided',
    jsonb_build_object('title', v_dlv.title, 'version', v_ver.version_number::text,
      'decision', case when p_decision = 'approved' then 'اعتمد' else 'طلب تعديلات على' end,
      'client', (select company from public.clients where id = v_dlv.client_id)),
    v_dlv.client_id, 'dlv-dec:' || p_version);
end;
$$;

grant execute on function public.client_decide_deliverable(uuid, text, text) to authenticated;

-- إشعار العميل عند العرض عليه
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('deliverable_sent_client', 'inapp', 'ar', null,
   'مخرج جديد بانتظار اعتمادكم: {{title}} (الإصدار {{version}}) — راجعوه وعلّقوا على أي نقطة من التصميم مباشرة.', true),
  ('deliverable_decided', 'inapp', 'ar', null,
   '{{client}} {{decision}} «{{title}}» V{{version}} — التفاصيل في مخرجات المشروع.', true)
on conflict do nothing;

create or replace function public.on_deliverable_sent()
returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; v_num int;
begin
  if new.status = 'pending_client' and old.status is distinct from 'pending_client' then
    select max(version_number) into v_num from public.deliverable_versions
     where deliverable_id = new.id;
    for r in select id from public.profiles
      where role = 'client' and client_id = new.client_id and active
    loop
      perform public.enqueue_notification('deliverable', 'inapp', 'deliverable_sent_client',
        jsonb_build_object('title', new.title, 'version', coalesce(v_num, 1)::text),
        r.id, null, new.client_id, now(), 'dlv-sent:' || new.id || ':' || r.id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger deliverables_notify_client
  after update on public.deliverables
  for each row execute function public.on_deliverable_sent();

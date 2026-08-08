-- المرحلة ٨ — محرك المحتوى: فكرة ← مسودة (يدوية أو AI) ← مراجعة بشرية
-- إلزامية ← اعتماد العميل من بوابته ← جدولة ← نشر.
--
-- عقيدتان مُحكمتان في القاعدة لا الواجهة:
--   ١) مخرَج AI لا يصل العميل قبل مراجعة بشرية موثقة (القاعدة الثابتة ٢).
--   ٢) لا نشر لغير المعتمد.

create type public.content_channel as enum
  ('article', 'social_post', 'reel_script', 'email', 'ad_copy');
create type public.content_status as enum
  ('idea', 'draft', 'internal_review', 'client_review',
   'approved', 'scheduled', 'published', 'archived');

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  project_id uuid references public.projects (id),
  channel public.content_channel not null,
  title text not null,
  brief text,
  body text,
  status public.content_status not null default 'idea',
  ai_generated boolean not null default false,
  human_reviewed_by uuid references public.profiles (id),
  human_reviewed_at timestamptz,
  scheduled_for date,
  published_at timestamptz,
  publish_url text,
  assignee uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_items is
  'محرك المحتوى (المرحلة ٨): مسودة AI معلَّمة ولا تتقدم لمراجعة العميل قبل مراجعة بشرية موثقة، ولا نشر لغير المعتمد';

alter table public.content_items enable row level security;
grant select, insert, update, delete on public.content_items to authenticated, service_role;

create policy "content: team manages" on public.content_items
  for all to authenticated
  using (public.is_team()) with check (public.is_team());
-- العميل يرى ما وصل مرحلته فصاعداً (لا أفكاراً ولا مسودات داخلية)
create policy "content: client reads own from review" on public.content_items
  for select to authenticated
  using (client_id = public.current_client_id()
    and status in ('client_review', 'approved', 'scheduled', 'published'));

create trigger content_items_audit
  after insert or update or delete on public.content_items
  for each row execute function public.audit_trigger();
create trigger content_items_updated
  before update on public.content_items
  for each row execute function public.set_updated_at();

-- الحارس المزدوج — على الإدراج والتحديث معاً (لا قفز فوق الاعتماد بإدراج مباشر)
create or replace function public.content_gates()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old public.content_status :=
    case when tg_op = 'INSERT' then 'idea'::public.content_status else old.status end;
begin
  -- بوابة المراجعة البشرية: مخرَج AI لا يتقدم لمراجعة العميل بلا مراجع بشري
  if new.status in ('client_review', 'approved', 'scheduled', 'published')
     and v_old in ('idea', 'draft', 'internal_review')
     and new.ai_generated and new.human_reviewed_by is null then
    raise exception 'محتوى مولَّد بالذكاء الاصطناعي — وثّق المراجعة البشرية (زر «راجعتُه») قبل عرضه على العميل';
  end if;
  -- بوابة النشر: لا نشر لغير المعتمد
  if new.status = 'published' and v_old not in ('approved', 'scheduled') then
    raise exception 'لا يُنشر محتوى قبل اعتماده — الاعتماد ثم الجدولة ثم النشر';
  end if;
  -- توثيق المراجعة عند ضغط «راجعتُه»
  if new.human_reviewed_by is not null
     and (tg_op = 'INSERT' or old.human_reviewed_by is null) then
    new.human_reviewed_at := coalesce(new.human_reviewed_at, now());
  end if;
  if new.status = 'published' and v_old <> 'published' then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger content_items_gates
  before insert or update on public.content_items
  for each row execute function public.content_gates();

-- ملاحظة العميل عند القرار (إلزامية عند الإعادة — تُفرض في الواجهة، وتصل الفريق)
alter table public.approvals add column if not exists note text;

-- عند عرضه على العميل: صف اعتماد + إشعار بوابته
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('content_client_review', 'inapp', 'ar', null,
   'محتوى جديد بانتظار اعتمادكم: «{{title}}» ({{channel}}) — راجعوه واعتمدوه من بوابتكم.', true),
  ('content_decided_team', 'inapp', 'ar', null,
   '{{client}} {{decision}} محتوى «{{title}}» — تابعه في المحتوى.', true)
on conflict do nothing;

create or replace function public.on_content_to_client()
returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status = 'client_review' and old.status is distinct from 'client_review' then
    insert into public.approvals (client_id, item_type, item_id)
    values (new.client_id, 'content', new.id);
    for r in select id from public.profiles
      where role = 'client' and client_id = new.client_id and active
    loop
      perform public.enqueue_notification('content', 'inapp', 'content_client_review',
        jsonb_build_object('title', new.title, 'channel', new.channel::text),
        r.id, null, new.client_id, now(), 'cnt-rev:' || new.id || ':' || r.id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger content_items_to_client
  after update on public.content_items
  for each row execute function public.on_content_to_client();

-- قرار العميل على الاعتماد يعكس حالة المحتوى ويُشعر الفريق
create or replace function public.on_content_approval_decided()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_item public.content_items%rowtype;
begin
  if new.item_type = 'content' and new.status <> 'pending'
     and old.status = 'pending' then
    select * into v_item from public.content_items where id = new.item_id;
    if v_item.id is not null then
      update public.content_items
         set status = case when new.status = 'approved'
                           then 'approved'::public.content_status
                           else 'internal_review'::public.content_status end
       where id = new.item_id;
      perform public.notify_team('content', 'content_decided_team',
        jsonb_build_object('title', v_item.title,
          'decision', case when new.status = 'approved' then 'اعتمد' else 'أعاد للمراجعة' end
            || coalesce(' («' || nullif(trim(new.note), '') || '»)', ''),
          'client', (select company from public.clients where id = new.client_id)),
        new.client_id, 'cnt-dec:' || new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger approvals_content_decided
  after update on public.approvals
  for each row execute function public.on_content_approval_decided();

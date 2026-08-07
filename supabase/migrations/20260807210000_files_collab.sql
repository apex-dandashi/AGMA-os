-- Package A — files & collaboration (closing the structural gap vs the
-- reference systems): a real file store with attachments everywhere, and
-- record-level collaboration (task comments + mentions + targeted
-- notifications) so coordination happens INSIDE the system.

-- ---------------------------------------------------------------------------
-- 1. Storage bucket (private; downloads via signed URLs only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 20 * 1024 * 1024)
on conflict (id) do nothing;

create policy "attachments: team reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and public.is_team());
create policy "attachments: team uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and public.is_team());
create policy "attachments: team deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and public.is_team());

-- ---------------------------------------------------------------------------
-- 2. Attachment metadata — one polymorphic table, queried per record
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('task', 'document', 'expense', 'client', 'project')),
  entity_id uuid not null,
  path text not null unique,
  filename text not null,
  mime text,
  size_bytes bigint,
  label text,
  uploaded_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index attachments_entity_idx on public.attachments (entity, entity_id);

alter table public.attachments enable row level security;
create policy "attachments meta: team manages" on public.attachments
  for all to authenticated using (public.is_team()) with check (public.is_team());
grant select, insert, update, delete on public.attachments to authenticated, service_role;
create trigger attachments_audit after insert or update or delete
  on public.attachments for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- 3. Task comments + mentions
-- ---------------------------------------------------------------------------
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author uuid not null references public.profiles(id) default auth.uid(),
  body text not null check (length(trim(body)) between 1 and 4000),
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id);

alter table public.task_comments enable row level security;
create policy "task_comments: team reads" on public.task_comments
  for select to authenticated using (public.is_team());
create policy "task_comments: team writes" on public.task_comments
  for insert to authenticated with check (public.is_team() and author = auth.uid());
create policy "task_comments: author deletes" on public.task_comments
  for delete to authenticated using (author = auth.uid() or public.is_admin());
grant select, insert, delete on public.task_comments to authenticated;
grant select, insert, update, delete on public.task_comments to service_role;
create trigger task_comments_audit after insert or delete
  on public.task_comments for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- 4. Targeted notifications: mention/comment + assignment
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('task_comment', 'inapp', 'ar', null,
   '{{author}} علّق على «{{task}}»: {{excerpt}}', true),
  ('task_assigned', 'inapp', 'ar', null,
   'أُسندت إليك مهمة: «{{task}}» في مشروع {{project}}', true)
on conflict do nothing;

create or replace function public.on_task_comment()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_task text; v_author text; v_assignee uuid; v_recipient uuid;
  v_recipients uuid[];
begin
  select t.title, t.assignee into v_task, v_assignee from public.tasks t where t.id = new.task_id;
  select coalesce(full_name, email) into v_author from public.profiles where id = new.author;
  -- mentioned users + the assignee, never the author themselves
  v_recipients := new.mentions;
  if v_assignee is not null and not (v_assignee = any(v_recipients)) then
    v_recipients := v_recipients || v_assignee;
  end if;
  foreach v_recipient in array v_recipients loop
    if v_recipient = new.author then continue; end if;
    perform public.enqueue_notification(
      'task_comment', 'inapp', 'task_comment',
      jsonb_build_object('author', coalesce(v_author, '؟'), 'task', coalesce(v_task, '؟'),
        'excerpt', left(new.body, 120)),
      v_recipient, null, null, now(), 'comment:' || new.id || ':' || v_recipient);
  end loop;
  return new;
end;
$$;

create trigger task_comments_notify
  after insert on public.task_comments
  for each row execute function public.on_task_comment();

create or replace function public.on_task_assigned()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_project text;
begin
  if new.assignee is not null and new.assignee is distinct from old.assignee
     and new.assignee <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') then
    select name into v_project from public.projects where id = new.project_id;
    perform public.enqueue_notification(
      'task_assigned', 'inapp', 'task_assigned',
      jsonb_build_object('task', new.title, 'project', coalesce(v_project, '—')),
      new.assignee, null, null, now(), 'assigned:' || new.id || ':' || new.assignee);
  end if;
  return new;
end;
$$;

create trigger tasks_assignment_notify
  after update on public.tasks
  for each row execute function public.on_task_assigned();

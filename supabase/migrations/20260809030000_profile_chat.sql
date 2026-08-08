-- طلب المالك: قسم الملف الشخصي وتعديلاته + دردشة الفريق (عامة وخاصة بين
-- الموظفين). العملاء خارج الدردشة كلياً — قناتهم بوابتهم.

-- ---------- الملف الشخصي -----------------------------------------------------
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_path text;

-- العضو يعدل ملفه هو فقط — والأعمدة الحساسة (role/active/client_id) محمية
-- بمحفّز لا بالسياسة، حتى لا يرقّي أحد نفسه.
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = new.id and not public.is_admin() then
    if new.role is distinct from old.role
       or new.active is distinct from old.active
       or new.client_id is distinct from old.client_id
       or new.email is distinct from old.email then
      raise exception 'هذه الحقول يديرها مدير النظام';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_self_update_guard
  before update on public.profiles
  for each row execute function public.guard_profile_self_update();

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- صور الملفات الشخصية — دلو عام (صور وجوه فريق، حساسية منخفضة، روابط ثابتة)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: own folder write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own folder update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- دردشة الفريق -----------------------------------------------------
-- recipient فارغ = القناة العامة؛ وإلا رسالة خاصة بين اثنين.
create table public.team_chat (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles (id) default auth.uid(),
  recipient uuid references public.profiles (id),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

comment on table public.team_chat is
  'دردشة الفريق: recipient فارغ = القناة العامة، وإلا خاصة بين المرسل والمستلم. العملاء معزولون كلياً';

create index team_chat_general_idx on public.team_chat (created_at desc)
  where recipient is null;
create index team_chat_dm_idx on public.team_chat (sender, recipient, created_at desc);

alter table public.team_chat enable row level security;
grant select, insert, delete on public.team_chat to authenticated;
grant all on public.team_chat to service_role;

create policy "chat: team reads own scope" on public.team_chat
  for select to authenticated
  using (public.is_team() and (
    recipient is null or sender = auth.uid() or recipient = auth.uid()
  ));
create policy "chat: team sends as self" on public.team_chat
  for insert to authenticated
  with check (public.is_team() and sender = auth.uid()
    and (recipient is null or recipient <> auth.uid()));
create policy "chat: sender deletes own" on public.team_chat
  for delete to authenticated
  using (public.is_team() and sender = auth.uid());

-- المستلم لا يكون عميلاً أبداً
create or replace function public.guard_chat_recipient()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.recipient is not null and exists (
    select 1 from public.profiles where id = new.recipient and role = 'client'
  ) then
    raise exception 'الدردشة داخلية — تواصل العملاء عبر بوابتهم';
  end if;
  return new;
end;
$$;

create trigger team_chat_recipient_guard
  before insert on public.team_chat
  for each row execute function public.guard_chat_recipient();

-- بث لحظي
alter publication supabase_realtime add table public.team_chat;

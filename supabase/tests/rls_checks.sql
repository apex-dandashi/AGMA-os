-- =============================================================================
-- RLS regression harness (docs/07 Sprint C1). Run against a fresh local stack:
--   scripts/rls-check.sh
-- Every DO block raises on violation → psql -v ON_ERROR_STOP=1 exits nonzero.
-- Personas mirror docs/02 §4. Fixtures are throwaway (local db only).
-- =============================================================================

\set ON_ERROR_STOP 1

-- ---------- fixtures (as postgres) -------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'rls-client@test.sa'),
  ('00000000-0000-0000-0000-0000000000e1', 'rls-executor@test.sa'),
  ('00000000-0000-0000-0000-0000000000a1', 'rls-strategist@test.sa')
on conflict (id) do nothing;

insert into public.clients (id, company) values
  ('10000000-0000-0000-0000-0000000000aa', 'RLS Client A'),
  ('10000000-0000-0000-0000-0000000000bb', 'RLS Client B')
on conflict (id) do nothing;

update public.profiles set role = 'client',
  client_id = '10000000-0000-0000-0000-0000000000aa'
  where id = '00000000-0000-0000-0000-0000000000c1';
update public.profiles set role = 'executor'
  where id = '00000000-0000-0000-0000-0000000000e1';
update public.profiles set role = 'strategist'
  where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.leads (id, name, source) values
  ('20000000-0000-0000-0000-0000000000aa', 'RLS Lead', 'site')
on conflict (id) do nothing;

insert into public.scopes (id, client_id, status, why_no_package_fit) values
  ('30000000-0000-0000-0000-0000000000aa', '10000000-0000-0000-0000-0000000000aa', 'draft', null),
  ('30000000-0000-0000-0000-0000000000bb', '10000000-0000-0000-0000-0000000000aa', 'sent', 'RLS fixture custom scope'),
  ('30000000-0000-0000-0000-0000000000cc', '10000000-0000-0000-0000-0000000000bb', 'sent', 'RLS fixture custom scope')
on conflict (id) do nothing;

insert into public.projects (id, client_id, playbook_id, name, mode)
select '40000000-0000-0000-0000-0000000000aa',
       '10000000-0000-0000-0000-0000000000aa', id, 'RLS Proj A', mode
from public.playbooks where slug = 'seo-content'
on conflict (id) do nothing;

insert into public.projects (id, client_id, playbook_id, name, mode)
select '40000000-0000-0000-0000-0000000000bb',
       '10000000-0000-0000-0000-0000000000bb', id, 'RLS Proj B', mode
from public.playbooks where slug = 'social-media'
on conflict (id) do nothing;

insert into public.sprints (id, project_id, number) values
  ('50000000-0000-0000-0000-0000000000aa', '40000000-0000-0000-0000-0000000000aa', 1),
  ('50000000-0000-0000-0000-0000000000bb', '40000000-0000-0000-0000-0000000000bb', 1)
on conflict (id) do nothing;

insert into public.tasks (id, project_id, sprint_id, title, assignee) values
  ('60000000-0000-0000-0000-0000000000aa', '40000000-0000-0000-0000-0000000000aa',
   '50000000-0000-0000-0000-0000000000aa',
   'RLS Task', '00000000-0000-0000-0000-0000000000e1')
on conflict (id) do nothing;

insert into public.website_clients (id, client_id, display_name_ar, consent_public, published) values
  ('70000000-0000-0000-0000-0000000000aa', '10000000-0000-0000-0000-0000000000aa', 'أ', true, true),
  ('70000000-0000-0000-0000-0000000000bb', '10000000-0000-0000-0000-0000000000bb', 'ب', false, true)
on conflict (id) do nothing;

-- ---------- CLIENT persona ---------------------------------------------------
do $$
declare n int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.clients;
  if n <> 1 then raise exception 'client: clients visible expected 1 got %', n; end if;

  select count(*) into n from public.scopes;
  if n <> 1 then raise exception 'client: scopes visible expected 1 (sent own) got %', n; end if;

  select count(*) into n from public.leads;
  if n <> 0 then raise exception 'client: leads must be invisible, got %', n; end if;

  select count(*) into n from public.tasks;
  if n <> 0 then raise exception 'client: tasks must be invisible, got %', n; end if;

  -- audit_log is now grantable (auditor/dpo read it) — RLS must still hide
  -- every row from clients.
  select count(*) into n from public.audit_log;
  if n <> 0 then
    raise exception 'client: audit_log rows must be hidden, saw %', n;
  end if;
end $$;

-- ---------- EXECUTOR persona -------------------------------------------------
do $$
declare n int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.leads;
  if n <> 0 then raise exception 'executor: leads must be invisible, got %', n; end if;

  select count(*) into n from public.projects;
  if n <> 1 then raise exception 'executor: only assigned project, expected 1 got %', n; end if;

  begin
    select count(*) into n from public.payment_accounts where internal_label is not null;
    raise exception 'executor: internal_label must be column-denied';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- STRATEGIST persona ----------------------------------------------
do $$
declare n int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.leads;
  if n < 1 then raise exception 'strategist: must see leads'; end if;

  select count(*) into n from public.scopes;
  if n <> 3 then raise exception 'strategist: scopes expected 3 got %', n; end if;
end $$;

-- ---------- ANON persona -----------------------------------------------------
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);

  select count(*) into n from public.website_clients;
  if n <> 1 then
    raise exception 'anon: website consent gate broken — expected 1 got %', n;
  end if;

  begin
    select count(*) into n from public.leads;
    raise exception 'anon: leads must be permission-denied';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- documents immutability ------------------------------------------
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);

  -- rerunnable on a non-fresh stack: the frozen fixture may already exist
  insert into public.documents (id, type, client_id, payload, number, status, issued_on)
  values ('80000000-0000-0000-0000-0000000000aa', 'quote',
          '10000000-0000-0000-0000-0000000000aa', '{"x":1}', 'Q-99999', 'sent', current_date)
  on conflict (id) do nothing;

  begin
    update public.documents set payload = '{"tampered":true}'
      where id = '80000000-0000-0000-0000-0000000000aa';
    raise exception 'immutability: payload tamper must be rejected';
  exception when raise_exception then
    if sqlerrm not like '%immutable%' then raise; end if;
  end;

  begin
    delete from public.documents where id = '80000000-0000-0000-0000-0000000000aa';
    raise exception 'immutability: delete must be rejected';
  exception when raise_exception then
    if sqlerrm not like '%immutable%' then raise; end if;
  end;
end $$;

-- ---------- content engine (المرحلة ٨) ---------------------------------------
insert into public.content_items (id, client_id, channel, title, status, ai_generated) values
  -- مسودة داخلية لعميل أ: يجب ألا يراها
  ('90000000-0000-0000-0000-0000000000aa', '10000000-0000-0000-0000-0000000000aa',
   'social_post', 'مسودة داخلية', 'draft', false),
  -- بمراجعة العميل لعميل أ: يراها
  ('90000000-0000-0000-0000-0000000000ab', '10000000-0000-0000-0000-0000000000aa',
   'article', 'مقال للاعتماد', 'client_review', false),
  -- بمراجعة العميل لعميل ب: عزل تام
  ('90000000-0000-0000-0000-0000000000bb', '10000000-0000-0000-0000-0000000000bb',
   'article', 'مقال عميل آخر', 'client_review', false)
on conflict (id) do nothing;

do $$
declare n int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.content_items;
  if n <> 1 then
    raise exception 'client: content visible expected 1 (own client_review) got %', n;
  end if;

  -- العميل قراءة فقط — أي تعديل مباشر يجب أن يمس صفر صفوف
  update public.content_items set title = 'عبث'
    where id = '90000000-0000-0000-0000-0000000000ab';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'client: content update must hit 0 rows, hit %', n; end if;
end $$;

-- الحارس: إدراج منشور مباشرة (حتى كفريق) مرفوض
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  begin
    insert into public.content_items (client_id, channel, title, status, ai_generated)
    values ('10000000-0000-0000-0000-0000000000aa', 'email', 'قفز فوق الاعتماد',
            'published', false);
    raise exception 'content: direct published insert must be rejected';
  exception when raise_exception then
    if sqlerrm not like '%اعتماد%' then raise; end if;
  end;
end $$;

-- ---------- blog engine (المرحلة ٨ب) -----------------------------------------
insert into public.articles (id, slug, title, body_md, status, ai_generated) values
  ('a0000000-0000-0000-0000-0000000000aa', 'rls-published', 'منشور', 'نص', 'published', false),
  ('a0000000-0000-0000-0000-0000000000ab', 'rls-draft', 'مسودة', 'نص', 'review', false)
on conflict (id) do nothing;

do $$
declare n int;
begin
  -- anon: يرى المنشور فقط
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  -- نحصر بمقالات الحزام (البذرة الافتتاحية منشورة أيضاً)
  select count(*) into n from public.articles where slug like 'rls-%';
  if n <> 1 then raise exception 'anon: articles expected 1 published got %', n; end if;

  -- العميل: لا يرى الإشارات ولا مسودات المدونة
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.content_signals;
  if n <> 0 then raise exception 'client: signals must be invisible, got %', n; end if;
  select count(*) into n from public.articles where status <> 'published';
  if n <> 0 then raise exception 'client: article drafts must be invisible, got %', n; end if;
end $$;

-- ---------- team chat + profile self-edit (المرحلة ٨ج) -----------------------
do $$
declare n int;
begin
  -- الاستراتيجي يرسل: عامة + خاصة للمنفذ
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  insert into public.team_chat (sender, recipient, body) values
    ('00000000-0000-0000-0000-0000000000a1', null, 'رسالة عامة (حزام)'),
    ('00000000-0000-0000-0000-0000000000a1',
     '00000000-0000-0000-0000-0000000000e1', 'خاصة للمنفذ (حزام)');

  -- انتحال مرسل: مرفوض
  begin
    insert into public.team_chat (sender, recipient, body) values
      ('00000000-0000-0000-0000-0000000000e1', null, 'انتحال');
    raise exception 'chat: sender spoofing must be rejected';
  exception when insufficient_privilege or check_violation then null;
  end;

  -- المنفذ يرى العامة وخاصته (٢)
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  select count(*) into n from public.team_chat where body like '%حزام%';
  if n <> 2 then raise exception 'executor: chat expected 2 got %', n; end if;

  -- العميل معزول كلياً
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  select count(*) into n from public.team_chat;
  if n <> 0 then raise exception 'client: chat must be invisible, got %', n; end if;

  -- ترقية ذاتية: مرفوضة
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  begin
    update public.profiles set role = 'admin'
      where id = '00000000-0000-0000-0000-0000000000e1';
    raise exception 'profiles: self escalation must be rejected';
  exception when raise_exception then
    if sqlerrm not like '%مدير النظام%' then raise; end if;
  end;

  -- تنظيف (كمرسل يملك رسائله)
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  delete from public.team_chat where body like '%حزام%';
end $$;

select 'RLS_CHECKS_PASSED' as result;

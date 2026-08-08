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

-- ---------- support routing + admin oversight (المرحلة ٨ز) -------------------
do $$
declare v_th uuid; n int;
begin
  -- العميل يفتح محادثة قانونية
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  insert into public.support_threads (client_id, department, subject)
  values ('10000000-0000-0000-0000-0000000000aa', 'legal', 'حزام: سؤال قانوني')
  returning id into v_th;
  insert into public.support_messages (thread_id, sender, body)
  values (v_th, '00000000-0000-0000-0000-0000000000c1', 'حزام: نص');

  -- المنفذ (قسم المشاريع): معزول عن القانونية
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  select count(*) into n from public.support_threads where subject like 'حزام:%';
  if n <> 0 then raise exception 'executor: legal support must be invisible, got %', n; end if;

  -- الاستراتيجي: يرى الكل (إشراف+)
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  select count(*) into n from public.support_threads where subject like 'حزام:%';
  if n <> 1 then raise exception 'strategist: must see all support, got %', n; end if;
  insert into public.support_messages (thread_id, sender, body)
  values (v_th, '00000000-0000-0000-0000-0000000000a1', 'حزام: رد بدل المختص');

  -- العميل يرى الرد
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  select count(*) into n from public.support_messages where thread_id = v_th;
  if n <> 2 then raise exception 'client: support replies expected 2 got %', n; end if;

  -- تنظيف
  perform set_config('role', 'postgres', true);
  delete from public.support_threads where subject like 'حزام:%';
end $$;

-- ---------- drop forms + onboarding (ذيل المرحلة ٧) --------------------------
do $$
declare v_form uuid; v_req uuid; n int;
begin
  select id into v_form from public.forms where is_system limit 1;
  if v_form is null then raise exception 'forms: system seed missing'; end if;

  -- طلب لعميل أ
  insert into public.form_requests (form_id, client_id, requested_by)
  values (v_form, '10000000-0000-0000-0000-0000000000aa', null)
  returning id into v_req;

  -- عميل أ يرى النموذج والطلب ويعبي
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.forms;
  if n <> 1 then raise exception 'client: requested form expected 1 got %', n; end if;
  insert into public.form_responses (request_id, form_id, client_id, respondent, answers)
  values (v_req, v_form, '10000000-0000-0000-0000-0000000000aa',
          '00000000-0000-0000-0000-0000000000c1', '{"about":"حزام"}');
  -- تعبئة ثانية لنفس الطلب مرفوضة
  begin
    insert into public.form_responses (request_id, form_id, client_id, respondent, answers)
    values (v_req, v_form, '10000000-0000-0000-0000-0000000000aa',
            '00000000-0000-0000-0000-0000000000c1', '{}');
    raise exception 'forms: duplicate submission must be rejected';
  exception when unique_violation or insufficient_privilege then null;
  end;

  -- المنفذ (فريق) يرى الإجابة؛ والعميل لا يرى نماذج غيره
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  select count(*) into n from public.form_responses where answers->>'about' = 'حزام';
  if n <> 1 then raise exception 'team: form response expected 1 got %', n; end if;

  perform set_config('role', 'postgres', true);
  delete from public.form_responses where answers->>'about' = 'حزام';
  delete from public.form_requests where id = v_req;
end $$;

-- ---------- بوابة الموظف + صحة العملاء (المرحلة ١٠) --------------------------
do $$
declare n int;
begin
  -- المحفز أنشأ قوائم تعيين لأعضاء الحزام تلقائياً؛ نزرع صحة عميل للفحص
  perform set_config('role', 'postgres', true);
  insert into public.client_health (client_id, week_start, score, band)
  values ('10000000-0000-0000-0000-0000000000aa', date_trunc('week', now())::date, 88, 'green')
  on conflict do nothing;

  -- المنفذ: يرى قائمته هو فقط — لا قوائم زملائه
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.staff_checklists;
  if n <> 1 then raise exception 'executor: own checklist only expected 1 got %', n; end if;
  select count(*) into n from public.staff_checklists
    where profile_id <> '00000000-0000-0000-0000-0000000000e1';
  if n <> 0 then raise exception 'executor: must not see others checklists'; end if;
  -- المنفذ لا يقفل بنوداً (إدارة القوائم لمدير النظام)
  begin
    update public.staff_checklists set status = 'done'
      where profile_id = '00000000-0000-0000-0000-0000000000e1';
    if found then raise exception 'executor: checklist update must be denied'; end if;
  exception when insufficient_privilege then null;
  end;
  -- الفريق يرى صحة العملاء
  select count(*) into n from public.client_health where score = 88;
  if n <> 1 then raise exception 'executor: client health visible to team, got %', n; end if;
  -- تسجيل عهدة ليس من صلاحياته
  begin
    insert into public.equipment_log (profile_id, item)
    values ('00000000-0000-0000-0000-0000000000e1', 'حزام: جهاز');
    raise exception 'executor: equipment insert must be denied';
  exception when insufficient_privilege then null;
  end;

  -- العميل: لا صحة عملاء ولا قوائم موظفين إطلاقاً
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
  select count(*) into n from public.client_health;
  if n <> 0 then raise exception 'client: client_health must be hidden, got %', n; end if;
  select count(*) into n from public.staff_checklists;
  if n <> 0 then raise exception 'client: staff checklists must be hidden, got %', n; end if;
  select count(*) into n from public.equipment_log;
  if n <> 0 then raise exception 'client: equipment log must be hidden, got %', n; end if;

  perform set_config('role', 'postgres', true);
  delete from public.client_health where score = 88;
end $$;

select 'RLS_CHECKS_PASSED' as result;

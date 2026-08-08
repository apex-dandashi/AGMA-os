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

select 'RLS_CHECKS_PASSED' as result;

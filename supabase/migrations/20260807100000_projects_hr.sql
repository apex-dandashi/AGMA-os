-- =============================================================================
-- Phase 4: delivery engine (docs/03 both modes, docs/04 §1.4/1.6/2.2, docs/08)
-- Playbook instantiation, task dependencies, time tracking, HR roster fields,
-- and the Odoo backbone: scope approved ⇒ projects auto-created.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tasks: belong to projects directly (sprints become optional groupings so
-- milestone-mode projects work), carry their playbook stage and dependencies.
-- -----------------------------------------------------------------------------
alter table public.tasks
  add column project_id uuid references public.projects (id) on delete cascade,
  add column stage_id uuid references public.playbook_stages (id),
  add column blocked_by uuid references public.tasks (id),
  add column sort int not null default 0;

update public.tasks t
   set project_id = s.project_id
  from public.sprints s
 where t.sprint_id = s.id and t.project_id is null;

alter table public.tasks alter column project_id set not null;
alter table public.tasks alter column sprint_id drop not null;

create index tasks_project_idx on public.tasks (project_id);
create index tasks_assignee_open_idx on public.tasks (assignee) where status <> 'done';

-- Rebuild executor scoping on the direct project link (was via sprints).
create or replace function public.is_project_member(pid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_strategist_plus()
    or exists (
      select 1 from public.tasks t
      where t.project_id = pid and t.assignee = auth.uid()
    );
$$;

drop policy "tasks: executor reads assigned projects" on public.tasks;
create policy "tasks: executor reads assigned projects" on public.tasks
  for select to authenticated
  using (public.is_team() and public.is_project_member(project_id));

-- -----------------------------------------------------------------------------
-- Time tracking (docs/04 §1.4: hours × cost rate = true project cost)
-- -----------------------------------------------------------------------------
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  member uuid not null references public.profiles (id) default auth.uid(),
  minutes int not null check (minutes > 0 and minutes <= 24 * 60),
  entry_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index time_entries_task_idx on public.time_entries (task_id);

alter table public.time_entries enable row level security;
grant select, insert, update, delete on public.time_entries to authenticated, service_role;

create policy "time: team reads" on public.time_entries
  for select to authenticated using (public.is_team());
create policy "time: member logs own" on public.time_entries
  for insert to authenticated
  with check (public.is_team() and member = auth.uid());
create policy "time: member edits own" on public.time_entries
  for update to authenticated
  using (member = auth.uid()) with check (member = auth.uid());
create policy "time: strategist+ manages" on public.time_entries
  for all to authenticated
  using (public.is_strategist_plus()) with check (public.is_strategist_plus());

create trigger time_entries_audit
  after insert or update or delete on public.time_entries
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- HR roster fields (docs/04 §1.6) + leave calendar
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column job_title text,
  add column phone text,
  add column cost_rate_hourly numeric,
  add column capacity_hours_week int not null default 40,
  add column skills text[] not null default '{}';

comment on column public.profiles.cost_rate_hourly is
  'Internal cost rate (SAR/hour) — feeds profitability (docs/04 §1.5). Admin-managed.';

create type public.leave_kind as enum ('annual', 'sick', 'unpaid', 'other');

create table public.leaves (
  id uuid primary key default gen_random_uuid(),
  member uuid not null references public.profiles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  kind public.leave_kind not null default 'annual',
  note text,
  created_at timestamptz not null default now()
);

alter table public.leaves enable row level security;
grant select, insert, update, delete on public.leaves to authenticated, service_role;

create policy "leaves: team reads" on public.leaves
  for select to authenticated using (public.is_team());
create policy "leaves: member requests own" on public.leaves
  for insert to authenticated
  with check (public.is_team() and member = auth.uid());
create policy "leaves: admin manages" on public.leaves
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger leaves_audit
  after insert or update or delete on public.leaves
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Playbook instantiation (docs/03 §How-this-changes #1): zero blank-page setup.
-- Creates the project + every task template with cumulative due dates; tasks
-- in a stage are blocked by the previous stage's approval gate (docs/04 flow #2).
-- -----------------------------------------------------------------------------
create or replace function public.create_project_from_playbook(
  p_client_id uuid,
  p_playbook_slug text,
  p_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_playbook public.playbooks%rowtype;
  v_project_id uuid;
  v_stage record;
  v_tpl record;
  v_due date := current_date;
  v_prev_gate uuid;
  v_stage_gate uuid;
  v_task_id uuid;
begin
  if not public.is_strategist_plus() then
    raise exception 'not allowed';
  end if;

  select * into v_playbook from public.playbooks where slug = p_playbook_slug;
  if v_playbook.id is null then
    raise exception 'unknown playbook %', p_playbook_slug;
  end if;

  insert into public.projects (client_id, playbook_id, name, mode, status)
  values (p_client_id, v_playbook.id, p_name, v_playbook.mode, 'planning')
  returning id into v_project_id;

  for v_stage in
    select * from public.playbook_stages
    where playbook_id = v_playbook.id order by sort
  loop
    v_stage_gate := null;
    for v_tpl in
      select * from public.task_templates
      where stage_id = v_stage.id order by sort
    loop
      v_due := v_due + make_interval(days => v_tpl.default_days);
      insert into public.tasks
        (project_id, stage_id, template_id, title, due,
         needs_client_approval, blocked_by, sort)
      values
        (v_project_id, v_stage.id, v_tpl.id, v_tpl.title_ar, v_due,
         v_tpl.needs_client_approval, v_prev_gate, v_tpl.sort)
      returning id into v_task_id;
      if v_tpl.needs_client_approval then
        v_stage_gate := v_task_id;
      end if;
    end loop;
    -- The last approval gate of this stage blocks the next stage's tasks.
    if v_stage_gate is not null then
      v_prev_gate := v_stage_gate;
    end if;
  end loop;

  return v_project_id;
end;
$$;

grant execute on function public.create_project_from_playbook to authenticated;

-- -----------------------------------------------------------------------------
-- The backbone (docs/04 cross-module flow #1, docs/08 §2): approving a scope
-- auto-creates one project per service category in the scope.
-- -----------------------------------------------------------------------------
create or replace function public.on_scope_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope public.scopes%rowtype;
  v_company text;
  v_cat record;
begin
  if new.item_type <> 'scope' or new.status <> 'approved'
     or old.status = 'approved' then
    return new;
  end if;

  select * into v_scope from public.scopes where id = new.item_id;
  if v_scope.id is null then return new; end if;

  update public.scopes set status = 'approved' where id = v_scope.id
    and status <> 'approved';

  select company into v_company from public.clients where id = v_scope.client_id;

  for v_cat in
    select distinct c.slug, c.name_ar
    from public.services_catalog s
    join public.service_categories c on c.id = s.category_id
    where s.id = any (v_scope.service_ids)
  loop
    -- Skip if an active project for this client+category already exists.
    if not exists (
      select 1 from public.projects p
      join public.playbooks pb on pb.id = p.playbook_id
      where p.client_id = v_scope.client_id
        and pb.slug = v_cat.slug
        and p.status in ('planning', 'active')
    ) then
      perform public.create_project_from_playbook(
        v_scope.client_id, v_cat.slug, v_company || ' — ' || v_cat.name_ar);
    end if;
  end loop;

  return new;
end;
$$;

create trigger approvals_scope_approved
  after update on public.approvals
  for each row execute function public.on_scope_approved();

-- Realtime for team-shared delivery views
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.time_entries;

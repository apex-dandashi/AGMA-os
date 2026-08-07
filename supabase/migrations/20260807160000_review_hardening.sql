-- Review round (post-6.5c): bug fixes + RLS hardening + benchmark gaps.
--
-- 1. FIX Flag & Hold deadlock: the gate checked "any flagged run ever", so a
--    task once flagged could never be completed even after a fresh run passed.
--    The gate now judges the LATEST run only: it must be 'passed'. The
--    auto-filed Issue remains the IDS follow-up trail.
-- 2. pause_checklists were read-only for everyone — but Gawande's rule is
--    that checklists are living documents updated after every incident.
--    Admins can now manage them from the app.
-- 3. Allocation confirmation is a partner act (bank transfers): tightened
--    from strategist+ to admin-only writes; team keeps read.
-- 4. Benchmark gap (docs/08 §3): payment reminder ladder — overdue +3d and
--    +7d client reminders join the existing due-tomorrow one.

-- ---------------------------------------------------------------------------
-- 1. Checklist gate: latest run decides
-- ---------------------------------------------------------------------------
create or replace function public.tasks_checklist_gate()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_key text; v_last public.checklist_runs%rowtype;
begin
  if new.status = 'done' and old.status <> 'done' and new.template_id is not null then
    select checklist_key into v_key from public.task_templates where id = new.template_id;
    if v_key is not null then
      select * into v_last from public.checklist_runs
        where task_id = new.id
        order by created_at desc limit 1;
      if v_last.id is null or v_last.status = 'in_progress' then
        raise exception 'نقطة توقف: هذه المهمة تتطلب قائمة فحص «%» مكتملة قبل الإنجاز', v_key;
      end if;
      if v_last.status = 'flagged' then
        raise exception 'Flag & Hold مفعّل على هذه المهمة — عالج السبب ثم أعد الفحص';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Checklists are living documents (admin-editable)
-- ---------------------------------------------------------------------------
grant insert, update, delete on public.pause_checklists to authenticated;
create policy "checklists: admin manages" on public.pause_checklists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Allocation confirmation is admin-only
-- ---------------------------------------------------------------------------
drop policy "allocations: strategist+ manages" on public.allocations;
create policy "allocations: team reads" on public.allocations
  for select to authenticated using (public.is_team());
create policy "allocations: admin manages" on public.allocations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Overdue payment reminders (+3d, +7d) — docs/08 finance ladder
-- ---------------------------------------------------------------------------
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('invoice_overdue', 'email', 'ar', 'تذكير: الفاتورة {{number}} مستحقة',
   'نذكّركم بأن الفاتورة رقم {{number}} أصبحت مستحقة منذ {{days}} أيام وقيمتها المتبقية {{balance}} ريال. للسداد عبر التحويل البنكي: {{bank}} — آيبان: {{iban}}. نشكر لكم تعاونكم.', true)
on conflict do nothing;

create or replace function public.send_overdue_reminders()
returns void
language plpgsql security definer set search_path = public as $$
declare r record; v_paid numeric; v_days int;
begin
  for r in
    select d.* from public.documents d
    where d.type = 'invoice' and d.status in ('sent', 'signed', 'active')
      and d.valid_until in (current_date - 3, current_date - 7)
  loop
    select coalesce(sum(amount), 0) into v_paid
      from public.payments where invoice_id = r.id;
    if v_paid < coalesce(r.total, 0) then
      v_days := current_date - r.valid_until;
      perform public.enqueue_notification(
        'invoice_overdue', 'email', 'invoice_overdue',
        jsonb_build_object('number', r.number,
          'days', v_days::text,
          'balance', (coalesce(r.total, 0) - v_paid)::text,
          'bank', r.payload -> 'paymentAccount' ->> 'bankName',
          'iban', r.payload -> 'paymentAccount' ->> 'iban'),
        null,
        (select email from public.contacts
          where client_id = r.client_id and email is not null
          order by is_primary desc limit 1),
        r.client_id, now(), 'overdue' || v_days || ':' || r.id);
      -- partners see the red too
      perform public.notify_team('invoice_overdue', 'invoice_overdue_team',
        jsonb_build_object('number', r.number, 'days', v_days::text,
          'balance', (coalesce(r.total, 0) - v_paid)::text),
        r.client_id, 'overdue-team' || v_days || ':' || r.id);
    end if;
  end loop;
end;
$$;

insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('invoice_overdue_team', 'inapp', 'ar', null,
   'الفاتورة {{number}} متأخرة {{days}} أيام — المتبقي {{balance}} ريال', true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Quote-line costs (docs/08 §2: margin on quote lines). Kept OUT of
--    documents.payload: the portal will let clients read their documents in
--    Phase 7, and cost/margin is internal-only — separate table, team-only RLS.
-- ---------------------------------------------------------------------------
create table public.document_costs (
  document_id uuid primary key references public.documents(id) on delete cascade,
  costs jsonb not null default '[]'::jsonb,
  total_cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_costs enable row level security;
create policy "document_costs: team manages" on public.document_costs
  for all to authenticated using (public.is_team()) with check (public.is_team());
grant select, insert, update, delete on public.document_costs to authenticated, service_role;
create trigger document_costs_set_updated_at before update
  on public.document_costs for each row execute function public.set_updated_at();

create or replace function public.run_daily_jobs_v3()
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.run_daily_jobs_v2();
  perform public.send_overdue_reminders();
end;
$$;

select cron.unschedule('agma-daily');
select cron.schedule('agma-daily', '0 6 * * *',
  $$select public.run_daily_jobs_v3()$$);

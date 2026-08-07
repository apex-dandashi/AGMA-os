-- Data round: entry normalization at the database boundary, data-quality
-- surface, and consumption-ready analytics views. Goal: every record that
-- enters AGMA OS is clean at rest, its gaps are visible, and downstream
-- consumers (reports, the Phase-8 RAG/chatbot layer, exports) read from
-- stable, RLS-respecting views instead of ad-hoc joins.

-- ---------------------------------------------------------------------------
-- 1. Normalization primitives
-- ---------------------------------------------------------------------------
-- Arabic-Indic and Extended (Persian) digits → Latin. Users type both.
create or replace function public.normalize_digits(t text)
returns text language sql immutable as $$
  select translate(t, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
$$;

-- Saudi phone → E.164 (+9665XXXXXXXX). Foreign/odd numbers pass through
-- digit-normalized but otherwise untouched — normalize, never destroy.
create or replace function public.normalize_phone_sa(t text)
returns text language plpgsql immutable as $$
declare d text;
begin
  if t is null or trim(t) = '' then return null; end if;
  d := regexp_replace(public.normalize_digits(t), '[^0-9+]', '', 'g');
  d := regexp_replace(d, '^00', '+');
  if d ~ '^\+966' then
    return '+966' || ltrim(substr(d, 5), '0');
  elsif d ~ '^966' then
    return '+966' || ltrim(substr(d, 4), '0');
  elsif d ~ '^05[0-9]{8}$' then
    return '+966' || substr(d, 2);
  elsif d ~ '^5[0-9]{8}$' then
    return '+966' || d;
  end if;
  return d;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Normalize at the boundary (triggers — catches every entry path:
--    forms, edge functions, imports, SQL)
-- ---------------------------------------------------------------------------
create or replace function public.contacts_normalize()
returns trigger language plpgsql as $$
begin
  new.name := trim(new.name);
  new.title := nullif(trim(coalesce(new.title, '')), '');
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  new.phone := public.normalize_phone_sa(new.phone);
  return new;
end;
$$;
create trigger contacts_normalize before insert or update on public.contacts
  for each row execute function public.contacts_normalize();

create or replace function public.leads_normalize()
returns trigger language plpgsql as $$
begin
  new.name := trim(new.name);
  new.company := nullif(trim(coalesce(new.company, '')), '');
  return new;
end;
$$;
create trigger leads_normalize before insert or update on public.leads
  for each row execute function public.leads_normalize();

create or replace function public.clients_normalize()
returns trigger language plpgsql as $$
begin
  new.company := trim(new.company);
  return new;
end;
$$;
create trigger clients_normalize before insert or update on public.clients
  for each row execute function public.clients_normalize();

-- One-time cleanup of existing rows (triggers fire on update).
update public.contacts set id = id;
update public.leads set id = id;
update public.clients set id = id;

-- Fast fuzzy lookup for duplicate detection and search.
create extension if not exists pg_trgm;
create index if not exists clients_company_trgm_idx
  on public.clients using gin (company gin_trgm_ops);
create index if not exists leads_name_trgm_idx
  on public.leads using gin (name gin_trgm_ops);
create index if not exists leads_company_trgm_idx
  on public.leads using gin (company gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. client_360 — one row per client, everything a human or model needs
--    to reason about the relationship. security_invoker: RLS applies.
-- ---------------------------------------------------------------------------
create or replace view public.client_360
with (security_invoker = true) as
select
  c.id,
  c.company,
  c.sector,
  c.status,
  c.tags,
  (select count(*) from public.contacts k where k.client_id = c.id) as contacts_count,
  (select max(i.created_at) from public.interactions i where i.client_id = c.id) as last_interaction_at,
  (select count(*) from public.projects p where p.client_id = c.id) as projects_count,
  (select count(*) from public.projects p
     where p.client_id = c.id and p.status = 'active') as active_projects,
  (select count(*) from public.scopes s where s.client_id = c.id) as scopes_count,
  exists (select 1 from public.scopes s
     where s.client_id = c.id and s.package_id is not null) as bought_package,
  coalesce((select sum(d.total) from public.documents d
     where d.client_id = c.id and d.type = 'invoice'
       and d.status not in ('draft', 'void')), 0) as invoiced_total,
  coalesce((select sum(p.amount) from public.payments p
     join public.documents d on d.id = p.invoice_id
     where d.client_id = c.id), 0) as paid_total,
  coalesce((select sum(d.total) from public.documents d
     where d.client_id = c.id and d.type = 'invoice'
       and d.status not in ('draft', 'void')), 0)
  - coalesce((select sum(p.amount) from public.payments p
     join public.documents d on d.id = p.invoice_id
     where d.client_id = c.id), 0) as open_balance,
  (select count(*) from public.approvals a
     where a.client_id = c.id and a.status = 'pending') as pending_approvals,
  coalesce((select sum(w.budget) from public.wallets w where w.client_id = c.id), 0) as wallet_budget,
  c.created_at
from public.clients c;

grant select on public.client_360 to authenticated;

-- ---------------------------------------------------------------------------
-- 4. pipeline_analytics — win rates and cycle times by source
-- ---------------------------------------------------------------------------
create or replace view public.pipeline_analytics
with (security_invoker = true) as
select
  l.source,
  count(*) as leads_total,
  count(*) filter (where l.outcome = 'won') as won,
  count(*) filter (where l.outcome = 'lost') as lost,
  count(*) filter (where l.outcome = 'open') as open,
  case when count(*) filter (where l.outcome in ('won', 'lost')) = 0 then null
    else round(100.0 * count(*) filter (where l.outcome = 'won')
      / count(*) filter (where l.outcome in ('won', 'lost')), 1) end as win_rate_pct,
  round(avg(extract(epoch from l.updated_at - l.created_at) / 86400)
    filter (where l.outcome = 'won'), 1) as avg_days_to_win,
  coalesce(sum(l.value) filter (where l.outcome = 'open'), 0) as open_value
from public.leads l
group by l.source;

grant select on public.pipeline_analytics to authenticated;

-- ---------------------------------------------------------------------------
-- 5. document_margins + project_costs — profitability building blocks
-- ---------------------------------------------------------------------------
create or replace view public.document_margins
with (security_invoker = true) as
select
  d.id, d.number, d.type, d.status, d.client_id, d.issued_on,
  d.total, dc.total_cost,
  case when coalesce(d.total, 0) > 0 and dc.total_cost is not null
    then round(100.0 * (d.total - dc.total_cost) / d.total, 1) end as margin_pct
from public.documents d
join public.document_costs dc on dc.document_id = d.id;

grant select on public.document_margins to authenticated;

create or replace view public.project_costs
with (security_invoker = true) as
select
  p.id, p.name, p.client_id, p.status, p.mode,
  count(distinct t.id) as tasks_total,
  count(distinct t.id) filter (where t.status = 'done') as tasks_done,
  round(coalesce(sum(te.minutes), 0) / 60.0, 1) as hours_logged,
  round(coalesce(sum(te.minutes / 60.0 * coalesce(pr.cost_rate_hourly, 0)), 0), 2) as labor_cost
from public.projects p
left join public.tasks t on t.project_id = p.id
left join public.time_entries te on te.task_id = t.id
left join public.profiles pr on pr.id = te.member
group by p.id;

grant select on public.project_costs to authenticated;

-- ---------------------------------------------------------------------------
-- 6. data_quality — the gaps, named. Reviewed in the weekly L10 / quarterly.
--    A record a human half-filled is a record no model can use.
-- ---------------------------------------------------------------------------
create or replace view public.data_quality
with (security_invoker = true) as
select 'client'::text as entity, c.id as entity_id, c.company as label,
       'عميل بلا قطاع محدد'::text as issue
  from public.clients c where c.sector is null and c.status = 'active'
union all
select 'client', c.id, c.company, 'عميل بلا أي جهة اتصال'
  from public.clients c
  where c.status = 'active'
    and not exists (select 1 from public.contacts k where k.client_id = c.id)
union all
select 'client', c.id, c.company, 'لا تواصل مسجّل منذ ٩٠ يوماً'
  from public.clients c
  where c.status = 'active'
    and not exists (select 1 from public.interactions i
      where i.client_id = c.id and i.created_at > now() - interval '90 days')
union all
select 'contact', k.id, k.name, 'جهة اتصال بلا هاتف ولا بريد'
  from public.contacts k where k.phone is null and k.email is null
union all
select 'lead', l.id, l.name, 'صفقة مفتوحة بلا قيمة متوقعة'
  from public.leads l where l.outcome = 'open' and l.value is null
union all
select 'lead', l.id, l.name, 'صفقة مفتوحة بلا تاريخ إغلاق متوقع'
  from public.leads l where l.outcome = 'open' and l.expected_close is null
union all
select 'lead', l.id, l.name, 'صفقة مفتوحة بلا نشاط قادم (خرق الانضباط)'
  from public.leads l
  where l.outcome = 'open'
    and not exists (select 1 from public.activities a
      where a.lead_id = l.id and a.done_at is null)
union all
select 'lead', l.id, l.name, 'صفقة خاسرة بلا سبب موثّق'
  from public.leads l where l.outcome = 'lost'
    and nullif(trim(coalesce(l.lost_reason, '')), '') is null;

grant select on public.data_quality to authenticated;

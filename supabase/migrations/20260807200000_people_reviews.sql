-- Orange package: People Analyzer storage (EOS §2.2.2 — docs/10).
-- The table was specified in the schema delta but never created in 6.5a.
create table public.people_reviews (
  id uuid primary key default gen_random_uuid(),
  subject uuid not null references public.profiles(id),
  reviewer uuid not null references public.profiles(id) default auth.uid(),
  quarter text not null,
  -- {"<core value>": "+" | "±" | "-"}
  value_scores jsonb not null default '{}'::jsonb,
  -- GWC per current seat: {"gets": bool, "wants": bool, "capacity": bool}
  gwc jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  unique (subject, reviewer, quarter)
);

alter table public.people_reviews enable row level security;
-- EOS runs this transparently in the quarterly session: the team sees, admins write.
create policy "people_reviews: team reads" on public.people_reviews
  for select to authenticated using (public.is_team());
create policy "people_reviews: admin manages" on public.people_reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.people_reviews to authenticated, service_role;
create trigger people_reviews_audit after insert or update or delete
  on public.people_reviews for each row execute function public.audit_trigger();

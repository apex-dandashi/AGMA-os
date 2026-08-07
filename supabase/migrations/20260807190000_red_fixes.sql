-- Red package: members may delete their own mistaken time entries
-- (strategist+ already can via "time: strategist+ manages").
create policy "time: member deletes own" on public.time_entries
  for delete to authenticated using (member = auth.uid());

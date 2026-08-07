-- =============================================================================
-- Sprint C3: rate limiting for public endpoints (lead-intake).
-- PDPL-aware: stores only a salted hash of the caller IP, self-pruning.
-- =============================================================================

create table public.rate_limits (
  bucket text not null,
  caller_hash text not null,
  window_start timestamptz not null default now(),
  hits int not null default 1,
  primary key (bucket, caller_hash, window_start)
);

alter table public.rate_limits enable row level security;
-- service_role only — no policies, no client grants.
grant select, insert, update, delete on public.rate_limits to service_role;

-- Returns true when the caller is within limits for the bucket.
-- Window: 1 hour; also prunes rows older than 24h opportunistically.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_caller_hash text,
  p_max_per_hour int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := date_trunc('hour', now());
  n int;
begin
  delete from public.rate_limits where window_start < now() - interval '24 hours';
  insert into public.rate_limits (bucket, caller_hash, window_start)
  values (p_bucket, p_caller_hash, w)
  on conflict (bucket, caller_hash, window_start)
    do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  return n <= p_max_per_hour;
end;
$$;

grant execute on function public.check_rate_limit to service_role;

-- Bug fix: settings/الحسابات البنكية hung forever. Root cause: phase-0
-- deliberately granted column-level SELECT on payment_accounts (excluding
-- internal_label — the «لا يظهر للعميل» rule — and created_at), and the new
-- settings tab selected * ordered by created_at → permission denied.
--
-- Fix keeps the protection: the base table stays column-restricted (portal
-- clients in Phase 7 authenticate as `authenticated` and must never read
-- internal labels). Admins get a definer view with everything.

grant select (created_at) on public.payment_accounts to authenticated;

create or replace view public.payment_accounts_admin as
  select * from public.payment_accounts where public.is_admin();

grant select on public.payment_accounts_admin to authenticated;

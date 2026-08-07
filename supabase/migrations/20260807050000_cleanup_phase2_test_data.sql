-- One-time removal of Phase 2 end-to-end test records (2026-08-07 test loop),
-- scoped to exact ids captured from production. No-op on any environment
-- where these rows don't exist. Audit log rows are intentionally preserved.

-- Pending approval on the test scope
delete from public.approvals
  where id = '7dfb7579-db7e-4fa6-b827-bc8c290d24bc';

-- Test scope (client مرّونيا)
delete from public.scopes
  where id = 'bc6c393e-09b0-444e-a6ae-01110f9e3690';

-- Website presence row (unpublished)
delete from public.website_clients
  where id = 'e58bf443-5302-4b95-b54b-2e4543214674';

-- Test client مرّونيا (contacts/interactions would cascade; none exist)
delete from public.clients
  where id = 'd0a90caf-11ef-4fe2-81a9-098fa0de009f';

-- Intake test lead (عميل تجريبي — اختبار النظام)
delete from public.leads
  where id = '26b67b26-17e1-4710-80d9-2334fec517b0';

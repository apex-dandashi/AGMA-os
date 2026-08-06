# AGMA OS — Build Progress

Update after every session (CLAUDE.md). Phase specs: docs/05 §C2.

## Phase tracker

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold + CI/CD + migrate current site | ✅ Done (2026-08-06) |
| 1 | Schema / RLS / seeds / auth / audit | ✅ Done (2026-08-07) |
| 2 | CRM + Sales + website sync | ✅ Done (2026-08-07) |
| 3 | Legal generators | ⬜ |
| 4 | Projects + playbooks + HR | ⬜ |
| 5 | Finance KSA | ⬜ |
| 6 | Notifications | ⬜ |
| 7 | Portal + onboarding + Drop Forms | ⬜ |
| 8 | Content Engine | ⬜ |
| 9 | Help Centre / RAG + chatbots | ⬜ |
| 10 | Employee portal + Analytics + digests | ⬜ |

## Phase 2 log (2026-08-07)

**Built:**
- Migration `20260807030000_crm_website_sync`: `contacts`, `interactions`
  (docs/04 §2.1) + `website_clients` (docs/05 §B1) with the consent kill
  switch — anon read policy requires `published AND consent_public`, and
  withdrawing consent force-unpublishes in the ops UI. Also: service_role
  DML grants across all public tables (same image gap as Phase 1's
  authenticated grants, surfaced as 42501 in the edge function).
- Edge function **lead-intake** (deployed to production): validates + honeypot,
  CORS locked to agma.com.sa/staging/localhost, inserts leads with source=site.
  `verify_jwt=false` (public form endpoint).
- **apps/ops** (ops.agma.com.sa, static export SPA): Supabase auth gate (team
  roles only — client accounts blocked), 6-stage pipeline Kanban with lead
  create/stage moves/convert-to-client, clients workspace (contacts +
  interactions log), scope builder over the 32-service catalog with SoW draft
  preview (docs/06 §3.5 default terms) + send-for-approval (creates approvals
  row), website sync manager.
- **apps/marketing**: lead form now posts to lead-intake (WhatsApp path kept as
  fallback on failure); `ClientLogos` section on homepage renders published
  clients — invisible while empty, so zero visual change until first publish.

**Verified locally:** full db reset replay · anon RLS on website_clients
(kill switch confirmed) · lead-intake end-to-end (insert, honeypot, validation)
· production function smoke-tested (honeypot + CORS, no junk data) · all
builds + typechecks green.

**Owner to-do (SETUP.md Phase 2 additions):** env vars on both marketing
deployments + redeploy · create ops.agma.com.sa deployment · create first
team user + promote to admin.

**Manual test list (after owner to-do):**
1. Submit the contact form on agma.com.sa → lead appears in ops pipeline
   (stage: مكالمة استكشافية, source: الموقع).
2. Log in to ops.agma.com.sa with the admin account; client account should be
   rejected.
3. Move a lead across stages; convert at خارطة الطريق stage → client created.
4. Client detail: add contact + log interaction; build a scope (services from
   catalog), check SoW preview, save draft, send for approval.
5. Website page: enable a client, toggle consent + publish → logo/name appears
   on agma.com.sa homepage (section auto-appears); withdraw consent →
   disappears and publish toggle clears.

**Decisions/notes:**
- **Supabase GitHub integration is NOT applying migrations** (discovered
  2026-08-07; Phase 1+2 reached production via manual `supabase db push`).
  **Resolved:** `.github/workflows/migrate.yml` now runs `db push` on every
  merge to main touching supabase/ (idempotent via migration tracker; also
  manually triggerable via workflow_dispatch). Needs repo secrets
  SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD (SETUP.md §1); owner should
  disconnect the Supabase GitHub integration. Local `db reset` verification
  before merge remains mandatory (CLAUDE.md rule 7).
- Logos are URL-based v1 (paste a URL in ops). Proper upload to R2/Storage
  lands with the DAM (docs/04 §3.4). R2 bucket still pending in SETUP §4.
- Rate limiting on lead-intake is honeypot-only v1; add per-IP limits when
  the notifications phase introduces infra for it.
- WhatsApp webhook intake (docs/02 §3.1) deferred to Phase 6 (needs Twilio).

## Phase 1 log (2026-08-07)

**Built (3 migrations + packages/db):**
- `20260807010000_roles_profiles`: user_role enum (admin/strategist/executor/client),
  `profiles` on auth.users with auto-create trigger, security-definer RLS helpers
  (`app_role`, `is_admin`, `is_strategist_plus`, `is_team`, `current_client_id`,
  `is_project_member`), `role_profiles` (5 seeded incl. Key Accounts Manager)
- `20260807010100_core_schema`: full docs/02 §2 model — service_categories,
  services_catalog, clients, leads, scopes, roadmaps, projects, sprints, tasks,
  metrics, reports, approvals (with server-side decision stamping), messages +
  docs/03 playbook engine (playbooks, playbook_stages, task_templates,
  kpi_definitions). RLS + audit trigger on every table; explicit table grants.
- `20260807010200_catalog_seeds`: 8 categories · 32 services (AR names from live
  site) · 8 playbooks · 36 stages · 113 task templates (26 client-approval
  gates) · 31 KPI definitions · 5 role_profiles
- `packages/db`: generated Database types, typed client factory, stage/phase constants

**Verified locally (db reset from zero + persona tests):**
- RLS matrix matches docs/02 §4 exactly: client sees only own rows (draft scopes
  hidden); executor sees only assigned projects, no leads; strategist sees all;
  audit_log denied to everyone below service_role.
- Found + fixed: this Postgres image's default privileges give `authenticated`
  no DML — every table needs explicit grants alongside policies. **Rule for all
  future migrations: policy + grant, always both.** (Phase 0's flags read policy
  had the same latent gap; grant added here.)

**Decisions/notes for owner:**
1. Catalog divergence: site's AI page shows 4 services (incl. LLM Integration);
   docs/03 canon is 5 (AI agents, workflow automation, chatbots, GEO, predictive
   analytics) — seeded per docs/03. Reconcile when Phase 2 wires website sync.
2. Playbook modes: ai-automation=milestone, pr-media=recurring (docs/03 leaves
   these two unassigned) — flip in `playbooks.mode` if wrong.
3. task_template default_days are starting estimates — tune in ops UI later.
4. First admin user: after signing up in the portal/ops app, promote via
   `update profiles set role='admin' where email='...'` (service role).

**Phase 2 will:** CRM + Sales pipeline UI in apps/ops (Kanban per docs/02 §3.1),
lead intake from the site contact form, scope builder → SoW draft, website
live-sync (website_clients + consent_public kill switch per docs/05 §B1).

## Phase 0 log (2026-08-06)

**Built:**
- pnpm workspaces + Turborepo monorepo (`apps/*`, `packages/*`)
- Site export migrated to `apps/marketing` (`git mv` — history preserved), design 1:1:
  - `output: 'export'` + `images.unoptimized` (Hostinger static, Path 1 docs/05 §A1)
  - Removed unused AI Studio leftovers: `@google/genai`, `firebase-tools`,
    `postcss-import`, `next start/clean` scripts, picsum image config, HMR webpack hack
  - `eslint-config-next` aligned to Next 15; favicon renamed `favicon-agma.webp` (was spaced)
- `packages/ui`: `tokens.ts` + `tokens.css` (web palette from live site, document palette
  from docs/06 §2, typography, spacing, radii) + base `Button`/`Card` matching site styles.
  Marketing app intentionally NOT rewired to it yet (no-redesign rule).
- `supabase/`: config + env workflow README + migration `20260806120000_core_foundation`:
  `audit_log` (append-only) · generic `audit_trigger()` for all future tables ·
  `set_updated_at()` · `flags` (seeded `vat_enabled=false`) · `payment_accounts`
  (3 IBANs seeded from docs/06, single-default index, IBAN format check,
  `internal_label` excluded via column-level grants, RLS on everything)
- `.github/workflows/deploy.yml`: staging/main → Hostinger rsync-over-SSH, secrets
  via GitHub environments
- `SETUP.md`: full owner checklist (Hostinger SSH, Supabase ×2, R2, Twilio ⏳,
  SendGrid, AI keys, company-data verification)

**Stubbed / deferred:**
- `apps/ops`, `apps/portal`, `packages/db|ai-router|notifications|legal-templates|zatca`
  — directories not created until their phases (kickoff scope)
- Supabase Edge Functions dir empty; migrations not yet applied to hosted projects
- Marketing lead form is UI-only (no backend) — wired to Supabase in Phase 2
- CI migration step deferred to Phase 1 (needs `SUPABASE_ACCESS_TOKEN`)

**Decisions needed (owner):**
1. GitHub push access: local credential `aelibrahim-a11y` lacks rights on
   `apex-dandashi/AGMA-os` → add collaborator or switch credential.
2. Document palette exact values (cream/brown) are provisional in `packages/ui` —
   sample from reference PDFs before Phase 3 generators.
3. EN toggle for marketing site: CLAUDE.md rule 8 requires AR+EN; site is AR-only
   today. Propose scheduling with Phase 2 website-sync work.
4. Supabase region choice + PDPL data-residency note — Mumbai `ap-south-1`
   recommended (no Middle East region offered); confirm once projects are created.

**Decisions made (owner, 2026-08-06):**
- Twilio WhatsApp: dedicated Saudi number purchased later; sender activation deferred
  until the OS build completes. Phase 6 develops against the Twilio sandbox; only
  Meta Business verification starts early (it is the true lead-time item).
- **Single Supabase project** (`agma-os-production`) instead of staging+production.
  CLAUDE.md rule 7 amended: migrations proven on the local Supabase stack before
  `db push`; destructive migrations need explicit owner OK; feature flags isolate
  the staging site from client-visible changes. Region: Mumbai `ap-south-1`.
- PITR add-on declined (cost). Daily Pro backups (7-day retention) are the current
  recovery layer; weekly logical dump + R2→B2 mirror scheduled for a later phase.
- Supabase GitHub integration ON (merge to `main` → auto `db push`); automatic
  preview branching OFF. Consequence: local `supabase db reset` verification must
  pass BEFORE the first push of `main` to GitHub. (Verified 2026-08-06: replay
  clean, seeds + audit trigger + internal_label column denial all confirmed;
  main + staging pushed.)
- Website deploys via **Hostinger Git integration** (not GitHub Actions):
  `staging` branch → staging.agma.com.sa now; `main` → agma.com.sa at cutover,
  after visual verification of staging. Old AGMA-Web repo keeps serving
  production until then. deploy.yml replaced by ci.yml (build check only).
- pnpm pinned to **11.20.0** (Hostinger's Node 22 builder ships pnpm 11 and
  ignores older pins). Lockfile rebuilt under pnpm 11's release-age policy;
  sharp + unrs-resolver allowlisted in allowBuilds.

**Phase 1 will:** full schema + RLS for CRM/projects/finance domains, auth with roles
(admin/staff/client), seeds (32 services, 8 playbooks, roles, role_profiles),
`packages/db` with typed client + seed files, audit triggers on every new table,
CI migration step.

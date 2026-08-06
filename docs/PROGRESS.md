# AGMA OS — Build Progress

Update after every session (CLAUDE.md). Phase specs: docs/05 §C2.

## Phase tracker

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold + CI/CD + migrate current site | ✅ Done (2026-08-06) |
| 1 | Schema / RLS / seeds / auth / audit | ⬜ Next |
| 2 | CRM + Sales + website sync | ⬜ |
| 3 | Legal generators | ⬜ |
| 4 | Projects + playbooks + HR | ⬜ |
| 5 | Finance KSA | ⬜ |
| 6 | Notifications | ⬜ |
| 7 | Portal + onboarding + Drop Forms | ⬜ |
| 8 | Content Engine | ⬜ |
| 9 | Help Centre / RAG + chatbots | ⬜ |
| 10 | Employee portal + Analytics + digests | ⬜ |

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

**Phase 1 will:** full schema + RLS for CRM/projects/finance domains, auth with roles
(admin/staff/client), seeds (32 services, 8 playbooks, roles, role_profiles),
`packages/db` with typed client + seed files, audit triggers on every new table,
CI migration step.

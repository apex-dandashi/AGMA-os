# AGENTS.md — AGMA OS

## What this is
AGMA OS is the complete operations ecosystem for AGMA (وكالة جيل الذكاء الاصطناعي) — a Saudi Native-AI marketing agency in Riyadh. One monorepo, three apps (marketing site, internal ops, client portal), one Supabase brain. The system runs the agency end-to-end: CRM → contracts → projects → finance → content engine → notifications.

## Read before building
All specifications live in `/docs` — read the relevant one before touching its domain:
- `docs/01-workflow.md` — company workflow, AGMA Method™, client lifecycle
- `docs/02-system-spec.md` — v1 modules, data model, roles
- `docs/03-service-playbooks.md` — 8 category playbooks, task templates, KPIs (seed data source)
- `docs/04-module-architecture.md` — full module map, cross-module flows
- `docs/05-master-blueprint.md` — infrastructure, AI routing, costs, compliance, build phases (THE master reference)
- `docs/06-brand-standards.md` — entity constants, payment accounts, document anatomy, visual tokens (design contract for ALL generated documents/emails)
- `docs/07-quality-roadmap.md` — quality gap analysis, hardening sprints, Definition of Done
- `docs/08-erp-crm-reference.md` — ERP/CRM functionality benchmark (adopt/skip per phase)
- `docs/09-traction-eos.md` — EOS layer (SUPERSEDED by docs/10 — kept for the scorecard auto-metric details)
- `docs/10-operating-principles.md` — **THE operating system**: E-Myth × EOS × Checklist Manifesto × Profit First × Built to Sell, one flywheel (binding for phases 6.5+)
- `docs/11-finance-platform-design.md` — owner-supplied corporate finance target-state (31-page PDF), ingested with adopt/defer/skip verdicts — «المالية ٢٫٠» package derives from section ب
- `docs/12-finance-lifecycle-reference.md` — second owner study (client lifecycle depth), compared to docs/11 with verdicts; disputes/leakage/close/AR-normalize/renewals adopted
- `docs/13-contract-library-reference.md` — third owner study (contract template library); P0 templates+clauses built, rest gated with triggers
- `docs/14-contract-library-v2.md` — fourth owner study (33-template library + org identity + build rules); 12 new types + org_settings built, SCC/B2C/signature gated
- `docs/15-ims-reference.md` — fifth owner study (IMS: ISO/PDPL/NCA audit-readiness); Phase-1 core built (frameworks/controls/risks/ROPA/DSAR/breaches/CAPA), ISO catalogs+Audit Room+BCMS gated
- `docs/16-public-layer-reference.md` — sixth owner study (complaints/feedback portal, careers+ATS w/ MHRSD rules, trust center); core built incl. publish gate + escalations, question banks+interview validations gated to first published job
- `docs/references/` — real quotation/invoice PDFs + CR certificate = visual ground truth for generator QA

## Stack
- **Frontend:** Next.js (App Router, static/SSG export) + Tailwind, Arabic-first RTL with EN toggle
- **Backend:** Supabase — Postgres + RLS, Auth, Realtime, Edge Functions, pg_cron, pgvector, Vault
- **Storage:** Cloudflare R2 (binaries) + Supabase Storage (hot files <100GB); metadata always in Postgres
- **Hosting:** Hostinger via GitHub Actions (`staging` branch → staging, `main` → production)
- **Messaging:** Twilio WhatsApp + SendGrid — ONLY through the notifications package, never direct sends
- **AI:** all calls through `packages/ai-router` — Gemini Flash (volume), Codex API (quality Arabic + agentic), Gemini image aka nano banana (default images), Higgsfield (premium creative)

## Repo structure
```
apps/marketing | apps/ops | apps/portal
packages/ui | packages/db | packages/ai-router | packages/notifications | packages/legal-templates | packages/zatca
supabase/migrations | supabase/functions
docs/ | .github/workflows/
```

## Non-negotiable rules
1. **Every table ships with RLS policies + audit trigger.** No exceptions. Clients see only `client_id`-scoped rows.
2. **Every AI output passes a human approval gate** before reaching any external surface (articles, images, documents, chatbot escalations).
3. **Money and legal documents are immutable** — corrections via credit notes / new versions. Sequential gapless numbering: `Q-`, `INV-`, `CN-` prefixed counters (continue from current: next quote Q-00055).
4. **Finance = VAT-off mode** at launch (establishment not VAT-registered); 15% VAT + ZATCA fields behind `config.vat_enabled` flag. Invoice layout reserves the VAT row.
5. **Payment accounts:** 3 IBANs in `payment_accounts`, all rendering the establishment beneficiary name; `internal_label` is admin-only and must never appear in any rendered output or the portal. Main account is default.
6. **All cross-module side effects go through events → notifications engine.** WhatsApp templates require Meta pre-approval — flag any new template need immediately.
7. **Feature-flag everything client-visible.** Deploy the site to staging first, always. **Single Supabase project** (`agma-os-production`, owner decision 2026-08-06): every migration must be verified on the local Supabase stack (`supabase start` + `supabase db reset`) before `db push`; destructive migrations additionally require an explicit owner OK. Never develop features directly against production data.
8. **Bilingual by design:** every client-facing string AR + EN; documents Arabic-primary. Follow `docs/06-brand-standards.md` for anything rendered — colors, layout anatomy, «بإذن الله إلى تعاونٍ مثمر» closing on client documents.
9. **Secrets** only in GitHub Actions secrets / Supabase Vault / `.env.local` (gitignored). Credentials vault entries encrypted, access-logged.
10. **PDPL:** consent records on client PII, right-to-deletion workflow, data-processing register, no PII in logs.

## قوانين المالك (Owner Laws — binding on EVERY form/screen, existing and new)
Repeated owner feedback, codified 2026-08-08. Violating these in a new feature
is a bug, not a style choice. Check each law when touching ANY form or screen:

L1. **Dropdowns everywhere sensible.** Any field with an enumerable answer gets
    a select/datalist — never a bare text input. Cities → `SAUDI_CITIES`,
    sectors → `SECTORS`, tiers → `BUDGET_TIERS` (all from `packages/ui` geo).
L2. **Phone fields get a dial-code select** (`DIAL_CODES`, السعودية +966
    default). **Israel is excluded from all country/dial lists by KSA legal
    requirement — never add it.** Local numbers compose to E.164.
    Layout (owner 2026-08-08): select + number live in ONE `dir="ltr"` flex
    container — flag+code select on the LEFT, number input on the RIGHT;
    options render `{flag} {code} {country}`.
L3. **No raw keys in UI.** Metric keys, enum values, status codes always render
    their Arabic label (e.g. scorecard metrics by `name_ar`, never
    `on_time_tasks_pct`).
L4. **No dead-end screens.** Every displayed item links to where it is edited
    (task → project, client name → profile, document → client). If the owner
    asks «وين أعدل هذا؟», that screen has a bug.
L5. **Hint icons on every number/term** whose source or meaning isn't obvious —
    what it means, where it comes from, where to change it.
L6. **Mistake entries are deletable by managers** (client/lead/draft/scope)
    when they have no financial/legal/compliance links; linked records get an
    Arabic refusal explaining the alternative. God mode stays admin-only.
L7. **Saudi-Arabic copy, no literal translations.** Business terms explained
    in plain language (e.g. «كتيب طريقة العمل» not «الدليل C»).
L8. **RTL-safe rendering everywhere**: LTR data (numbers, IBAN, emails, refs)
    wrapped dir="ltr"; print templates tested AR+EN mixed.
L9. **Public forms**: honeypot + rate limit + Arabic field-specific errors +
    privacy-notice version stored + data minimization (identity only with
    explicit permission). Every new public edge function gets its
    `config.toml` `verify_jwt = false` entry BEFORE first deploy.
L10. **After adding any public-facing feature, update privacy policy + terms**
    in the same round — policies must always describe current reality.
L11. **Every lead-capturing form requires a phone number** (with dial select
    per L2, +966 default) — enforced in the edge-function schema too, so no
    future form can capture a lead without it. Phone is the sales channel.
L12. **No closed service lists** (owner, 2026-08-09): the catalog always
    includes the supporting/production services (photography, video, editing,
    voice-over, ad design — category production-support), and EVERY service-
    selection screen must offer a free-text "خدمات أخرى" adder. Custom entries
    flow into the SOW draft and quote items (priced manually) — a service we
    didn't foresee must never be unrepresentable.

## Conventions
- TypeScript strict everywhere; Zod validation at every boundary (forms, edge functions, webhooks).
- DB: snake_case tables/columns; migrations via `supabase migration new <name>`; seed files in `packages/db/seed/` (32 services, 8 playbooks, roles, payment accounts, role_profiles).
- UI: shared components from `packages/ui` only; design tokens from brand standards; no one-off styling in apps.
- **Icons, never emojis** — all UI glyphs come from lucide-react (or the brand SVG set); emoji characters are banned in rendered interfaces, documents, and notifications.
- Commits: conventional (`feat:`, `fix:`, `chore:`); one phase = one PR to `staging`.
- Tests: unit tests on generators (documents, signatures, ZATCA QR/XML) — these produce legal artifacts, they must be deterministic.

## Definition of Done (binding for every feature — docs/07-quality-roadmap.md)
UI exclusively from `packages/ui` with loading/error/empty/disabled states ·
mutations optimistic or spinner-guarded with failure toasts, confirm dialog if
irreversible · every form validated by a Zod schema shared with its backend
boundary · lists get search/filter/pagination past 20 items · strings
bilingual-ready · keyboard + screen-reader pass · unit + happy-path e2e +
RLS check for new tables · realtime on team-shared views.

## Build phases (track in docs/PROGRESS.md — update after every session)
0. Scaffold + CI/CD + migrate current site → 1. Schema/RLS/seeds/auth/audit → 2. CRM + Sales + website sync → 3. Legal generators → **3.5 Quality hardening (docs/07 — Sprints A/B/C)** → 4. Projects + playbooks + HR → 5. Finance KSA → 6. Notifications → **6.5 Operating System (docs/10 — a: OS-core, b: safety+cash, c: sellable)** → 7. Portal + onboarding + Drop Forms → 8. Content Engine → 9. Help Centre/RAG + chatbots → 10. Employee portal + Analytics + digests

## Environment variables (names only — values from owner)
`SUPABASE_URL` `SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` (single production project — both site environments point at it) · `R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET` · `TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_WHATSAPP_FROM` · `SENDGRID_API_KEY` · `GEMINI_API_KEY` `ANTHROPIC_API_KEY` `HIGGSFIELD_API_KEY` · `HOSTINGER_DEPLOY_*`

## When unsure
Prefer the spec docs over assumptions. If a decision isn't covered, implement the smallest reversible version behind a flag and note it in PROGRESS.md under "Decisions needed".

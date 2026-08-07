# AGMA OS — Quality Roadmap (3/10 → 9+/10)

**Owner verdict (2026-08-07): current product quality 3/10. Target: 9+.**
This document is the binding gap analysis and upgrade plan. It inserts a
dedicated hardening phase (3.5) before Phase 4 and raises the Definition of
Done for every phase after it (now in CLAUDE.md).

## Honest scorecard

| Area | Now | Why | Target |
|---|---|---|---|
| Database layer (RLS, audit, immutability, seeds) | 8 | DB-enforced guarantees, persona-tested, unit-tested generators | 9 |
| Document generators | 7 | Faithful to references, deterministic, tested; builder UI thin | 9 |
| Ops app UX | 3 | Raw inputs, no states, no validation, no search, no realtime, AR-only | 9 |
| Design system (packages/ui) | 2 | Two components; ops styled ad-hoc (violates CLAUDE.md convention 3) | 9 |
| Data layer (frontend) | 3 | useEffect+useState everywhere; no cache, no optimistic updates, silent errors | 9 |
| Validation | 2 | Zod convention exists on paper only | 9 |
| Auth UX & security | 4 | Login works; no invite/reset flows, no 2FA (docs/05 §B11.4 mandates it) | 9 |
| Testing | 4 | 22 generator tests + persona SQL checks; no e2e, no RLS harness, no component tests | 8 |
| Observability & ops | 2 | No error tracking, no uptime checks, no backup job (§B11.3/10) | 8 |
| Marketing site | 8 | Inherited polish; lead form now real | 9 |

---

## Phase 3.5 — Quality Hardening (inserted before Phase 4)

### Sprint A — Foundation (the 3→7 jump)

**A1. Design system buildout (packages/ui).** The single highest-leverage
item. Components, all RTL-first, dark-theme, keyboard-accessible, with
loading/disabled/error states baked in:
`Input, Textarea, Select, Combobox (searchable), Checkbox, Switch, Button
(loading state), IconButton, Badge, Card, Modal/ConfirmDialog, Drawer,
Toast system, Tabs, Table (sortable, sticky header), Skeleton, EmptyState,
Tooltip, DropdownMenu, DatePicker (hijri-aware display), FormField (label +
error + hint wrapper)`. Ops app re-skinned to use ONLY these.

**A2. Data layer.** TanStack Query on top of supabase-js: query cache,
optimistic mutations with rollback, retry policy, global error → toast,
per-view loading skeletons. Shared typed hooks in `apps/ops/lib/queries/`
(`useLeads`, `useClients`, `useDocuments`, …) — components stop talking to
supabase directly.

**A3. Validation everywhere (Zod).** Shared schemas in `packages/db/src/schemas.ts`
(lead, client, contact, interaction, scope, quote payload, contract payload).
Used three places: ops forms (inline field errors), lead-intake edge function
(replace hand-rolled checks), and payload validation before render/finalize.

**A4. Real Kanban.** Drag-and-drop pipeline (dnd-kit): drag cards between
stages, optimistic move + rollback on failure, stage WIP counts, keyboard
DnD support. Card click → lead drawer (edit, notes timeline, convert).

**A5. Navigation & information architecture.** Real routes with deep links:
`/clients/[id]` via query param → proper client-side router state that
survives refresh; breadcrumbs; global search (⌘K) across leads/clients/
documents; list filters (stage, status, type, date) + sort + pagination
(server-side `range()`); URL-reflected filter state.

**A6. Safety UX.** ConfirmDialog on every irreversible action (finalize,
void, convert, publish); "unsaved changes" guard on builders; inline
success/error toasts replacing silent failures; disabled-with-reason
buttons (e.g. finalize disabled until items valid).

### Sprint B — Product feel (7→9)

**B1. Realtime.** Supabase Realtime subscriptions on leads/documents/
approvals → live board updates across team members; presence indicator.

**B2. Bilingual (rule 8 debt).** i18n scaffolding (AR default, EN toggle)
for ops chrome: nav, labels, buttons, statuses. Documents stay
Arabic-primary. Locale persisted per user profile.

**B3. Auth lifecycle.** Invite-by-email flow (admin sends invite → user
sets password), password reset, session expiry handling, **TOTP 2FA
enforced for team roles** (Supabase MFA), profile page (name, locale).

**B4. Mobile & responsive ops.** The pipeline, approvals and client views
usable on a phone (the owner runs the agency from WhatsApp — the ops app
must follow). Bottom-nav layout under `md:`.

**B5. Quote builder depth.** Item reordering (drag), the two-option
scenario UI (renderer already supports it), page-2 تفاصيل الخدمات editor
(per-item checklists), VAT-on preview toggle, duplicate-as-new-version
(supersedes) flow, quote → SoW handoff.

**B6. Accessibility pass.** Focus rings, aria labels, contrast audit
(the gray-medium-on-ink pairs fail WCAG AA today), skip links, reduced
motion. Axe clean on every ops route.

### Sprint C — Trust & operations (the +)

**C1. Testing depth.** Playwright e2e for the golden paths (login → lead →
convert → scope → quote → finalize; RLS denial paths as API tests);
RLS test harness in SQL (the persona checks from Phases 1–3, automated in
CI against a spun-up local stack); component tests for ui package.

**C2. Observability.** Sentry (or GlitchTip) in both apps + edge functions;
structured logs in lead-intake; uptime monitoring with WhatsApp-on-down
(docs/05 §B11.10 dead-man switch comes with Phase 6 crons).

**C3. Security headers & hygiene.** `.htaccess` CSP/HSTS/nosniff for both
sites; dependency audit in CI; rate limiting on lead-intake (per-IP,
Upstash or pg-based); remove `tsconfig.tsbuildinfo` from git.

**C4. Data ops.** Weekly logical dump workflow (GitHub Actions cron →
artifact/R2), restore drill documented; seed data for local dev
(`supabase/seed.sql` with demo clients) so the local stack isn't empty.

**C5. Delivery hygiene.** PR-based flow with preview builds for staging;
lint gate re-enabled (marketing currently ignores ESLint during builds);
bundle-size check; conventional-commit lint.

---

## Definition of Done (now binding for every phase — added to CLAUDE.md)

A feature is NOT done unless:
1. UI built exclusively from `packages/ui` components with loading, error,
   empty, and disabled states.
2. Every mutation: optimistic or spinner-guarded, toast on failure, confirm
   dialog if irreversible.
3. Every form: Zod schema shared with the backend boundary, inline errors.
4. Lists: search/filter/pagination past 20 items.
5. Strings bilingual-ready (AR shipped, EN keyed).
6. Keyboard + screen-reader pass on new views.
7. Tests: unit for logic, e2e for the happy path, RLS check for new tables.
8. Realtime where two teammates can look at the same data.

## Sequencing decision

Phase 3.5 runs BEFORE Phase 4 (projects/playbooks) — otherwise Phase 4
builds more surface area on a 3/10 foundation and the debt compounds.
Estimated effort: Sprint A ≈ one working session, B ≈ one, C ≈ one.
Phases 4–10 resume after, each held to the Definition of Done.

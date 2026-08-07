# AGMA OS — Build Progress

Update after every session (CLAUDE.md). Phase specs: docs/05 §C2.

## Phase tracker

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold + CI/CD + migrate current site | ✅ Done (2026-08-06) |
| 1 | Schema / RLS / seeds / auth / audit | ✅ Done (2026-08-07) |
| 2 | CRM + Sales + website sync | ✅ Done (2026-08-07) |
| 3 | Legal generators | ✅ Done (2026-08-07) |
| 3.5 | **Quality hardening** — docs/07 quality roadmap (owner verdict: 3/10 → target 9+) | ✅ Done — Sprints A+B+C (2026-08-07) |
| 4 | Projects + playbooks + HR | ✅ Done (2026-08-07) |
| 5 | Finance KSA | ✅ Done (2026-08-07) |
| 6 | Notifications | ✅ Done (2026-08-07) |
| 6.5a | **OS-core** (docs/10): vision/VTO, seats, primary_aims, rocks, issues+IDS, scorecard+digest, L10 meetings | ✅ Done (2026-08-07) |
| 6.5b | **Safety+cash** (docs/10): pause checklists, Flag & Hold, huddles, Profit First allocations, Vault/drip, leak detection | ✅ Done (2026-08-07) |
| 6.5c | **Sellable** (docs/10): TVR scores, service_packages, custom-reason mining, playbook versions+grades, experiments, EMT/independence gauges | ✅ Done (2026-08-07) |
| 7 | Portal + onboarding + Drop Forms | ⬜ |
| 8 | Content Engine | ⬜ |
| 9 | Help Centre / RAG + chatbots | ⬜ |
| 10 | Employee portal + Analytics + digests | ⬜ |

## Gaps round log (2026-08-07) — owner walkthrough fixes

The owner walked the app and hit real walls: «أين أدخل بيانات العميل؟ موقع
شركته؟ كيف أنشئ عقد عدم إفصاح؟ كيف أعدّل الإعدادات؟». All closed:

- **Full client profile**: clients gained website / city / cr_number /
  vat_number. New «بيانات العميل» card on the client page — sector, decision
  maker, budget tier, status, tags, website (clickable), CR and VAT — all
  editable in place. CR/VAT will feed contracts and ZATCA invoicing.
- **NDA in three clicks**: ContractBuilder in المستندات («+ عقد / عدم
  إفصاح») — type selector (nda/sow/sla/msa/amc/coc), client prefills the
  second party (with CR + representative), 7 seeded NDA clauses arrive
  pre-picked (تعريف السرية، الالتزامات، الاستثناءات، مدة ٣ سنوات، الإعادة
  والإتلاف، التعويض، النظام السعودي/الرياض), custom clauses addable,
  live preview via renderContract, draft → finalize.
- **Contracts numbering**: new gapless CT-00001 counter; finalize button now
  works for every draft type (was quote-only) and picks Q/CT by type.
- **الإعدادات page** (nav entry, admin-only): bank accounts CRUD with Saudi
  IBAN validation + single-default enforcement · clause library editor with
  approve toggles · pause-checklist editor (1–9 items enforced) · allocation
  CAP→TAP editor with sum=100% guard (the قرار شركاء enabler) · notification
  template approve/active switches. Backed by new admin RLS policies on
  payment_accounts and notification_templates.

All gates green; migration applied to production.

## Data round log (2026-08-07) — entry → processing → output → AI-readiness

**Entry layer (every path produces the same clean value):**
- DB normalization triggers on contacts/leads/clients: trim, email lowercase,
  Arabic-Indic + Persian digits → Latin, Saudi phones → E.164
  (normalize_phone_sa: ٠٥٥→+9665، 00966→+966، foreign numbers untouched —
  all cases fixture-verified). One-time cleanup ran on existing rows.
- Identical normalizers in packages/db schemas (zod transforms on phone/email)
  and in the lead-intake edge function (redeployed) — form, API, and SQL
  entries converge on the same representation. Website intake now .catch()es
  bad phones to undefined instead of rejecting the lead.
- pg_trgm + trigram indexes on clients.company / leads.name/company — fast
  fuzzy duplicate detection and search.
- Contact quick-form now captures email (with inputMode/ltr); the biggest
  data_quality gap generator closed at the source.

**Processing/consumption layer — 5 RLS-respecting views (security_invoker):**
- client_360: one row per client — contacts, last interaction, projects,
  scopes/packages, invoiced/paid/balance, pending approvals, wallet budget.
  The retrieval surface for Phase-8 RAG/chatbots and any report.
- pipeline_analytics: win rate, avg days-to-win, open value per source.
- document_margins (total vs internal cost), project_costs (hours + labor
  cost per project via time_entries × cost rates).
- data_quality: named gaps (client no sector/contacts/90d-silence, contact
  unreachable, open deal missing value/close-date/next-activity, lost deal
  without reason) — fixture-verified flags.

**Output layer:**
- Client 360 summary card on the client page (invoiced/paid/balance, active
  projects, pending approvals, last touch, «عميل باقات» badge).
- «جودة البيانات» section in التحسين tab: grouped gap counts for the L10.
- Source-performance strip on the pipeline (win % + cycle days per source,
  appears once deals have closed).
- Projects CSV export from project_costs (incl. hours + labor cost);
  shared lib/format.ts replaced per-panel fmt duplicates.

All gates green; migration + lead-intake deployed to production.

## Review round log (2026-08-07) — post-6.5, pre-Phase-7

Code review of the 6.5 layer + audit against the docs/08 benchmark criteria.

**Bugs found & fixed (migration 20260807160000_review_hardening):**
- **Flag & Hold deadlock (critical):** the done-gate checked «any flagged run
  ever», so a task once flagged could NEVER complete, even after a fresh
  checklist run passed. Gate now judges the latest run only. Verified all
  three paths: no-run → blocked · flagged latest → blocked · new passed run
  → done succeeds.
- **pause_checklists were frozen:** no write policy or grants existed — even
  admins couldn't update a checklist after an incident, violating the
  Gawande living-document rule. Admin-manage policy + grants added.
- **Allocation confirmation tightened to admin-only** (bank transfers are a
  partner act); team keeps read. UI hides the confirm button for others.
- ChecklistRunModal: a flagged run silently spawned a fresh run on open,
  hiding the flag reason. Now: flagged banner with reason + explicit
  «إعادة الفحص من البداية» action; checkboxes frozen while flagged.
- AllocationsTab: vault-reserve math simplified to match the SQL exactly.

**Benchmark gaps closed (docs/08 «Adopt» items that had slipped):**
- §1 Duplicate detection: new-lead form warns (never blocks) when a similar
  lead/client name or company exists.
- §2 Margin on quote lines: internal-only cost field per line + live margin %
  (red < 40%) in QuoteBuilder. Costs stored in new team-only document_costs
  table — deliberately OUT of documents.payload, which Phase-7 clients will
  read. «داخلي — لا يظهر في العرض».
- §3 Payment-reminder ladder: overdue +3d and +7d client emails join the
  due-tomorrow reminder (send_overdue_reminders, run_daily_jobs_v3, cron
  repointed) + in-app alert to partners. Verified via fixture.
- §6 CSV export (PDPL + owner habit): exportCsv util (Excel-safe BOM) with
  export buttons on pipeline, clients, invoices, and expenses lists.

**Benchmark audit — confirmed already delivered:** next-action discipline,
deal value/close/won-lost reasons, tags, UTM, quote supersede chain, quote
expiry cron, recurring-invoice auto-draft, AR aging, ad wallets, my-day,
dependencies, workload-lite, activities engine.
**Still deferred (unchanged, honest):** client statement PDF, CSV import,
ZATCA Phase-2 API, saved filters, portal items (Phase 7).

## Phase 6.5c log (2026-08-07)

**Built to Sell + E-Myth (docs/10 §2.1 + §2.5):**
- **TVR filter**: services_catalog gains teachable/valuable/repeatable 1–5
  scores, editable in the new الباقات tab — sum ≥12 flags «مرشّحة كباقة».
- **service_packages** seeded from proven demand: Launch Kit (= quote 00054,
  Option-1/Option-2 kept, 100% upfront), Growth Retainer (monthly-ahead),
  AI Starter (upfront). All seeded **inactive**: a DB guard refuses activation
  while any linked playbook is documentation-grade C or the price is unset
  (both verified) — «grade C cannot be sold» enforced at the database.
- **Say-no mechanism**: ScopeBuilder is package-first; a custom scope requires
  why_no_package_fit (DB trigger blocks sending without it — verified) +
  optional custom_premium_pct. Reasons mined in التحسين tab (90-day list) for
  the quarterly «السوق يصمّم منتجاتك» review.
- **Playbook versioning**: playbook_versions (semver) + documentation_grade
  A/B/C + doc_gaps per playbook, grade editor + version history in UI.
- **Experiments** (Innovation → Quantification → Orchestration): hypothesis →
  running → won/lost. Won with a playbook auto-releases the next minor version
  (verified 1.1.0 → 1.2.0) + notifies the team; lost documents the lesson and
  releases nothing (verified). New notification template experiment_decided.
- **Owner-independence**: tasks.executed_by auto-stamped on done;
  task_templates.emt_class (entrepreneur/manager/technician). 3 new scorecard
  metrics via compute_scorecard_v3 (cron repointed): package_revenue_pct ·
  owner_technician_pct · delivery_by_team_pct — fixture-verified 100% for a
  non-partner-executed task.
- incentive_plans stub (admin-only RLS) for the first senior hire.

Honest deferrals: package pages on the marketing site; AI Scope Drafter
(sales-independence stage 1 tooling) — Phase 8 territory.

All gates green; production migration applied.

## Phase 6.5b log (2026-08-07)

**Gawande (docs/10 §2.3):**
- 10 checklists seeded: 5 DO-CONFIRM launch gates (campaign/website/content/
  invoice/automation, ≤9 killer items enforced by check constraint) + 5
  READ-DO runbooks (allocation ritual, ZATCA day, security incident, PDPL
  deletion, partner absence).
- Launch task-templates in market-phase stages carry checklist_key; a DB
  trigger REFUSES marking them done without a passed run, and refuses while
  a Flag & Hold stands.
- **Flag & Hold**: anyone flags with a reason → run blocked + Issue auto-filed
  + team notified. Huddle card in the run modal names each assignee and their
  piece («اعتراضات؟» — أصغر عضو له سلطة الإيقاف). Per-item checker+timestamp
  recorded.
- Verified: done-without-checklist rejected with «نقطة توقف…» · pass→done
  succeeds · flag filed issue + notification.

**Profit First (docs/10 §2.4):**
- allocation_rules with CAP→TAP (placeholder %s marked قرار شركاء),
  allocations generated on the 10th & 25th by the daily cron from
  **payments only — wallet ad-money provably excluded** (verified: 20k wallet
  spend invisible to a 10k allocation → 500/300/1500/1500/6200 = exact).
- Ritual UX: pending card with amounts + READ-DO transfer checklist +
  confirm (audited); vault-months meter (reserve ÷ 90-day OpEx avg);
  quarterly profit-distribution event (50/50 default).
- 4 new scorecard metrics: allocation_on_time · vault_months ·
  scope_leak_sar (untemplated task hours × cost rate) · flags_raised
  («الصفر الدائم إشارة سيئة»). Sunday cron now computes 12 metrics.

All gates green; production migration applied (crons updated to v2).

## Operating System adoption (2026-08-07)

Owner supplied docs/10-operating-principles.md v2 — five frameworks fused
(E-Myth · EOS · Checklist Manifesto · Profit First · Built to Sell).
Supersedes docs/09. Phase 6.5 split into a/b/c (tracker above). The doc's
Part-4 phase wiring predates phases 1–6 shipping, so its deltas are absorbed
into the 6.5 arc instead:
- 6.5a OS-core: vision/VTO · seats (one name per seat) · primary_aims
  (private per partner) · rocks (3–5 cap enforced) · issues+IDS (root-cause
  required, recur→reopen, auto-filed from 2-week-red scorecards) ·
  scorecard_metrics/entries with Sunday 07:00 digest · L10/quarterly/annual
  meeting packs.
- 6.5b safety+cash: pause_checklists/checklist_runs at stage transitions ·
  Flag & Hold (anyone; zero-flags-is-the-bad-sign metric) · huddle prompts ·
  last_caught_at hygiene · allocation_rules/allocations on the 10th/25th ·
  Vault months meter · OpEx drip · scope-creep leak report ·
  media-wallets-never-allocated guard (wallets already pass-through).
- 6.5c sellable: TVR scoring on the 32 services · service_packages (Launch
  Kit = quote-00054 shape, Growth Retainer, AI Starter) · upfront-payment
  default · why_no_package_fit mining · playbook_versions + documentation
  grades (grade C unsellable) · experiments (Innovation→Quantification→
  Orchestration) · Technician-% and owner-independence gauges.

**BLOCKING INPUT — the seven partner decisions (docs/10 Part 5):** Primary
Aims · Core Values + Core Focus wording · TAPs + comp split · scorecard
targets · first quarter's Rocks · package pricing · the fixed weekly meeting
slot. The 6.5a build ships with placeholder seeds clearly marked; the partner
session locks them in.

## Phase 6 log (2026-08-07)

**Built (docs/05 §B8 — one event-driven engine, rule 6 enforced):**
- Migration `20260807120000_notifications`: template registry (AR seed set for
  invoice issued/due/overdue, 48h approval nudge, task overdue, wallet 80%,
  retainer generated, quote expired) · unified queue+send-log table with
  dedupe keys · `enqueue_notification()` / `notify_team()` helpers.
- **Event triggers:** invoice finalized → client email + team in-app ·
  approval created → 48h nudge scheduled (email to primary contact + in-app),
  **auto-cancelled when the approval is decided**.
- **`run_daily_jobs()`** (pg_cron 09:00 KSA): quote expiry sweep · retainer
  auto-generation on day-of-month (draft invoice + team alert, monthly
  dedupe) · due-tomorrow reminders · overdue chasing (weekly dedupe, client
  email + team in-app) · per-assignee task-overdue digests · wallet-80%
  crossings (once per wallet).
- **`dispatch_notifications()`** (pg_cron every 5 min): in-app instantly;
  email via pg_net→SendGrid with the key read from **Vault** — until the key
  exists messages queue gracefully; quiet hours 08:00–20:00 Riyadh for
  outbound; WhatsApp rows skip with a note (owner's deferred-Twilio call).
- **ops UI:** inbox bell (unread badge, mark-all-read, realtime) + admin
  سجل الإشعارات page (full audit log per §B8).

**Verified locally:** fixture run — retainer generated draft invoice, overdue
email queued (no key = graceful), team in-app sent, nudges scheduled then
cancelled on approval, 2 crons installed · RLS harness · e2e · 33 tests ·
builds. Production migration applied (crons + triggers live).

**Activation (owner, SETUP §6):** one SQL line puts the SendGrid key in Vault
→ email channel goes live on the next dispatch cycle. WhatsApp activates
post-build per your decision (sender + Meta templates, SETUP §5).

## Phase 5 log (2026-08-07)

**Built (docs/05 §B3 · docs/06 §3 · docs/08 §3):**
- Migrations `20260807110000/110100`: invoices + credit notes join the
  immutable documents engine (document_type extended in its own txn);
  `documents.total` frozen at finalization; `payments` with DB guards
  (finalized invoices only, never exceed balance, no paying void docs);
  `recurring_invoices` retainers; `expenses`; ad-spend `wallets` +
  `wallet_entries` (client budgets never blend with revenue). Realtime on
  payments.
- **renderInvoice** in legal-templates: فاتورة / إشعار دائن on the reference
  anatomy — sidebar payment details, paid/balance dark box, reserved VAT row
  «—», recurring-renewal callout (docs/06 §3.6), source-quote reference,
  negative-signed CN amounts. **11 new golden tests (33 total).**
- **ops → المالية** (4 tabs):
  - الفواتير: create from a finalized quote (payload carries over — no
    retyping), finalize assigns INV number + freezes total + 14-day due date,
    payment recording (bank ref, per-account, "كامل المتبقي"), status chips
    (مسودة/مستحقة/جزئي/مدفوعة/متأخرة/ملغاة), **AR aging strip**
    (current/30/60/90+), credit-note creation from any finalized invoice,
    print with live paid/balance.
  - الاشتراكات: retainers with day-of-month + "توليد فاتورة الآن" (Phase 6
    cron automates); المصروفات: quick-add + month total; محافظ الإعلانات:
    budget vs spend progress with 80% highlight.

**Verified:** INV-00053 and CN-00001 issued in true sequence · overpay guard
raises · migration replay · RLS harness · e2e (extended with finance page,
switched nav assertions to goto after diagnosing a dev-compile race via the
Playwright trace) · 33 generator tests · builds/typecheck. Production
migrations applied.

**Deferred:** ZATCA Phase 2 API (flagged, per §B3 — confirm wave with
accountant) · payment reminders + retainer cron + wallet 80% alert → Phase 6 ·
client statement PDF → with portal documents area (Phase 7) · line-level
margin capture → when time-cost data accumulates.

## Phase 4 log (2026-08-07)

**Built (docs/03 both modes · docs/04 §1.4/1.6/2.2 · docs/08 backbone):**
- Migration `20260807100000_projects_hr`:
  - tasks now belong to projects directly (sprints optional → milestone mode
    works), carry playbook stage, `blocked_by` dependency, sort.
  - `create_project_from_playbook()`: instantiates project + all task
    templates with cumulative due dates; each stage's tasks blocked by the
    previous stage's client-approval gate (docs/04 flow #2).
  - **THE BACKBONE**: `on_scope_approved` trigger — approving a scope
    auto-creates one project per scoped category. Verified: 1 approval →
    2 projects, 28 tasks, 6 gates, 18 dependency-blocked, scope auto-approved.
  - `time_entries` (member logs own; feeds cost via profiles.cost_rate_hourly)
    + HR fields on profiles (job_title, phone, cost rate, capacity, skills)
    + `leaves` table. Realtime on tasks/time_entries.
- **ops → المشاريع**: project cards with AGMA Method™ phase pills +
  recurring/milestone badges, deep-linked detail with stage-grouped task board
  (status, assignee, due, approval-gate ShieldCheck badge, Lock badge with
  blocking-task tooltip, status select disabled while blocked), quick time
  logging (15/30/60/120 presets), create-from-playbook modal.
- **ops → يومي** (docs/05 §B9): my open tasks across projects, overdue-first,
  inline status; header shows open/overdue/activity counts.
- **ops → الفريق**: HR columns (job title + cost rate admin-editable inline),
  workload heatmap-lite (open-task count per member, hot ≥ 8).

**Verified:** migration replay · backbone trigger test · RLS harness (fixture
updated for tasks.project_id) · e2e golden path · builds/typecheck/tests.

**Deferred:** sprint-cycle UI for recurring projects (cadence automation lands
with Phase 6 crons) · CSV import (docs/08 P4 item → next session) · leaves UI
(table + RLS live; surface with employee portal Phase 10).

## Phase 3.5 Sprint C log (2026-08-07)

**Brand & rules (owner directives):**
- **Icons-never-emojis rule** added to CLAUDE.md conventions; full sweep of
  ops + packages/ui replaced every emoji with lucide icons (Bell, Clock,
  AlertTriangle, Trophy, Check, X, FileText, Users, Globe, KanbanSquare…).
- AGMA logo (logo.svg) now brands the ops header, login, and reset pages;
  favicon-agma.webp set as the ops favicon.

**Security (C3):**
- Security headers via shipped .htaccess on BOTH sites (HSTS, nosniff,
  frame policies, Permissions-Policy, CSP scoped to self + Supabase;
  ops additionally DENY-framed + noindex).
- Rate limiting on lead-intake: pg `check_rate_limit()` (migration
  20260807090000), 5/hour per caller via salted IP hash — no raw PII stored.
- tsbuildinfo artifacts removed from git.

**Observability (C2):**
- `client-errors` edge function (deployed): browser error sink → Supabase
  function logs; rate-capped, PII-free, Zod-validated. Ops installs window
  error + unhandledrejection reporters (10/session cap). Sentry remains the
  documented upgrade path when volume justifies it.

**Testing (C1):**
- **RLS persona harness**: supabase/tests/rls_checks.sql + scripts/rls-check.sh
  — client/executor/strategist/anon visibility, internal_label column denial,
  audit_log denial, website consent gate, documents immutability. Green.
- **Playwright e2e** (apps/ops/e2e): full golden path — login → forced MFA
  enrollment completing with a REAL computed TOTP → pipeline → validated lead
  creation → search → documents → team roster. Green in 14s. Idempotent
  fixtures via local admin API.
- **Quality workflow** (.github/workflows/quality.yml): spins the full local
  Supabase stack in CI, runs the RLS harness + e2e on staging pushes/PRs,
  uploads traces on failure.

**Ops (C4):**
- backup.yml: weekly schema+data dumps as 90-day artifacts (secrets already
  configured for Migrate).
- uptime.yml: 30-min probes of all three sites + lead-intake preflight;
  failures email via GitHub notifications. WhatsApp alerting lands Phase 6.

**Deferred from C (honest):** lint gate re-enable (marketing's inherited code
needs a cleanup pass first) · bundle-size check · PR-based flow (single-
operator repo; revisit when a second contributor joins).

## Phase 3.5 Sprint B log (2026-08-07)

**Functionality half (docs/08):**
- Migration `20260807080000`: **activities engine** (global reminders table,
  linkable to leads/clients/documents), leads gain value/expected_close/
  outcome(won|lost)+lost_reason/tags/utm, clients gain tags, realtime
  publication on leads+documents+activities.
- **Pipeline discipline**: next-action chip on every card («⚠ لا خطوة تالية»
  when an open deal has no scheduled step — the Pipedrive rule), pipeline
  value badge, deal value on cards, win/loss with reasons, tags, next-step
  quick-add inside the lead editor, activities bell with overdue count +
  quick-add + mark-done.
- **UTM attribution**: marketing form captures utm_*+referrer → leads.utm.
- **Quote depth**: two-scenario pricing UI (★ recommended), item reordering,
  «نسخة جديدة» supersede flow with version badges.

**UX half (docs/07):**
- **Realtime**: postgres_changes → query invalidation (leads/documents/
  activities live across teammates).
- **TOTP 2FA enforced for team roles** (docs/05 §B11.4): forced enrollment on
  first login (QR + secret), challenge on later logins; self-heals orphaned
  unverified factors. Verified END-TO-END locally (enrolled + computed TOTP +
  reached aal2). Local config: [auth.mfa.totp]; hosted: check dashboard.
- **Auth lifecycle**: /reset page (request + set modes), invite-user edge
  function (admin-only, role stamping), الفريق team page (invite + role管理).
- **AR/EN chrome toggle** (i18n provider, localStorage persisted, direction
  flips; documents remain Arabic-primary).
- **Mobile**: bottom tab nav + responsive paddings.
- **Contrast**: gray-medium token lifted #737373→#8A8A8A (WCAG AA on ink).

**Bugs found & fixed while smoke-testing:** stale session for a deleted user
hung the shell (now force-signs-out) · StrictMode double-enroll · orphaned
unverified MFA factors blocking re-enrollment.

**Owner notes:** SETUP.md gains two items — confirm hosted MFA/TOTP enabled,
and configure custom SMTP before inviting the team (invites/resets email).

## Phase 3.5 Sprint A log (2026-08-07)

**Built (the 3→7 foundation):**
- **packages/ui**: 16-component design system — Input/Textarea/Select/Checkbox/
  Switch with FormField chrome (label+error+hint, aria-invalid), Button
  (loading + ghost + sizes), Badge, Spinner, Skeleton(+List), EmptyState,
  Modal (esc/backdrop/focus), ConfirmDialog (busy-guarded), Toast system
  (aria-live), Tabs, Table/Tr/Td. All RTL-first, focus-visible rings.
- **Zod everywhere**: packages/db/schemas.ts (lead/client/contact/interaction/
  scope/quote-draft, Arabic messages) used by ops forms with inline errors;
  lead-intake edge function rewritten on zod (mirrored — deno can't import
  the workspace package).
- **Data layer**: TanStack Query + typed hooks (lib/queries.ts), optimistic
  lead-stage moves with rollback, global mutation error→toast, skeletons.
- **Pipeline**: true drag-and-drop Kanban (dnd-kit, pointer+keyboard sensors,
  drag overlay, drop highlight) + stage select fallback in the edit modal
  (touch/screen-reader path); lead search; convert-to-client behind
  ConfirmDialog; empty state.
- **Navigation**: ⌘K global search (leads/clients/documents), client deep
  links (/clients/?id= survives refresh, Suspense-wrapped for static export),
  documents type/status filters, skip-link, aria-current nav.
- **Safety UX**: ConfirmDialogs on finalize/void/consent-withdrawal;
  disabled-with-reason buttons; success/error toasts on every mutation.

**Found & fixed:** Tailwind v4 doesn't scan workspace packages — `@source
"../../../packages/ui/src"` in ops globals.css or ui classes silently vanish.

**Verified:** full visual smoke on local stack (login → seeded pipeline →
stage move via fallback + optimistic update + toast → documents filters/empty
state) · builds · typechecks · 22 tests green.

**Remaining for 9+:** Sprint B (realtime, EN toggle, auth lifecycle + 2FA,
mobile, quote-builder depth, WCAG contrast) · Sprint C (e2e, RLS harness in
CI, Sentry, rate limiting, security headers, backups, PR flow + lint gate).

## Phase 3 log (2026-08-07)

**Built:**
- Migration `20260807060000_legal_documents`: `documents` (immutable after
  finalization — DB triggers block payload changes and deletes, status moves
  forward only), `document_counters` with atomic gapless
  `next_document_number()` (seeded Q=55, INV=53, CN=1 per docs/06 §3.1;
  strategist+ only, counters table reachable only through the function),
  `clause_library` seeded with the docs/06 §3.5 default commercial clause set.
- **packages/legal-templates**: entity constants (docs/06 §1/1b), palette
  sampled from the reference PDF, deterministic HTML renderers:
  `renderQuote` reproduces quotation-00054 anatomy (RTL dark sidebar with
  recipient/project/payment details, عرض سعر display title, numbered item
  cards with strikethrough discounts, named discounts, option pills with ★,
  reserved VAT row «—», footer strip, Arabic page numbers, closing line) and
  `renderContract` (NDA/SoW/SLA/MSA/AMC/COC family).
- **22 unit tests** incl. golden reproduction of reference 00054 totals
  (net 6,620), determinism, VAT-off row, internal_label leak guard, HTML
  escaping. Wired into CI (`pnpm test`).
- **apps/ops → المستندات**: quote builder (client, items with discounts,
  named discount, payment-account selector defaulting to Main, clause picker,
  live preview iframe), finalize = atomic Q-number + status sent + frozen
  payload, status transitions (sent→signed→active / void), print-to-PDF via
  browser print.

**Verified locally:** migration replay · Q-00055→Q-00056 sequential issue ·
immutability guard blocks tamper + delete on finalized docs · all builds,
typechecks, tests green.

**Deferred/notes:**
- Invoices + credit notes (INV/CN counters already live) land in Phase 5
  Finance with ZATCA fields behind the vat_enabled flag.
- Contract builder UI is minimal v1 (create via quote builder patterns);
  richer per-type variable forms with Phase 5/7 integrations.
- PDF is via browser print (deterministic HTML is the artifact of record);
  server-side PDF rendering can come with the notifications phase if needed.
- Page 2 (تفاصيل الخدمات per-item checklists) renders when payload provides
  details — builder UI field for it TBD.

**Manual test list:**
1. ops → المستندات → + عرض سعر: build a quote for a client, preview —
   compare against docs/references/quotation-00054.pdf side by side.
2. حفظ كمسودة → اعتماد وترقيم → number must be **Q-00055**.
3. Try another → Q-00056 (gapless, sequential).
4. Print preview → A4 layout, sidebar + footer intact.
5. Confirm a finalized quote's items can no longer be edited (immutable).

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
team user + promote to admin. **All completed 2026-08-07** (admin:
abdulrahman.elibrahim@gmail.com). Supabase public config additionally
hardcoded as env fallback (Hostinger static builds don't receive env vars).

**Post-deploy incident (2026-08-07, resolved):** sites appeared stale after
deploys. Root causes: (1) Hostinger CDN edge served old assets and its
flush didn't purge → **CDN disabled on all three sites** (SETUP.md §2);
(2) verification-script false negatives (compressed responses + a marker
string that JSX splits across elements). Origin + on-disk builds were
verified current via SSH. agma.com.sa confirmed serving Phase 2 code.

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
  manually triggerable via workflow_dispatch). Secrets configured; verified
  green end-to-end (run Migrate #2, 2026-08-07). Owner still to disconnect
  the defunct Supabase GitHub integration. Local `db reset` verification
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

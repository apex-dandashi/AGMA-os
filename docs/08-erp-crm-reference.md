# AGMA OS — ERP/CRM Functionality Reference

**Purpose:** the functionality yardstick behind the 9+/10 target. Each module
is benchmarked against the systems that do it best; every adopted feature is
assigned to a phase. "Skip" items are deliberate — an agency OS for one team
must not become Salesforce.

**Reference systems:** Odoo & ERPNext (end-to-end ERP chains, open-source =
inspectable flows) · Pipedrive & HubSpot (pipeline/CRM UX discipline) ·
Zoho Books & QuickBooks (KSA-grade small-business finance) · ClickUp/Asana
(delivery) · Zendesk (SLA/helpdesk patterns for the portal).

---

## 1. CRM & Sales (benchmark: Pipedrive + Odoo CRM)

| Feature (reference) | Verdict | Phase |
|---|---|---|
| **Activities & next-action discipline** — every open deal MUST have a scheduled next activity (call/meeting/task w/ due date); overdue = red. Pipedrive's core idea | **Adopt — highest impact** | 3.5-B |
| Deal value + expected close date + weighted pipeline value | Adopt | 3.5-B |
| **Won/Lost with reasons** (lost-reason taxonomy → reports) — docs/04 already asks for win/loss log | Adopt | 3.5-B |
| Lead → deal → client entity split | Skip — leads table with stages suffices at agency scale | — |
| Duplicate detection on create (name/phone/email fuzzy) | Adopt (warn, not block) | 4 |
| Timeline view per client: interactions + docs + approvals + projects, unified | Adopt | 4 |
| Tags/labels on clients & leads | Adopt (cheap, high filter value) | 3.5-B |
| Email sync/BCC dropbox | Skip v1 — WhatsApp-first agency; revisit with notifications | 6 |
| Source attribution + UTM capture on site leads | Adopt (extend lead-intake) | 3.5-B |
| Round-robin lead assignment, territories, scoring | Skip — one team | — |

## 2. Quotes & Documents (benchmark: Odoo Sales)

| Feature | Verdict | Phase |
|---|---|---|
| **Quote → (accept) → project + invoice chain** — the single flow that makes an ERP an ERP. Odoo: confirm quote ⇒ order ⇒ invoice; ours: quote signed ⇒ project from playbook + invoice schedule (docs/04 cross-module flow #1) | **Adopt — the backbone** | 4+5 |
| Online quote acceptance (client opens link, approves) | Adopt via portal approvals | 7 |
| Quote templates (saved item bundles per service category) | Adopt — from scope/playbook | 4 |
| Quote versioning UI (supersede chain visible) | Adopt (schema ready) | 3.5-B |
| Expiry automation (valid_until → status expired via cron) | Adopt | 6 |
| Margin on quote lines (cost vs price) | Adopt — feeds profitability matrix | 5 |
| CPQ/configurator, price lists per customer | Skip | — |

## 3. Finance (benchmark: Zoho Books/QuickBooks + ZATCA reality)

| Feature | Verdict | Phase |
|---|---|---|
| Invoice from quote/order (no retyping) | Adopt | 5 |
| **Payment recording & matching** (partial payments, bank-ref field, per-account) + AR aging report | Adopt | 5 |
| Recurring invoices (retainers!) with auto-draft | Adopt — agency lifeblood | 5 |
| Credit notes (CN- counter live) linked to source invoice | Adopt | 5 |
| Payment reminders schedule (due-3d, due, +3d, +7d via WhatsApp/email) | Adopt | 6 |
| Expenses + supplier bills + simple P&L | Adopt (lite) | 5 |
| Client statement of account (PDF) | Adopt | 5 |
| ZATCA Phase 2 clearance API | Behind flag (per docs/05 §B3) | 5 |
| Ad-spend wallets (budget vs spend per client) | Adopt — spec'd §B3 | 5 |
| Multi-currency, inventory, payroll ledger | Skip (SAR only; payroll = HR-lite) | — |

## 4. Projects & Delivery (benchmark: ClickUp/Asana + Odoo Project)

| Feature | Verdict | Phase |
|---|---|---|
| Templates auto-instantiation (playbooks — already seeded) | Adopt | 4 |
| My-day / my-tasks cross-project view (docs/05 §B9) | Adopt | 4 |
| Time logging on tasks → cost via HR rates | Adopt | 4 |
| Task dependencies (approval gate blocks next task — flow #2) | Adopt (simple blocked_by) | 4 |
| Recurring tasks for retainer cadences (weekly Adapt cycles) | Adopt | 4 |
| Workload heatmap | Adopt-lite (count-based) | 4 |
| Gantt, sprints velocity, OKRs | Skip v1 | — |

## 5. Client Portal (benchmark: Zendesk + Odoo portal)

| Feature | Verdict | Phase |
|---|---|---|
| Approvals queue one-tap + 48h nudge (spec'd) | Adopt | 7 |
| Documents area (quotes/invoices/contracts, download PDF) | Adopt | 7 |
| SLA timers on client requests (docs/05 §B11.9) | Adopt | 7 |
| Project status read-only + published reports | Adopt | 7 |
| Client-side ticket categories/priorities | Skip — messages thread suffices | — |

## 6. Cross-cutting platform (benchmark: Odoo framework)

| Feature | Verdict | Phase |
|---|---|---|
| **Global activity/reminder engine** (one `activities` table: what, who, when, linked to any record) — powers CRM next-actions, doc expiries, compliance renewals | **Adopt — one engine, many consumers** | 3.5-B |
| CSV export on every list (PDPL right + owner habit) | Adopt | 3.5-C |
| CSV import (clients/leads migration) | Adopt | 4 |
| Saved filters/views per user | Later | 8+ |
| Custom fields engine | Skip — YAGNI, jsonb escape hatch exists | — |
| Webhooks/public API | Later (Zapier-style) | 9+ |
| Per-record follow/watch + mention notifications | Adopt-lite with notifications | 6 |

---

## What this changes in the plan

1. **Sprint B grows a functionality half** (alongside UX): activities engine +
   next-action discipline on pipeline, deal value/close-date/win-loss reasons,
   tags, UTM capture, quote versioning UI.
2. **Phase 4 is re-scoped** around the Odoo-style backbone: quote-accepted ⇒
   auto-project from playbook (+ dependencies via approval gates, time logs,
   my-day, CSV import).
3. **Phase 5 checklist is now explicit** (recurring invoices, payment matching,
   AR aging, credit notes, statements, expenses-lite, wallets, margins).
4. **Phase 6/7 inherit** reminders schedule, expiry automation, portal
   acceptance & SLA timers as concrete deliverables, not vibes.
5. Skip-list is binding too: no entity sprawl, no custom-fields engine, no
   multi-currency, no territory management — bloat is how ERPs die at 6 people.

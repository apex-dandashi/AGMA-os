# AGMA OS — Module Architecture
**Full system map: departments, shared engines, foundation | v1.0 — August 2026**

Three layers. Departments are role-based workspaces; shared engines are the systems every department reads/writes; foundation services power everything underneath.

---

## Layer 1 — Departments (workspaces)

### 1.1 Management
**Purpose:** one screen to run the agency.
**Data:** reads everything, owns nothing.
**Screens:** agency dashboard (revenue, pipeline value, utilization, client health scores), approvals above threshold, quarterly OKRs.
**Links:** Analytics (all KPIs), Finance (P&L), Projects (delivery health), CRM (pipeline).

### 1.2 Sales
**Purpose:** lead → signed client.
**Data:** owns leads, deals, proposals.
**Screens:** pipeline Kanban (6 lifecycle stages), proposal/scope builder (pulls from 32-service catalog), win/loss log.
**Links:** CRM (leads, contacts), Legal (SoW + contract generation on deal-won), Operations (handoff trigger — signed deal auto-creates project), Finance (deal value → invoice schedule).

### 1.3 Marketing (AGMA's own)
**Purpose:** the agency marketing itself — practicing what it sells.
**Data:** owns AGMA's campaigns, content calendar, site leads.
**Screens:** own content calendar, campaign tracker, lead-source attribution (which channel fills the pipeline).
**Links:** AI Studio (Articles Daily Generator publishes to agma.com.sa blog), CRM (attributes every lead to source), Assets (brand files), Analytics.

### 1.4 Operations
**Purpose:** delivery engine — runs the service playbooks.
**Data:** owns projects, sprints, tasks, playbook instances.
**Screens:** all-projects board, per-project Method-phase view (A→G→M→A), capacity planner, vendor assignments.
**Links:** Projects engine (core), HR (who's available), Vendors (external assignments), Client Portal (deliverables + approvals out), Finance (hours logged → cost).

### 1.5 Finance
**Purpose:** money in, money out, margin per everything.
**Data:** owns invoices, quotations, expenses, payouts, ad-spend wallets.
**Screens:** invoicing + payment tracking, client media-budget wallets (spend vs. approved budget per client), vendor/freelancer payouts, **profitability matrix** (margin per client / per service / per hour), P&L.
**Links:** CRM (client billing data), Projects + HR (hours × cost rate = true project cost), Legal (payment terms from contracts), Sales (deal → invoice schedule).
**Note:** ad-spend wallets are agency-specific and critical — client media budgets must never blend with agency revenue.

### 1.6 HR & People
**Purpose:** the team as data.
**Data:** owns team roster, roles, cost rates, capacity, leave, freelancer profiles.
**Screens:** roster, capacity heatmap (who's overloaded next sprint), skills matrix (who can execute which of the 32 services), leave calendar.
**Links:** Projects (assignment + availability), Finance (cost rates feed profitability), Legal (employment/freelance contracts).

---

## Layer 2 — Shared engines

### 2.1 CRM
**Purpose:** single record of every company and human AGMA touches.
**Data:** companies, contacts, interactions (calls, WhatsApp, email), lead sources, client health score.
**Used by:** Sales (pipeline), Marketing (attribution), Operations (client context), Finance (billing entities), Portal (login identities).
**Rule:** one client record everywhere — no duplicate client data in any other module.

### 2.2 Projects
**Purpose:** the delivery engine spec'd in the playbooks doc.
**Data:** projects, playbook instances, sprints, tasks, Method phases, deliverables.
**Used by:** Operations (primary), Sales (deal-won auto-creates project from scoped services), Finance (hours + costs), Portal (client-visible status), Analytics.
**Modes:** recurring (weekly/monthly cycles) and milestone (fixed scope, revision caps) — per playbook.

### 2.3 Legal
**Purpose:** every binding document, templated and tracked.
**Data:** contract templates (service agreement, SoW, NDA, influencer agreement, freelance contract, media-buy IO), executed contracts, renewal/expiry dates.
**Screens:** template library (AR/EN), contract status board, expiry alerts.
**Used by:** Sales (client contracts), HR (employment/freelance), Operations (vendor + influencer agreements), Finance (payment terms extraction).
**v1:** template generation + status tracking. v2: e-signature integration.

### 2.4 AI Studio
**Purpose:** one AI layer, many apps — dogfooding the AI-automation service.
**Apps (v1):**
- **Articles Daily Generator** — daily Arabic articles from the SEO content calendar → draft → human review → publish to blog/client CMS.
- **Scope Drafter** — call notes → draft SoW from the service catalog.
- **Report Writer** — project metrics → Arabic business-impact summary for monthly reports.
- **Social Caption Generator** — calendar slots → caption variants in client brand voice.
**Data:** prompt templates per app, generation logs, review status (nothing publishes without human approval).
**Used by:** Marketing, Operations, Sales.
**Rule:** every app follows draft → review → approve. AI never ships directly to a client.

---

## Layer 3 — Foundation

### 3.1 Analytics / BI
**Purpose:** every module writes events; one query layer reads them.
**Data:** event stream + metric tables (CPA, ROAS, hours saved, margin, utilization, pipeline velocity).
**Surfaces:** Management dashboard, per-department widgets, client-facing report data.
**Rule:** modules never query each other's tables for reporting — they query Analytics.

### 3.2 Knowledge Base
**Purpose:** the company brain as system data, not Drive files.
**Data:** the workflow document, 8 service playbooks, SOPs, brand guidelines per client, meeting-note templates.
**Used by:** every department; AI Studio reads it as generation context (playbooks ground the Scope Drafter, brand voices ground the caption generator).

### 3.3 Client Portal
**Purpose:** client-facing skin over internal engines — already spec'd.
**Reads:** CRM (identity), Projects (status + deliverables), Finance (invoices), Legal (contracts to sign), reports.
**Writes:** approvals, messages, uploaded briefs.
**Core loop:** approvals queue with 48h WhatsApp nudges.

### 3.4 Assets (DAM)
**Purpose:** every file findable — brand kits, creatives, deliverables, contracts (PDF copies).
**Data:** files tagged by client / project / service / type, version history.
**Used by:** Operations (deliverables), Marketing (AGMA brand), AI Studio (reference material), Portal (client downloads).
**v1:** Supabase Storage + tagging. v2: auto-tagging via AI.

### 3.5 Vendors & Freelancers
**Purpose:** the external workforce — influencers, media vendors, printers, freelance designers.
**Data:** vendor profiles, rates, ratings, active assignments.
**Used by:** Operations (assignment), Finance (payouts), Legal (agreements).
**Lives under:** Operations workspace, own data tables.

---

## Cross-module flows (the wiring that matters)

| Trigger | Automated flow |
|---|---|
| Deal marked won (Sales) | Legal generates contract → on signature, Projects creates project from scoped services → Finance creates invoice schedule → Portal invites client |
| Task flagged `needs_client_approval` (Projects) | Portal queue entry → WhatsApp nudge at 48h → approval unblocks next task |
| Sprint closed (Projects) | Hours × HR cost rates → Finance profitability matrix → Analytics event |
| Strategy project completed | AI Studio Scope Drafter proposes scopes for roadmap-recommended categories → Sales pipeline |
| Content calendar slot due (SEO playbook) | Articles Daily Generator drafts → review queue → publish → Analytics logs |
| Contract 30 days from expiry (Legal) | Alert to Sales (renewal deal auto-created) + Management |
| Client media wallet at 80% (Finance) | Alert to Operations + client notification via Portal |

---

## Revised build order

| Phase | Modules | Why first |
|---|---|---|
| 1 | CRM + Auth/roles + Knowledge Base (seed playbooks) | Everything references clients and playbooks |
| 2 | Sales pipeline + Legal templates | Revenue flow live |
| 3 | Projects + Operations + HR roster | Delivery engine |
| 4 | Finance (invoices, wallets, profitability) | Needs hours + contracts to exist |
| 5 | Analytics + Management dashboard | Needs data flowing |
| 6 | Client Portal + Assets | Client-facing polish |
| 7 | AI Studio (all 4 apps) + Vendors | Builds on everything |

Articles Daily Generator can jump the queue as a standalone v0 (calendar → draft → review → publish) if you want it running before the rest — it only needs the Knowledge Base and a review screen.

---
*AGMA™ internal — completes the set: Workflow → System Spec → Service Playbooks → Module Architecture*

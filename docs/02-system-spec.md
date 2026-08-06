# AGMA OS — Operations System Specification
**Internal platform to run AGMA end-to-end | v1.0 — August 2026**

---

## 1. What we're building

A custom web app — **ops.agma.com.sa** — that digitizes the workflow document: the 6-stage client lifecycle, the AGMA Method™ delivery engine across 32 services, live performance reporting, and a client-facing portal. One system, one database, no scattered tools.

**Stack (matching agma.com.sa):**

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind | Same stack as the main site; shared design system |
| Backend | Next.js API routes / Server Actions | No separate backend to maintain |
| Database + Auth | Supabase (Postgres, RLS, Realtime, Storage) | Row-level security splits team vs. client access cleanly; you already know it |
| Deployment | Subdomain `ops.agma.com.sa`, same hosting as main site | One infra, one CI pipeline |
| Notifications | WhatsApp Business API + email (Resend) | Matches AGMA's client entry points |

Arabic-first UI (RTL), English toggle for technical views.

---

## 2. Data model (core entities)

```
leads          → id, name, company, source (call/whatsapp/email/site), stage, notes
clients        → id, company, sector, decision_maker, budget_tier, status
scopes         → id, client_id, services[], timeline, responsibilities, status (draft/approved)
roadmaps       → id, scope_id, priorities[], channels[], tools[], approved_at
projects       → id, client_id, roadmap_id, category (1 of 8), status, method_phase (A/G/M/A)
services_catalog → id, category, name_ar, name_en (the 32 services, seeded)
sprints        → id, project_id, number, start, end, goal
tasks          → id, sprint_id, service_id, title, assignee, status, due, deliverable_url
metrics        → id, project_id, date, cpa, roas, hours_saved, spend, conversions, custom{}
reports        → id, project_id, period, summary_ar, pdf_url, published_to_portal
approvals      → id, client_id, item_type (scope/roadmap/deliverable/report), status, decided_at
messages       → id, client_id, sender, body, channel, read_at
users          → id, role (admin/strategist/executor/client), client_id?
```

Every table gets RLS: team sees everything, clients see only their own rows.

---

## 3. Module specs

### 3.1 Client Pipeline (lead → scope → roadmap)
Mirrors lifecycle stages 1–4 from the workflow doc.

- **Kanban board** with the 6 stages: Discovery Call → Opportunity Analysis → Scoping → Roadmap → Live → Optimize.
- Lead intake auto-created from the site's contact form + WhatsApp webhook.
- Each lead card holds: call notes, gap/opportunity map, proposed services (picked from the 32-service catalog), timeline, owner.
- Scope builder: select services → auto-generates SoW draft with deliverables and responsibilities → one click sends to client portal for approval.
- Stage gates: a lead can't move to "Live" without an approved scope + roadmap. No hidden-cost surprises, enforced by the system.

### 3.2 Project Delivery (AGMA Method™ engine)
- Every project carries a **Method phase badge**: Analyze → Generate → Market → Adapt. Phase transitions are logged — this becomes your "we work in a closed loop" proof for clients.
- Sprint planning per project; tasks tagged to one of the 32 services so utilization per service is queryable.
- Category playbooks: creating a project in a category (e.g., Performance Marketing) auto-seeds its phase checklist from the execution matrix in the workflow doc.
- Assignees, due dates, deliverable links (Drive/Figma), internal review step before anything ships to the portal.

### 3.3 Reporting & Dashboards
- **Internal dashboard:** per-project and agency-wide CPA, ROAS, hours saved, spend vs. budget — the same three numbers the site's ROI simulator promises.
- v1 metric entry: manual/CSV import. v2: connectors for Meta Ads, Google Ads, GA4 APIs.
- Auto-generated monthly report: pulls metrics + completed tasks → drafts the Arabic business-impact summary → team reviews → publishes to portal as PDF.
- Agency rollup: total automated hours, average client growth — feeds the site's live counters eventually.

### 3.4 Client Portal
- Client logs in, sees only: pipeline status, approvals queue, published reports, deliverables, messages.
- **Approvals queue** is the centerpiece — the workflow doc says client approval speed is the #1 dependency, so make approving a one-tap action with WhatsApp nudges after 48h.
- Structured comms thread per client (kills the scattered-WhatsApp problem while still notifying via WhatsApp).

---

## 4. Roles & permissions

| Role | Access |
|---|---|
| Admin | Everything + user management + agency dashboard |
| Strategist | Pipeline, scopes, roadmaps, reports (all clients) |
| Executor | Assigned projects, sprints, tasks only |
| Client | Own portal only (RLS-enforced) |

---

## 5. Build plan

**Phase 1 — Foundation (weeks 1–2)**
Auth + roles, DB schema + RLS, service catalog seeded, app shell with RTL.

**Phase 2 — Pipeline (weeks 3–4)**
Kanban, lead intake from site form, scope builder, approval flow (internal only first).

**Phase 3 — Delivery (weeks 5–6)**
Projects, Method phases, sprints/tasks, category playbooks.

**Phase 4 — Reporting (weeks 7–8)**
Metric entry, dashboards, report generator (manual data).

**Phase 5 — Portal (weeks 9–10)**
Client auth, approvals queue, published reports, messaging + WhatsApp notifications.

**v2 backlog:** ad platform API connectors, AI agents (auto-draft scopes from call notes, auto-write report summaries — dogfooding your own AI-automation service), invoicing/Odoo bridge.

---

## 6. Decisions needed before Phase 1

1. Hosting of agma.com.sa (Vercel? Cloudflare?) — deploy AGMA OS to the same.
2. WhatsApp Business API provider (Meta Cloud API direct vs. a BSP like 360dialog).
3. Who are the first internal users (how many strategist/executor seats)?
4. One pilot client for the portal beta.

---
*AGMA™ internal — pairs with AGMA-Company-Workflow.md*

# AGMA OS — EOS Layer (Traction, Gino Wickman)

**Purpose:** map the Six Key Components of EOS onto AGMA OS. This becomes the
substance of the Management workspace (docs/04 §1.1) — replacing a generic
"analytics dashboard" with an operating system for running the company.
EOS-lite calibrated for a small team: the framework's discipline without its
big-company ceremony.

## Why EOS fits AGMA OS unusually well

Generic EOS tools (Ninety, Bloom Growth) make humans type their numbers in
every week. AGMA OS **owns the source data** — pipeline, invoices, payments,
tasks, time, content. Most of the Scorecard computes itself, Rocks link to
real projects, and Issues attach to the actual client/invoice/task they're
about. That is the product thesis: *EOS where the numbers are alive.*

---

## 1. Vision → the V/TO record

One `vision` record (versioned, admin-edited, visible to every team member):
core values · core focus (purpose + niche) · 10-year target · marketing
strategy (target market, three uniques, proven process = AGMA Method™,
guarantee) · 3-year picture · 1-year plan · quarterly rocks reference.

- UI: read view for all (شاشة الرؤية), edit for admin; "shared by all" —
  shown on ops home/dashboard header line.
- Bonus: the marketing-strategy section reuses live data (the 8 playbooks ARE
  the proven process; the site's positioning IS the niche).

## 2. Traction → Rocks (90-day priorities)

`rocks` table: quarter (e.g. 2026-Q4), owner (profile), title, description,
status (on_track / off_track / done / dropped), optional link to a project.
Rules from the book: 3–7 per person, company rocks first, binary done/not-done
at quarter end.

- UI: Rocks board on the dashboard grouped company → per-owner, with on/off
  track toggles; quarter selector; completion % per quarter.
- The weekly meeting reviews rocks as on/off track only (no discussion —
  off-track drops to the Issues list, per the book).

## 3. Data → the Scorecard (the crown jewel)

`scorecard_metrics`: name, owner, weekly goal, direction, and **source**:
- `auto` metrics computed from live tables — no human typing:
  - new leads/week (leads.created_at)
  - proposals sent (documents type=quote → sent)
  - win rate & pipeline value (leads.outcome/value)
  - revenue invoiced + cash collected (documents/payments)
  - AR overdue > 30d (aging buckets already computed)
  - open tasks overdue (tasks.due)
  - client-approval gates waiting > 48h (approvals.pending + created_at)
  - hours logged (time_entries) / utilization vs capacity_hours_week
  - wallet burn % (wallets)
- `manual` metrics for what the system can't see yet (NPS until Phase 6/7).

`scorecard_snapshots`: weekly frozen row per metric (cron, Phase 6) so the
13-week trailing view (the book's format) is historical fact, not recompute.
Red/green against goal; 13-week sparkline per metric.

## 4. Issues → the Issues List (IDS)

`issues`: title, raised_by, context link (client_id / project_id /
document_id / lead_id — same nullable-links pattern as activities), priority,
status (open / discussing / solved / dropped), solved_note.

- Raise-an-issue button available EVERYWHERE (any panel's context menu):
  friction to capture ≈ zero, per the book's "issues are normal, hiding them
  is the sin".
- IDS flow in the meeting screen: Identify → Discuss → Solve; solving
  creates a to-do or a rock, and links it.

## 5. Meeting Pulse → Level 10 meeting screen

`meetings` + `meeting_todos` (7-day to-dos are NOT project tasks — they die
in 7 days or escalate to the Issues list).

The L10 screen walks the book's agenda with live data at each step:
1. Segue (good news — manual, 5 min)
2. **Scorecard review** — pulled live, reds highlighted (5 min)
3. **Rock review** — on/off track toggles (5 min)
4. Customer/employee headlines (5 min)
5. **To-do list** — last week's done %, target > 90% (5 min)
6. **IDS** — the issues list, top-3 first (60 min)
7. Conclude — recap to-dos, cascade messages, rate 1–10 (5 min)

Meeting record stores the rating and to-do completion % — both become auto
scorecard metrics about the meeting habit itself.

## 6. People → Accountability Chart + GWC

`seats`: seat name, the five roles (bullets), reports_to (tree). Profiles
link to seats (person ≠ seat, the book's core distinction). GWC (gets it,
wants it, capacity) as three booleans on the person↔seat link, reviewed
quarterly. People Analyzer (core-values ratings) joins when the team is big
enough to need it — deferred deliberately.

- Near-term win: the accountability chart view replaces the org-chart nobody
  has, and the "who owns this?" question every small team fights about.

## 7. Process → already built, add the meter

The 8 playbooks + task templates + DoD **are** the documented core processes.
Add the "Followed By All" meter: per-playbook adherence % (tasks completed
vs skipped/deleted per project) as an auto scorecard metric.

---

## Sequencing (amends the phase plan)

| When | What ships |
|---|---|
| **Phase 6 (notifications — next)** | unchanged, but the weekly digest (§B11.11) is built AS the scorecard snapshot cron + L10 pre-read: digest = scorecard + rocks status + top issues |
| **Phase 6.5 — EOS core** (new, small) | vision record · rocks · issues (+ raise-everywhere) · scorecard with auto metrics · L10 meeting screen · seats/accountability chart |
| **Phase 10 (analytics)** | absorbs the remainder: 13-week sparklines, People Analyzer, FBA meter, client health score feeding the scorecard |

Rationale: the EOS core needs the snapshot cron (Phase 6) but must not wait
for Phase 10 — Rocks and the Issues list change how the company runs *now*,
and they're two small tables + two screens on the existing foundation.

# AGMA OS — The Operating System (docs/10-operating-principles.md)
**Five complete frameworks, fused into one machine | v2.0 — August 2026**
Sources, mined fully: The E-Myth Revisited (Gerber) · Traction/EOS (Wickman) · The Checklist Manifesto (Gawande) · Profit First (Michalowicz) · Built to Sell (Warrillow).

This is not five features. It is one flywheel where each framework powers the next, translated into AGMA's reality: two partners, 32 services, project-based cash flow, Saudi market, and an existing brand promise (AGMA Method™) that these frameworks complete.

---

# PART 1 — THE FLYWHEEL (how the five interlock)

```
BUILT TO SELL defines WHAT we sell        → Packages (productized, upfront-paid)
E-MYTH + EOS-Process define HOW           → Playbooks (the franchise prototype)
GAWANDE defines HOW SAFELY                → Pause points + stop-the-line authority
EOS-Data defines HOW WE KNOW              → Scorecard, measurables, one owner each
PROFIT FIRST defines WHAT WE KEEP         → Allocations before spending
EOS-Issues + E-Myth's Innovation loop
  define HOW WE IMPROVE                   → Issue → Experiment → Measure → new playbook version
                                            ...which improves the Packages. Loop closes.
```

**The deep alignment nobody planned:** AGMA Method™ (Analyze → Generate → Market → Adapt) is Gerber's Innovation–Quantification–Orchestration cycle wearing your brand. *Adapt* IS quantify-then-orchestrate. So the improvement engine below isn't imported theory bolted on — it's your own method applied to the company itself. AGMA runs AGMA the way AGMA runs client accounts. That sentence is also a sales weapon.

---

# PART 2 — THE FIVE FRAMEWORKS, FULLY INTEGRATED

## 2.1 The E-Myth — the company as franchise prototype

**The full theory:** Every founder is three people — Entrepreneur (vision), Manager (order), Technician (doing) — and the Technician usually wins, trapping the founder *in* the business instead of *on* it. The cure is building the company as a **franchise prototype**: so systematized it could be replicated. The engine is **Innovation → Quantification → Orchestration**: try a better way, measure it, then lock it in as *the* way until a better one is proven. Beneath it sits the Business Development hierarchy: **Primary Aim** (the owner's life purpose the business must serve) → **Strategic Objective** → **Organizational Strategy** (draw the org chart of seats *before* people) → **Management System** (the system manages; managers run the system) → **People Strategy** (work as a game worth playing) → **Systems Strategy** (hard, soft, and information systems).

**AGMA integration:**

1. **Primary Aim record (per partner).** A private page each for you and Amer: what life is this company buying you? Revisited annually; every annual plan (2.2) must trace to it. Schema: `primary_aims` (user, statement, updated_at) — visible only to its owner + shared excerpts by choice. This sounds soft; it is the root node that decides every "should we take this client" argument before it happens.
2. **Seats before people.** `seats` table (the org chart as data): Visionary, Integrator, Sales, Marketing, Ops/Delivery, Finance — each with roles, responsibilities, and *5 measurables*. You two currently occupy multiple seats each; the chart makes that explicit and shows exactly what your next hire absorbs. Rule: **one name per seat, every seat named** — accountability is singular even in a partnership.
3. **Technician-trap gauge.** Every task logs `executed_by` — the dashboard shows each partner's split across Entrepreneur / Manager / Technician work (classified by task type). Watching your own Technician % fall quarter over quarter is the E-Myth practiced, not read.
4. **Playbooks = the franchise prototype**, with **versioning**: `playbook_versions` (semver, changelog, evidence link). Changing how AGMA delivers is a *release*, not a habit drift. `documentation_grade` A/B/C per playbook; **grade C cannot be sold** in the scope builder.
5. **Innovation → Quantification → Orchestration as workflow** (the improvement engine, shared with EOS Issues — see 2.2.4): every process change enters as an `experiments` row (hypothesis, metric, duration) → Analytics quantifies → win = playbook version bump (orchestration) + notification to all affected seats; loss = documented in the changelog anyway. Nothing improves by vibes.
6. **The "store" discipline:** the brand standards doc (docs/06) is Gerber's uniform-and-storefront rule — every client touchpoint (document, email, portal screen, WhatsApp template) identical in voice and dress. Already built; now named as policy.

## 2.2 EOS / Traction — the full six components

**The full theory:** Vision (everyone sees where and how), People (right people × right seats, tested by Core Values fit + GWC — Gets it, Wants it, Capacity), Data (scorecard + everyone owns a number), Issues (list them, then IDS: Identify–Discuss–Solve, root cause not symptom), Process (the few core processes, documented, followed by all — EOS's name for the franchise prototype), Traction (Rocks: 3–5 quarterly priorities per person; Meeting Pulse: same-day-same-time Level-10 weekly + quarterly + annual sessions).

**AGMA integration:**

1. **V/TO as a living system page** (`vision` module, Management dashboard): Core Values (define 3–5 with Amer — these later score hires and even clients), Core Focus (draft to react to: *"نمنح المنشآت السعودية قدرات تسويق مبنية بالذكاء الاصطناعي"* / purpose: AI-native growth for Saudi businesses; niche: SMEs modernizing), 10-Year Target, 3-Year Picture, 1-Year Plan, current Rocks, Issues list — one screen, always current, shown at every quarterly.
2. **People Analyzer in HR:** quarterly, every person (partners included — rate each other) scored on each Core Value (+/±/−) and GWC per seat. `people_reviews` table. This is how a two-person firm hires its first five people without gut-feel disasters — and how you'll know when a seat has outgrown its holder.
3. **Scorecard — the full discipline:** 5–15 weekly measurables, **each owned by one seat**, green/red thresholds, 13-week trailing view. Seed (owners in seat names, not personal names — E-Myth rule):

| Metric | Source | Seat | Green |
|---|---|---|---|
| Cash collected (SAR) | Finance | Finance | ≥ weekly target |
| Allocation ritual done on time | Finance | Finance | yes (10th/25th) |
| Pipeline value | CRM | Sales | ≥ 3× monthly target |
| New qualified leads / proposals sent | CRM | Sales | ≥ targets |
| % revenue from Packages vs custom | Finance | Sales | rising |
| Client approval lag (h) | Portal | Delivery | < 48 |
| On-time task completion | Projects | Delivery | ≥ 85% |
| Pause-checklist pass rate first-try | Projects | Delivery | ≥ 90% |
| Articles published vs plan | Content Engine | Marketing | 100% |
| Playbooks at grade A | Knowledge | Integrator | rising |
| Owner Technician-work % | Projects | Integrator | falling |
| Client health avg / NPS | Analytics | Delivery | ≥ threshold |

Sunday 7am: scorecard computes → WhatsApp digest to both partners, reds first. A red two weeks running auto-files an Issue.
4. **Issues + IDS as workflow:** `issues` (anyone files, including auto-filed from scorecard reds, doc_gaps, checklist failures, client complaints) with states `identified → discussed → solved`, root-cause field required to close, and solved issues that recur auto-reopen linked to the original. IDS discipline: the weekly meeting solves the **top 3 by vote**, not the loudest.
5. **Meeting pulse, automated:** Level-10 weekly agenda auto-generated (segue → scorecard → Rocks check → headlines → to-dos → IDS top issues → rate the meeting 1–10, stored); Quarterly session pack auto-compiled (prior Rocks scored, V/TO review, next Rocks entry); Annual session pack (year in numbers + Primary Aim prompts + Core Values review). The system prepares every meeting; you two just show up and decide.
6. **Rocks:** `rocks` (quarter, owner_user, title, success_criteria, linked_project?, status). 3–5 per partner max; the system rejects a 6th. Biweekly status nudge; quarterly scored done/not-done — no partial credit (EOS rule).

## 2.3 The Checklist Manifesto — distributed authority, not paperwork

**The full theory:** In complex work, failure comes from skipping the *routine*, not fumbling the hard parts. Two checklist types: **DO-CONFIRM** (work from memory, pause and verify) and **READ-DO** (step-by-step for rare/critical procedures). Checklists live at **pause points**, stay under ~9 killer items, and — Gawande's deepest finding from surgery — their power is *social*: forcing the team to speak (introductions by name, voicing concerns) **activates responsibility and flattens hierarchy**, giving the most junior person authority to stop the operation.

**AGMA integration:**

1. **DO-CONFIRM checklists** at launch pause points (block stage transition until 100%, logged per item with checker + timestamp): campaign go-live (pixel firing · budget cap · UTMs · exclusions · creative approval recorded · landing <3s mobile) · website launch (SSL · redirects · analytics+GSC · forms→CRM tested · PDPL notice · backups · UAT sign-off) · content publish (sources cited+live · image rights · Arabic proofread · brand-voice check · human approval) · invoice issue (account selected · items match approved scope · sequence verified · recurring flagged) · automation deploy (UAT recorded · rollback documented · alerting wired · minimal data scope).
2. **READ-DO runbooks** for the rare and dangerous: ZATCA registration day · security incident / credential leak · client data-deletion request (PDPL) · production rollback · partner-absence continuity. Stored in Knowledge Base, tested annually as a drill task.
3. **Stop-the-line authority (the cultural core):** *anyone* — newest hire included — can hit **Flag & Hold** on any launch-bound item with a reason. It blocks progression, notifies the seat owner, and files an Issue. Metric watched: flags raised per quarter — **zero flags is the bad sign** (silence, not safety). No-blame rule written into the COC.
4. **The huddle prompt:** launches involving 2+ people trigger a 2-minute pre-launch huddle card — names each person and their piece aloud (Gawande's activation phenomenon, digitized): "Sara owns tracking. Khalid owns creatives. Client approved v3 on Tuesday. Concerns?"
5. **Checklist hygiene:** every checklist item carries a `last_caught_at` — items that never catch anything get reviewed at quarterlies (checklists must stay sharp, or they become wallpaper and people pencil-whip them).

## 2.4 Profit First — cash discipline as architecture

**The full theory:** Parkinson's Law governs money — it expands to fill the account it sits in. So use **small plates**: five accounts (Income, Profit, Owner's Comp, Tax, OpEx); allocate *every* deposit by percentage on a fixed **10th & 25th rhythm**; take profit **first** and let expenses fight over what remains. Move from **CAPs** (current allocation %) toward **TAPs** (targets) in small quarterly steps. Quarterly: distribute 50% of the Profit account as owner bonus (celebrate!), keep 50% building the reserve. When OpEx doesn't fit its plate, **cut costs — never shrink the profit plate**. Irregular revenue smooths through a Vault→Drip pattern.

**AGMA integration:**

1. **Account mapping onto your real structure:** Main establishment account = **Income** (all client payments land here — matching the invoice standard). Sub-ledgers (system-tracked buckets, physical transfers manual): **Profit reserve · Zakat/Tax reserve · OpEx**. Partner comp buckets route to your two labeled accounts ("For A.Alghamdi" / "For A.Elibrahim") — Michalowicz's Owner's Comp plates are *literally already open at Al Rajhi*. The system computes; humans transfer (a Gawande READ-DO checklist per allocation day — frameworks interlocking).
2. **The rhythm:** 10th & 25th allocation tasks auto-created with the transfer checklist; scorecard tracks on-time completion. Missed ritual = red = Issue filed. Discipline by architecture, not memory.
3. **CAP → TAP stepper:** enter TAPs with your accountant (e.g., Profit 5%→10%, Zakat ~2.5%+, Comp, OpEx remainder — **numbers are partner decisions, not mine**); system moves CAPs 1–2 points per quarter toward TAPs and shows the path. Agencies die of OpEx creep; the stepper is the tourniquet.
4. **Vault & Drip for lumpy agency cash:** project payments are spiky (your 50/25/25 terms guarantee it). Income allocates on the rhythm, but OpEx receives a **fixed monthly drip** computed from trailing-12-week average — surplus builds the Vault (target: 3 months OpEx). The system shows "Vault months" on the Management dashboard: the agency's oxygen meter.
5. **Two hard guards:** client **media wallets are pass-through — never allocated** (ad money is not revenue; blending it is the classic agency self-deception and, post-VAT, a compliance mess). And **scope-creep leak detection**: hours logged beyond approved scope × seat cost rate = unbilled leak, reported weekly (Profit First's "plug the leaks" applied to the real agency leak, which is free work).
6. **Quarterly profit distribution as ritual:** the quarterly meeting ends with the Profit split event — 50% distributed per partnership terms, 50% retained — logged, celebrated, and tied to the Rocks review. Profit becomes a habit with a date, and the transparent ledger becomes the partnership's referee.

## 2.5 Built to Sell — sellable by design

**The full theory (the 8 lessons as one arc):** Find the service that is **Teachable, Valuable, and Repeatable** → productize it with fixed scope and price → **charge upfront** (positive cash-flow cycle funds growth) → **name and brand the process** so clients buy the process, not the person → **say no** to work outside it (specialists command premiums; generalists commute) → build sales that **don't require the owner** (hire people who love selling a product) → run it long enough to prove the model in the numbers → keep key people with a **long-term incentive plan** that isn't equity.

**AGMA integration:**

1. **TVR filter on the catalog:** score all 32 services on Teachable (grade-A playbook possible?), Valuable (client pays premium?), Repeatable (same steps every time?). High-TVR services become **Packages**; low-TVR stay as custom (allowed, but visibly second-class in the scope builder).
2. **Packages, branded under the Method:** `service_packages` (fixed scope, fixed price, standard timeline, playbook refs, options). Launch candidates from *proven* demand: **Launch Kit** (quote 00054 is this package already — identity + profile + website + domain/hosting, with the Option-1/Option-2 pattern kept), **Growth Retainer** (performance + content, monthly), **AI Starter** (one automation + chatbot). Each package sold as "AGMA Method™ applied to X" — Warrillow's own-your-process rule; you already own a trademark-ready name.
3. **Cash-flow cycle:** packages default to **100% upfront with a small incentive** (or keep 50/25/25 as the fallback); recurring retainers bill month-ahead. Upfront cash + Profit First's Vault = growth funded without debt.
4. **The "say no" mechanism, made kind:** custom scope requires a `why_no_package_fit` reason. Quarterly, those reasons are mined — recurring ones become the next package (the market designs your product line); one-offs get priced with a **custom premium multiplier** (saying no politely, in riyals).
5. **Owner-independence as the valuation dial:** % of delivery tasks executed by non-partners, % of deals closed without partner presence, % of client comms not involving partners — trended quarterly. This triangulates with the E-Myth Technician gauge: same disease, two thermometers.
6. **Sales independence path:** stage 1 (now) — system-assisted selling: scope builder + package pages + AI Scope Drafter make proposals producible by anyone; stage 2 — first sales hire sells *packages only* (Warrillow's rule: product-sellers, not service-consultants); stage 3 — partner exits daily sales. Each stage has a scorecard trigger, not a date.
7. **Key-people incentive plan:** for future seat-owners, a long-term bonus pool tied to company Profit-account growth, vesting over 3 years (Warrillow's non-equity retention) — table stub now, activated at first senior hire.

---

# PART 3 — ONE CADENCE (all five books, one calendar)

| Rhythm | Ritual | Framework |
|---|---|---|
| Continuous | Pause-point checklists · Flag & Hold · Issues filed by anyone | Gawande, EOS |
| Sun 7:00 | Scorecard computes → partner WhatsApp digest, reds first | EOS Data |
| Weekly (fixed day/time) | Level-10 meeting, agenda auto-prepared, top-3 IDS | EOS Traction |
| 10th & 25th | Allocation ritual (READ-DO checklist, transfers, Vault update) | Profit First + Gawande |
| Biweekly | Rocks status nudge | EOS |
| Monthly | Scope-creep leak report · package-mix review · client health review | PF, BtS, EOS |
| Quarterly | Quarterly session: Rocks scored → V/TO → People Analyzer → CAP→TAP step → checklist hygiene → custom-reasons mining → **Profit distribution event** | All five |
| Annually | Annual session: Primary Aims → Core Values → 3-Year Picture → READ-DO drills → playbook franchise audit | E-Myth + EOS + Gawande |

One calendar. The system prepares every ritual; the partners only think and decide.

---

# PART 4 — SCHEMA DELTA & PHASE WIRING

New tables: `primary_aims` · `seats` · `people_reviews` · `vision` (V/TO) · `rocks` · `issues` · `experiments` · `playbook_versions` (+ `documentation_grade`, `doc_gaps`) · `scorecard_metrics` / `scorecard_entries` · `pause_checklists` / `checklist_runs` (+ Flag & Hold states, `last_caught_at`) · `allocation_rules` / `allocations` (+ vault ledger) · `service_packages` (+ `why_no_package_fit` on scopes) · `incentive_plans` (stub).
New task fields: `executed_by`, EMT-classification, scope-approved-hours link.

| Phase | Absorbs |
|---|---|
| 1 | seats, playbook grades + versioning, issues (core tables) |
| 2 | service_packages, TVR scores, custom-reason field, upfront terms |
| 4 | pause checklists engine, Flag & Hold, huddle prompts, executed_by |
| 5 | allocation engine, 10th/25th rhythm, Vault/drip, leak detection, media-wallet guard |
| 10 | scorecard + digest, V/TO page, Rocks, People Analyzer, meeting-pulse automation, EMT gauge, owner-independence, incentive stub |

---

# PART 5 — PARTNER DECISIONS (the system can't decide these)

1. Primary Aim — each of you, privately, then shared excerpts. 2. Core Values (3–5) + Core Focus wording. 3. TAPs with the accountant + partner comp split terms. 4. Weekly scorecard targets. 5. First quarter's Rocks (3–5 each). 6. Package pricing for Launch Kit / Growth Retainer / AI Starter. 7. Fixed weekly meeting slot — same day, same time, forever.

Bring these seven here when you and Amer sit — I'll facilitate and we lock them into seed data.

---
*AGMA™ internal — docs/10 v2. Five books, one machine: what we sell (BtS), how (E-Myth/EOS), how safely (Gawande), what we keep (PF), how we improve (all of them, forever).*

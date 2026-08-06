# AGMA OS — Master Blueprint
**The complete ecosystem specification, ready for Claude Code | v1.0 — August 2026**

This is the definitive build document. It consolidates the four prior specs (Workflow, System Spec, Service Playbooks, Module Architecture), adds every requested capability, fills the gaps, and defines infrastructure, costs, compliance, and build order.

---

# PART A — INFRASTRUCTURE & STACK

## A1. Confirmed stack

| Layer | Tool | Role |
|---|---|---|
| Hosting | Hostinger Cloud Startup (GitHub deploy) | Frontend + app server |
| Repo/CI | GitHub + GitHub Actions | Version control, auto-deploy on push to `main` |
| Database/Auth/Realtime | Supabase (Postgres + RLS) | The brain — all operational data |
| Messaging | Twilio (WhatsApp Business API + SendGrid email) | Notification engine |
| AI images/video | Higgsfield (subscribed) + Gemini image (nano banana) | Creative generation |
| AI text | Gemini (bulk/cheap) + Claude API (quality/agentic) | Content, assistants, generators |

**Hostinger reality check:** Cloud Startup plans are PHP-first. For a Next.js app you have two clean paths — decide in week 1:
- **Path 1 (recommended):** Frontend as static/SSG Next.js export served by Hostinger; all dynamic logic in Supabase (RLS-protected queries from the browser + Edge Functions for server logic). Zero Node server to maintain.
- **Path 2:** Upgrade to Hostinger VPS (KVM 2, ~$8/mo), run Next.js SSR via Docker + GitHub Actions deploy. Needed only if you require heavy server rendering.
Since the current agma.com.sa came out of Google AI Studio (client-side React), Path 1 is the natural continuation. Migrate the existing site code into the monorepo as the `marketing` app.

## A2. File storage — cost-effective recommendation (not Google Drive)

**Recommendation: Cloudflare R2 as the warehouse + Supabase Storage as the hot layer.**

| Option | 5TB/month | Egress | Verdict |
|---|---|---|---|
| **Cloudflare R2** | ~$75 | **$0 — free egress** | ✅ Winner. S3-compatible, zero egress means serving files to the portal/website costs nothing |
| Backblaze B2 | ~$30 | Free up to 3× storage, then $0.01/GB | Cheapest raw storage; good as cold backup target |
| Supabase Storage | ~$105 | Bandwidth billed | Use only for hot files (<100GB): avatars, logos, recent reports |
| Wasabi | ~$35 (min commit) | "Free" but fair-use capped | OK, but R2's zero-egress is safer for a client-facing portal |
| Google Drive 5TB | ~$25 (Workspace) | Free | Cheapest, but API quotas, no S3 API, weak for programmatic serving — keep as **manual/team drive only**, not app storage |

**Architecture:** `assets` table in Postgres holds metadata (client, project, service, tags, version); binary lives in R2 under `client-id/project-id/`. App serves via signed URLs. Nightly backup job mirrors R2 → Backblaze B2 (cheap redundancy, ~$30/mo). Realistic year-1 usage is well under 1TB → expect **~$15–30/mo total storage**, scaling linearly.

## A3. AI stack with cost breakdown

Principle: **cheap model for volume, strong model for judgment.** Every AI feature routes through one internal `ai-router` service so models are swappable.

| Task | Model | Est. cost | Notes |
|---|---|---|---|
| Daily article drafts (bulk) | Gemini 2.5 Flash | ~free–$5/mo | Free tier covers early volume; pennies after |
| High-value Arabic long-form, scope drafts, report writing | Claude Sonnet API | ~$15–40/mo | Noticeably better Arabic business prose; worth it where clients read the output |
| Agentic flows (multi-step research → article with sources) | Claude Sonnet API | included above | Tool-use reliability matters here |
| Article/social images | Gemini image ("nano banana") | ~$0.04/image → ~$5/mo | Default for article headers |
| Premium creative (campaign visuals, video) | Higgsfield | already subscribed | Route "hero" creative here |
| Embeddings (help centre RAG, semantic search) | Gemini embeddings | ~free | Store vectors in Supabase pgvector |
| Chatbot (site + WhatsApp) | Gemini Flash, escalate to Claude on low confidence | ~$5–15/mo | Confidence-based routing keeps cost tiny |
| **Total AI estimate** | | **~$30–70/mo** at launch scale | Scales with usage, all metered |

## A4. Total monthly infrastructure estimate (launch scale)

Hostinger ~$10 · Supabase Pro $25 · R2 + B2 backup ~$20 · Twilio WhatsApp ~$20–50 (Meta conversation fees dominate) · SendGrid ~$20 · AI ~$30–70 → **≈ $125–195/mo**. Trivial against one client retainer.

---

# PART B — THE ECOSYSTEM (module specs, gaps filled)

Everything from the Module Architecture doc stands. Below are the new capabilities, specified, plus best-practice additions.

## B1. CRM → Website live sync
When a client is activated in CRM:
- Logo uploaded to CRM → stored in R2 → `website_clients` table flagged `published` → agma.com.sa client/portfolio section renders it automatically (site reads the same Supabase project, anon-key + RLS `published=true` only).
- Same pattern extends to: case studies, testimonials, live counters (automated hours, campaigns count) — the site's stats become real system data, never manually edited.
- Kill switch per client (`consent_public boolean`) — legal requirement: never publish a client logo without contract clause + toggle.

## B2. Content Engine (daily collection → sourced articles → images → approval → publish)
Pipeline (cron via Supabase Edge Functions / pg_cron):
1. **Collect:** daily crawl of configured sources (industry news, Google Trends KSA, competitor blogs) via web-search API → stored in `content_signals` with URLs.
2. **Select:** AI ranks signals against the SEO topic clusters (Knowledge Base) → proposes today's article topics.
3. **Draft:** Claude writes the Arabic article **with inline source citations** (links preserved from step 1 — no uncited claims allowed by the prompt contract).
4. **Illustrate:** nano banana generates the header image; "premium" flag routes to Higgsfield instead.
5. **Approval gate:** draft + image land in the Review queue (editor edits/approves/rejects; nothing publishes without a human — same rule as all AI Studio apps).
6. **Publish:** to agma.com.sa blog and/or client CMS targets; Analytics logs impressions → feeds the Adapt phase.
This engine serves double duty: AGMA's own marketing AND the deliverable engine for client SEO/content retainers (per-client source lists, brand voice from Knowledge Base).

## B3. Finance — Saudi edition (fully compliant)
Everything from the Finance module plus KSA specifics:
- **VAT 15%** on all invoices; VAT-registration fields on client records; quarterly VAT return report.
- **ZATCA e-invoicing (Fatoora):** build **Phase 2-ready from day one** — invoices generated as UBL 2.1 XML + PDF/A-3 with embedded XML, cryptographic stamp fields, QR code (TLV format: seller, VAT no., timestamp, total, VAT amount). Phase 1 compliance immediate; Phase 2 API integration (clearance/reporting to Fatoora) built behind a feature flag — **verify AGMA's current wave applicability with your accountant** since waves roll out by revenue threshold.
- **Invoice types:** standard tax invoice (B2B) + simplified (B2C), Arabic-primary bilingual layout, sequential numbering, no deletion — credit notes only (ZATCA rule).
- Payment tracking: bank transfer reference matching, Mada/card via a KSA gateway later (Moyasar/Tap — v2).
- Ad-spend wallets, payouts, profitability matrix as previously spec'd.
- **PDPL compliance (Saudi data protection):** consent records for client data, data-processing register, right-to-deletion workflow, data residency note — Supabase region choice documented + transfer assessment; PII encrypted at rest, audit-logged access.

## B4. Legal Document Generator Suite
Template engine (Arabic-primary, bilingual) + variable injection from CRM/HR/Projects + versioned output to R2 + status tracking (draft → sent → signed → active → expiring):
- **NDA** (mutual/one-way) · **SLA** (per service category — response times, uptime, revision caps pulled from playbooks) · **AMC** (annual maintenance contract — for web/automation retainers) · **COC** (code of conduct — employee + vendor variants) · **MSA** (master service agreement) · **SoW** (auto-drafted from scoped services) · Influencer agreement · Freelancer contract · Media-buy IO · Employment contract (Saudi labor law fields: probation, notice, GOSI) · Data-processing addendum (PDPL).
- Clause library: lawyer approves clauses once; generator assembles; anything off-template flags for legal review. **Disclaimer in system: generated docs require lawyer review before first use of each template.**
- v2: e-signature integration.

## B5. Client Onboarding & Data Collection
Triggered automatically on contract signed:
- **Onboarding wizard** in the portal: company profile, brand assets upload (→ DAM), access credentials vault (ad accounts, CMS, socials — encrypted, access-logged), target audience brief, competitors, goals/KPIs.
- **Drop Forms builder:** internal no-code form builder (field types, logic jumps, file drops) → every submission lands as structured rows in `form_responses` → instantly queryable in Analytics. Used for onboarding, campaign briefs, feedback surveys, event registrations. This is what makes "data analyses easier" — no more data trapped in PDFs.
- Onboarding completion % visible to Operations; project can't enter Generate phase below 100% (gate).

## B6. Help Centre + AI Assistant
- Public help centre (portal FAQ, service explainers, billing questions) + internal help centre (SOPs, playbooks) — both content from Knowledge Base.
- **RAG assistant:** pgvector embeddings over Knowledge Base + help articles; answers cite the source article; "not confident" → creates a support ticket instead of guessing.
- Same brain powers three surfaces: portal help widget, site chatbot, WhatsApp bot.

## B7. Chatbot Support
- **Site chatbot:** lead qualification (captures → CRM as lead with conversation transcript), service questions via RAG, books strategy calls (calendar link).
- **WhatsApp bot (Twilio):** client support tier-1 (invoice copies, project status reads from Projects), FAQ, human-handoff keyword → routes to team inbox with full context.
- All conversations logged to CRM interactions — the bot is a CRM input device.

## B8. Notification Engine (Twilio WhatsApp + SendGrid Email)
One event-driven service, not scattered sends:
- `notifications` table: event type → recipient role → channel(s) → template → locale (AR/EN) → schedule.
- Template registry with WhatsApp-approved message templates (Meta requires pre-approval — submit early, approval takes days).
- Wired events: approval pending (48h nudge), invoice issued/due/overdue, project phase change, report published, contract expiring (30d), wallet at 80%, onboarding incomplete (72h), new lead assigned, task overdue, welcome sequences.
- Per-user notification preferences + quiet hours (KSA evenings/weekends aware) + full send log for audit.

## B9. Employee Project Management Tools
The Operations/Projects engine surfaced for the team:
- "My day" view: tasks across projects, approvals waiting on me, sprint focus.
- Time logging (feeds profitability), workload heatmap, blockers flag (pings project lead via engine B8).
- Internal comments/mentions per task; client-visible vs internal clearly separated.

## B10. New Employee Portal
Triggered on HR record created:
- **Provisioning checklist** auto-generated by role (accounts to create, tools access, playbooks to read).
- **Auto HTML email signature generator:** name, role AR/EN, phone, agma.com.sa branding → rendered HTML + install instructions per mail client. One brand, zero rogue signatures.
- **Role-based welcome email:** template per role (strategist/executor/finance/admin) with first-week plan, their playbooks, team directory.
- 30/60/90-day check-in forms (Drop Forms), COC e-acknowledgment (Legal suite), equipment log.
- Offboarding mirror: access revocation checklist, handover form, exit survey.

## B11. Best-practice additions (the gaps you asked me to fill)
1. **Audit log** — every create/update/delete on sensitive tables (finance, legal, credentials vault) with actor + timestamp. Non-negotiable for PDPL and for trust.
2. **Environments** — `staging` branch → staging deploy + separate Supabase project. Never test on client data.
3. **Backups** — Supabase PITR (Pro plan) + nightly R2→B2 mirror + weekly logical dump. Test a restore quarterly.
4. **Security** — 2FA mandatory for team, credentials vault encrypted (Supabase Vault), RLS on every table, rate-limited public endpoints, secrets in GitHub Actions secrets only.
5. **Feature flags** — simple `flags` table; ship dark, enable per-user. This is how one developer + Claude Code ships safely.
6. **Client health score** — computed weekly: approval speed, payment punctuality, NPS, engagement → surfaces churn risk on Management dashboard before it happens.
7. **NPS + feedback loop** — quarterly NPS via WhatsApp (one tap), post-project CSAT form; scores feed health score.
8. **Referral tracking** — referral source on every lead; referring clients visible → fuel for a referral incentive program.
9. **SLA timers** — from the SLA generator into Projects: response-time countdowns on client requests, breach alerts. Your SLAs become monitored, not decorative.
10. **Status page + uptime** — simple public status for portal + monitored crons (dead-man switch: if daily content engine doesn't run, you get a WhatsApp).
11. **Weekly digest** — auto WhatsApp/email to Management: revenue, pipeline, delivery health, flags. The company in one message.
12. **Data export** — every module exports CSV; client can request full data export (PDPL right).

---

# PART C — BUILD PLAN FOR CLAUDE CODE

## C1. Repo structure (monorepo)
```
agma-os/
├── CLAUDE.md                  ← build rules, conventions, this blueprint referenced
├── apps/
│   ├── marketing/             ← agma.com.sa (migrated from Google AI Studio)
│   ├── ops/                   ← internal app (ops.agma.com.sa)
│   └── portal/                ← client portal (my.agma.com.sa)
├── packages/
│   ├── ui/                    ← shared RTL design system (site look & feel)
│   ├── db/                    ← schema, migrations, RLS policies, seed (playbooks!)
│   ├── ai-router/             ← model routing (Gemini/Claude/nano banana/Higgsfield)
│   ├── notifications/         ← Twilio/SendGrid engine + templates
│   ├── legal-templates/       ← document generator + clause library
│   └── zatca/                 ← invoice XML/QR/PDF-A3 generation
├── supabase/
│   ├── migrations/
│   └── functions/             ← edge functions: crons, webhooks, content engine
└── .github/workflows/         ← deploy.yml (staging + production to Hostinger)
```

## C2. Build phases (each = a Claude Code working session set)
| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | Repo scaffold, CLAUDE.md, CI/CD to Hostinger, staging env, migrate current site in | your local AGMA files |
| 1 | Schema + RLS + seeds (32 services, 8 playbooks, roles) + Auth + audit log | 0 |
| 2 | CRM + Sales pipeline + website live-sync (logo → site) | 1 |
| 3 | Legal generator suite (NDA/SLA/AMC/COC/MSA/SoW) | 2 |
| 4 | Projects + playbook engine + employee PM views + HR roster | 1 |
| 5 | Finance KSA (VAT invoices, ZATCA-ready, wallets, profitability) | 2,4 |
| 6 | Notification engine (Twilio WA + SendGrid) — then wire into everything prior | 1 |
| 7 | Client portal + onboarding wizard + Drop Forms | 2,4,6 |
| 8 | Content Engine (collect→draft→image→approve→publish) | 1,6 |
| 9 | Help Centre + RAG assistant + chatbots (site + WhatsApp) | 8 |
| 10 | Employee portal (signatures, welcome emails, provisioning) + Analytics dashboards + health scores + digest | all |

Phases 2–3 make you revenue-operational fast; 8 can be pulled earlier as standalone v0 if you want daily articles flowing immediately.

## C3. What to prepare before the first Claude Code session
1. Local AGMA site files (the Google AI Studio export) in a folder.
2. Fresh GitHub repo (`agma-os`) + Hostinger deploy credentials (or Git integration enabled).
3. Supabase: two projects (staging, production) — note URLs + keys.
4. Twilio account SID/token + WhatsApp sender setup started (**submit WhatsApp template approvals now — it's the longest lead time**).
5. API keys: Gemini, Anthropic, Higgsfield.
6. Cloudflare account for R2 (bucket: `agma-assets`).
7. Company constants: CR number, VAT number, bank details (for invoice templates).

## C4. CLAUDE.md ground rules (will be written into the repo)
- Arabic-first RTL UI, English toggle; all client-facing text bilingual-ready.
- Every table ships with RLS + audit trigger; no exceptions.
- Every AI output passes an approval gate before any external surface.
- All cross-module communication through events → notification engine; no direct sends.
- Feature-flag anything client-visible; deploy to staging first, always.
- Money and legal documents are immutable — corrections via new versions/credit notes.

---

**The level you're aiming for is right, and this stack reaches it.** One system where signing a client cascades through contracts, invoicing, onboarding, project creation, and their logo appearing on the website — while the content engine publishes daily and every party gets the right WhatsApp at the right moment. Drop the AGMA files in, and Phase 0 starts.

*AGMA™ internal — supersedes and consolidates: Workflow · System Spec · Service Playbooks · Module Architecture*

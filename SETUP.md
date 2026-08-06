# AGMA OS — Owner Setup Checklist

Every account, key, and manual step required to take the repo from scaffold to
running system. Work top-to-bottom; items marked **⏳ lead time** should be
started immediately.

---

## 1. GitHub

- [x] Repo exists: `https://github.com/apex-dandashi/AGMA-os` — `main` + `staging` pushed
- [x] Collaborator access granted to the local dev credential (`aelibrahim-a11y`)
- [ ] Later phases add repo secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

GitHub Actions runs a **build check only** (`.github/workflows/ci.yml`) — no
deploy secrets needed; deploys are Hostinger's Git integration (below).

## 2. Hostinger (Git integration — replaces the old SSH/rsync plan)

Deploys pull straight from GitHub; no SSH keys or GitHub secrets involved.

- [x] Staging: hPanel Git deploy on `staging.agma.com.sa` ← repo **AGMA-os**,
      branch `staging`
- [x] Staging verified (2026-08-06): Node **22.x** · Root `apps/marketing` ·
      Build `pnpm run build` · pnpm · Output `out` · Entry empty. Homepage,
      inner pages, deep links (301→trailing slash), 404s all confirmed live.
- [ ] Production cutover (when ready): same Git deploy wizard for **agma.com.sa**
      ← repo AGMA-os, branch `main`, identical settings — the old AGMA-Web repo
      retires at that moment
- [ ] Enable auto-deploy on push for both (hPanel toggle), if not on by default

## 3. Supabase (⏳ do before Phase 1)

**Owner decision (2026-08-06): single hosted project.** Migration testing happens on
the local stack (Docker), never on a second hosted project — see supabase/README.md.

- [ ] Create project **`agma-os-production`** — region **Mumbai `ap-south-1`**
      (no Middle East region offered; document as the PDPL data-residency note,
      docs/05 §B3)
- [x] ~~Point-in-Time Recovery add-on~~ — **declined (owner, 2026-08-06; cost)**.
      Coverage instead: Pro plan daily backups (7-day retention, automatic) now +
      weekly logical dump & R2→B2 mirror when the backup jobs phase lands
- [x] **Supabase GitHub integration enabled**: merge to `main` auto-applies
      `supabase/migrations` to production (working dir `.`); automatic preview
      branching OFF (uncovered compute cost; local stack is the test layer)
- [ ] Note: Project ref · URL · anon key · service_role key · DB password
- [ ] Install Docker Desktop (needed for the local Supabase stack)
- [x] Phase 0 migration applied to production (2026-08-06) — tables, seeds, and
      audit trail verified via data dump. Original instruction:
      `supabase db reset` (local) → `supabase link --project-ref <PROD_REF> && supabase db push`
- [ ] Personal access token for CI: account → Access Tokens → `SUPABASE_ACCESS_TOKEN`

## 4. Cloudflare R2

- [ ] Create Cloudflare account / use existing → R2 → create bucket **`agma-assets`**
- [ ] Create R2 API token (Object Read & Write, scoped to the bucket)
- [ ] Record: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=agma-assets`

## 5. Twilio WhatsApp (⏳ LONGEST LEAD TIME — start today)

**Owner decision (2026-08-06):** a dedicated Saudi number will be purchased for the
platform; sender goes live only after the OS build is finished. Until then Phase 6
develops against the **Twilio WhatsApp sandbox** (no registered sender needed).

- [ ] Twilio account → note `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- [ ] **Meta Business verification** for the AGMA business — start this early anyway;
      it is independent of the phone number and is the actual long lead time
- [ ] Nearer launch: purchase the dedicated Saudi number → WhatsApp Business sender
      registration on it
- [ ] Then submit the first template batch for Meta approval (each needs AR + EN body):
      invoice issued · invoice due reminder · invoice overdue · approval pending
      nudge · project phase changed · report published · contract expiring ·
      onboarding incomplete · welcome sequence · task overdue
- [ ] Record sender as `TWILIO_WHATSAPP_FROM` (format `whatsapp:+9665XXXXXXXX`);
      until then the sandbox number fills this variable in staging only

## 6. SendGrid

- [ ] Create account → API key with Mail Send → `SENDGRID_API_KEY`
- [ ] **Domain authentication** for `agma.com.sa` (CNAME records in DNS) so mail
      sends from `care@agma.com.sa` / `hello@agma.com.sa` without spoof flags
- [ ] Single-sender verification as interim until DNS propagates

## 7. AI API keys (used from Phase 2 on, all through packages/ai-router)

- [ ] `GEMINI_API_KEY` — Google AI Studio
- [ ] `ANTHROPIC_API_KEY` — Anthropic console
- [ ] `HIGGSFIELD_API_KEY` — existing subscription
- [ ] Store in Supabase Vault (server-side use) + GitHub environment secrets (CI)

## 8. Company data verification (docs/06)

- [ ] Transcribe exact GOSI · HRSD · SPL numbers from the original CR certificate
      PDF into `config/company.ts` when Phase 1 creates it (scan quality — verify digits)
- [ ] Chamber of Commerce registration: track to completion (تحت الإجراء)
- [ ] Confirm with accountant: Balady license not required; ZATCA wave applicability

---

## Environment variable reference (names only — CLAUDE.md)

`SUPABASE_URL` `SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` (staging + prod pairs) ·
`R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET` ·
`TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_WHATSAPP_FROM` · `SENDGRID_API_KEY` ·
`GEMINI_API_KEY` `ANTHROPIC_API_KEY` `HIGGSFIELD_API_KEY` · `HOSTINGER_DEPLOY_*`

Local development: copy values into `.env.local` files (gitignored). Never commit values.

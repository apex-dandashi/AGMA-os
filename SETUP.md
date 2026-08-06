# AGMA OS — Owner Setup Checklist

Every account, key, and manual step required to take the repo from scaffold to
running system. Work top-to-bottom; items marked **⏳ lead time** should be
started immediately.

---

## 1. GitHub

- [ ] Repo exists: `https://github.com/apex-dandashi/AGMA-os` ✓ (created)
- [ ] Grant push access to the machine account/collaborator that develops locally
      (current local credential: `aelibrahim-a11y` → add as collaborator, or
      re-login the keychain credential as the repo owner)
- [ ] Create branch `staging` (CI deploys it to the staging site)
- [ ] Create two **GitHub environments** (repo → Settings → Environments):
      `staging` and `production`
- [ ] In **each** environment, add these secrets (same names, per-target values):

  | Secret | Value |
  |---|---|
  | `HOSTINGER_DEPLOY_HOST` | SSH host from hPanel (e.g. `ssh.agma.com.sa` or server IP) |
  | `HOSTINGER_DEPLOY_PORT` | SSH port (Hostinger default: `65002`) |
  | `HOSTINGER_DEPLOY_USER` | SSH username from hPanel |
  | `HOSTINGER_DEPLOY_SSH_KEY` | Private key (generate: `ssh-keygen -t ed25519 -f agma_deploy`; paste the **private** file) |
  | `HOSTINGER_DEPLOY_PATH` | Web root: production `~/domains/agma.com.sa/public_html`, staging e.g. `~/domains/staging.agma.com.sa/public_html` |

- [ ] Later phases add (also per environment): `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

## 2. Hostinger

- [ ] hPanel → Advanced → **SSH Access**: enable, note host/port/user
- [ ] Add the **public** half of the deploy key to SSH keys
- [ ] Create subdomain `staging.agma.com.sa` with its own web root (staging target)
- [ ] Verify: `ssh -p <port> <user>@<host>` from your machine works with the key

## 3. Supabase (⏳ do before Phase 1)

- [ ] Create project `agma-os-staging` — region: closest with acceptable PDPL
      posture (document the choice — data-residency note required by docs/05 §B3)
- [ ] Create project `agma-os-production` — same region, **Pro plan** (PITR backups)
- [ ] Note per project: Project ref · URL · anon key · service_role key · DB password
- [ ] Apply the Phase 0 migration to staging:
      `supabase link --project-ref <STAGING_REF> && supabase db push`
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

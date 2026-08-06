# Claude Code — Kickoff Prompt (Phase 0)

Copy-paste the block below as your first message in Claude Code, opened in the folder containing the AGMA site files and the docs.

---

You are building AGMA OS — the complete operations ecosystem for my agency. Start by reading CLAUDE.md fully, then skim docs/05-master-blueprint.md and docs/06-brand-standards.md. All rules in CLAUDE.md are binding.

This folder contains:
- The current agma.com.sa site export (from Google AI Studio) in [FOLDER_NAME]
- The /docs folder with all six specification documents
- docs/references/ with the real quotation, invoice, and CR certificate PDFs

Phase 0 tasks, in order:
1. Initialize the monorepo exactly per the structure in CLAUDE.md (pnpm workspaces + Turborepo). Create docs/PROGRESS.md with the phase tracker.
2. Audit the existing site export: report its framework, structure, and quality. Then migrate it into apps/marketing as a Next.js static-export app, preserving the current design 1:1. Do not redesign anything.
3. Set up packages/ui: extract the design tokens (colors, typography, spacing) from the existing site + docs/06-brand-standards.md into a shared RTL-first token file and base components.
4. Create supabase/ scaffolding: config for two projects (staging/production), an initial migration with the `flags`, `audit_log`, and `payment_accounts` tables (seed the 3 accounts from docs/06 — remember internal_label is admin-only), and the audit trigger function that all future tables will use.
5. Set up .github/workflows/deploy.yml: staging branch → staging deploy, main → production, to Hostinger. Use placeholder secrets; list every secret I need to add in a SETUP.md checklist.
6. Write SETUP.md: every account, key, and manual step I must complete (Supabase projects, R2 bucket, Twilio WhatsApp sender + template submissions, SendGrid domain auth, Hostinger Git deploy) with exact instructions.
7. Verify: `pnpm build` passes for apps/marketing, and give me a summary of what exists, what's stubbed, and what Phase 1 will do.

Constraints for this session: no feature building yet, no schema beyond the three tables above, no redesign of the site. Ask me before any destructive operation on the existing site files. When done, update docs/PROGRESS.md and stop.

---

## Per-phase prompt pattern (for later sessions)

"Read CLAUDE.md and docs/PROGRESS.md. We are starting Phase [N]: [name]. Read [relevant spec doc + section]. Build it completely: migrations with RLS + audit, seed data, UI in apps/[app], tests on any generator. Deploy to staging, list what I should manually test, update PROGRESS.md, stop."

Phase-to-spec map:
- Phase 1 → docs/02 (data model) + docs/03 (playbook seeds)
- Phase 2 → docs/04 §1.2/2.1 + B1 website sync in docs/05
- Phase 3 → docs/05 §B4 + docs/06 (document anatomy) + reference PDFs
- Phase 4 → docs/03 (both project modes) + docs/04 §1.4/1.6/2.2
- Phase 5 → docs/05 §B3 + docs/06 §1/1b/3 (accounts, numbering, VAT-off)
- Phase 6 → docs/05 §B8
- Phase 7 → docs/05 §B5 + docs/02 (portal spec)
- Phase 8 → docs/05 §B2
- Phase 9 → docs/05 §B6/B7
- Phase 10 → docs/05 §B10/B11 + docs/06 §4 (signature/welcome templates)

## Pre-session checklist (do once, before kickoff)
☐ Folder ready: site export + docs/ (rename the six .md files to 01–06 as listed in CLAUDE.md) + docs/references/ PDFs
☐ CLAUDE.md at folder root
☐ GitHub repo `agma-os` created (empty)
☐ Supabase staging + production projects created — keys at hand
☐ Cloudflare R2 bucket `agma-assets` created
☐ Twilio: WhatsApp sender registration started + first template batch submitted (longest lead time!)
☐ API keys ready: Gemini, Anthropic, Higgsfield, SendGrid
☐ Hostinger Git deployment enabled

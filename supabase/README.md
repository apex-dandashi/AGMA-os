# Supabase — environment workflow

AGMA OS uses **two hosted Supabase projects** (docs/05 §B11.2 — never test on client data):

| Environment | Project name | Used by |
|---|---|---|
| Staging | `agma-os-staging` | `staging` branch deploys, all development |
| Production | `agma-os-production` | `main` branch deploys only |

## Applying migrations

```bash
# staging (default day-to-day)
supabase link --project-ref <STAGING_PROJECT_REF>
supabase db push

# production (only after staging verification)
supabase link --project-ref <PRODUCTION_PROJECT_REF>
supabase db push
```

CI applies migrations automatically on deploy (see `.github/workflows/deploy.yml`);
manual `db push` is the fallback.

## Rules (from CLAUDE.md — binding)

1. Every table ships with RLS policies + the `audit_trigger()` function attached.
2. New migrations via `supabase migration new <name>` — never edit an applied migration.
3. `payment_accounts.internal_label` is admin-only: column-level grants exclude it
   from `anon`/`authenticated`; never add it to any view, document, or portal query.
4. Secrets live in Supabase Vault / GitHub Actions secrets — never in migrations.

## Local development

```bash
supabase start   # local stack (Docker)
supabase db reset  # replay all migrations + seeds locally
```

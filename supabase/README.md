# Supabase — environment workflow

**Owner decision (2026-08-06): one hosted project only — `agma-os-production`.**
There is no hosted staging database. The safety layer is the **local Supabase
stack**: every migration is proven locally before it touches production.

| Environment | What it is | Used for |
|---|---|---|
| Local | `supabase start` (Docker) | All development + migration testing |
| Production | `agma-os-production` (hosted) | The live system; both site deploys point here |

## Migration workflow (binding)

```bash
# 1. Write the migration
supabase migration new <name>

# 2. Prove it locally — full replay from zero must succeed
supabase start
supabase db reset

# 3. Only then let it reach production: merge to main — the Supabase GitHub
#    integration auto-applies supabase/migrations on merge.
#    Manual fallback: supabase link --project-ref <PROD_REF> && supabase db push
```

Destructive migrations (drop/alter with data loss potential) additionally require
an explicit owner OK before step 3 — no exceptions.

## Rules (from CLAUDE.md — binding)

1. Every table ships with RLS policies + the `audit_trigger()` function attached.
2. Never edit an applied migration — corrections are new migrations.
3. `payment_accounts.internal_label` is admin-only: column-level grants exclude it
   from `anon`/`authenticated`; never add it to any view, document, or portal query.
4. Client-visible features ship dark behind `flags` rows — with one shared database,
   feature flags are the isolation between the staging site and the production site.
5. Secrets live in Supabase Vault / GitHub Actions secrets — never in migrations.

/**
 * Public client configuration. These values are public BY DESIGN — the anon
 * key ships in every browser bundle and RLS is the security layer (CLAUDE.md
 * rule 9 covers secrets; these are not secrets). Hardcoded fallbacks exist
 * because Hostinger's static builds don't receive deployment env vars.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gjaheqlgheizvebvakfd.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_4skzKO7V1tBiFuuTfjKofw_9eIYq8gq';

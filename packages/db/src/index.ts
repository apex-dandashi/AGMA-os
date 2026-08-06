import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type AgmaClient = SupabaseClient<Database>;

/**
 * Browser/anon client — RLS enforces all access. Apps pass their env values
 * (never import env here; each app owns its .env.local).
 */
export function createAgmaClient(url: string, anonKey: string): AgmaClient {
  return createClient<Database>(url, anonKey);
}

/** The 6 pipeline stages in board order (docs/02 §3.1). */
export const LEAD_STAGES = [
  'discovery_call',
  'opportunity_analysis',
  'scoping',
  'roadmap',
  'live',
  'optimize',
] as const satisfies readonly Enums<'lead_stage'>[];

/** AGMA Method™ phases in order (docs/02 §3.2). */
export const METHOD_PHASES = [
  'analyze',
  'generate',
  'market',
  'adapt',
] as const satisfies readonly Enums<'method_phase'>[];

export const USER_ROLES = [
  'admin',
  'strategist',
  'executor',
  'client',
] as const satisfies readonly Enums<'user_role'>[];

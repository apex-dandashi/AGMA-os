'use client';

import { createAgmaClient, type AgmaClient } from '@agma/db';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './publicConfig';

let client: AgmaClient | null = null;

/** Lazily-created browser client — never constructed during prerender. */
export function getSupabase(): AgmaClient {
  if (!client) {
    client = createAgmaClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

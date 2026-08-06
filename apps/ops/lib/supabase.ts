'use client';

import { createAgmaClient, type AgmaClient } from '@agma/db';

let client: AgmaClient | null = null;

/** Lazily-created browser client — never constructed during prerender. */
export function getSupabase(): AgmaClient {
  if (!client) {
    client = createAgmaClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

// Client error sink (docs/07 Sprint C2 — observability v1, zero external cost).
// Browser errors land in Supabase function logs, rate-capped, PII-free.
// Upgrade path: swap this sink for Sentry when error volume justifies it.
import { z } from 'npm:zod@3';

const schema = z.object({
  app: z.enum(['ops', 'marketing']),
  message: z.string().max(500),
  stack: z.string().max(2000).optional(),
  url: z.string().max(300).optional(),
  ua: z.string().max(300).optional(),
});

const ORIGINS = new Set([
  'https://agma.com.sa',
  'https://www.agma.com.sa',
  'https://staging.agma.com.sa',
  'https://ops.agma.com.sa',
  'http://localhost:3000',
  'http://localhost:3001',
]);

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ORIGINS.has(origin) ? origin : 'https://agma.com.sa',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

// In-memory throttle per isolate (cheap first line; cold starts reset it).
let count = 0;
let windowStart = Date.now();

Deno.serve(async (req) => {
  const h = headers(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: h });
  }

  if (Date.now() - windowStart > 60_000) {
    count = 0;
    windowStart = Date.now();
  }
  if (++count > 30) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: h });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (parsed.success) {
      const e = parsed.data;
      console.error(
        `[client-error] app=${e.app} url=${e.url ?? '-'} msg=${e.message}` +
          (e.stack ? `\n${e.stack.slice(0, 1000)}` : '')
      );
    }
  } catch {
    // swallow — the sink must never throw back at the app
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: h });
});

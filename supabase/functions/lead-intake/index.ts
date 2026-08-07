// Lead intake: agma.com.sa contact form → leads table (docs/02 §3.1).
// Public endpoint; Zod-validated, honeypot-guarded, inserts with service role.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa',
  'https://www.agma.com.sa',
  'https://staging.agma.com.sa',
  'http://localhost:3000',
]);

// Mirror of packages/db/src/schemas.ts leadIntakeSchema (deno runtime can't
// import the workspace package; keep the two in sync).
const intakeSchema = z.object({
  name: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  services: z.string().trim().max(500).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  website: z.string().optional(),
});

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://agma.com.sa';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }

  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'validation', field: parsed.error.issues[0]?.path?.[0] ?? null }),
      { status: 400, headers }
    );
  }
  const body = parsed.data;

  // Honeypot: real users never fill this hidden field.
  if (body.website && body.website.length > 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const notes = [
    body.phone && `الهاتف: ${body.phone}`,
    body.email && `البريد: ${body.email}`,
    body.services && `الخدمات المطلوبة: ${body.services}`,
    body.budget && `الميزانية: ${body.budget}`,
    body.message && `الرسالة: ${body.message}`,
  ]
    .filter(Boolean)
    .join('\n');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase.from('leads').insert({
    name: body.name,
    company: body.company || null,
    source: 'site',
    notes: notes || null,
  });

  if (error) {
    console.error('lead insert failed', error.code);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});

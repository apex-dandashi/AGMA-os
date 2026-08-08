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

// Mirror of packages/db/src/schemas.ts (deno runtime can't import the
// workspace package; keep the two in sync).
const DIGITS_AR = '٠١٢٣٤٥٦٧٨٩';
const DIGITS_FA = '۰۱۲۳۴۵۶۷۸۹';
function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (ch) => {
    const i = DIGITS_AR.indexOf(ch);
    return String(i >= 0 ? i : DIGITS_FA.indexOf(ch));
  });
}
function normalizePhoneSa(s: string): string {
  let d = normalizeDigits(s).replace(/[^0-9+]/g, '').replace(/^00/, '+');
  if (d.startsWith('+966')) d = '+966' + d.slice(4).replace(/^0+/, '');
  else if (d.startsWith('966')) d = '+966' + d.slice(3).replace(/^0+/, '');
  else if (/^05[0-9]{8}$/.test(d)) d = '+966' + d.slice(1);
  else if (/^5[0-9]{8}$/.test(d)) d = '+966' + d;
  return d;
}

const intakeSchema = z.object({
  name: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).optional(),
  // L11: لا عميل محتمل بلا جوال — الجوال هو قناة البيع
  phone: z.string().trim().min(7).max(40).transform(normalizePhoneSa),
  email: z.string().trim()
    .transform((v) => (v === '' ? undefined : v.toLowerCase()))
    .pipe(z.string().email().max(200).optional()).catch(undefined),
  services: z.string().trim().max(500).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  website: z.string().optional(),
  utm: z.record(z.string().max(300)).optional(),
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

  // Rate limit: 5 submissions/hour per caller (salted IP hash — no raw PII).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const salt = Deno.env.get('RATE_SALT') ?? 'agma-intake';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${ip}`)
  );
  const callerHash = Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const { data: allowed, error: rlErr } = await supabase.rpc('check_rate_limit', {
    p_bucket: 'lead-intake',
    p_caller_hash: callerHash,
    p_max_per_hour: 5,
  });
  if (rlErr) console.error('rate limit check failed', rlErr.code);
  if (allowed === false) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  const { error } = await supabase.from('leads').insert({
    name: body.name,
    company: body.company || null,
    source: 'site',
    notes: notes || null,
    utm: body.utm ?? {},
  });

  if (error) {
    console.error('lead insert failed', error.code);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});

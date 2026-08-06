// Lead intake: agma.com.sa contact form → leads table (docs/02 §3.1).
// Public endpoint; validates, honeypot-guards, inserts with service role.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa',
  'https://www.agma.com.sa',
  'https://staging.agma.com.sa',
  'http://localhost:3000',
]);

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://agma.com.sa';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length === 0 ? null : s.slice(0, max);
};

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }

  // Honeypot: real users never fill this hidden field.
  if (clean(body.website, 100)) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const name = clean(body.name, 200);
  if (!name) {
    return new Response(JSON.stringify({ error: 'name_required' }), { status: 400, headers });
  }

  const company = clean(body.company, 200);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 200);
  const services = clean(body.services, 500);
  const budget = clean(body.budget, 100);
  const message = clean(body.message, 2000);

  const notes = [
    phone && `الهاتف: ${phone}`,
    email && `البريد: ${email}`,
    services && `الخدمات المطلوبة: ${services}`,
    budget && `الميزانية: ${budget}`,
    message && `الرسالة: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase.from('leads').insert({
    name,
    company,
    source: 'site',
    notes: notes || null,
  });

  if (error) {
    console.error('lead insert failed', error.code);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});

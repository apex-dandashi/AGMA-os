// Team invitations (docs/07 Sprint B3). Admin-only: verifies the caller's JWT,
// checks their profile role, then invites via the auth admin API and stamps
// the requested role on the auto-created profile.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const inviteSchema = z.object({
  email: z.string().trim().email().max(200),
  role: z.enum(['admin', 'strategist', 'executor']),
  full_name: z.string().trim().max(200).optional(),
});

const ORIGINS = new Set([
  'https://ops.agma.com.sa',
  'http://localhost:3001',
]);

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ORIGINS.has(origin) ? origin : 'https://ops.agma.com.sa',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  const h = headers(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: h });
  }

  const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: h });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: caller, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !caller.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: h });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', caller.user.id)
    .single();
  if (!profile || !profile.active || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: h });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: h });
  }
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation' }), { status: 400, headers: h });
  }
  const { email, role, full_name } = parsed.data;

  const redirectTo = req.headers.get('origin') && ORIGINS.has(req.headers.get('origin')!)
    ? `${req.headers.get('origin')}/reset/`
    : 'https://ops.agma.com.sa/reset/';

  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: full_name ?? '' },
    redirectTo,
  });
  if (invErr || !invited.user) {
    console.error('invite failed', invErr?.message);
    return new Response(JSON.stringify({ error: 'invite_failed' }), { status: 500, headers: h });
  }

  // Profile row is auto-created by the on_auth_user_created trigger; promote it.
  const { error: roleErr } = await admin
    .from('profiles')
    .update({ role, full_name: full_name ?? '' })
    .eq('id', invited.user.id);
  if (roleErr) {
    console.error('role stamp failed', roleErr.message);
    return new Response(JSON.stringify({ error: 'role_failed' }), { status: 500, headers: h });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: h });
});

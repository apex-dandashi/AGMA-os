// النماذج العامة (docs/16): شكوى / تقييم / تقديم وظيفي / تتبع شكوى.
// نفس ضمانات lead-intake: CORS مقيد، Zod، honeypot، حد معدل بتجزئة IP مملّحة.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa',
  'https://www.agma.com.sa',
  'https://staging.agma.com.sa',
  'http://localhost:3000',
]);

const complaintSchema = z.object({
  action: z.literal('complaint'),
  complainant_type: z.enum(['client', 'prospect', 'supplier', 'partner', 'visitor', 'other']).default('visitor'),
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(200)).optional().catch(undefined),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(200).optional(),
  is_current_client: z.boolean().optional(),
  category: z.string().trim().min(2).max(100),
  subject: z.string().trim().min(3).max(300),
  description: z.string().trim().min(10).max(5000),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  channel: z.string().trim().max(100).optional(),
  desired_resolution: z.string().trim().max(2000).optional(),
  confidential_flag: z.boolean().default(false),
  source_page: z.string().trim().max(300).optional(),
  website: z.string().optional(), // honeypot
}); // شرط وسيلة تواصل واحدة على الأقل يُفحص بعد التحليل (discriminatedUnion لا يقبل refine)

const feedbackSchema = z.object({
  action: z.literal('feedback'),
  rating: z.number().int().min(1).max(5),
  aspect: z.string().trim().max(100).optional(),
  positive_comment: z.string().trim().max(2000).optional(),
  improvement_comment: z.string().trim().max(2000).optional(),
  contact_permission: z.boolean().default(false),
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(200)).optional().catch(undefined),
  source_page: z.string().trim().max(300).optional(),
  website: z.string().optional(),
});

const applySchema = z.object({
  action: z.literal('apply'),
  job_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(200)),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(100).optional(),
  experience_level: z.string().trim().max(50).optional(),
  work_model_pref: z.string().trim().max(50).optional(),
  start_availability: z.string().trim().max(50).optional(),
  arabic_level: z.string().trim().max(50).optional(),
  english_level: z.string().trim().max(50).optional(),
  salary_range: z.string().trim().max(50).optional(),
  portfolio_url: z.string().trim().url().max(300).optional().catch(undefined),
  linkedin_url: z.string().trim().url().max(300).optional().catch(undefined),
  accommodations_needed: z.string().trim().max(1000).optional(),
  cover_note: z.string().trim().max(3000).optional(),
  talent_pool_consent: z.boolean().default(false),
  website: z.string().optional(),
});

const trackSchema = z.object({
  action: z.literal('track'),
  reference: z.string().trim().regex(/^CMP-\d{4}-\d{5}$/),
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
});

const bodySchema = z.discriminatedUnion('action', [
  complaintSchema, feedbackSchema, applySchema, trackSchema,
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

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  // JSON عادي، أو multipart عند إرفاق سيرة ذاتية (حقل payload + ملف cv)
  let raw: unknown;
  let cvFile: File | null = null;
  try {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData();
      raw = JSON.parse(String(fd.get('payload') ?? '{}'));
      const f = fd.get('cv');
      if (f instanceof File && f.size > 0) cvFile = f;
    } else {
      raw = await req.json();
    }
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'validation', field: parsed.error.issues[0]?.path?.[0] ?? null }),
      { status: 400, headers }
    );
  }
  const body = parsed.data;

  if (body.action === 'complaint' && !body.email && !body.phone) {
    return new Response(JSON.stringify({ error: 'validation', field: 'contact' }),
      { status: 400, headers });
  }
  if (body.action === 'apply' && !body.job_id && !body.role_id) {
    return new Response(JSON.stringify({ error: 'validation', field: 'job_or_role' }),
      { status: 400, headers });
  }

  if ('website' in body && body.website && body.website.length > 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const salt = Deno.env.get('RATE_SALT') ?? 'agma-intake';
  const digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  const callerHash = Array.from(new Uint8Array(digest)).slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_bucket: `public-${body.action}`,
    p_caller_hash: callerHash,
    p_max_per_hour: body.action === 'track' ? 20 : 5,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  if (body.action === 'complaint') {
    const { action: _a, website: _w, ...row } = body;
    const { data, error } = await supabase.from('complaints')
      .insert(row).select('public_reference').single();
    if (error) {
      console.error('complaint insert', error.code);
      return new Response(JSON.stringify({ error: 'server' }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ ok: true, reference: data.public_reference }),
      { status: 200, headers });
  }

  if (body.action === 'feedback') {
    const { action: _a, website: _w, name, email, contact_permission, ...row } = body;
    const { error } = await supabase.from('feedback_entries').insert({
      ...row,
      contact_permission,
      // تقليل بيانات: لا نخزن الهوية إلا بإذن تواصل صريح
      name: contact_permission ? name ?? null : null,
      email: contact_permission ? email ?? null : null,
    });
    if (error) {
      console.error('feedback insert', error.code);
      return new Response(JSON.stringify({ error: 'server' }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  if (body.action === 'apply') {
    const { action: _a, website: _w, ...row } = body;
    if (row.job_id) {
      const { data: job } = await supabase.from('career_jobs')
        .select('status, close_date').eq('id', row.job_id).maybeSingle();
      if (!job || job.status !== 'published'
          || (job.close_date && job.close_date < new Date().toISOString().slice(0, 10))) {
        return new Response(JSON.stringify({ error: 'job_closed' }), { status: 400, headers });
      }
    }
    // السيرة الذاتية: PDF/DOC/DOCX حتى ٥MB، باسم عشوائي في دلو خاص
    let cvPath: string | null = null;
    let cvName: string | null = null;
    if (cvFile) {
      const ALLOWED: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      };
      const ext = ALLOWED[cvFile.type];
      const nameExt = cvFile.name.toLowerCase().match(/\.(pdf|docx?)$/)?.[1];
      if (!ext || !nameExt) {
        return new Response(JSON.stringify({ error: 'cv_type' }), { status: 400, headers });
      }
      if (cvFile.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'cv_size' }), { status: 400, headers });
      }
      cvPath = `${crypto.randomUUID()}.${ext}`;
      cvName = cvFile.name.slice(0, 200);
      const { error: upErr } = await supabase.storage.from('applications')
        .upload(cvPath, cvFile, { contentType: cvFile.type });
      if (upErr) {
        console.error('cv upload', upErr.message);
        return new Response(JSON.stringify({ error: 'server' }), { status: 500, headers });
      }
    }

    const { data, error } = await supabase.from('career_applications')
      .insert({ ...row, cv_path: cvPath, cv_filename: cvName })
      .select('public_reference').single();
    if (error) {
      console.error('application insert', error.code);
      return new Response(JSON.stringify({ error: 'server' }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ ok: true, reference: data.public_reference }),
      { status: 200, headers });
  }

  // track: الحالة فقط، وبالبريد المطابق — لا تفاصيل
  const { data: c } = await supabase.from('complaints')
    .select('status, created_at, email')
    .eq('public_reference', body.reference).maybeSingle();
  if (!c || (c.email ?? '').toLowerCase() !== body.email) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
  }
  return new Response(JSON.stringify({ ok: true, status: c.status, submitted_at: c.created_at }),
    { status: 200, headers });
});

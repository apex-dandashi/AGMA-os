// فاحص المواقع — صائد العملاء (جولة التكاملات، P0 برأي المالك المعتمد):
// يستقبل رابطاً وبيانات تواصل ← يسجل Lead في المسار ← يفحص عبر
// Google PageSpeed Insights API (مجاني؛ PAGESPEED_API_KEY اختياري يرفع الحصة)
// ← يعيد الدرجات وأهم فرص التحسين بالعربية.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa', 'https://www.agma.com.sa',
  'https://staging.agma.com.sa', 'http://localhost:3000',
]);

const schema = z.object({
  url: z.string().trim().transform((v) => (v.startsWith('http') ? v : `https://${v}`))
    .pipe(z.string().url().max(300)),
  name: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).optional(),
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(200)),
  phone: z.string().trim().min(7).max(40),  // L11
  website: z.string().optional(), // honeypot
  turnstile: z.string().optional(),
});

const OPPORTUNITY_AR: Record<string, string> = {
  'render-blocking-resources': 'إزالة الموارد المعطِّلة للعرض',
  'unused-javascript': 'تقليل JavaScript غير المستخدم',
  'unused-css-rules': 'تقليل CSS غير المستخدم',
  'uses-optimized-images': 'ضغط الصور',
  'uses-webp-images': 'استخدام صيغ صور حديثة (WebP/AVIF)',
  'uses-responsive-images': 'تحجيم الصور المناسب للشاشات',
  'server-response-time': 'تسريع استجابة الخادم',
  'largest-contentful-paint': 'تحسين سرعة أكبر عنصر ظاهر (LCP)',
  'uses-text-compression': 'تفعيل ضغط النصوص',
  'meta-description': 'إضافة وصف Meta مفقود',
  'document-title': 'تصحيح عنوان الصفحة',
  'font-display': 'تحسين تحميل الخطوط',
  'redirects': 'تقليل التحويلات المتسلسلة',
  'uses-long-cache-ttl': 'تفعيل التخزين المؤقت للأصول',
};

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
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'validation', field: parsed.error.issues[0]?.path?.[0] ?? null }),
      { status: 400, headers });
  }
  const body = parsed.data;
  if (body.website) return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Turnstile عند توفر المفتاح (قانون L9 — يعمل فور إضافته في Vault)
  const tsSecret = Deno.env.get('TURNSTILE_SECRET');
  if (tsSecret) {
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: tsSecret, response: body.turnstile ?? '' }),
    }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!v.success) {
      return new Response(JSON.stringify({ error: 'turnstile' }), { status: 400, headers });
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const salt = Deno.env.get('RATE_SALT') ?? 'agma-intake';
  const digest = await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(`${salt}:${ip}`));
  const callerHash = Array.from(new Uint8Array(digest)).slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_bucket: 'website-audit', p_caller_hash: callerHash, p_max_per_hour: 3,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  // Lead أولاً — حتى لو فشل الفحص، الطلب نفسه فرصة بيع
  await supabase.from('leads').insert({
    name: body.name,
    company: body.company ?? null,
    source: 'site',
    notes: [`طلب فحص موقع: ${body.url}`, `الهاتف: ${body.phone}`,
            `البريد: ${body.email}`].join('\n'),
    tags: ['فاحص المواقع'],
  });

  // PageSpeed Insights
  const key = Deno.env.get('PAGESPEED_API_KEY');
  const psUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  psUrl.searchParams.set('url', body.url);
  psUrl.searchParams.set('strategy', 'mobile');
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    psUrl.searchParams.append('category', c);
  }
  if (key) psUrl.searchParams.set('key', key);

  try {
    const res = await fetch(psUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`ps_${res.status}`);
    const data = await res.json();
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};
    const score = (k: string) => Math.round(((cats[k]?.score ?? 0) as number) * 100);
    const scores = {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    };
    const overall = Math.round(
      (scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4);
    const opportunities = Object.entries(OPPORTUNITY_AR)
      .filter(([k]) => {
        const a = audits[k];
        return a && typeof a.score === 'number' && a.score < 0.9;
      })
      .slice(0, 5)
      .map(([, ar]) => ar);
    const lcp = audits['largest-contentful-paint']?.displayValue ?? null;

    return new Response(JSON.stringify({ ok: true, overall, scores, opportunities, lcp }),
      { status: 200, headers });
  } catch (e) {
    console.error('pagespeed', (e as Error).message);
    return new Response(JSON.stringify({ error: 'audit_failed' }), { status: 502, headers });
  }
});

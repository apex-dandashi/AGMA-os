// «حصة الذكاء» — هل تذكر محركات الذكاء علامتك حين يسأل عميلك؟
// أداة عامة بلا JWT: حد معدل (٦/ساعة)، مدخلات قصيرة، لا وصول لأي بيانات.
// نطرح ٦ أسئلة شراء بلغة عميل حقيقي في قطاع الزائر ومدينته على نموذج
// الذكاء (طبقة LLM المشتركة) ونفحص ذكر العلامة والمنافسين، ونسجّل الفحص
// في ai_visibility_checks (بلا بيانات شخصية). قياس لحظي من نموذج واحد —
// يُقال ذلك للزائر صراحة.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { LLM_SETUP_MSG, completeJSON, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';

const schema = z.object({
  brand: z.string().trim().min(2).max(80),
  sector: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(40),
  website: z.string().optional(), // honeypot (يبقى فارغاً)
});

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa', 'https://www.agma.com.sa', 'https://staging.agma.com.sa',
  'http://localhost:3000', 'http://localhost:3001', 'http://localhost:8765',
]);
function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://agma.com.sa';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

/* أسئلة شراء كما يطرحها عميل حقيقي — قوالب ثابتة تُملأ بالقطاع والمدينة */
function questions(sector: string, city: string): string[] {
  return [
    `ما أفضل ${sector} في ${city}؟`,
    `أبغى ${sector} موثوق في ${city}، بمن تنصحني؟`,
    `قارن لي أفضل ٣ خيارات لـ${sector} في ${city} مع الأسعار التقريبية`,
    `ما أكثر ${sector} تقييماً من العملاء في ${city}؟`,
    `أنا جديد في ${city} وأحتاج ${sector}، من الأسماء المعروفة؟`,
    `${sector} في ${city} يقدم خدمة سريعة ويرد على واتساب؟`,
  ];
}

/* تطبيع للمقارنة: إزالة التشكيل والألف واللام والمسافات وتوحيد الهمزات */
function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/^ال/, '').replace(/\s+ال/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/* أسماء عامة ومنصات ليست منافسين (تظهر في أجوبة النماذج كثيراً) */
const GENERIC = ['google','maps','clutch','whatsapp','snapchat','instagram','tiktok','linkedin','twitter','facebook','youtube','chatgpt','gemini','perplexity','trustpilot','yelp',
  'جوجل','خرائط','واتساب','سناب','انستقرام','تيكتوك','لينكدان','تويتر','فيسبوك','يوتيوب','وكالهاعلانيه','وكالاتاعلانيه','شركهتسويق','شركاتتسويق','وكالهتسويق','عياده','مطعم','متجر'];
function isGeneric(b: string): boolean {
  const n = norm(b);
  return n.length < 3 || GENERIC.some((g) => n === norm(g) || n.includes(norm(g)));
}

function modelLabel(): string {
  if (Deno.env.get('ANTHROPIC_API_KEY')) return 'Claude';
  if (Deno.env.get('GEMINI_API_KEY')) return 'Gemini';
  return 'نموذج مفتوح (OpenRouter)';
}

const SYSTEM = 'أنت مساعد ذكاء اصطناعي عام يجيب مستخدماً سعودياً بالعربية كما تجيب عادةً. اذكر أسماء جهات محددة حقيقية إن كنت تعرفها، ولا تخترع أسماء. أعد النتيجة بصيغة JSON فقط.';
const OUT_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'الجواب الطبيعي المختصر (≤ ١٢٠ كلمة)' },
    brands: { type: 'array', items: { type: 'string' }, description: 'أسماء الجهات/العلامات التي ذكرتها في الجواب' },
  },
  required: ['answer', 'brands'],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers });
  const { brand, sector, city, website } = parsed.data;
  if (website) return new Response(JSON.stringify({ ok: true, score: 0, total: 6, mentions: 0, results: [], competitors: [] }), { status: 200, headers });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const { data: allowed } = await supabase.rpc('check_rate_limit', { p_bucket: 'ai-visibility', p_caller_hash: hash, p_max_per_hour: 6 });
  if (allowed === false) {
    return new Response(JSON.stringify({ error: 'rate_limited', message: 'فحوصات كثيرة خلال ساعة — اطلب التقرير الكامل أو عد لاحقاً.' }), { status: 429, headers });
  }
  if (!llmConfigured()) return new Response(JSON.stringify({ error: 'not_configured', message: LLM_SETUP_MSG }), { status: 503, headers });

  const qs = questions(sector, city);
  const target = norm(brand);
  try {
    const answers = await Promise.all(qs.map((q) =>
      completeJSON<{ answer: string; brands: string[] }>(SYSTEM, q, OUT_SCHEMA, 1200)
        .catch(() => ({ answer: '', brands: [] as string[] })),
    ));
    const counts = new Map<string, number>();
    const results = qs.map((q, i) => {
      const a = answers[i];
      const brands = (a.brands ?? []).map((b) => String(b).trim()).filter((b) => b.length > 1 && !isGeneric(b)).slice(0, 8);
      const mentioned = norm(a.answer ?? '').includes(target) || brands.some((b) => norm(b).includes(target) || target.includes(norm(b)));
      for (const b of brands) { if (!norm(b).includes(target)) counts.set(b, (counts.get(b) ?? 0) + 1); }
      return { q, mentioned, brands };
    });
    const mentions = results.filter((r) => r.mentioned).length;
    const score = Math.round((mentions / qs.length) * 100);
    const competitors = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    const model = modelLabel();

    const { error } = await supabase.from('ai_visibility_checks').insert({
      brand, sector, city, questions: results, mentions, total: qs.length, score, competitors, model, caller_hash: hash,
    });
    if (error) console.error('ai_visibility_checks insert failed', error.message);

    return new Response(JSON.stringify({ ok: true, score, total: qs.length, mentions, results, competitors, model }), { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error) ?? 'تعذر القياس الآن — جرّب بعد قليل.';
    return new Response(JSON.stringify({ error: 'llm_failed', message: msg }), { status: 502, headers });
  }
});

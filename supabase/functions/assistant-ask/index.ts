// عقل المساعد (RAG): سؤال ← تضمين ← أقرب أجزاء المعرفة المعتمدة ← جواب
// يستشهد بمصادره. «غير واثق» ← يسلّم لبشري بدل التخمين (عقيدة ثابتة).
//
// الواجهات: site (عام — بحد معدل، جمهور public فقط) · portal (عميل موثق —
// public+client) · whatsapp لاحقاً. كل حوار يُسجل في assistant_logs.
//
// عامة بلا JWT (config.toml) لخدمة بوت الموقع — الحماية: حد معدل + مدخل
// واحد نصي محدود + لا وصول لأي بيانات خارج المعرفة المعتمدة (L9).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { LLM_SETUP_MSG, completeText, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';

// @ts-expect-error — Supabase.ai متاح في بيئة التشغيل
const embedder = new Supabase.ai.Session('gte-small');

const schema = z.object({
  question: z.string().trim().min(2).max(600),
  surface: z.enum(['site', 'portal']).default('site'),
  session_key: z.string().trim().max(80).optional(),
  website: z.string().optional(), // honeypot
});

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa', 'https://www.agma.com.sa', 'https://staging.agma.com.sa',
  'https://ops.agma.com.sa', 'http://localhost:3000', 'http://localhost:3001',
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

const NO_ANSWER =
  'ما عندي جواب موثوق على هذا السؤال — والأفضل أوصلك بفريق AGMA مباشرة بدل التخمين.';

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation' }), { status: 400, headers });
  }
  const { question, surface, session_key, website } = parsed.data;
  if (website) {
    // فخ الروبوتات — نتظاهر بالنجاح
    return new Response(JSON.stringify({ ok: true, answer: NO_ANSWER, confident: false }),
      { status: 200, headers });
  }

  // حد المعدل للواجهة العامة (نفس آلية النماذج العامة)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (surface === 'site') {
    const hash = Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)),
    )).map((b) => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_bucket: 'assistant', p_caller_hash: hash, p_max_per_hour: 20,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: 'rate_limited',
        message: 'أسئلة كثيرة خلال ساعة — كلمنا مباشرة من صفحة التواصل' }),
        { status: 429, headers });
    }
  }

  // هوية العميل للبوابة: جمهور أوسع + ربط السجل بمنشأته
  let clientId: string | null = null;
  let audiences = ['public'];
  if (surface === 'portal') {
    const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    try {
      const b64 = jwt.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
      const sub = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)))?.sub;
      if (sub) {
        const { data: p } = await supabase.from('profiles')
          .select('client_id, role').eq('id', sub).single();
        if (p?.role === 'client' && p.client_id) {
          clientId = p.client_id;
          audiences = ['public', 'client'];
        }
      }
    } catch { /* جلسة غير صالحة → جمهور عام فقط */ }
  }

  if (!llmConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', message: LLM_SETUP_MSG }),
      { status: 503, headers });
  }

  try {
    // ١) تضمين السؤال والبحث الدلالي
    const qEmbedding = await embedder.run(question, { mean_pool: true, normalize: true });
    const { data: matches } = await supabase.rpc('match_kb_chunks', {
      p_embedding: JSON.stringify(qEmbedding), p_count: 5, p_audiences: audiences,
    });
    const strong = (matches ?? []).filter((m: { similarity: number }) => m.similarity > 0.72);

    // ٢) لا معرفة كافية ← تسليم بشري صريح، لا تخمين
    if (strong.length === 0) {
      await supabase.from('assistant_logs').insert({
        surface, session_key: session_key ?? null, client_id: clientId,
        question, answer: null, confident: false, cited: [],
      });
      return new Response(JSON.stringify({
        ok: true, confident: false, answer: NO_ANSWER, citations: [],
      }), { status: 200, headers });
    }

    // ٣) الجواب من السياق فقط
    const context = strong
      .map((m: { title: string; content: string }, i: number) =>
        `[${i + 1}] (${m.title})\n${m.content}`)
      .join('\n\n---\n\n');
    const system = [
      'أنت مساعد AGMA (وكالة تسويق سعودية). أجب بعربية سعودية ودودة مختصرة',
      '(٢–٥ جمل) اعتماداً على المقاطع المعطاة **فقط**.',
      'قاعدة صارمة: إن لم تكفِ المقاطع للإجابة الدقيقة فأخرج الكلمة NO_ANSWER',
      'وحدها حرفياً — ممنوع الاعتذار أو الشرح أو أي كلمة أخرى معها.',
      'لا تختلق أسعاراً أو وعوداً أو مواعيد. لا تذكر كلمة «المقاطع» ولا أرقامها',
      'في جوابك إطلاقاً — تكلم كأن المعرفة معرفتك.',
    ].join('\n');
    const answer = (await completeText(system,
      `السؤال: ${question}\n\nالمقاطع:\n${context}`, 1000)).trim();

    // الحارس المزدوج: كلمة الحارس أو أي تسريب لصياغة داخلية/اعتذار = غير واثق
    const confident = !(/NO_ANSWER|المقاطع|لا تحتوي على معلومات|لا تتوفر معلومات|لا يمكنني الإجابة/.test(answer));
    const citedIds = [...new Set(strong.map((m: { kb_id: string }) => m.kb_id))];
    const citations = confident
      ? [...new Set(strong.map((m: { title: string }) => m.title))].slice(0, 3)
      : [];

    await supabase.from('assistant_logs').insert({
      surface, session_key: session_key ?? null, client_id: clientId,
      question, answer: confident ? answer : null, confident, cited: citedIds,
    });

    return new Response(JSON.stringify({
      ok: true, confident,
      answer: confident ? answer : NO_ANSWER,
      citations,
    }), { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error);
    console.error('assistant-ask', (e as Error).message);
    return new Response(JSON.stringify({
      error: 'llm', message: msg ?? 'تعذر — أعد المحاولة',
    }), { status: msg ? 422 : 500, headers });
  }
});

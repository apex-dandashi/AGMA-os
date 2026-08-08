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
  surface: z.enum(['site', 'portal', 'ops']).default('site'),
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

  // الجمهور بحسب الهوية: زائر ← عام؛ عميل موثق ← +عملاء؛ فريق ← الكل
  let clientId: string | null = null;
  let audiences = ['public'];
  if (surface === 'portal' || surface === 'ops') {
    const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    try {
      const b64 = jwt.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
      const sub = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)))?.sub;
      if (sub) {
        const { data: p } = await supabase.from('profiles')
          .select('client_id, role, active').eq('id', sub).single();
        if (surface === 'portal' && p?.role === 'client' && p.client_id) {
          clientId = p.client_id;
          audiences = ['public', 'client'];
        } else if (surface === 'ops' && p?.active && p.role !== 'client') {
          audiences = ['public', 'client', 'internal'];
        }
      }
    } catch { /* جلسة غير صالحة → جمهور عام فقط */ }
  }
  if (surface === 'ops' && audiences.length === 1) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers });
  }

  if (!llmConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', message: LLM_SETUP_MSG }),
      { status: 503, headers });
  }

  try {
    // ١) تضمين السؤال والبحث الدلالي
    const qEmbedding = await embedder.run(question, { mean_pool: true, normalize: true });
    const { data: matches } = await supabase.rpc('match_kb_hybrid', {
      p_embedding: JSON.stringify(qEmbedding), p_query: question,
      p_count: 5, p_audiences: audiences,
    });
    // أرضية منخفضة تقطع الضجيج فقط — تضمينات gte-small للعربي تعطي تشابهاً
    // متواضعاً حتى للمطابقة الحرفية، والحكم النهائي «هل المقاطع تجيب؟»
    // متروك للنموذج بقواعد الطبقات لا لعتبة جيب التمام.
    const strong = (matches ?? []).filter((m: { similarity: number }) => m.similarity > 0.45);

    // العقل من طبقتين: موثق من المعرفة إن وُجدت؛ وإلا نصيحة تسويق عامة
    // موسومة — الرفض محفوظ فقط لما يخص AGMA تحديداً وليس في المعرفة.
    const context = strong
      .map((m: { title: string; content: string }, i: number) =>
        `[${i + 1}] (${m.title})\n${m.content}`)
      .join('\n\n---\n\n');
    const system = [
      'أنت مساعد AGMA — وكالة تسويق سعودية AI-native في الرياض. عربية سعودية',
      'ودودة مختصرة (٢–٦ جمل). قواعد الطبقات:',
      '١) إن كانت المقاطع المعطاة تجيب السؤال: أجب منها والتزم بها.',
      '٢) إن كان السؤال تسويقياً/تجارياً عاماً والمقاطع لا تغطيه: أجب من خبرتك',
      '   التسويقية العامة بنصيحة عملية مفيدة، وابدأ الجواب حرفياً بالوسم',
      '   [نصيحة_عامة] ثم النصيحة.',
      '٣) إن كان السؤال عن AGMA تحديداً (أسعارها، مواعيدها، عملاؤها، وعودها)',
      '   والمقاطع لا تجيبه: أخرج NO_ANSWER وحدها حرفياً.',
      '٤) إن كان السؤال خارج التسويق والأعمال كلياً: أخرج NO_ANSWER وحدها.',
      'ممنوعات مطلقة: اختلاق أسعار أو وعود أو حقائق عن AGMA؛ ذكر كلمة',
      '«المقاطع» أو أرقامها — تكلم كأن المعرفة معرفتك.',
    ].join('\n');
    const answer = (await completeText(system,
      `السؤال: ${question}\n\nالمقاطع المتاحة:\n${context || '(لا مقاطع)'}`,
      1200)).trim();

    // الحارس: كلمة الحارس أو تسريب صياغة داخلية أو مخرجات بلا عربية إطلاقاً
    // (نماذج openrouter/free المجانية ترجع أحياناً تصنيفات أمان إنجليزية) = تسليم بشري
    const refused = /NO_ANSWER|المقاطع|المقطع|لا تحتوي على معلومات|لا تتوفر معلومات|لا يمكنني الإجابة/.test(answer)
      || !/[؀-ۿ]/.test(answer);
    const isGeneral = !refused && answer.includes('[نصيحة_عامة]');
    const cleanAnswer = answer.replace('[نصيحة_عامة]', '').trim();
    const grounded = !refused && !isGeneral && strong.length > 0;

    const citedIds = grounded
      ? [...new Set(strong.map((m: { kb_id: string }) => m.kb_id))] : [];
    const citations = grounded
      ? [...new Set(strong.map((m: { title: string }) => m.title))].slice(0, 3) : [];

    const { error: logErr } = await supabase.from('assistant_logs').insert({
      surface, session_key: session_key ?? null, client_id: clientId,
      question, answer: refused ? null : cleanAnswer,
      confident: !refused, cited: citedIds,
      meta: {
        top_sim: (matches ?? [])[0]?.similarity ?? null,
        n_strong: strong.length,
        raw_head: refused ? answer.slice(0, 120) : null,
      },
    });
    if (logErr) console.error('assistant-log', logErr.message);

    return new Response(JSON.stringify({
      ok: true,
      confident: !refused,
      general: isGeneral,
      answer: refused ? NO_ANSWER : cleanAnswer,
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

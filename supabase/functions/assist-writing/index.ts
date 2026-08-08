// مساعد الكتابة داخل المحرر (فريق فقط): يشتغل على نص المحرر أو التحديد —
// تحسين، إكمال، تلخيص، تحويل HTML، أو أي توجيه حر. يعيد النص فقط.
// المزود عبر طبقة llm.ts (OpenRouter مجاني أو Anthropic).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { LLM_SETUP_MSG, completeText, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';
import { teamCors } from '../_shared/team-cors.ts';
import { verifiedUserId } from '../_shared/auth.ts';

const schema = z.object({
  instruction: z.string().trim().min(3).max(600),
  text: z.string().max(20000).default(''),
});

Deno.serve(async (req) => {
  const headers = teamCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const userId = verifiedUserId(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', userId).single();
  if (!profile || profile.role === 'client') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation' }), { status: 400, headers });
  }
  if (!llmConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', message: LLM_SETUP_MSG }),
      { status: 503, headers });
  }
  const { instruction, text } = parsed.data;

  const system = [
    'أنت محرر نصوص أول في وكالة AGMA السعودية، تساعد الكاتب داخل محرر مقالات',
    'مدونة agma.com.sa. تنفذ توجيهه على النص المعطى وتعيد **النتيجة فقط** —',
    'بلا مقدمات ولا شروح ولا أسوار كود.',
    'قواعد: عربية سعودية معاصرة؛ حافظ على صيغة النص (ماركداون يبقى ماركداون،',
    'HTML يبقى HTML صالحاً)؛ لا تختلق حقائق أو أرقاماً — استخدم [قوساً مربعاً]',
    'لما يحتاج تأكيداً؛ إن طُلب HTML فاجعله نظيفاً بأنماط مضمنة بسيطة.',
  ].join('\n');

  const prompt = text.trim()
    ? `التوجيه: ${instruction}\n\nالنص:\n${text}`
    : `التوجيه: ${instruction}\n\n(لا نص بعد — أنشئ من الصفر بحسب التوجيه)`;

  try {
    const out = await completeText(system, prompt, 4000);
    return new Response(JSON.stringify({ ok: true, text: out }), { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error);
    console.error('assist-writing', (e as Error).message);
    return new Response(JSON.stringify({
      error: 'llm', message: msg ?? 'خطأ غير متوقع — أعد المحاولة',
    }), { status: msg ? 422 : 500, headers });
  }
});

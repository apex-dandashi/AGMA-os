// طبقة التوليد النصي الموحدة — مزودان بالأولوية:
//   ١) ANTHROPIC_API_KEY  → Claude (أعلى جودة عربية + مخرجات مهيكلة مضمونة)
//   ٢) OPENROUTER_API_KEY → OpenRouter (نماذج مجانية — OPENROUTER_MODEL
//      اختياري، الافتراضي 'openrouter/free' يوجه تلقائياً لأفضل مجاني متاح)
//
// أضف أياً منهما في أسرار الدوال ويعمل التوليد فوراً. عند وجود الاثنين
// يُستخدم Claude. حدود المجاني (~٥٠ طلباً/يوم بلا رصيد) تكفي حجمنا اليومي.
import Anthropic from 'npm:@anthropic-ai/sdk';

export function llmConfigured(): boolean {
  return Boolean(Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('OPENROUTER_API_KEY'));
}

export const LLM_SETUP_MSG =
  'التوليد غير مهيأ بعد — أضف OPENROUTER_API_KEY (نماذج مجانية) أو ANTHROPIC_API_KEY في أسرار الدوال ليعمل فوراً';

async function openrouterChat(
  system: string,
  prompt: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  const key = Deno.env.get('OPENROUTER_API_KEY')!;
  const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://agma.com.sa',
      'X-Title': 'AGMA OS',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      // بعض النماذج المجانية تتجاهلها — التعقيم الدفاعي أدناه يغطي ذلك
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    console.error('openrouter', res.status, body);
    if (res.status === 429) throw new Error('rate_limited');
    throw new Error('provider');
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new Error('empty');
  return text;
}

/** نص حر (مثل محتوى العملاء). */
export async function completeText(
  system: string,
  prompt: string,
  maxTokens = 8000,
): Promise<string> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const msg = await anthropic.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: prompt }],
    } as Parameters<typeof anthropic.beta.messages.create>[0]);
    if (msg.stop_reason === 'refusal') throw new Error('refused');
    const text = msg.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text).join('\n').trim();
    if (!text) throw new Error('empty');
    return text;
  }
  return (await openrouterChat(system, prompt, maxTokens, false)).trim();
}

/** استخراج JSON من رد نموذج قد يلفه بأسوار كود أو كلام زائد. */
function extractJSON<T>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no_json');
  return JSON.parse(s.slice(start, end + 1)) as T;
}

/**
 * مخرجات مهيكلة: Claude بمخطط مضمون من الواجهة؛ OpenRouter بتعليمات JSON
 * صارمة + تعقيم دفاعي + محاولة ثانية عند فشل التحليل.
 */
export async function completeJSON<T>(
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
  maxTokens = 16000,
): Promise<T> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const msg = await anthropic.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    } as Parameters<typeof anthropic.beta.messages.create>[0]);
    if (msg.stop_reason === 'refusal') throw new Error('refused');
    const text = msg.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text).join('');
    return JSON.parse(text) as T;
  }

  const jsonInstr = [
    system,
    '',
    'أجب بكائن JSON واحد صالح فقط — بلا أي نص قبله أو بعده وبلا أسوار كود.',
    `المخطط المطلوب حرفياً: ${JSON.stringify(schema)}`,
  ].join('\n');
  const first = await openrouterChat(jsonInstr, prompt, maxTokens, true);
  try {
    return extractJSON<T>(first);
  } catch {
    // محاولة إصلاح واحدة — نعيد للنموذج رده ليصححه JSON صالحاً
    const fixed = await openrouterChat(
      'أصلح النص التالي ليكون كائن JSON واحداً صالحاً مطابقاً للمخطط، وأعد الـ JSON فقط.',
      `المخطط: ${JSON.stringify(schema)}\n\nالنص:\n${first.slice(0, 12000)}`,
      maxTokens,
      true,
    );
    return extractJSON<T>(fixed);
  }
}

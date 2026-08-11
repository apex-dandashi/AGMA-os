// طبقة التوليد النصي الموحدة — ثلاثة مزودين بالأولوية:
//   ١) ANTHROPIC_API_KEY  → Claude (أعلى جودة عربية + مخرجات مهيكلة مضمونة)
//   ٢) GEMINI_API_KEY     → Gemini (سخي مجاناً وجيد عربياً — GEMINI_MODEL
//      اختياري، الافتراضي gemini-2.5-flash) — طلب المالك لدقائق الاجتماعات
//   ٣) OPENROUTER_API_KEY → OpenRouter (نماذج مجانية متقلبة الجودة)
//
// أضف أياً منها في أسرار الدوال ويعمل التوليد فوراً؛ وعند التعدد الأعلى يفوز،
// وتعثر Gemini يسقط تلقائياً على OpenRouter إن وُجد.
import Anthropic from 'npm:@anthropic-ai/sdk';

export function llmConfigured(): boolean {
  return Boolean(Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('GEMINI_API_KEY')
    || Deno.env.get('OPENROUTER_API_KEY'));
}

export const LLM_SETUP_MSG =
  'التوليد غير مهيأ بعد — أضف GEMINI_API_KEY أو OPENROUTER_API_KEY (مجانية) أو ANTHROPIC_API_KEY في أسرار الدوال ليعمل فوراً';

async function openrouterOnce(
  system: string,
  prompt: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const key = Deno.env.get('OPENROUTER_API_KEY')!;
  const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free';
  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(110_000),
    });
  } catch (e) {
    if ((e as Error).name === 'TimeoutError' || (e as Error).name === 'AbortError') {
      throw new Error('timeout');
    }
    throw e;
  }
  const bodyText = await res.text();
  if (!res.ok) {
    console.error('openrouter', res.status, bodyText.slice(0, 400));
    return { ok: false, status: res.status, body: bodyText.slice(0, 400) };
  }
  // OpenRouter قد يعيد 200 وداخله خطأ
  let data: Record<string, unknown>;
  try { data = JSON.parse(bodyText); } catch {
    return { ok: false, status: 502, body: bodyText.slice(0, 200) };
  }
  const errObj = data?.error as { message?: string; code?: number } | undefined;
  if (errObj) {
    console.error('openrouter inline error', JSON.stringify(errObj).slice(0, 400));
    return { ok: false, status: errObj.code ?? 502, body: errObj.message ?? 'unknown' };
  }
  const text = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) return { ok: false, status: 502, body: 'empty completion' };
  return { ok: true, text };
}

function throwProviderError(status: number, body: string): never {
  const b = body.toLowerCase();
  if (status === 429 || b.includes('rate limit')) throw new Error('rate_limited');
  if (b.includes('data policy') || b.includes('privacy')) throw new Error('data_policy');
  throw new Error(`provider:${status}:${body.slice(0, 160)}`);
}

async function geminiOnce(
  system: string,
  prompt: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const key = Deno.env.get('GEMINI_API_KEY')!;
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        }),
        signal: AbortSignal.timeout(110_000),
      },
    );
  } catch (e) {
    if ((e as Error).name === 'TimeoutError' || (e as Error).name === 'AbortError') {
      throw new Error('timeout');
    }
    throw e;
  }
  const bodyText = await res.text();
  if (!res.ok) {
    console.error('gemini', res.status, bodyText.slice(0, 400));
    return { ok: false, status: res.status, body: bodyText.slice(0, 400) };
  }
  let data: Record<string, unknown>;
  try { data = JSON.parse(bodyText); } catch {
    return { ok: false, status: 502, body: bodyText.slice(0, 200) };
  }
  const text = ((data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }).candidates?.[0]?.content?.parts ?? [])
    .map((pp) => pp.text ?? '').join('');
  if (!text.trim()) return { ok: false, status: 502, body: 'empty completion' };
  return { ok: true, text };
}

async function openrouterChat(
  system: string,
  prompt: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  let r = await openrouterOnce(system, prompt, maxTokens, jsonMode);
  // بعض المجانية ترفض response_format — أعد المحاولة بدونه
  if (!r.ok && jsonMode && (r.status === 400 || r.status === 404)) {
    r = await openrouterOnce(system, prompt, maxTokens, false);
  }
  if (!r.ok) throwProviderError(r.status, r.body);
  return r.text;
}

/** المزود المجاني المتاح: Gemini أولاً وتعثره يسقط على OpenRouter إن وُجد. */
async function freeChat(
  system: string,
  prompt: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  if (Deno.env.get('GEMINI_API_KEY')) {
    const r = await geminiOnce(system, prompt, maxTokens, jsonMode);
    if (r.ok) return r.text;
    if (Deno.env.get('OPENROUTER_API_KEY')) {
      return openrouterChat(system, prompt, maxTokens, jsonMode);
    }
    throwProviderError(r.status, r.body);
  }
  return openrouterChat(system, prompt, maxTokens, jsonMode);
}

/** رسالة عربية مفهومة من أخطاء المزود — تستخدمها الدوال في ردودها. */
export function llmErrorMessage(e: Error): string | null {
  const m = e.message;
  if (m === 'rate_limited') {
    return 'وصلنا حد النماذج المجانية اليومي — حاول لاحقاً أو أضف رصيداً/مفتاح Anthropic';
  }
  if (m === 'data_policy') {
    return 'إعداد الخصوصية في OpenRouter يمنع النماذج المجانية — فعّل «Free model publication» من Settings ← Privacy هناك';
  }
  if (m.startsWith('provider:')) {
    const [, status, detail] = m.split(':');
    return `مزود التوليد رفض الطلب (${status}): ${detail}`;
  }
  if (m === 'timeout') {
    return 'النموذج المجاني تجاوز المهلة — أعد المحاولة (غالباً ينجح ثانيةً)، أو ثبّت نموذجاً أسرع عبر OPENROUTER_MODEL';
  }
  if (m === 'bad_json') {
    return 'النموذج المجاني أعاد نصاً غير صالح — جرّب مجدداً، أو ثبّت نموذجاً أقوى عبر OPENROUTER_MODEL (مثل deepseek/deepseek-chat-v3-0324:free)';
  }
  if (m === 'refused') return 'تعذر توليد هذا المحتوى — عدّل الطلب وحاول مجدداً';
  return null;
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
  return (await freeChat(system, prompt, maxTokens, false)).trim();
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
  const first = await freeChat(jsonInstr, prompt, maxTokens, true);
  try {
    return extractJSON<T>(first);
  } catch {
    // محاولة إصلاح واحدة — نعيد للنموذج رده ليصححه JSON صالحاً
    const fixed = await freeChat(
      'أصلح النص التالي ليكون كائن JSON واحداً صالحاً مطابقاً للمخطط، وأعد الـ JSON فقط.',
      `المخطط: ${JSON.stringify(schema)}\n\nالنص:\n${first.slice(0, 12000)}`,
      maxTokens,
      true,
    );
    try {
      return extractJSON<T>(fixed);
    } catch {
      throw new Error('bad_json');
    }
  }
}

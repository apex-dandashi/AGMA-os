// دقائق الاجتماع بالذكاء (فريق فقط): نص اجتماع خام ← ملخص + قرارات + بنود
// عمل تُدرج مهام متابعة تلقائياً. يمر بطبقة LLM الموحدة (Claude/Gemini/OpenRouter).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { teamCors } from '../_shared/team-cors.ts';
import { verifiedUserId } from '../_shared/auth.ts';
import { LLM_SETUP_MSG, completeJSON, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';

const schema = z.object({
  meeting_id: z.string().uuid().optional(),
  transcript: z.string().trim().min(50, 'النص أقصر من أن يُستخرج منه شيء').max(60_000),
  title: z.string().trim().max(200).optional(),
});

const OUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary_md', 'decisions', 'action_items'],
  properties: {
    summary_md: { type: 'string', description: 'ملخص منظم بالعربية بعناوين ##' },
    decisions: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    action_items: {
      type: 'array', maxItems: 25,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string' },
          owner_hint: { type: 'string', description: 'اسم المكلف كما ورد إن ذُكر' },
        },
      },
    },
  },
} as const;

type Minutes = {
  summary_md: string;
  decisions: string[];
  action_items: { title: string; owner_hint?: string }[];
};

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
    .select('role, active').eq('id', userId).single();
  if (!profile?.active || profile.role === 'client') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers });
  }
  if (!llmConfigured()) {
    return new Response(JSON.stringify({ error: 'not_configured', message: LLM_SETUP_MSG }),
      { status: 503, headers });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: 'validation', message: parsed.error.issues[0]?.message,
    }), { status: 400, headers });
  }
  const { meeting_id, transcript, title } = parsed.data;

  try {
    const minutes = await completeJSON<Minutes>(
      [
        'أنت أمين سر اجتماعات محترف في وكالة تسويق سعودية. من نص الاجتماع',
        'الخام أخرج: ملخصاً منظماً بالعربية (summary_md بعناوين ##)،',
        'قائمة القرارات المتخذة نصاً قاطعاً، وبنود العمل القابلة للتنفيذ',
        '(action_items) بصيغة أمر واضح مع اسم المكلف إن ذُكر في النص.',
        'التزم بما قيل فعلاً — لا تخترع قرارات ولا مهاماً لم تُذكر.',
      ].join('\n'),
      `${title ? `عنوان الاجتماع: ${title}\n\n` : ''}نص الاجتماع:\n${transcript}`,
      OUT_SCHEMA as unknown as Record<string, unknown>,
      6000,
    );

    // خزّن المحضر على الاجتماع (موجود أو جديد) وحوّل البنود مهام متابعة
    let mid = meeting_id ?? null;
    if (mid) {
      await supabase.from('meetings').update({
        transcript, minutes_md: minutes.summary_md,
        decisions: minutes.decisions, title: title ?? null,
      }).eq('id', mid);
    } else {
      const { data: m } = await supabase.from('meetings').insert({
        kind: 'l10', title: title ?? 'اجتماع', transcript,
        minutes_md: minutes.summary_md, decisions: minutes.decisions,
      }).select('id').single();
      mid = m?.id ?? null;
    }
    if (mid && minutes.action_items.length) {
      await supabase.from('meeting_todos').insert(
        minutes.action_items.map((a) => ({
          meeting_id: mid,
          title: a.owner_hint ? `${a.title} (${a.owner_hint})` : a.title,
        })),
      );
    }

    return new Response(JSON.stringify({ ok: true, meeting_id: mid, minutes }),
      { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error);
    console.error('meeting-minutes', (e as Error).message);
    return new Response(JSON.stringify({
      error: 'llm', message: msg ?? 'تعذر الاستخراج — أعد المحاولة',
    }), { status: msg ? 422 : 500, headers });
  }
});

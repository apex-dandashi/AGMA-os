// توليد مقال عند الطلب (فريق فقط): من إشارات مختارة أو موضوع حر.
// المسودة تدخل «للمراجعة» — النشر قرار بشري دائماً (المحفّز يفرضها).
// السر: ANTHROPIC_API_KEY في أسرار الدوال.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { draftArticle, type Signal } from '../_shared/article.ts';
import { LLM_SETUP_MSG, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';
import { teamCors } from '../_shared/team-cors.ts';

const schema = z.object({
  signal_ids: z.array(z.string().uuid()).max(12).optional(),
  topic: z.string().trim().min(5).max(300).optional(),
}).refine((v) => (v.signal_ids?.length ?? 0) > 0 || v.topic, {
  message: 'signals_or_topic_required',
});

Deno.serve(async (req) => {
  const headers = teamCors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: req.headers.get('authorization') ?? '' } } },
  );
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }
  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', userData.user.id).single();
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
  const { signal_ids, topic } = parsed.data;

  if (!llmConfigured()) {
    return new Response(JSON.stringify({
      error: 'not_configured', message: LLM_SETUP_MSG,
    }), { status: 503, headers });
  }

  let signals: (Signal & { id: string })[] = [];
  if (signal_ids?.length) {
    const { data } = await supabase.from('content_signals')
      .select('id, title, url, summary').in('id', signal_ids);
    signals = (data ?? []) as (Signal & { id: string })[];
  }

  try {
    const draft = await draftArticle(signals, topic);
    let slug = draft.slug;
    let insert = await supabase.from('articles').insert({
      slug, title: draft.title, excerpt: draft.excerpt, body_md: draft.body_md,
      tags: draft.tags, sources: signals.map((s) => ({ title: s.title, url: s.url })),
      status: 'review', ai_generated: true,
      seo_title: draft.seo_title, seo_description: draft.seo_description,
      created_by: userData.user.id,
    }).select('id').single();
    if (insert.error?.code === '23505') {
      slug = `${draft.slug}-${Date.now().toString(36)}`;
      insert = await supabase.from('articles').insert({
        slug, title: draft.title, excerpt: draft.excerpt, body_md: draft.body_md,
        tags: draft.tags, sources: signals.map((s) => ({ title: s.title, url: s.url })),
        status: 'review', ai_generated: true,
        seo_title: draft.seo_title, seo_description: draft.seo_description,
        created_by: userData.user.id,
      }).select('id').single();
    }
    if (insert.error) throw new Error(insert.error.message);
    if (signals.length) {
      await supabase.from('content_signals')
        .update({ used_in_article: insert.data.id })
        .in('id', signals.map((s) => s.id));
    }
    return new Response(JSON.stringify({ ok: true, article_id: insert.data.id }),
      { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error);
    console.error('generate-article', (e as Error).message);
    if (msg) {
      return new Response(JSON.stringify({ error: 'llm', message: msg }),
        { status: 422, headers });
    }
    return new Response(JSON.stringify({ error: 'server',
      message: 'خطأ غير متوقع في التوليد — أعد المحاولة' }), { status: 500, headers });
  }
});

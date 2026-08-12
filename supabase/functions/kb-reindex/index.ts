// فهرسة قاعدة المعرفة (فريق فقط): يقسّم كل مقال منشور غير مفهرس إلى أجزاء
// ويولّد تضميناتها بنموذج gte-small المدمج في بيئة Supabase — مجاني بلا مفاتيح.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { teamCors } from '../_shared/team-cors.ts';
import { verifiedUserId } from '../_shared/auth.ts';

// @ts-expect-error — Supabase.ai متاح في بيئة التشغيل وليس في الأنواع
const session = new Supabase.ai.Session('gte-small');

function chunkText(title: string, body: string): string[] {
  // أجزاء بحدود الفقرات/العناوين ~٨٠٠ حرف، وكل جزء يحمل عنوان مقاله للسياق
  const parts = body.split(/\n(?=## )|\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + '\n\n' + p).length > 800 && cur) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + '\n\n' + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.map((c) => `${title}\n${c}`);
}

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

  // مقال واحد لكل استدعاء — التضمين يستهلك حصة معالج Edge، والمقالات الطويلة
  // (أدلة الخدمات) بمقاطعها الست تكفي وحدها؛ الواجهة تكرر حتى remaining = 0
  // (درس WORKER_RESOURCE_LIMIT: ١٤ دفعة واحدة ثم ٣ طويلة)
  const BATCH = 1;
  const { data: dirty, count } = await supabase.from('kb_articles')
    .select('id, title, body_md', { count: 'exact' })
    .eq('published', true).is('indexed_at', null).limit(BATCH);
  let indexed = 0;
  for (const a of dirty ?? []) {
    const chunks = chunkText(a.title, a.body_md);
    await supabase.from('kb_chunks').delete().eq('kb_id', a.id);
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await session.run(chunks[i], { mean_pool: true, normalize: true });
      await supabase.from('kb_chunks').insert({
        kb_id: a.id, seq: i, content: chunks[i],
        embedding: JSON.stringify(embedding),
      });
    }
    await supabase.from('kb_articles')
      .update({ indexed_at: new Date().toISOString() }).eq('id', a.id);
    indexed++;
  }
  // نظّف أجزاء المقالات التي أُلغي نشرها
  const { data: unpub } = await supabase.from('kb_articles')
    .select('id').eq('published', false);
  if (unpub?.length) {
    await supabase.from('kb_chunks').delete()
      .in('kb_id', unpub.map((a) => a.id));
  }

  return new Response(JSON.stringify({
    ok: true, indexed, remaining: Math.max(0, (count ?? 0) - indexed),
  }), { status: 200, headers });
});

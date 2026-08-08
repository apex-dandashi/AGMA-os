// الجمع اليومي لمحرك المقالات: cron (pg_net) يستدعيها كل صباح.
// ١) يجلب عناوين اليوم من مصادر RSS المسجلة ← content_signals (بلا تكرار).
// ٢) يقلّم الإشارات القديمة.
// ٣) إن وُجد ANTHROPIC_API_KEY ولم تُكتب مسودة اليوم: يولّد مقال اليوم من أقوى
//    الإشارات ويضعه «للمراجعة» — البشر ينشرون، الآلة لا تنشر (عقيدة ثابتة،
//    والقاعدة تفرضها بمحفّز).
//
// عامة بلا JWT (config.toml) لأن cron يستدعيها بلا توثيق — لا تقبل أي مدخلات
// مؤثرة: تتجاهل الجسم كلياً وتعمل على المسجل في القاعدة فقط (قانون L9).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { XMLParser } from 'npm:fast-xml-parser@4';
import { draftArticle, type Signal } from '../_shared/article.ts';
import { llmConfigured } from '../_shared/llm.ts';

type FeedItem = { title?: unknown; link?: unknown; description?: unknown; pubDate?: unknown };

function text(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && '#text' in v) return String((v as Record<string, unknown>)['#text']).trim();
  return '';
}

function link(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return link(v[0]);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return String(o['@_href'] ?? o['#text'] ?? '').trim();
  }
  return '';
}

Deno.serve(async (_req) => {
  const headers = { 'content-type': 'application/json' };
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: sources } = await supabase.from('content_sources')
    .select('id, feed_url').eq('active', true);

  const parser = new XMLParser({ ignoreAttributes: false });
  let collected = 0;

  for (const src of sources ?? []) {
    try {
      const res = await fetch(src.feed_url, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'user-agent': 'AGMA-ContentBot/1.0 (+https://agma.com.sa)' },
      });
      if (!res.ok) continue;
      const xml = parser.parse(await res.text());
      // RSS 2.0 أو Atom
      const rawItems: FeedItem[] = xml?.rss?.channel?.item ?? xml?.feed?.entry ?? [];
      const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 10);
      for (const it of items) {
        const title = text(it.title);
        const url = link(it.link);
        if (!title || !url.startsWith('http')) continue;
        const summary = text(it.description).replace(/<[^>]+>/g, '').slice(0, 500) || null;
        const pub = text(it.pubDate) || null;
        const { error } = await supabase.from('content_signals').insert({
          source_id: src.id, title: title.slice(0, 300), url, summary,
          published_at: pub ? new Date(pub).toISOString() : null,
        });
        if (!error) collected++;
      }
      await supabase.from('content_sources')
        .update({ last_collected_at: new Date().toISOString() }).eq('id', src.id);
    } catch (e) {
      console.error('feed', src.feed_url, (e as Error).message);
    }
  }

  // تقليم: أبقِ آخر ٥٠٠ إشارة غير مستخدمة
  await supabase.rpc('prune_content_signals').then(() => null, () => null);

  // مسودة اليوم الآلية — مرة واحدة يومياً وفقط إن كان مزود التوليد مهيأً
  let drafted: string | null = null;
  if (llmConfigured()) {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase.from('articles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    if ((count ?? 0) === 0) {
      const { data: fresh } = await supabase.from('content_signals')
        .select('id, title, url, summary')
        .is('used_in_article', null)
        .order('collected_at', { ascending: false }).limit(8);
      if (fresh && fresh.length >= 3) {
        try {
          const draft = await draftArticle(fresh as Signal[]);
          const { data: art, error } = await supabase.from('articles').insert({
            slug: draft.slug, title: draft.title, excerpt: draft.excerpt,
            body_md: draft.body_md, tags: draft.tags,
            sources: fresh.map((s) => ({ title: s.title, url: s.url })),
            status: 'review', ai_generated: true,
            seo_title: draft.seo_title, seo_description: draft.seo_description,
          }).select('id').single();
          if (error && error.code === '23505') {
            // تعارض رابط — أعد المحاولة بلاحقة تاريخ
            const alt = `${draft.slug}-${new Date().toISOString().slice(0, 10)}`;
            const { data: art2 } = await supabase.from('articles').insert({
              slug: alt, title: draft.title, excerpt: draft.excerpt,
              body_md: draft.body_md, tags: draft.tags,
              sources: fresh.map((s) => ({ title: s.title, url: s.url })),
              status: 'review', ai_generated: true,
              seo_title: draft.seo_title, seo_description: draft.seo_description,
            }).select('id').single();
            drafted = art2?.id ?? null;
          } else if (error) {
            throw new Error(error.message);
          } else {
            drafted = art?.id ?? null;
          }
          if (drafted) {
            await supabase.from('content_signals')
              .update({ used_in_article: drafted })
              .in('id', fresh.map((s) => s.id));
          }
        } catch (e) {
          console.error('auto-draft', (e as Error).message);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, collected, drafted }), { headers });
});

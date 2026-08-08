'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { marked } from 'marked';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/publicConfig';
import type { BlogArticle } from '../../../lib/blog';

export default function ReadClient() {
  const slug = useSearchParams().get('slug') ?? '';
  const [article, setArticle] = useState<BlogArticle | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) { setArticle(null); return; }
    fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published&slug=eq.${encodeURIComponent(slug)}` +
      '&select=slug,title,excerpt,body_md,tags,sources,seo_title,seo_description,published_at&limit=1',
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: BlogArticle[]) => setArticle(rows[0] ?? null))
      .catch(() => setArticle(null));
  }, [slug]);

  if (article === undefined) {
    return <main dir="rtl" className="mx-auto max-w-3xl px-4 py-16 text-gray-medium">جارٍ التحميل…</main>;
  }
  if (article === null) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-gray-light">المقال غير موجود.</p>
        <Link href="/blog/" className="text-pulse-orange hover:underline">← عودة للمدونة</Link>
      </main>
    );
  }

  const html = marked.parse(article.body_md ?? '', { async: false }) as string;

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-16">
      <nav className="mb-6 text-xs text-gray-medium">
        <Link href="/blog/" className="hover:text-pulse-orange">← المدونة</Link>
      </nav>
      <article>
        <h1 className="mb-3 text-3xl font-black leading-snug text-snow">{article.title}</h1>
        {article.published_at && (
          <time dateTime={article.published_at} className="text-xs text-gray-medium">
            {new Date(article.published_at).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
        )}
        {article.excerpt && (
          <p className="mt-4 border-s-2 border-pulse-orange ps-4 text-base leading-relaxed text-gray-light">
            {article.excerpt}
          </p>
        )}
        <div
          className="mt-8 space-y-4 text-[15px] leading-8 text-gray-light [&_a]:text-pulse-orange [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-snow [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-snow [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-snow"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {article.sources.length > 0 && (
          <section className="mt-10 rounded-lg border border-white/10 p-4">
            <h2 className="mb-2 text-sm font-bold text-snow">المصادر</h2>
            <ul className="space-y-1 text-xs">
              {article.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer nofollow"
                    className="text-pulse-orange hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}

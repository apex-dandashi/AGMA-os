'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/publicConfig';

type Fresh = { slug: string; title: string; excerpt: string | null; published_at: string | null };

/**
 * المنشور بعد آخر بناء ثابت: يُجلب في المتصفح ويُعرض فوراً بروابط القارئ
 * الفوري، وفي البناء اليومي التالي يتحول صفحة ثابتة مفهرسة.
 */
export default function FreshArticles({ bakedSlugs }: { bakedSlugs: string[] }) {
  const [fresh, setFresh] = useState<Fresh[]>([]);

  useEffect(() => {
    const baked = new Set(bakedSlugs);
    fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published` +
      '&select=slug,title,excerpt,published_at&order=published_at.desc&limit=10',
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Fresh[]) => setFresh(rows.filter((r) => !baked.has(r.slug))))
      .catch(() => null);
  }, [bakedSlugs]);

  if (fresh.length === 0) return null;

  return (
    <ul className="mb-8 space-y-6 border-b border-white/10 pb-8">
      {fresh.map((a) => (
        <li key={a.slug}>
          <article>
            <span className="me-2 rounded-full bg-pulse-orange/15 px-2 py-0.5 text-[11px] font-bold text-pulse-orange">
              جديد
            </span>
            <Link href={`/blog/read/?slug=${encodeURIComponent(a.slug)}`}
              className="text-xl font-bold text-snow transition-colors hover:text-pulse-orange">
              {a.title}
            </Link>
            {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-gray-light">{a.excerpt}</p>}
          </article>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/publicConfig';

/**
 * مركز المساعدة العام: قاعدة معرفة AGMA المنشورة للجمهور — تصفح بالتصنيف
 * وبحث فوري. المساعد الذكي (فقاعة الموقع) متاح من نفس الصفحة لأي سؤال أعمق.
 */

type KbArticle = { id: string; title: string; category: string; body_md: string };

export default function HelpClient() {
  const [articles, setArticles] = useState<KbArticle[] | undefined>(undefined);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `${SUPABASE_URL}/rest/v1/kb_articles?published=eq.true&audience=eq.public` +
      '&select=id,title,category,body_md&order=category,title',
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: KbArticle[]) => setArticles(rows))
      .catch(() => setArticles([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return articles ?? [];
    return (articles ?? []).filter((a) =>
      a.title.includes(needle) || a.body_md.includes(needle) || a.category.includes(needle));
  }, [articles, q]);

  const byCategory = useMemo(() => {
    const map = new Map<string, KbArticle[]>();
    for (const a of filtered) map.set(a.category, [...(map.get(a.category) ?? []), a]);
    return [...map.entries()];
  }, [filtered]);

  return (
    <main data-silk-mood="silence" className="min-h-screen relative">
      <Header />
      <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-20 pt-32 lg:pt-40">
        <h1 className="text-3xl font-black text-snow">مركز المساعدة</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-light">
          أجوبة مباشرة عن التسويق الرقمي وطريقة عملنا — ابحث عن موضوعك، أو اسأل
          مساعد AGMA من الفقاعة أسفل الشاشة لأي سؤال ما لقيته هنا.
        </p>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث… (مثال: ميزانية، سيو، إعلانات)"
          aria-label="بحث في مركز المساعدة"
          className="mt-8 w-full rounded-lg border border-white/15 bg-void/60 px-4 py-3 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none"
        />

        {articles === undefined ? (
          <p className="mt-8 text-gray-medium">جارٍ التحميل…</p>
        ) : byCategory.length === 0 ? (
          <p className="mt-8 text-gray-light">
            لا نتائج لهذا البحث — جرب كلمة أقصر أو اسأل المساعد مباشرة.
          </p>
        ) : byCategory.map(([cat, arts]) => (
          <section key={cat} className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-pulse-orange">{cat}</h2>
            <div className="space-y-3">
              {arts.map((a) => {
                const open = openId === a.id;
                return (
                  <div key={a.id} className="overflow-hidden rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : a.id)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm font-medium text-snow hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
                    >
                      {a.title}
                      <span className="text-gray-medium" aria-hidden>{open ? '−' : '+'}</span>
                    </button>
                    {open && (
                      <div
                        className="border-t border-white/10 px-4 py-4 text-[15px] leading-8 text-gray-light [&_a]:text-pulse-orange [&_a]:underline [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-snow [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-snow [&_li]:ms-5 [&_li]:list-disc [&_p]:mt-3 [&_strong]:text-snow"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(a.body_md, { async: false }) as string,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <Footer />
    </main>
  );
}

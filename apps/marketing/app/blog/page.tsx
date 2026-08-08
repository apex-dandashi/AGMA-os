import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchPublishedArticles } from '../../lib/blog';
import FreshArticles from './FreshArticles';

export const metadata: Metadata = {
  title: 'آخر الأخبار — التسويق والذكاء الاصطناعي في السعودية | AGMA',
  description:
    'مقالات يومية من وكالة AGMA: آخر أخبار السيو والتسويق الرقمي والذكاء الاصطناعي، مترجمة لقرارات عملية لأصحاب الأعمال في السعودية والخليج.',
  alternates: { canonical: 'https://agma.com.sa/blog/' },
};

export default async function BlogIndex() {
  const articles = await fetchPublishedArticles();
  const bakedSlugs = articles.map((a) => a.slug);

  return (
    <main className="min-h-screen relative bg-pure-ink">
      <Header />
      <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-20 pt-32 lg:pt-40">
      <h1 className="mb-2 text-3xl font-black text-snow">آخر الأخبار</h1>
      <p className="mb-10 text-gray-light">
        أفكار وأخبار مجالنا — سيو، تسويق رقمي، ذكاء اصطناعي — مترجمة لقرارات
        عملية لعملك في السعودية.
      </p>

      {/* أحدث المقالات المنشورة بعد آخر بناء (تُجلب في المتصفح) */}
      <FreshArticles bakedSlugs={bakedSlugs} />

      {articles.length === 0 ? (
        <p className="text-gray-medium">المقالات الأولى في الطريق — عد غداً.</p>
      ) : (
        <ul className="space-y-8">
          {articles.map((a) => (
            <li key={a.slug}>
              <article>
                <Link href={`/blog/${a.slug}/`}
                  className="text-xl font-bold text-snow transition-colors hover:text-pulse-orange">
                  {a.title}
                </Link>
                {a.published_at && (
                  <time dateTime={a.published_at} className="ms-3 text-xs text-gray-medium">
                    {new Date(a.published_at).toLocaleDateString('ar-SA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </time>
                )}
                {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-gray-light">{a.excerpt}</p>}
                {a.tags.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-2">
                    {a.tags.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-light">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
      </div>
      <Footer />
    </main>
  );
}

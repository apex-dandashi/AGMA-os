import type { Metadata } from 'next';
import Link from 'next/link';
import { marked } from 'marked';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchArticle, fetchPublishedArticles } from '../../../lib/blog';

/**
 * صفحة المقال الثابتة (SEO/GEO): HTML كامل مخبوز وقت البناء + Article JSON-LD
 * + مصادر مستشهد بها. المقالات المنشورة بعد آخر بناء تُقرأ من /blog/read
 * حتى يخبزها البناء اليومي التالي.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = await fetchPublishedArticles();
  // حارس البناء: لو تعذر الجلب لا ينكسر التصدير — المقال الافتتاحي مزروع دائماً
  if (articles.length === 0) return [{ slug: 'welcome-to-agma-blog' }];
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchArticle(slug);
  if (!a) return {};
  return {
    title: a.seo_title ?? a.title,
    description: a.seo_description ?? a.excerpt ?? undefined,
    alternates: { canonical: `https://agma.com.sa/blog/${a.slug}/` },
    openGraph: {
      title: a.seo_title ?? a.title,
      description: a.seo_description ?? a.excerpt ?? undefined,
      type: 'article',
      publishedTime: a.published_at ?? undefined,
      url: `https://agma.com.sa/blog/${a.slug}/`,
      siteName: 'AGMA',
    },
  };
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const a = await fetchArticle(slug);
  if (!a) {
    // حارس البناء: القاعدة غير متاحة لحظة التصدير — صفحة بسيطة بدل كسر البناء
    return (
      <main className="min-h-screen relative bg-pure-ink">
        <Header />
        <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-20 pt-32 lg:pt-40">
          <p className="text-gray-light">المقال في الطريق —</p>
          <Link href="/blog/" className="text-pulse-orange hover:underline">← عودة لآخر الأخبار</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const html = marked.parse(a.body_md ?? '', { async: false }) as string;

  // بيانات منظمة — تجعل المقال قابلاً للفهم والاستشهاد من محركات البحث والذكاء
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.seo_description ?? a.excerpt ?? undefined,
    datePublished: a.published_at ?? undefined,
    inLanguage: 'ar-SA',
    author: { '@type': 'Organization', name: 'AGMA', url: 'https://agma.com.sa' },
    publisher: {
      '@type': 'Organization',
      name: 'AGMA — وكالة جيل الذكاء الاصطناعي',
      url: 'https://agma.com.sa',
      logo: { '@type': 'ImageObject', url: 'https://agma.com.sa/logo.svg' },
    },
    mainEntityOfPage: `https://agma.com.sa/blog/${a.slug}/`,
    keywords: a.tags.join(', '),
    citation: a.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })),
  };

  return (
    <main className="min-h-screen relative bg-pure-ink">
      <Header />
      <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-20 pt-32 lg:pt-40">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-xs text-gray-medium">
        <Link href="/blog/" className="hover:text-pulse-orange">← آخر الأخبار</Link>
      </nav>

      <article>
        <h1 className="mb-3 text-3xl font-black leading-snug text-snow">{a.title}</h1>
        {a.published_at && (
          <time dateTime={a.published_at} className="text-xs text-gray-medium">
            {new Date(a.published_at).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
        )}
        {a.excerpt && (
          <p className="mt-4 border-s-2 border-pulse-orange ps-4 text-base leading-relaxed text-gray-light">
            {a.excerpt}
          </p>
        )}

        <div
          className="prose-agma mt-8 space-y-4 text-[15px] leading-8 text-gray-light [&_a]:text-pulse-orange [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-snow [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-snow [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-snow"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {a.sources.length > 0 && (
          <section className="mt-10 rounded-lg border border-white/10 p-4">
            <h2 className="mb-2 text-sm font-bold text-snow">المصادر</h2>
            <ul className="space-y-1 text-xs">
              {a.sources.map((s, i) => (
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

        <section className="mt-10 rounded-lg border border-pulse-orange/40 bg-white/5 p-5 text-center">
          <p className="mb-3 text-sm font-bold text-snow">
            تريد تطبيق هذا على عملك؟ AGMA تبني لك الخطة وتنفذها.
          </p>
          <Link href="/contact"
            className="inline-block rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90">
            تواصل معنا
          </Link>
        </section>
      </article>
      </div>
      <Footer />
    </main>
  );
}

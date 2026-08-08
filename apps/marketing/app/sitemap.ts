import type { MetadataRoute } from 'next';
import { fetchPublishedArticles } from '../lib/blog';

/** خريطة الموقع — تُخبز وقت البناء وتشمل مقالات المدونة (SEO). */

export const dynamic = 'force-static';

const BASE = 'https://agma.com.sa';

const STATIC_ROUTES = [
  '', '/about', '/agma-method', '/process', '/services', '/industries',
  '/pricing', '/contact', '/blog', '/help', '/careers', '/complaints', '/feedback',
  '/trust', '/live', '/transform', '/tools/website-audit',
  '/privacy-policy', '/terms',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await fetchPublishedArticles();
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${BASE}${r}/`.replace(/\/\/$/, '/'),
      changeFrequency: (r === '/blog' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: r === '' ? 1 : r === '/blog' ? 0.9 : 0.7,
    })),
    ...articles.map((a) => ({
      url: `${BASE}/blog/${a.slug}/`,
      lastModified: a.published_at ?? undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}

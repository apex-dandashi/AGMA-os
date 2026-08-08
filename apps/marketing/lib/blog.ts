/**
 * مقالات المدونة وقت البناء: المصدر الأول لقطة داخل المستودع
 * (content/articles-snapshot.json — يحدثها سير bake اليومي) لأن بيئة بناء
 * Hostinger لا تصل للشبكة الخارجية (مثبت 2026-08-08)؛ والشبكة احتياط
 * للتطوير المحلي. فشل الكل لا يكسر البناء — قائمة فارغة.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './publicConfig';

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  tags: string[];
  sources: { title: string; url: string }[];
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

const COLS = 'slug,title,excerpt,body_md,tags,sources,seo_title,seo_description,published_at';

function fromSnapshot(): BlogArticle[] | null {
  try {
    const raw = readFileSync(
      join(process.cwd(), 'content', 'articles-snapshot.json'), 'utf8');
    const rows = JSON.parse(raw) as BlogArticle[];
    return Array.isArray(rows) && rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

export async function fetchPublishedArticles(limit = 100): Promise<BlogArticle[]> {
  const snap = fromSnapshot();
  if (snap) return snap.slice(0, limit);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=${COLS}` +
      `&order=published_at.desc&limit=${limit}`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as BlogArticle[];
  } catch {
    return [];
  }
}

export async function fetchArticle(slug: string): Promise<BlogArticle | null> {
  const snap = fromSnapshot();
  if (snap) return snap.find((a) => a.slug === slug) ?? null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.published&slug=eq.${encodeURIComponent(slug)}` +
      `&select=${COLS}&limit=1`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as BlogArticle[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

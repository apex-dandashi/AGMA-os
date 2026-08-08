/**
 * جلب مقالات المدونة وقت البناء (REST مباشر — يعمل في بيئة بناء Hostinger
 * الثابتة). المفتاح anon عام بالتصميم وRLS تسمح بقراءة المنشور فقط.
 * فشل الجلب لا يكسر البناء — يعيد قائمة فارغة.
 */
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

export async function fetchPublishedArticles(limit = 100): Promise<BlogArticle[]> {
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

#!/usr/bin/env node
// لقطة مقالات «آخر الأخبار» → ملف داخل المستودع.
// لماذا؟ بيئة بناء Hostinger لا تصل لقاعدة البيانات وقت البناء (مثبت
// 2026-08-08)، فالبناء يقرأ هذه اللقطة محلياً — حتمي على أي استضافة.
// يشغلها سير bake اليومي، أو يدوياً: node scripts/snapshot-articles.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = 'https://gjaheqlgheizvebvakfd.supabase.co';
// المفتاح عام بالتصميم (يشحن في كل متصفح) — RLS تسمح بقراءة المنشور فقط
const ANON = 'sb_publishable_4skzKO7V1tBiFuuTfjKofw_9eIYq8gq';
const COLS = 'slug,title,excerpt,body_md,tags,sources,seo_title,seo_description,published_at';

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=${COLS}&order=published_at.desc&limit=200`,
  { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } },
);
if (!res.ok) {
  console.error('snapshot fetch failed:', res.status, (await res.text()).slice(0, 200));
  process.exit(1);
}
const articles = await res.json();
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'apps', 'marketing', 'content', 'articles-snapshot.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(articles, null, 1) + '\n');
console.log(`snapshot: ${articles.length} published article(s) → ${out}`);

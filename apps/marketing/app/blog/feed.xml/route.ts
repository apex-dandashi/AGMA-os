import { fetchPublishedArticles } from '../../../lib/blog';

/** خلاصة RSS لمدونة AGMA — تُخبز وقت البناء (تغذي المجمعات ومحركات الذكاء). */

export const dynamic = 'force-static';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const articles = await fetchPublishedArticles(30);
  const items = articles.map((a) => [
    '<item>',
    `<title>${esc(a.title)}</title>`,
    `<link>https://agma.com.sa/blog/${a.slug}/</link>`,
    `<guid isPermaLink="true">https://agma.com.sa/blog/${a.slug}/</guid>`,
    a.excerpt ? `<description>${esc(a.excerpt)}</description>` : '',
    a.published_at ? `<pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : '',
    '</item>',
  ].join('')).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>مدونة AGMA</title>
<link>https://agma.com.sa/blog/</link>
<description>أفكار وأخبار التسويق والذكاء الاصطناعي في السعودية — من وكالة AGMA</description>
<language>ar-sa</language>
${items}
</channel></rss>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
}

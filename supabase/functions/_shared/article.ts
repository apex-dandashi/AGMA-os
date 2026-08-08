// صياغة مقال المدونة — منطق مشترك بين content-collect (اليومي الآلي)
// وgenerate-article (عند الطلب من الفريق).
//
// قواعد الجودة (SEO/GEO): عربية سعودية معاصرة، استشهاد بالمصادر المزودة فقط،
// لا اختلاق أرقام، بنية عناوين نظيفة، وخلاصة قابلة للاستشهاد من محركات الذكاء.
import Anthropic from 'npm:@anthropic-ai/sdk';

export type Signal = { title: string; url: string; summary?: string | null };

export type ArticleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
};

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slug', 'excerpt', 'body_md', 'tags', 'seo_title', 'seo_description'],
  properties: {
    title: { type: 'string' },
    slug: { type: 'string', description: 'لاتيني قصير بفواصل - مثل ai-marketing-trends' },
    excerpt: { type: 'string', description: 'خلاصة ٢-٣ جمل قابلة للاستشهاد' },
    body_md: { type: 'string', description: 'ماركداون: ## عناوين فرعية، روابط المصادر داخل النص' },
    tags: { type: 'array', items: { type: 'string' } },
    seo_title: { type: 'string', description: '≤ ٦٠ حرفاً' },
    seo_description: { type: 'string', description: '≤ ١٥٥ حرفاً' },
  },
} as const;

export async function draftArticle(
  apiKey: string,
  signals: Signal[],
  topic?: string,
): Promise<ArticleDraft> {
  const anthropic = new Anthropic({ apiKey });

  const system = [
    'أنت كاتب المدونة الرسمية لوكالة AGMA (وكالة تسويق سعودية AI-native في الرياض،',
    'موقعها agma.com.sa). تكتب مقالات عربية سعودية معاصرة لجمهور أصحاب الأعمال',
    'والمسوقين في السعودية والخليج. قواعد صارمة:',
    '١) استشهد فقط بالمصادر المزودة لك — اربطها داخل النص بصيغة [نص الرابط](URL).',
    '   لا تختلق مصادر أو أرقاماً أو إحصاءات غير واردة فيها.',
    '٢) ابدأ بخلاصة مباشرة تجيب سؤال القارئ (محركات الذكاء تقتبسها)، ثم عناوين',
    '   فرعية ## واضحة، وأنهِ بقسم «ماذا يعني هذا لعملك في السعودية؟».',
    '٣) اربط الموضوع بالسوق السعودي (رؤية ٢٠٣٠، سلوك المستهلك المحلي) حيث يصح.',
    '٤) ٦٠٠–٩٠٠ كلمة. لا إيموجي. لا حشو.',
    '٥) لا تذكر أنك ذكاء اصطناعي ولا تروج لـ AGMA بشكل مباشر — القيمة أولاً.',
  ].join('\n');

  const srcList = signals
    .map((s, i) => `${i + 1}. ${s.title}\n   ${s.url}${s.summary ? `\n   ${s.summary.slice(0, 300)}` : ''}`)
    .join('\n');

  const prompt = [
    topic
      ? `اكتب مقالاً عن: ${topic}`
      : 'اختر أقوى خيط مشترك من إشارات اليوم التالية واكتب مقالاً واحداً متماسكاً عنه (لا ملخص أخبار متفرقة):',
    signals.length ? `\nإشارات اليوم (مصادرك الوحيدة المسموحة):\n${srcList}` : '',
  ].join('\n');

  const msg = await anthropic.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    output_config: {
      format: { type: 'json_schema', schema: SCHEMA },
    },
    messages: [{ role: 'user', content: prompt }],
  } as Parameters<typeof anthropic.beta.messages.create>[0]);

  if (msg.stop_reason === 'refusal') throw new Error('refused');
  const text = msg.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text).join('');
  const draft = JSON.parse(text) as ArticleDraft;
  // تعقيم الرابط الثابت مهما أعاد النموذج
  draft.slug = draft.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80) || `article-${Date.now()}`;
  return draft;
}

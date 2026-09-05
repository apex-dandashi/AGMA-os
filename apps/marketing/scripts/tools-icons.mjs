// يولّد public/tools/*.svg و lib/tools.ts من حزمة simple-icons + الشعارات الرسمية المحفوظة في public/tools
// التشغيل: node scripts/tools-icons.mjs   (من مجلد apps/marketing)
// الشعارات غير المتوفرة في simple-icons (أدوبي، لينكدإن، OpenAI، Twilio، SendGrid، CapCut، Playwright، زد، فاتورة، Google Business)
// نُزّلت مرة واحدة من مصادرها الرسمية أو ويكيميديا وتُحفظ في public/tools باسم المعرّف؛ السكربت لا يلمسها.
import * as si from 'simple-icons';
import fs from 'node:fs';

// [id, simple-icons slug or null, display name, group]
const T = [
  ['nextjs', 'nextdotjs', 'Next.js', 'web'], ['react', 'react', 'React', 'web'], ['typescript', 'typescript', 'TypeScript', 'web'],
  ['tailwind', 'tailwindcss', 'Tailwind CSS', 'web'], ['framer', 'framer', 'Framer Motion', 'web'], ['webgl', 'webgl', 'WebGL', 'web'],
  ['supabase', 'supabase', 'Supabase', 'web'], ['postgresql', 'postgresql', 'PostgreSQL', 'web'], ['hostinger', 'hostinger', 'Hostinger', 'web'],
  ['github', 'github', 'GitHub', 'web'], ['lighthouse', 'lighthouse', 'Lighthouse', 'web'], ['playwright', null, 'Playwright', 'web'],
  ['searchconsole', 'googlesearchconsole', 'Google Search Console', 'web'], ['ga4', 'googleanalytics', 'Google Analytics 4', 'web'],
  ['gtm', 'googletagmanager', 'Google Tag Manager', 'web'], ['salla', 'salla', 'سلة', 'web'], ['zid', null, 'زد', 'web'], ['shopify', 'shopify', 'Shopify', 'web'],
  ['figma', 'figma', 'Figma', 'brand'], ['illustrator', null, 'Adobe Illustrator', 'brand'], ['photoshop', null, 'Adobe Photoshop', 'brand'], ['affinity', null, 'Affinity Designer', 'brand'],
  ['instagram', 'instagram', 'Instagram', 'social'], ['snapchat', 'snapchat', 'Snapchat', 'social'], ['tiktok', 'tiktok', 'TikTok', 'social'], ['x', 'x', 'X', 'social'],
  ['linkedin', null, 'LinkedIn', 'social'], ['youtube', 'youtube', 'YouTube', 'social'], ['meta', 'meta', 'Meta Business Suite', 'social'],
  ['premiere', null, 'Adobe Premiere Pro', 'social'], ['aftereffects', null, 'Adobe After Effects', 'social'], ['capcut', null, 'CapCut', 'social'], ['elevenlabs', 'elevenlabs', 'ElevenLabs', 'social'],
  ['claude', 'claude', 'Claude', 'systems'], ['anthropic', 'anthropic', 'Anthropic', 'systems'], ['gemini', 'googlegemini', 'Gemini', 'systems'], ['openai', null, 'OpenAI', 'systems'],
  ['openrouter', 'openrouter', 'OpenRouter', 'systems'], ['perplexity', 'perplexity', 'Perplexity', 'systems'], ['whatsapp', 'whatsapp', 'WhatsApp Business', 'systems'],
  ['twilio', null, 'Twilio', 'systems'], ['sendgrid', null, 'SendGrid', 'systems'], ['n8n', 'n8n', 'n8n', 'systems'], ['deno', 'deno', 'Deno', 'systems'], ['odoo', 'odoo', 'Odoo', 'systems'],
  ['zatca', null, 'فاتورة ZATCA', 'systems'], ['zoom', 'zoom', 'Zoom', 'systems'], ['googlemeet', 'googlemeet', 'Google Meet', 'systems'], ['calendly', 'calendly', 'Calendly', 'systems'], ['notion', 'notion', 'Notion', 'systems'],
  ['googleads', 'googleads', 'Google Ads', 'ads'], ['googlebusiness', null, 'Google Business Profile', 'seo'],
];
const ext = { googlebusiness: 'png' };
const out = [];
for (const [id, slug, name, group] of T) {
  let hex = '';
  const file = `public/tools/${id}.${ext[id] || 'svg'}`;
  if (slug) {
    const ic = si['si' + slug[0].toUpperCase() + slug.slice(1)];
    if (!ic) { console.error('MISSING in simple-icons:', slug); continue; }
    hex = '#' + ic.hex;
    fs.writeFileSync(file, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${ic.title}"><path fill="currentColor" d="${ic.path}"/></svg>\n`);
  } else if (!fs.existsSync(file)) { console.error('NO FILE for', id, '— add it to public/tools manually'); continue; }
  out.push({ id, name, group, hex, src: '/' + file.replace('public/', ''), mono: !!slug });
}
fs.writeFileSync('lib/tools.ts', `// يُولَّد من scripts/tools-icons.mjs — لا تُحرّر يدوياً. المصدر: simple-icons + شعارات رسمية في public/tools
export type ToolGroup = 'web' | 'brand' | 'social' | 'systems' | 'ads' | 'seo';
export type Tool = { id: string; name: string; group: ToolGroup; hex: string; src: string; mono: boolean };
export const TOOL_GROUPS: Record<ToolGroup, string> = { web: 'الموقع والتجربة الرقمية', brand: 'الهوية والتصميم', social: 'السوشال والمحتوى', systems: 'الأنظمة والأتمتة والذكاء', ads: 'الإعلانات', seo: 'السيو والظهور' };
export const TOOLS: Tool[] = ${JSON.stringify(out, null, 1)};
`);
console.log('written', out.length, 'tools');

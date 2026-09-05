// يُولَّد من scripts/tools-icons.mjs — لا تُحرّر يدوياً. المصدر: simple-icons + شعارات رسمية في public/tools
export type ToolGroup = 'web' | 'brand' | 'social' | 'systems' | 'ads' | 'seo';
export type Tool = { id: string; name: string; group: ToolGroup; hex: string; src: string; mono: boolean };
export const TOOL_GROUPS: Record<ToolGroup, string> = { web: 'الموقع والتجربة الرقمية', brand: 'الهوية والتصميم', social: 'السوشال والمحتوى', systems: 'الأنظمة والأتمتة والذكاء', ads: 'الإعلانات', seo: 'السيو والظهور' };
export const TOOLS: Tool[] = [
 {
  "id": "nextjs",
  "name": "Next.js",
  "group": "web",
  "hex": "#000000",
  "src": "/tools/nextjs.svg",
  "mono": true
 },
 {
  "id": "react",
  "name": "React",
  "group": "web",
  "hex": "#61DAFB",
  "src": "/tools/react.svg",
  "mono": true
 },
 {
  "id": "typescript",
  "name": "TypeScript",
  "group": "web",
  "hex": "#3178C6",
  "src": "/tools/typescript.svg",
  "mono": true
 },
 {
  "id": "tailwind",
  "name": "Tailwind CSS",
  "group": "web",
  "hex": "#06B6D4",
  "src": "/tools/tailwind.svg",
  "mono": true
 },
 {
  "id": "framer",
  "name": "Framer Motion",
  "group": "web",
  "hex": "#0055FF",
  "src": "/tools/framer.svg",
  "mono": true
 },
 {
  "id": "webgl",
  "name": "WebGL",
  "group": "web",
  "hex": "#990000",
  "src": "/tools/webgl.svg",
  "mono": true
 },
 {
  "id": "supabase",
  "name": "Supabase",
  "group": "web",
  "hex": "#3FCF8E",
  "src": "/tools/supabase.svg",
  "mono": true
 },
 {
  "id": "postgresql",
  "name": "PostgreSQL",
  "group": "web",
  "hex": "#4169E1",
  "src": "/tools/postgresql.svg",
  "mono": true
 },
 {
  "id": "hostinger",
  "name": "Hostinger",
  "group": "web",
  "hex": "#673DE6",
  "src": "/tools/hostinger.svg",
  "mono": true
 },
 {
  "id": "github",
  "name": "GitHub",
  "group": "web",
  "hex": "#181717",
  "src": "/tools/github.svg",
  "mono": true
 },
 {
  "id": "lighthouse",
  "name": "Lighthouse",
  "group": "web",
  "hex": "#F44B21",
  "src": "/tools/lighthouse.svg",
  "mono": true
 },
 {
  "id": "playwright",
  "name": "Playwright",
  "group": "web",
  "hex": "",
  "src": "/tools/playwright.svg",
  "mono": false
 },
 {
  "id": "searchconsole",
  "name": "Google Search Console",
  "group": "web",
  "hex": "#458CF5",
  "src": "/tools/searchconsole.svg",
  "mono": true
 },
 {
  "id": "ga4",
  "name": "Google Analytics 4",
  "group": "web",
  "hex": "#E37400",
  "src": "/tools/ga4.svg",
  "mono": true
 },
 {
  "id": "gtm",
  "name": "Google Tag Manager",
  "group": "web",
  "hex": "#246FDB",
  "src": "/tools/gtm.svg",
  "mono": true
 },
 {
  "id": "salla",
  "name": "سلة",
  "group": "web",
  "hex": "#BAF3E6",
  "src": "/tools/salla.svg",
  "mono": true
 },
 {
  "id": "zid",
  "name": "زد",
  "group": "web",
  "hex": "",
  "src": "/tools/zid.svg",
  "mono": false
 },
 {
  "id": "shopify",
  "name": "Shopify",
  "group": "web",
  "hex": "#7AB55C",
  "src": "/tools/shopify.svg",
  "mono": true
 },
 {
  "id": "figma",
  "name": "Figma",
  "group": "brand",
  "hex": "#F24E1E",
  "src": "/tools/figma.svg",
  "mono": true
 },
 {
  "id": "illustrator",
  "name": "Adobe Illustrator",
  "group": "brand",
  "hex": "",
  "src": "/tools/illustrator.svg",
  "mono": false
 },
 {
  "id": "photoshop",
  "name": "Adobe Photoshop",
  "group": "brand",
  "hex": "",
  "src": "/tools/photoshop.svg",
  "mono": false
 },
 {
  "id": "affinity",
  "name": "Affinity Designer",
  "group": "brand",
  "hex": "",
  "src": "/tools/affinity.svg",
  "mono": false
 },
 {
  "id": "instagram",
  "name": "Instagram",
  "group": "social",
  "hex": "#FF0069",
  "src": "/tools/instagram.svg",
  "mono": true
 },
 {
  "id": "snapchat",
  "name": "Snapchat",
  "group": "social",
  "hex": "#FFFC00",
  "src": "/tools/snapchat.svg",
  "mono": true
 },
 {
  "id": "tiktok",
  "name": "TikTok",
  "group": "social",
  "hex": "#000000",
  "src": "/tools/tiktok.svg",
  "mono": true
 },
 {
  "id": "x",
  "name": "X",
  "group": "social",
  "hex": "#000000",
  "src": "/tools/x.svg",
  "mono": true
 },
 {
  "id": "linkedin",
  "name": "LinkedIn",
  "group": "social",
  "hex": "",
  "src": "/tools/linkedin.svg",
  "mono": false
 },
 {
  "id": "youtube",
  "name": "YouTube",
  "group": "social",
  "hex": "#FF0000",
  "src": "/tools/youtube.svg",
  "mono": true
 },
 {
  "id": "meta",
  "name": "Meta Business Suite",
  "group": "social",
  "hex": "#0467DF",
  "src": "/tools/meta.svg",
  "mono": true
 },
 {
  "id": "premiere",
  "name": "Adobe Premiere Pro",
  "group": "social",
  "hex": "",
  "src": "/tools/premiere.svg",
  "mono": false
 },
 {
  "id": "aftereffects",
  "name": "Adobe After Effects",
  "group": "social",
  "hex": "",
  "src": "/tools/aftereffects.svg",
  "mono": false
 },
 {
  "id": "capcut",
  "name": "CapCut",
  "group": "social",
  "hex": "",
  "src": "/tools/capcut.svg",
  "mono": false
 },
 {
  "id": "elevenlabs",
  "name": "ElevenLabs",
  "group": "social",
  "hex": "#000000",
  "src": "/tools/elevenlabs.svg",
  "mono": true
 },
 {
  "id": "claude",
  "name": "Claude",
  "group": "systems",
  "hex": "#D97757",
  "src": "/tools/claude.svg",
  "mono": true
 },
 {
  "id": "anthropic",
  "name": "Anthropic",
  "group": "systems",
  "hex": "#191919",
  "src": "/tools/anthropic.svg",
  "mono": true
 },
 {
  "id": "gemini",
  "name": "Gemini",
  "group": "systems",
  "hex": "#8E75B2",
  "src": "/tools/gemini.svg",
  "mono": true
 },
 {
  "id": "openai",
  "name": "OpenAI",
  "group": "systems",
  "hex": "",
  "src": "/tools/openai.svg",
  "mono": false
 },
 {
  "id": "openrouter",
  "name": "OpenRouter",
  "group": "systems",
  "hex": "#94A3B8",
  "src": "/tools/openrouter.svg",
  "mono": true
 },
 {
  "id": "perplexity",
  "name": "Perplexity",
  "group": "systems",
  "hex": "#1FB8CD",
  "src": "/tools/perplexity.svg",
  "mono": true
 },
 {
  "id": "whatsapp",
  "name": "WhatsApp Business",
  "group": "systems",
  "hex": "#25D366",
  "src": "/tools/whatsapp.svg",
  "mono": true
 },
 {
  "id": "twilio",
  "name": "Twilio",
  "group": "systems",
  "hex": "",
  "src": "/tools/twilio.svg",
  "mono": false
 },
 {
  "id": "sendgrid",
  "name": "SendGrid",
  "group": "systems",
  "hex": "",
  "src": "/tools/sendgrid.svg",
  "mono": false
 },
 {
  "id": "n8n",
  "name": "n8n",
  "group": "systems",
  "hex": "#EA4B71",
  "src": "/tools/n8n.svg",
  "mono": true
 },
 {
  "id": "deno",
  "name": "Deno",
  "group": "systems",
  "hex": "#000000",
  "src": "/tools/deno.svg",
  "mono": true
 },
 {
  "id": "odoo",
  "name": "Odoo",
  "group": "systems",
  "hex": "#714B67",
  "src": "/tools/odoo.svg",
  "mono": true
 },
 {
  "id": "zatca",
  "name": "فاتورة ZATCA",
  "group": "systems",
  "hex": "",
  "src": "/tools/zatca.svg",
  "mono": false
 },
 {
  "id": "zoom",
  "name": "Zoom",
  "group": "systems",
  "hex": "#0B5CFF",
  "src": "/tools/zoom.svg",
  "mono": true
 },
 {
  "id": "googlemeet",
  "name": "Google Meet",
  "group": "systems",
  "hex": "#00897B",
  "src": "/tools/googlemeet.svg",
  "mono": true
 },
 {
  "id": "calendly",
  "name": "Calendly",
  "group": "systems",
  "hex": "#006BFF",
  "src": "/tools/calendly.svg",
  "mono": true
 },
 {
  "id": "notion",
  "name": "Notion",
  "group": "systems",
  "hex": "#000000",
  "src": "/tools/notion.svg",
  "mono": true
 },
 {
  "id": "googleads",
  "name": "Google Ads",
  "group": "ads",
  "hex": "#4285F4",
  "src": "/tools/googleads.svg",
  "mono": true
 },
 {
  "id": "googlebusiness",
  "name": "Google Business Profile",
  "group": "seo",
  "hex": "",
  "src": "/tools/googlebusiness.png",
  "mono": false
 }
];

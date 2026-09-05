'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { DIAL_CODES } from '@agma/ui';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/publicConfig';

/**
 * الباقات السنوية — «من الفكرة إلى الأثر» (المالك 2026-09-05: ثلاث باقات من
 * خدماتنا كلها على سنة، لا الخمس فقط، بلا تصوير وبلا ذكر للضريبة).
 * القواعد: كل تسليم من دلائل الخدمات، وكل «قيمة منفردة» محسوبة من الحدود
 * الدنيا في صفحة التسعير (البنود غير المسعّرة موسومة تقديري). L12: أضف
 * خدمة أخرى دائماً. L2/L11 في النموذج. الحرير يخيط خريطة السنة ويشتعل عند
 * الطلب. الجوال: شرائح خدمات أفقية فوق المسرح، والعناوين لا تختفي تحت
 * الهيدر (scroll-mt).
 */

type Tier = 'launch' | 'accelerator' | 'leader';
const TIERS: Tier[] = ['launch', 'accelerator', 'leader'];
const fmt = (n: number) => n.toLocaleString('en-US');

type Item = { text: string; tiers: Tier[]; yearly: number; basis: string; est?: boolean; by?: Partial<Record<Tier, { text?: string; yearly?: number; basis?: string }>> };
type Kind = 'web' | 'brand' | 'social' | 'flow' | 'bars' | 'rank' | 'chat';
type Svc = { id: string; name: string; promise: string; kind: Kind; items: Item[] };

const ALL: Tier[] = ['launch', 'accelerator', 'leader'];
const PLUS: Tier[] = ['accelerator', 'leader'];
const TOP: Tier[] = ['leader'];

/* الخدمات: التسليمات من دلائل الخدمات، والقيم من صفحة التسعير الإرشادية */
const SERVICES: Svc[] = [
  { id: 'web', name: 'الموقع والمنصة', promise: 'موقع يبيع ٢٤/٧ ويتكامل مع حملاتك.', kind: 'web', items: [
    { text: 'موقع كامل يُطلق خلال أول ٤–٨ أسابيع: جوال أولاً وسيو من اليوم الأول، ولوحة إدارة محتوى بيدك', tiers: ALL, yearly: 7500, basis: 'موقع من 7,500' },
    { text: '٤ صفحات هبوط في السنة (واحدة لكل ربع) بتتبع تحويل مثبت', tiers: PLUS, yearly: 10000, basis: '٤ صفحات هبوط من 2,500', by: { leader: { text: '٨ صفحات هبوط في السنة (لكل حملة رئيسية) بتتبع تحويل مثبت', yearly: 20000, basis: '٨ صفحات هبوط من 2,500' } } },
    { text: 'الدومين والاستضافة باسمك دائماً، ودعم فني مستمر', tiers: ALL, yearly: 0, basis: '' },
  ] },
  { id: 'brand', name: 'الهوية البصرية', promise: 'شعار يتحوّل إلى نظام كامل.', kind: 'brand', items: [
    { text: '٣ اتجاهات تصميم ثم هوية كاملة بكل الصيغ خلال ٣–٥ أسابيع، وحقوقها لك', tiers: ALL, yearly: 6000, basis: 'هوية من 6,000' },
    { text: 'دليل هوية: قواعد الشعار والألوان والخطوط ونبرة الصوت', tiers: ALL, yearly: 4400, basis: 'دليل هوية من 4,400' },
    { text: '٨ تصاميم شهرياً بهويتك: إعلانات وأغلفة وقوالب محتوى', tiers: PLUS, yearly: 12000, basis: '٨ أصول شهرياً ~1,000', est: true, by: { leader: { text: '١٦ تصميماً شهرياً بهويتك: إعلانات وأغلفة وقوالب ومطبوعات', yearly: 20000, basis: '١٦ أصلاً شهرياً ~1,650' } } },
  ] },
  { id: 'social', name: 'السوشال ميديا', promise: 'حضور يومي يبني مجتمعاً لا متابعين فقط.', kind: 'social', items: [
    { text: 'منصتان · ١٢ منشوراً و٤ ريلز شهرياً بتقويم تعتمده، وتقرير شهري يفرّق النمو الحقيقي عن الأرقام الفارغة', tiers: ALL, yearly: 33600, basis: 'إدارة من 2,800/شهر', by: { accelerator: { text: '٣ منصات · ٢٠ منشوراً و٨ ريلز شهرياً بتقويم تعتمده، وتقرير شهري يفرّق النمو الحقيقي عن الأرقام الفارغة', yearly: 42000, basis: 'إدارة ٣ منصات ~3,500/شهر' }, leader: { text: '٤ منصات · ٣٠ منشوراً و١٢ ريلز شهرياً بتقويم تعتمده، وتقرير شهري يفرّق النمو الحقيقي عن الأرقام الفارغة', yearly: 54000, basis: 'إدارة ٤ منصات ~4,500/شهر' } } },
    { text: 'استراتيجية حساب لكل منصة: دور وجمهور ونبرة وأعمدة محتوى', tiers: PLUS, yearly: 5000, basis: 'استراتيجية من 5,000' },
    { text: 'إدارة مجتمع يومية: ردود بلهجة علامتك واحتواء الشكاوى قبل انتشارها', tiers: PLUS, yearly: 26400, basis: 'مجتمع من 2,200/شهر' },
  ] },
  { id: 'systems', name: 'الأنظمة والأتمتة', promise: 'طلباتك تمشي وحدها من الاستقبال إلى التسليم.', kind: 'flow', items: [
    { text: 'روبوت محادثة على واتساب وموقعك يجيب من معرفة منشأتك المعتمدة فقط ويسلّم البشري ما لا يعرفه', tiers: ALL, yearly: 7500, basis: 'روبوت من 7,500' },
    { text: 'أتمتة عمليتين في السنة من وصول الطلب إلى إقفاله، بتنبيهات لما يتعثر', tiers: PLUS, yearly: 9000, basis: 'مساران من 4,500', by: { leader: { text: 'أتمتة ٤ عمليات في السنة من وصول الطلب إلى إقفاله، بتنبيهات لما يتعثر', yearly: 18000, basis: '٤ مسارات من 4,500' } } },
    { text: 'تحديث شهري لقاعدة المعرفة وصيانة الأتمتة', tiers: PLUS, yearly: 18000, basis: 'صيانة ~1,500/شهر', est: true },
  ] },
  { id: 'ads', name: 'الإعلانات المدفوعة', promise: 'ميزانيتك محمية بسقوف وقياس صادق.', kind: 'bars', items: [
    { text: 'حملتان نشطتان شهرياً على منصتين (سناب/تيك توك/إنستغرام/إكس): ٣ زوايا رسائل تُختبر أول أسبوعين ثم تصاميم شهرية وتقرير بلغة عمل', tiers: PLUS, yearly: 30000, basis: 'إدارة من 2,500/شهر', by: { leader: { text: '٤ حملات نشطة شهرياً على ٤ منصات: زوايا رسائل تُختبر ثم تصاميم شهرية وتقرير بلغة عمل', yearly: 42000, basis: 'إدارة ٤ منصات ~3,500/شهر' } } },
    { text: 'إعلانات جوجل (بحث وعرض) بحسابات باسمك وتتبع تحويل', tiers: TOP, yearly: 30000, basis: 'جوجل من 2,500/شهر' },
    { text: 'ميزانية الإعلانات نفسها تُدفع للمنصات مباشرة وليست ضمن الباقة', tiers: PLUS, yearly: 0, basis: '' },
  ] },
  { id: 'seo', name: 'السيو والمحتوى', promise: 'تصدّر بحث جوجل ومحركات الذكاء.', kind: 'rank', items: [
    { text: 'سيو عربي متخصص: نوايا البحث واللهجة وسلوك المستخدم السعودي والخليجي', tiers: TOP, yearly: 36000, basis: 'سيو عربي من 3,000/شهر' },
    { text: '٤ مقالات و٢٠ وصفاً/منشوراً شهرياً بخط إنتاج ذكاء اصطناعي يراجعه محررونا قبل أي نشر', tiers: TOP, yearly: 26400, basis: 'محتوى من 2,200/شهر' },
    { text: 'حصة الذكاء: قياس شهري لذكر علامتك في ChatGPT وGemini وPerplexity (٣ نماذج × ٣٠ سؤالاً) وتحسين الظهور فيها (GEO)', tiers: TOP, yearly: 36000, basis: 'GEO من 3,000/شهر' },
  ] },
  { id: 'agent', name: 'وكيل ذكاء اصطناعي', promise: 'عملية واحدة تُدار بذكاء اصطناعي مخصص لك.', kind: 'chat', items: [
    { text: 'وكيل ذكاء اصطناعي مخصص لعملية واحدة من عملياتك (تأهيل، متابعة، أو خدمة عملاء) مع مراجعة بشرية', tiers: TOP, yearly: 15000, basis: 'وكيل من 15,000' },
    { text: 'تحسين معدل التحويل: اختبارات على صفحاتك الأعلى زيارة', tiers: TOP, yearly: 3800, basis: 'CRO من 3,800' },
  ] },
];

type Pkg = { id: Tier; name: string; en: string; price: number; tagline: string; bestFor: string; recommended?: boolean };
const PACKAGES: Pkg[] = [
  { id: 'launch', name: 'انطلاقة', en: 'Launch', price: 3900, tagline: 'الأساس الصحيح لحضور رقمي يبدأ اليوم.', bestFor: 'لمنشأة تبدأ حضورها أو تعيد بناءه من الصفر.' },
  { id: 'accelerator', name: 'مسرّع الأعمال', en: 'Business Accelerator', price: 9500, tagline: 'فريق كامل يدير نموّك شهراً بشهر.', bestFor: 'لمنشأة تعمل وتريد نمواً مستمراً بلا توظيف داخلي.', recommended: true },
  { id: 'leader', name: 'قيادة السوق', en: 'Market Leader', price: 17500, tagline: 'كل قنوات النمو معاً، بعقل اصطناعي مخصص لك.', bestFor: 'لمنشأة تريد التصدّر في البحث والإعلانات والخدمة.' },
];
const MONTHS = 12;
const WHATSAPP = 'https://wa.me/966581195387';

const forTier = (i: Item, t: Tier): Item => ({ ...i, ...(i.by?.[t] ?? {}) });
const includedItems = (t: Tier) => SERVICES.flatMap((s) => s.items.filter((i) => i.tiers.includes(t)).map((i) => forTier(i, t)));
const includedServices = (t: Tier) => SERVICES.filter((s) => s.items.some((i) => i.tiers.includes(t)));
const yearlyValue = (t: Tier) => includedItems(t).reduce((a, i) => a + i.yearly, 0);
const monthlyValue = (t: Tier) => Math.round(yearlyValue(t) / MONTHS / 100) * 100;

const ROADMAP = [
  { when: 'الشهر ١', title: 'التأسيس', items: ['استراتيجيات السوشال ومُوجّه الهوية وهيكل الموقع معتمدة منك', 'خريطة عملياتك الحالية والمقترحة', 'حسابات إعلانية وتتبع باسمك (في الباقات الأوسع)'] },
  { when: 'الشهران ٢–٣', title: 'الإطلاق', items: ['الهوية والموقع وروبوت المحادثة يعملون', 'السوشال بإيقاعه الكامل بهويتك الجديدة', 'أول عملية مؤتمتة وأول حملات مختبرة'] },
  { when: 'الأشهر ٤–٦', title: 'التسريع', items: ['صفحات هبوط لحملاتك بتتبع تحويل', 'العملية المؤتمتة الثانية', 'تحسين شهري على أرقام حقيقية'] },
  { when: 'الأشهر ٧–١٢', title: 'النمو المركّب', items: ['أصول وسوشال وإعلانات بإيقاع ثابت', 'مراجعة ربعية للنتائج والأولويات', 'خريطة السنة الثانية إن أردت الاستمرار'] },
];
const SECTORS = ['التجزئة والمتاجر', 'العقار', 'المطاعم والضيافة', 'الصحة والعيادات', 'التعليم', 'التقنية والتطبيقات', 'الخدمات المهنية', 'أخرى'];
const FAQ = [
  { q: 'ما الفرق بين الباقات الثلاث؟', a: 'انطلاقة تبني الأساس: موقع وهوية وسوشال وروبوت محادثة. مسرّع الأعمال يضيف الإعلانات المدفوعة وإدارة المجتمع والأتمتة والأصول الشهرية. قيادة السوق تضيف السيو والمحتوى وإعلانات جوجل ووكيل ذكاء اصطناعي مخصصاً.' },
  { q: 'لماذا الالتزام سنة كاملة؟', a: 'لأن الهوية والموقع والأتمتة تُبنى في أول ربع وتُثمر في بقية السنة. المدة وشروطها تُثبَّت كتابةً قبل أي دفعة.' },
  { q: 'وماذا لو أردت الخروج قبل نهاية السنة؟', a: 'بعد الربع الأول تستطيع الخروج بإشعار ٣٠ يوماً. الشرط مكتوب في العقد قبل أن تدفع ريالاً، وكل ما سُلّم لك حتى تاريخ الخروج يبقى ملكك.' },
  { q: 'هل ميزانية الإعلانات ضمن السعر؟', a: 'لا. سعر الباقة يغطي إدارة الحملات وتصاميمها وتقاريرها، أما ما يُدفع للمنصات فيُدفع من حسابك مباشرة وبسقوف تحددها أنت.' },
  { q: 'من يملك الموقع والهوية والحسابات؟', a: 'أنت. الدومين والاستضافة والحسابات الإعلانية باسمك من اليوم الأول، وحقوق الهوية كاملة لك بعد سداد قيمتها.' },
  { q: 'أحتاج خدمة غير الموجودة في الباقة؟', a: 'أضفها من الحقل أسفل الباقات. لدينا ٣٧ خدمة في ٩ فئات، ويُسعَّر الإضافي في عرضك.' },
  { q: 'كيف أتابع العمل؟', a: 'من بوابة العميل في AGMA OS: المهام والتسليمات والتقارير والفواتير في مكان واحد، وتقدر تجرّب البوابة قبل أن تشترك.' },
];

function pulseAt(el: Element | null, amp = 26) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('agma:silk-pulse', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, amp } }));
}

/* ── مسرح العرض: رسوم نسبية تعمل على أي عرض ─────────────────────────── */
function Stage({ kind }: { kind: Kind }) {
  const [flip, setFlip] = useState(false);
  useEffect(() => { const t = window.setInterval(() => setFlip((f) => !f), 2600); return () => window.clearInterval(t); }, []);
  const spring = { type: 'spring' as const, bounce: 0, duration: 0.7 };
  const enter = { initial: { opacity: 0, filter: 'blur(8px)' }, animate: { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }, exit: { opacity: 0 } };
  return (
    <div className="relative mx-auto flex h-[220px] w-full max-w-md items-center justify-center sm:h-[300px]">
      <AnimatePresence mode="wait">
        {kind === 'web' && (
          <motion.div key="web" {...enter} className="flex w-full items-end justify-center gap-4">
            <motion.div transition={spring} animate={{ width: flip ? '30%' : '72%', height: flip ? 190 : 170 }} className="material-card overflow-hidden rounded-2xl p-3">
              <div className="mb-2 h-2 w-1/3 rounded bg-pulse-orange/70" /><div className="mb-1 h-1.5 w-4/5 rounded bg-white/20" /><div className="mb-3 h-1.5 w-3/5 rounded bg-white/10" /><div className="h-7 w-20 rounded bg-pulse-orange" />
            </motion.div>
            <div className="w-28 shrink-0 text-right text-xs text-gray-light sm:text-sm"><p className="font-bold text-snow">{flip ? 'على الجوال' : 'على الكمبيوتر'}</p><p>مسار طلب واحد.</p></div>
          </motion.div>
        )}
        {kind === 'brand' && (
          <motion.div key="brand" {...enter} className="relative h-full w-full">
            <motion.div animate={{ scale: flip ? 0.6 : 1, x: flip ? '38%' : '0%', y: flip ? '-60%' : '0%' }} transition={spring} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-pulse-orange sm:text-6xl">AG</motion.div>
            {[['موقع', '-30%', '10%'], ['بطاقة', '-30%', '-60%'], ['منشور', '20%', '30%']].map(([l, x, y], i) => (
              <motion.div key={l} animate={{ opacity: flip ? 1 : 0, x: flip ? x : '0%', y: flip ? y : '30%' }} transition={{ ...spring, delay: i * 0.08 }} className="material-card absolute left-1/2 top-1/2 flex h-12 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl text-xs text-gray-light sm:h-14 sm:w-28">{l}</motion.div>
            ))}
          </motion.div>
        )}
        {kind === 'social' && (
          <motion.div key="social" {...enter} className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div key={i} animate={{ opacity: flip ? 1 : i % 2 ? 0.25 : 1, scale: flip ? 1 : 0.9, rotate: flip ? 0 : (i % 3 - 1) * 4 }} transition={{ ...spring, delay: i * 0.03 }} className={`material-card h-14 w-14 rounded-lg sm:h-20 sm:w-20 ${i === 4 ? 'is-active' : ''}`} />
            ))}
          </motion.div>
        )}
        {kind === 'flow' && (
          <motion.div key="flow" {...enter} className="flex w-full items-center justify-between gap-1" dir="rtl">
            {['طلب', 'ردّ آلي', 'تسعير', 'تنفيذ', 'تسليم'].map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-2">
                <motion.div animate={{ scale: (flip ? i >= 2 : i < 2) ? 1.15 : 1, borderColor: (flip ? i >= 2 : i < 2) ? 'rgba(244,77,43,.9)' : 'rgba(255,255,255,.1)' }} transition={spring} className="material-card grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-snow sm:h-12 sm:w-12">{i + 1}</motion.div>
                <span className="text-[11px] text-gray-light">{s}</span>
              </div>
            ))}
          </motion.div>
        )}
        {kind === 'bars' && (
          <motion.div key="bars" {...enter} className="flex h-40 w-full items-end justify-center gap-3" dir="ltr">
            {[0.35, 0.5, 0.42, 0.65, 0.8, 0.72, 0.95].map((h, i) => (
              <motion.div key={i} animate={{ height: `${(flip ? h : h * 0.55) * 100}%` }} transition={{ ...spring, delay: i * 0.05 }} className={`w-6 rounded-t-md sm:w-8 ${i >= 5 ? 'bg-pulse-orange' : 'bg-white/15'}`} />
            ))}
          </motion.div>
        )}
        {kind === 'rank' && (
          <motion.div key="rank" {...enter} className="w-full max-w-sm space-y-2">
            <div className="material-card flex items-center gap-2 rounded-full px-4 py-2 text-xs text-gray-light"><span className="h-2 w-2 rounded-full bg-pulse-orange" />أفضل وكالة تسويق في الرياض</div>
            {['منافس', 'علامتك', 'منافس'].map((l, i) => (
              <motion.div key={i} animate={{ y: flip ? (i === 1 ? -44 : i === 0 ? 44 : 0) : 0 }} transition={spring} className={`material-card flex items-center justify-between rounded-xl px-4 py-2 text-sm ${i === 1 ? 'is-active text-snow' : 'text-gray-medium'}`}><span>{l}</span><span dir="ltr">#{flip && i === 1 ? 1 : i + 1}</span></motion.div>
            ))}
          </motion.div>
        )}
        {kind === 'chat' && (
          <motion.div key="chat" {...enter} className="w-full max-w-sm space-y-2">
            {[['عميل', 'عندكم توصيل للدمام؟'], ['الوكيل', 'نعم، خلال يومين. أرسل لك خيارات الشحن؟'], ['عميل', 'أبغى الأسرع'], ['الوكيل', 'تم، حوّلت طلبك للفريق برقم مرجعي.']].map(([who, t], i) => (
              <motion.div key={i} animate={{ opacity: flip ? (i < 2 ? 1 : 1) : i < 2 ? 1 : 0.15, x: 0 }} transition={{ ...spring, delay: i * 0.08 }} className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm ${who === 'الوكيل' ? 'material-card is-active mr-auto text-snow' : 'material-card ml-auto text-gray-light'}`}>{t}</motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AcceleratorClient() {
  const [tier, setTier] = useState<Tier>('accelerator');
  const pkg = PACKAGES.find((p) => p.id === tier)!;
  const svcs = useMemo(() => includedServices(tier), [tier]);
  const [activeId, setActiveId] = useState<string>('web');
  const active = svcs.find((s) => s.id === activeId) ?? svcs[0];
  const [extras, setExtras] = useState<string[]>([]);
  const [extraDraft, setExtraDraft] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [lead, setLead] = useState({ name: '', company: '', sector: '', dial: '+966', phone: '', when: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  const summary = useMemo(() => {
    const base = `باقة ${pkg.name} ${pkg.en} (${fmt(pkg.price)} ر.س/شهر × ${MONTHS} شهراً؛ قيمة الخدمات منفردة ~${fmt(monthlyValue(tier))}): ` + svcs.map((s) => s.name).join('، ');
    return extras.length ? `${base} + إضافات: ${extras.join('، ')}` : base;
  }, [pkg, tier, svcs, extras]);

  function choose(p: Pkg, el: HTMLElement) {
    setTier(p.id); pulseAt(el, 26);
    if (!includedServices(p.id).some((s) => s.id === activeId)) setActiveId('web');
  }
  function pick(s: Svc, btn: HTMLElement) { setActiveId(s.id); pulseAt(btn, 20); window.setTimeout(() => pulseAt(stageRef.current, 16), 180); }
  function addExtra() { const v = extraDraft.trim(); if (v.length < 2) return; setExtras((x) => (x.includes(v) ? x : [...x, v])); setExtraDraft(''); }
  function askAssistant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement; const v = input.value.trim(); if (v.length < 3) return;
    window.dispatchEvent(new CustomEvent('agma:ask', { detail: { question: `نشاطي: ${v}. أي باقة سنوية تناسبني من باقات AGMA (انطلاقة، مسرّع الأعمال، قيادة السوق) ولماذا، وما أول ما تبدأون به؟` } }));
    input.value = '';
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (status === 'busy') return; setStatus('busy');
    try {
      const details = [lead.sector && `القطاع: ${lead.sector}`, lead.when && `أفضل وقت للاتصال: ${lead.when}`, lead.message.trim() && `رسالة: ${lead.message.trim()}`].filter(Boolean).join(' · ');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST', headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ name: lead.name.trim(), company: lead.company.trim() || undefined, phone: lead.dial + lead.phone.trim().replace(/^0+/, ''), services: summary, message: `من صفحة الباقات السنوية — ${details}`, source: 'site', website: '' }),
      });
      setStatus(res.ok ? 'ok' : 'err'); if (res.ok) pulseAt(document.querySelector('[data-silk-ignite]'), 40);
    } catch { setStatus('err'); }
  }

  const reveal = { initial: { opacity: 0, y: 18, filter: 'blur(8px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }, viewport: { once: true, margin: '-80px' } };
  const waText = encodeURIComponent(`أهلاً فريق AGMA، أريد الاستفسار عن باقة ${pkg.name} (${fmt(pkg.price)} ر.س شهرياً لمدة سنة).`);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    ...PACKAGES.map((p) => ({ '@type': 'Product', name: `باقة ${p.name} ${p.en}`, brand: { '@type': 'Brand', name: 'AGMA' }, description: p.tagline, offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'SAR', availability: 'https://schema.org/InStock', url: 'https://agma.com.sa/business-accelerator/', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'SAR', unitText: 'MONTH' } } })),
    { '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ] };
  const rows = includedItems(tier).filter((i) => i.yearly > 0);

  return (
    <main data-silk-mood="home" className="min-h-screen relative overflow-hidden pb-20 lg:pb-0" suppressHydrationWarning>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* ١) الفكرة */}
      <section data-silk="1" className="relative px-6 pb-20 pt-40 text-center lg:pt-52">
        <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-[#0A0A0A]/60 via-transparent to-[#0A0A0A]/60 opacity-40" />
        <p className="mx-auto mb-6 inline-block rounded-full border border-pulse-orange/40 bg-pulse-orange/10 px-4 py-1.5 text-sm font-bold text-pulse-orange">الباقات السنوية</p>
        <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.25] text-snow sm:text-6xl lg:text-7xl">
          <motion.span className="block" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8 }}>فريق واحد لسنة كاملة</motion.span>
          <motion.span className="block text-gradient" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8, delay: 0.35 }}>من الفكرة إلى الأثر</motion.span>
        </h1>
        <motion.p {...reveal} className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-light">ثلاث باقات من خدماتنا، تختار حجم النمو الذي تريده، وفريق واحد يديره لك شهراً بشهر وتتابعه من بوابتك.</motion.p>
        <motion.div {...reveal} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#packages" className="btn-primary px-10 py-4 text-lg">قارن الباقات</a>
          <a href="#roadmap" className="btn-secondary px-10 py-4 text-lg">خريطة السنة</a>
        </motion.div>
        <motion.p {...reveal} className="mt-5 text-sm text-gray-medium">جديد: <Link href="/ai-visibility" className="text-pulse-orange underline">قِس حصة علامتك في إجابات الذكاء الاصطناعي مجاناً</Link></motion.p>
        <form onSubmit={askAssistant} className="mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] p-1.5 pr-5">
          <input name="q" placeholder="اكتب نشاطك بسطر… ومساعدنا يرشّح باقتك" aria-label="اكتب نشاطك ليرشّح المساعد باقتك" className="min-w-0 flex-1 bg-transparent py-2 text-base text-snow placeholder:text-gray-medium focus:outline-none" />
          <button type="submit" className="btn-primary shrink-0 rounded-full px-5 py-2.5 text-sm">رشّح لي</button>
        </form>
      </section>

      {/* ٢) بوابة العميل: التميّز الذي لا يعرضه أحد — فوق الطية */}
      <section data-silk="0.5" className="scroll-mt-28 px-6 pb-4 pt-2">
        <motion.div {...reveal} className="material-card container mx-auto grid max-w-6xl items-center gap-8 rounded-3xl p-6 lg:grid-cols-5 lg:p-10">
          <div className="lg:col-span-2">
            <p className="text-sm font-bold text-pulse-orange">AGMA OS · بوابة العميل</p>
            <h2 className="mt-2 text-3xl font-black text-snow">تتابع كل شيء من بوابتك</h2>
            <p className="mt-4 leading-relaxed text-gray-light">تقدّم كل خدمة بنسبة ومهلة، اعتمادات من جوالك، تقارير بلغة عمل، وفواتير في سجل واحد. هذه لقطة حقيقية من البوابة التجريبية، افتحها الآن بلا تسجيل.</p>
            <a href="https://ops.agma.com.sa/portal/demo/" target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex px-6 py-3">جرّب البوابة الآن</a>
          </div>
          <a href="https://ops.agma.com.sa/portal/demo/" target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50 lg:col-span-3" aria-label="افتح البوابة التجريبية">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/portal-demo.jpg" alt="لقطة من بوابة عملاء AGMA OS: تقدم المشروع، القرارات المنتظرة، والنشاط الحي" width={1600} height={1000} loading="eager" className="h-auto w-full" />
          </a>
        </motion.div>
      </section>

      {/* قسم «الدليل» يعود حين تتوفر آراء عملاء موافَق على نشرها (الجدول فارغ اليوم — لا نعرض قسماً فارغاً ولا قصصاً بلا إذن) */}

      {/* ٣) الباقات الثلاث */}
      <section id="packages" data-silk="0.85" className="scroll-mt-28 px-6 py-20">
        <div className="container mx-auto">
          <motion.div {...reveal} className="mb-10 text-center">
            <h2 className="text-3xl font-black text-snow sm:text-4xl">ثلاث باقات، فريق واحد</h2>
            <p className="mt-3 text-gray-medium">كل باقة سنة كاملة بسعر شهري ثابت. اختر باقة لترى خدماتها وقيمتها منفردة.</p>
          </motion.div>
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            {PACKAGES.map((p) => {
              const on = p.id === tier; const mv = monthlyValue(p.id); const save = mv - p.price;
              return (
                <button key={p.id} type="button" onClick={(e) => choose(p, e.currentTarget)} aria-pressed={on}
                  className={`material-panel relative rounded-3xl p-6 text-right transition-opacity lg:p-8 ${on ? 'is-active ring-1 ring-pulse-orange/70' : 'opacity-85 hover:opacity-100'}`}>
                  {p.recommended && <span className="absolute -top-3 right-6 rounded-full bg-pulse-orange px-3 py-1 text-xs font-bold text-snow">توصيتنا</span>}
                  <p className="text-xs font-bold text-pulse-orange">{p.en}</p>
                  <h3 className="mt-1 text-2xl font-black text-snow">{p.name}</h3>
                  <p className="mt-1 text-sm text-gray-light">{p.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-2"><span className="text-4xl font-black text-snow" dir="ltr">{fmt(p.price)}</span><span className="text-sm text-gray-light">ر.س شهرياً · ١٢ شهراً</span></div>
                  <p className="mt-1 text-xs text-gray-medium">منفردة ~{fmt(mv)} · توفّر ~{fmt(save)} شهرياً ({Math.round((save / mv) * 100)}٪)</p>
                  <ul className="mt-5 space-y-1.5 text-sm text-gray-light">
                    {includedServices(p.id).map((s) => <li key={s.id} className="flex items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{s.name}</li>)}
                  </ul>
                  <p className="mt-4 text-xs text-gray-medium">{p.bestFor}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ٤) مسرح الخدمات للباقة المختارة */}
      <section id="services" data-silk="0.6" className="scroll-mt-28 px-6 pb-20">
        <div className="container mx-auto">
          <motion.div {...reveal} className="mb-6 text-center">
            <h2 className="text-2xl font-black text-snow sm:text-4xl">ماذا تسلّم كل خدمة في باقة {pkg.name}؟</h2>
            <p className="mt-2 text-gray-medium">اختر خدمة لترى تسليماتها.</p>
          </motion.div>
          {/* شرائح أفقية (الجوال) / قائمة جانبية (الكمبيوتر) */}
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:col-span-4 lg:flex-col lg:overflow-visible lg:px-0" style={{ scrollSnapType: 'x proximity' }}>
              {svcs.map((s) => (
                <button key={s.id} type="button" onClick={(e) => pick(s, e.currentTarget)} aria-pressed={active.id === s.id}
                  className={`material-card shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-opacity lg:whitespace-normal lg:rounded-2xl lg:p-5 lg:text-right ${active.id === s.id ? 'is-active text-snow' : 'text-gray-light opacity-80 hover:opacity-100'}`}>
                  <span className="block lg:text-lg">{s.name}</span>
                  <span className="hidden lg:mt-1 lg:block lg:text-sm lg:font-normal lg:text-gray-light">{s.promise}</span>
                </button>
              ))}
            </div>
            <div ref={stageRef} className="material-panel rounded-3xl p-5 lg:col-span-8 lg:p-10">
              <Stage kind={active.kind} />
              <div className="mt-4 border-t border-white/[0.06] pt-5">
                <h3 className="text-xl font-bold text-snow">{active.name}</h3>
                <ul className="mt-3 grid gap-2 text-gray-light">
                  {active.items.filter((i) => i.tiers.includes(tier)).map((i) => forTier(i, tier)).map((i) => (<li key={i.text} className="flex items-start gap-2 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{i.text}</li>))}
                </ul>
              </div>
            </div>
          </div>

          {/* قيمة الخدمات منفردة للباقة المختارة */}
          <motion.div {...reveal} className="material-panel mx-auto mt-10 max-w-4xl rounded-[32px] p-6 lg:p-12">
            <div className="text-center">
              <p className="text-sm font-bold text-pulse-orange">باقة {pkg.name} · {pkg.en}</p>
              <div className="mt-3 flex flex-wrap items-baseline justify-center gap-2"><span className="text-5xl font-black text-snow sm:text-6xl" dir="ltr">{fmt(pkg.price)}</span><span className="text-xl text-gray-light">ر.س شهرياً</span></div>
              <p className="mt-2 text-gray-medium">التزام {MONTHS} شهراً · نطاق شهري يُثبَّت في العقد</p>
              <p className="mt-3 text-base font-bold text-pulse-orange">قيمة الخدمات منفردة ~{fmt(monthlyValue(tier))} ر.س شهرياً · توفّر ~{fmt(monthlyValue(tier) - pkg.price)} شهرياً</p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="text-gray-medium"><th className="pb-2 text-right font-medium">البند</th><th className="pb-2 text-right font-medium">أساس الحساب (أسعارنا الإرشادية)</th><th className="pb-2 text-left font-medium">السنة</th></tr></thead>
                <tbody className="text-gray-light">
                  {rows.map((r) => (<tr key={r.text} className="border-t border-white/[0.06]"><td className="max-w-[260px] py-2.5 text-snow">{r.text.split('،')[0].split(':')[0]}</td><td className="py-2.5 text-gray-medium">{r.basis}{r.est ? ' (تقديري)' : ''}</td><td className="py-2.5 text-left" dir="ltr">{fmt(r.yearly)}</td></tr>))}
                  <tr className="border-t border-white/15 font-bold text-snow"><td className="py-3">منفردة</td><td className="py-3 text-gray-medium">{fmt(yearlyValue(tier))} ÷ 12</td><td className="py-3 text-left" dir="ltr">{fmt(yearlyValue(tier))}</td></tr>
                  <tr className="font-bold text-pulse-orange"><td className="py-2">الباقة</td><td className="py-2 text-gray-medium">{fmt(pkg.price)} × 12</td><td className="py-2 text-left" dir="ltr">{fmt(pkg.price * MONTHS)}</td></tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-gray-medium">الحساب من الحدود الدنيا في <Link href="/pricing" className="underline">صفحة التسعير الإرشادية</Link> ودلائل خدماتنا. البنود الموسومة «تقديري» غير مسعّرة هناك فقيمها تقدير معلن. ميزانيات الإعلانات تُدفع للمنصات مباشرة.</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {svcs.map((s) => (<span key={s.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-light">{s.name}</span>))}
              {extras.map((x) => (<button key={x} type="button" onClick={() => setExtras((e) => e.filter((v) => v !== x))} className="rounded-full border border-pulse-orange/60 bg-pulse-orange/10 px-3 py-1 text-sm text-pulse-orange" title="إزالة">{x} ✕</button>))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addExtra(); }} className="mx-auto mt-5 flex max-w-md gap-2">
              <input value={extraDraft} onChange={(e) => setExtraDraft(e.target.value)} placeholder="أضف خدمة أخرى تحتاجها… (مونتاج، فعاليات، علاقات عامة)" className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <button type="submit" className="btn-secondary rounded-full px-5 py-2.5 text-sm">أضف</button>
            </form>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#contact" className="btn-primary px-10 py-4 text-lg">أريد باقة {pkg.name}</a>
              <a href={`${WHATSAPP}?text=${waText}`} target="_blank" rel="noreferrer" className="btn-secondary px-8 py-4 text-lg">اسأل على واتساب</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ٦) خريطة السنة */}
      <section id="roadmap" className="scroll-mt-28 px-6 py-20">
        <motion.div {...reveal} className="container mx-auto mb-12 text-center"><h2 className="text-3xl font-black text-snow sm:text-4xl">خريطة السنة</h2><p className="mt-3 text-gray-medium">أربع مراحل، والضوء ينتقل معك من واحدة إلى التالية.</p></motion.div>
        <div className="container mx-auto grid max-w-4xl gap-12">
          {ROADMAP.map((m, i) => (
            <motion.div key={m.when} data-silk="0.7" {...reveal} className="material-card flex flex-col gap-4 rounded-2xl p-8 sm:flex-row sm:items-start sm:gap-8">
              <div className="shrink-0 sm:w-40"><span className="grid h-12 w-12 place-items-center rounded-full bg-pulse-orange text-xl font-black text-snow">{i + 1}</span><p className="mt-3 text-sm font-bold text-pulse-orange">{m.when}</p><h3 className="text-xl font-bold text-snow">{m.title}</h3></div>
              <ul className="grid flex-1 gap-2 text-gray-light">{m.items.map((t) => (<li key={t} className="flex items-start gap-2 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{t}</li>))}</ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ٧) قبل أن تقرر */}
      <section data-silk="0.4" className="scroll-mt-28 px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <motion.h2 {...reveal} className="mb-8 text-center text-3xl font-black text-snow">قبل أن تقرر</motion.h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="material-card rounded-2xl">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center justify-between gap-4 p-5 text-right"><span className="text-base font-bold text-snow">{f.q}</span><span className={`shrink-0 text-pulse-orange transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span></button>
                <AnimatePresence initial={false}>{openFaq === i && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-gray-light">{f.a}</p></motion.div>)}</AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ٨) الطلب */}
      <section id="contact" data-silk="0.9" className="scroll-mt-28 px-6 pb-32 pt-8">
        <motion.div {...reveal} className="material-panel container mx-auto max-w-2xl rounded-[32px] p-6 lg:p-12">
          <h2 className="text-center text-3xl font-black text-snow">اطلب باقتك</h2>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {PACKAGES.map((p) => (<button key={p.id} type="button" onClick={(e) => choose(p, e.currentTarget)} aria-pressed={p.id === tier} className={`material-card rounded-xl px-2 py-3 text-center text-sm font-bold ${p.id === tier ? 'is-active text-snow' : 'text-gray-light'}`}>{p.name}<span className="block text-xs font-normal text-gray-medium" dir="ltr">{fmt(p.price)}</span></button>))}
          </div>
          <p className="mt-3 text-center text-xs text-gray-medium">{summary}</p>
          {status === 'ok' ? (
            <p className="mt-8 rounded-2xl border border-pulse-orange/40 bg-pulse-orange/10 p-6 text-center text-lg text-snow">وصل طلبك. سيتصل بك الفريق خلال يوم عمل لتثبيت النطاق وموعد المكالمة الاستكشافية.</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))} required minLength={2} placeholder="اسمك" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                <input value={lead.company} onChange={(e) => setLead((l) => ({ ...l, company: e.target.value }))} placeholder="اسم الشركة (اختياري)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={lead.sector} onChange={(e) => setLead((l) => ({ ...l, sector: e.target.value }))} aria-label="قطاعك" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow focus:border-pulse-orange focus:outline-none"><option value="" className="bg-black">قطاعك</option>{SECTORS.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}</select>
                <select value={lead.when} onChange={(e) => setLead((l) => ({ ...l, when: e.target.value }))} aria-label="أفضل وقت للاتصال" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow focus:border-pulse-orange focus:outline-none"><option value="" className="bg-black">أفضل وقت للاتصال</option>{['صباحاً (٩–١٢)', 'ظهراً (١٢–٣)', 'عصراً (٣–٦)', 'مساءً (٦–٩)'].map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}</select>
              </div>
              <div dir="ltr" className="flex gap-2">
                <select value={lead.dial} aria-label="مفتاح الدولة" onChange={(e) => setLead((l) => ({ ...l, dial: e.target.value }))} className="w-36 shrink-0 rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-sm text-snow focus:border-pulse-orange focus:outline-none">{DIAL_CODES.map((d) => <option key={d.code} value={d.code} className="bg-black">{d.flag} {d.code} {d.country}</option>)}</select>
                <input value={lead.phone} onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))} inputMode="tel" required placeholder="5XXXXXXXX" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              <textarea value={lead.message} onChange={(e) => setLead((l) => ({ ...l, message: e.target.value }))} rows={3} placeholder="أخبرنا بسطر عن علامتك وما تريد تطويره (اختياري)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button type="submit" data-silk-ignite disabled={status === 'busy' || lead.name.trim().length < 2 || lead.phone.trim().length < 7} className="btn-primary w-full py-4 text-lg disabled:opacity-60">{status === 'busy' ? 'جارٍ الإرسال…' : `أرسل طلب باقة ${pkg.name}`}</button>
              {status === 'err' && <p className="text-center text-sm text-pulse-orange">تعذر الإرسال. جرّب مرة أخرى أو من <Link href="/contact" className="underline">صفحة التواصل</Link>.</p>}
              <p className="text-center text-xs text-gray-medium">رد خلال يوم عمل · بياناتك تُستخدم للتواصل معك فقط</p>
            </form>
          )}
        </motion.div>
      </section>

      {/* شريط الجوال الثابت */}
      <div className="glass-panel fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 py-3 pl-24 pr-4 lg:hidden">
        <a href="#contact" className="btn-primary px-5 py-3 text-sm">اطلب {pkg.name}</a>
        <div className="text-left"><span className="block text-lg font-black text-snow" dir="ltr">{fmt(pkg.price)} <span className="text-xs font-medium text-gray-light">ر.س/شهر</span></span><span className="block text-[11px] text-gray-medium">١٢ شهراً</span></div>
      </div>
      <Footer />
    </main>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { DIAL_CODES } from '@agma/ui';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Testimonials from '@/components/Testimonials';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/publicConfig';

/**
 * باقة مسرّع الأعمال Business Accelerator — «من الفكرة إلى الأثر».
 * أهم صفحة بيع في الموقع (المالك 2026-09-05). القواعد:
 *  - كل رقم هنا من دلائل الخدمات (service_guides) أو صفحة التسعير الإرشادية.
 *  - «قيمة الخدمات منفردة» جدول محسوب صريح — لا سعر «كان» مشطوب.
 *  - L12: لا قائمة مغلقة (أضف خدمة أخرى). L2: مفتاح الدولة يسار. L11: الجوال إلزامي.
 *  - الحرير هو الخط: مشتعل في البداية، يرسو خلف المسرح، يخيط خريطة السنة،
 *    ويشتعل عند الطلب. ثلاث لحظات بارزة فقط وبقية الحركة هادئة.
 */

const PRICE = 9500;
const MONTHS = 12;
const WHATSAPP = 'https://wa.me/966581195387';
const fmt = (n: number) => n.toLocaleString('en-US');

type Svc = { id: string; name: string; promise: string; monthly: string[] };
const SERVICES: Svc[] = [
  { id: 'web', name: 'الموقع والمنصة', promise: 'موقع يبيع ٢٤/٧ ويتكامل مع حملاتك.',
    monthly: ['موقع كامل يُطلق خلال أول ٤–٨ أسابيع: جوال أولاً وسيو من اليوم الأول', 'صفحة هبوط لكل حملة (٤ في السنة على الأقل) بتتبع تحويل مثبت', 'لوحة إدارة محتوى تحدّث بها بنفسك، والدومين والاستضافة باسمك دائماً'] },
  { id: 'brand', name: 'الهوية البصرية', promise: 'شعار يتحوّل إلى نظام كامل.',
    monthly: ['٣ اتجاهات تصميم ثم هوية كاملة بكل الصيغ خلال ٣–٥ أسابيع', 'دليل هوية: قواعد الشعار والألوان والخطوط ونبرة الصوت', 'أصول شهرية بهويتك: تصاميم إعلانية وأغلفة وقوالب محتوى'] },
  { id: 'photo', name: 'تصوير المنتجات', promise: 'منتجك كما يستحق أن يُرى.',
    monthly: ['جلسة تصوير شهرية بقائمة لقطات معتمدة مسبقاً', 'صور معالجة بجودة الويب والطباعة ومقصوصة لمقاسات منصاتك', 'مكتبة منظمة وحقوق استخدام كاملة لك بلا قيود'] },
  { id: 'social', name: 'السوشال ميديا', promise: 'حضور يومي يبني مجتمعاً لا متابعين فقط.',
    monthly: ['استراتيجية حساب لكل منصة في الشهر الأول: دور وجمهور ونبرة وأعمدة محتوى', 'تقويم شهري تعتمده، ثم تصميم ونشر منشورات وقصص وريلز', 'إدارة تفاعل يومية وتقرير شهري يفرّق النمو الحقيقي عن الأرقام الفارغة'] },
  { id: 'systems', name: 'الأنظمة والأتمتة', promise: 'طلباتك تمشي وحدها من الاستقبال إلى التسليم.',
    monthly: ['روبوت محادثة على واتساب وموقعك يجيب من معرفة منشأتك المعتمدة فقط', 'أتمتة عمليتين على الأقل في السنة من وصول الطلب إلى إقفاله', 'تحديث شهري لقاعدة المعرفة وتنبيهات واضحة لما يتعثر'] },
];

/* قيمة الخدمات منفردة: من الحدود الدنيا الإرشادية في صفحة التسعير ودلائل
   الخدمات، محوّلة إلى متوسط شهري على سنة. التصوير وأصول الهوية الشهرية
   وصيانة الأتمتة غير مسعّرة في الصفحة فقيمها تقديرية معلنة. */
const VALUE_ROWS: { name: string; basis: string; yearly: number }[] = [
  { name: 'الموقع والمنصة', basis: 'موقع من 7,500 + ٤ صفحات هبوط من 2,500', yearly: 7500 + 4 * 2500 },
  { name: 'الهوية البصرية', basis: 'هوية 6,000 + دليل هوية من 4,400 + أصول شهرية ~1,000', yearly: 6000 + 4400 + 12 * 1000 },
  { name: 'تصوير المنتجات', basis: '١٢ جلسة × ~2,500 (تقديري)', yearly: 12 * 2500 },
  { name: 'السوشال ميديا', basis: 'إدارة من 2,800/شهر + مجتمع من 2,200/شهر + استراتيجية من 5,000', yearly: 12 * 2800 + 12 * 2200 + 5000 },
  { name: 'الأنظمة والأتمتة', basis: 'روبوت من 7,500 + مساران من 4,500 + صيانة ~1,500/شهر', yearly: 7500 + 2 * 4500 + 12 * 1500 },
];
const VALUE_YEARLY = VALUE_ROWS.reduce((a, r) => a + r.yearly, 0);
const VALUE_MONTHLY = Math.round(VALUE_YEARLY / 12 / 100) * 100;
const SAVE_MONTHLY = VALUE_MONTHLY - PRICE;
const SAVE_PCT = Math.round((1 - PRICE / VALUE_MONTHLY) * 100);

const ROADMAP = [
  { when: 'الشهر ١', title: 'التأسيس', items: ['استراتيجية سوشال ومُوجّه الهوية وهيكل الموقع معتمدة منك', 'خريطة عملياتك الحالية والمقترحة', 'أول جلسة تصوير'] },
  { when: 'الشهران ٢–٣', title: 'الإطلاق', items: ['الهوية والموقع وروبوت المحادثة يعملون', 'السوشال بإيقاعه الكامل بهويتك الجديدة', 'أول عملية مؤتمتة من الطلب إلى الإقفال'] },
  { when: 'الأشهر ٤–٦', title: 'التسريع', items: ['صفحات هبوط لحملاتك بتتبع تحويل', 'العملية المؤتمتة الثانية', 'تحسين شهري على أرقام حقيقية'] },
  { when: 'الأشهر ٧–١٢', title: 'النمو المركّب', items: ['أصول وتصوير وسوشال بإيقاع ثابت', 'مراجعة ربعية للنتائج والأولويات', 'خريطة السنة الثانية إن أردت الاستمرار'] },
];

const SECTORS = ['التجزئة والمتاجر', 'العقار', 'المطاعم والضيافة', 'الصحة والعيادات', 'التعليم', 'التقنية والتطبيقات', 'الخدمات المهنية', 'أخرى'];

const FAQ: { q: string; a: string }[] = [
  { q: 'لماذا الالتزام سنة كاملة؟', a: 'لأن الهوية والموقع والأتمتة تُبنى في أول ربع وتُثمر في بقية السنة. مدة العقد وشروط الإنهاء تُثبَّت كتابةً قبل أي دفعة.' },
  { q: 'كيف يكون الدفع؟', a: 'شهرياً بفاتورة ضريبية. الأسعار غير شاملة ضريبة القيمة المضافة.' },
  { q: 'من يملك الموقع والهوية والصور؟', a: 'أنت. الدومين والاستضافة باسمك من اليوم الأول، وحقوق الهوية والصور كاملة لك بعد سداد قيمتها.' },
  { q: 'ماذا يحدث في الشهر الأول؟', a: 'تأسيس لا تنفيذ عشوائي: استراتيجية السوشال ومُوجّه الهوية وهيكل الموقع وخريطة عملياتك تُعتمد منك، وأول جلسة تصوير تُنجز.' },
  { q: 'أحتاج خدمة غير الخمس؟', a: 'أضفها من الحقل أسفل الباقة. لدينا ٣٧ خدمة في ٩ فئات، ويُسعَّر الإضافي في عرضك.' },
  { q: 'كيف أتابع العمل؟', a: 'من بوابة العميل في AGMA OS: المهام والتسليمات والتقارير والفواتير في مكان واحد، وتقدر تجرّب البوابة قبل أن تشترك.' },
];

function pulseAt(el: Element | null, amp = 26) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('agma:silk-pulse', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, amp } }));
}

/* ── مسرح العرض ─────────────────────────────────────────────────────── */
function Stage({ id }: { id: string }) {
  const [flip, setFlip] = useState(false);
  useEffect(() => { const t = window.setInterval(() => setFlip((f) => !f), 2600); return () => window.clearInterval(t); }, []);
  const spring = { type: 'spring' as const, bounce: 0, duration: 0.7 };
  const enter = { initial: { opacity: 0, filter: 'blur(8px)' }, animate: { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }, exit: { opacity: 0 } };
  return (
    <div className="relative flex h-[260px] items-center justify-center sm:h-[340px]">
      <AnimatePresence mode="wait">
        {id === 'web' && (
          <motion.div key="web" {...enter} className="flex items-end gap-6">
            <motion.div transition={spring} animate={{ width: flip ? 120 : 320, height: flip ? 210 : 200 }} className="material-card overflow-hidden rounded-2xl p-3">
              <div className="mb-2 h-2 w-1/3 rounded bg-pulse-orange/70" />
              <div className="mb-1 h-1.5 w-4/5 rounded bg-white/20" />
              <div className="mb-3 h-1.5 w-3/5 rounded bg-white/10" />
              <div className="h-7 w-24 rounded bg-pulse-orange" />
            </motion.div>
            <div className="text-right text-sm text-gray-light">
              <p className="font-bold text-snow">{flip ? 'على الجوال' : 'على الكمبيوتر'}</p>
              <p>مسار الطلب واحد: يدخل، يفهم، يطلب.</p>
            </div>
          </motion.div>
        )}
        {id === 'brand' && (
          <motion.div key="brand" {...enter} className="relative h-56 w-full max-w-md">
            <motion.div animate={{ scale: flip ? 0.55 : 1, x: flip ? 150 : 0, y: flip ? -70 : 0 }} transition={spring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-pulse-orange">AG</motion.div>
            {[['موقع', 0, 80], ['بطاقة', -150, 60], ['منشور', -60, 120]].map(([l, x, y], i) => (
              <motion.div key={l} animate={{ opacity: flip ? 1 : 0, x: flip ? Number(x) : 0, y: flip ? Number(y) : 40 }} transition={{ ...spring, delay: i * 0.08 }}
                className="material-card absolute left-1/2 top-1/2 flex h-16 w-28 items-center justify-center rounded-xl text-xs text-gray-light">{l}</motion.div>
            ))}
          </motion.div>
        )}
        {id === 'photo' && (
          <motion.div key="photo" {...enter} className="material-card relative h-52 w-full max-w-md overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-dark to-[#1a1a1f]" />
            <motion.div animate={{ width: flip ? '78%' : '32%' }} transition={spring} className="absolute inset-y-0 right-0 bg-gradient-to-bl from-pulse-orange/70 via-[#3a1a12] to-[#1a1a1f]" />
            <motion.div animate={{ right: flip ? '78%' : '32%' }} transition={spring} className="absolute inset-y-0 w-0.5 bg-snow shadow-[0_0_12px_rgba(255,255,255,.6)]" />
            <span className="absolute bottom-3 left-3 text-xs text-gray-medium">قبل</span>
            <span className="absolute bottom-3 right-3 text-xs font-bold text-snow">بعد</span>
          </motion.div>
        )}
        {id === 'social' && (
          <motion.div key="social" {...enter} className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div key={i} animate={{ opacity: flip ? 1 : i % 2 ? 0.25 : 1, scale: flip ? 1 : 0.9, rotate: flip ? 0 : (i % 3 - 1) * 4 }} transition={{ ...spring, delay: i * 0.03 }}
                className={`material-card h-14 w-14 rounded-lg sm:h-20 sm:w-20 ${i === 4 ? 'is-active' : ''}`} />
            ))}
          </motion.div>
        )}
        {id === 'systems' && (
          <motion.div key="systems" {...enter} className="flex w-full max-w-md items-center justify-between gap-2" dir="rtl">
            {['طلب', 'ردّ آلي', 'تسعير', 'تنفيذ', 'تسليم'].map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-2">
                <motion.div animate={{ scale: (flip ? i >= 2 : i < 2) ? 1.15 : 1, borderColor: (flip ? i >= 2 : i < 2) ? 'rgba(244,77,43,.9)' : 'rgba(255,255,255,.1)' }} transition={spring}
                  className="material-card grid h-11 w-11 place-items-center rounded-full text-xs font-bold text-snow">{i + 1}</motion.div>
                <span className="text-[11px] text-gray-light">{s}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AcceleratorClient() {
  const [active, setActive] = useState<Svc>(SERVICES[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const [extraDraft, setExtraDraft] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const [lead, setLead] = useState({ name: '', company: '', sector: '', dial: '+966', phone: '', when: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const summary = useMemo(() => {
    const base = `باقة مسرّع الأعمال Business Accelerator (${fmt(PRICE)} ر.س/شهر × ${MONTHS} شهراً؛ قيمة الخدمات منفردة ~${fmt(VALUE_MONTHLY)}): ` + SERVICES.map((s) => s.name).join('، ');
    return extras.length ? `${base} + إضافات: ${extras.join('، ')}` : base;
  }, [extras]);

  function pick(s: Svc, btn: HTMLElement) {
    setActive(s); pulseAt(btn, 22);
    window.setTimeout(() => pulseAt(stageRef.current, 18), 180);
  }
  function addExtra() {
    const v = extraDraft.trim(); if (v.length < 2) return;
    setExtras((x) => (x.includes(v) ? x : [...x, v])); setExtraDraft('');
  }
  function askAssistant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement;
    const v = input.value.trim(); if (v.length < 3) return;
    window.dispatchEvent(new CustomEvent('agma:ask', { detail: { question: `نشاطي: ${v}. كيف تفيدني باقة مسرّع الأعمال (موقع، هوية، تصوير، سوشال، أتمتة) وما أول ما تبدأون به؟` } }));
    input.value = '';
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (status === 'busy') return; setStatus('busy');
    try {
      const details = [lead.sector && `القطاع: ${lead.sector}`, lead.when && `أفضل وقت للاتصال: ${lead.when}`, lead.message.trim() && `رسالة: ${lead.message.trim()}`, `الخدمة المعروضة عند الطلب: ${active.name}`].filter(Boolean).join(' · ');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ name: lead.name.trim(), company: lead.company.trim() || undefined, phone: lead.dial + lead.phone.trim().replace(/^0+/, ''), services: summary, message: `من صفحة مسرّع الأعمال — ${details}`, source: 'site', website: '' }),
      });
      setStatus(res.ok ? 'ok' : 'err');
      if (res.ok) pulseAt(document.querySelector('[data-silk-ignite]'), 40);
    } catch { setStatus('err'); }
  }

  const reveal = {
    initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
    viewport: { once: true, margin: '-80px' },
  };
  const waText = encodeURIComponent(`أهلاً فريق AGMA، أريد الاستفسار عن باقة مسرّع الأعمال (${fmt(PRICE)} ر.س شهرياً لمدة سنة).`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Product', name: 'باقة مسرّع الأعمال Business Accelerator', description: 'موقع، هوية بصرية، تصوير منتجات، سوشال ميديا، وأنظمة أتمتة بفريق واحد لمدة سنة.', brand: { '@type': 'Brand', name: 'AGMA' },
        offers: { '@type': 'Offer', price: String(PRICE), priceCurrency: 'SAR', availability: 'https://schema.org/InStock', url: 'https://agma.com.sa/business-accelerator/', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(PRICE), priceCurrency: 'SAR', unitText: 'MONTH', valueAddedTaxIncluded: false } } },
      { '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };

  return (
    <main data-silk-mood="home" className="min-h-screen relative overflow-hidden pb-20 lg:pb-0" suppressHydrationWarning>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* ١) الفكرة */}
      <section data-silk="1" className="relative px-6 pb-20 pt-40 text-center lg:pt-52">
        <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-[#0A0A0A]/60 via-transparent to-[#0A0A0A]/60 opacity-40" />
        <p className="mx-auto mb-6 inline-block rounded-full border border-pulse-orange/40 bg-pulse-orange/10 px-4 py-1.5 text-sm font-bold text-pulse-orange">Business Accelerator</p>
        <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.25] text-snow sm:text-6xl lg:text-7xl">
          <motion.span className="block" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8 }}>باقة مسرّع الأعمال</motion.span>
          <motion.span className="block text-gradient" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8, delay: 0.35 }}>من الفكرة إلى الأثر</motion.span>
        </h1>
        <motion.p {...reveal} className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-light">
          موقع، هوية، تصوير، سوشال، وأتمتة. فريق واحد يديرها كلها لعلامتك سنة كاملة بـ{fmt(PRICE)} ر.س شهرياً، وتتابع كل شيء من بوابتك.
        </motion.p>
        <motion.div {...reveal} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#package" className="btn-primary px-10 py-4 text-lg">اكتشف الباقة</a>
          <a href="#roadmap" className="btn-secondary px-10 py-4 text-lg">خريطة السنة</a>
        </motion.div>
        {/* المساعد يخصّص الإجابة لقطاع الزائر */}
        <form onSubmit={askAssistant} className="mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] p-1.5 pr-5">
          <input name="q" placeholder="اكتب نشاطك بسطر… ومساعدنا يشرح كيف يخدمك المسرّع" aria-label="اكتب نشاطك ليشرح المساعد كيف يخدمك المسرّع"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-snow placeholder:text-gray-medium focus:outline-none" />
          <button type="submit" className="btn-primary shrink-0 rounded-full px-5 py-2.5 text-sm">اشرح لي</button>
        </form>
      </section>

      {/* ٢) الدليل */}
      <section data-silk="0.45" className="px-6 py-16">
        <motion.div {...reveal} className="container mx-auto mb-4 text-center">
          <h2 className="text-3xl font-black text-snow sm:text-4xl">الدليل قبل الكلام</h2>
          <p className="mt-3 text-gray-medium">آراء عملاء وافقوا على نشرها من استبيان الرضا. لا نعرض قصصاً بلا إذن أصحابها.</p>
        </motion.div>
        <Testimonials />
      </section>

      {/* ٣) مسرح الخدمات */}
      <section id="package" data-silk="0.6" className="px-6 py-20">
        <div className="container mx-auto">
          <motion.div {...reveal} className="mb-10 text-center">
            <h2 className="text-3xl font-black text-snow sm:text-4xl">خمس خدمات، فريق واحد</h2>
            <p className="mt-3 text-gray-medium">اختر خدمة لترى ما تسلّمه كل شهر. الضوء يتبع اختيارك.</p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div ref={stageRef} className="material-panel order-first rounded-3xl p-5 lg:order-none lg:col-span-8 lg:p-10">
              <Stage id={active.id} />
              <div className="mt-4 border-t border-white/[0.06] pt-5">
                <h3 className="text-xl font-bold text-snow">{active.name}</h3>
                <ul className="mt-3 grid gap-2 text-gray-light">
                  {active.monthly.map((m) => (<li key={m} className="flex items-start gap-2 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{m}</li>))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              {SERVICES.map((s) => (
                <button key={s.id} type="button" onClick={(e) => pick(s, e.currentTarget)}
                  className={`material-card rounded-2xl p-4 text-right transition-opacity lg:p-5 ${active.id === s.id ? 'is-active' : 'opacity-75 hover:opacity-100'}`}>
                  <span className="block text-lg font-bold text-snow">{s.name}</span>
                  <span className="mt-1 block text-sm text-gray-light">{s.promise}</span>
                </button>
              ))}
            </div>
          </div>

          {/* الباقة + قيمة الخدمات منفردة */}
          <motion.div {...reveal} className="material-panel mx-auto mt-12 max-w-4xl rounded-[32px] p-8 lg:p-12">
            <div className="text-center">
              <p className="text-sm font-bold text-pulse-orange">باقة مسرّع الأعمال · Business Accelerator</p>
              <div className="mt-4 flex flex-wrap items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-snow sm:text-6xl" dir="ltr">{fmt(PRICE)}</span>
                <span className="text-xl text-gray-light">ر.س شهرياً</span>
              </div>
              <p className="mt-2 text-gray-medium">التزام {MONTHS} شهراً · الخدمات الخمس معاً · نطاق شهري يُثبَّت في العقد · غير شامل ضريبة القيمة المضافة</p>
              <p className="mt-3 text-base font-bold text-pulse-orange">قيمة الخدمات منفردة ~{fmt(VALUE_MONTHLY)} ر.س شهرياً · توفّر ~{fmt(SAVE_MONTHLY)} شهرياً ({SAVE_PCT}٪)</p>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-medium"><th className="pb-2 text-right font-medium">الخدمة</th><th className="pb-2 text-right font-medium">أساس الحساب (أسعارنا الإرشادية)</th><th className="pb-2 text-left font-medium">السنة</th></tr></thead>
                <tbody className="text-gray-light">
                  {VALUE_ROWS.map((r) => (
                    <tr key={r.name} className="border-t border-white/[0.06]"><td className="py-2.5 font-bold text-snow">{r.name}</td><td className="py-2.5 text-gray-medium">{r.basis}</td><td className="py-2.5 text-left" dir="ltr">{fmt(r.yearly)}</td></tr>
                  ))}
                  <tr className="border-t border-white/15 font-bold text-snow"><td className="py-3">منفردة</td><td className="py-3 text-gray-medium">{fmt(VALUE_YEARLY)} ÷ 12</td><td className="py-3 text-left" dir="ltr">{fmt(VALUE_YEARLY)}</td></tr>
                  <tr className="font-bold text-pulse-orange"><td className="py-2">المسرّع</td><td className="py-2 text-gray-medium">{fmt(PRICE)} × 12 شهراً</td><td className="py-2 text-left" dir="ltr">{fmt(PRICE * MONTHS)}</td></tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-gray-medium">الحساب من الحدود الدنيا في <Link href="/pricing" className="underline">صفحة التسعير الإرشادية</Link> ودلائل خدماتنا. البنود الموسومة «تقديري» غير مسعّرة هناك فقيمها تقدير معلن.</p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SERVICES.map((s) => (<span key={s.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-light">{s.name}</span>))}
              {extras.map((x) => (<button key={x} type="button" onClick={() => setExtras((e) => e.filter((v) => v !== x))} className="rounded-full border border-pulse-orange/60 bg-pulse-orange/10 px-3 py-1 text-sm text-pulse-orange" title="إزالة">{x} ✕</button>))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addExtra(); }} className="mx-auto mt-5 flex max-w-md gap-2">
              <input value={extraDraft} onChange={(e) => setExtraDraft(e.target.value)} placeholder="أضف خدمة أخرى تحتاجها… (مونتاج، إعلانات، سيو)"
                className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <button type="submit" className="btn-secondary rounded-full px-5 py-2.5 text-sm">أضف</button>
            </form>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#contact" className="btn-primary px-10 py-4 text-lg">أريد هذه الباقة</a>
              <a href={`${WHATSAPP}?text=${waText}`} target="_blank" rel="noreferrer" className="btn-secondary px-8 py-4 text-lg">اسأل على واتساب</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ٤) بوابة العميل */}
      <section data-silk="0.5" className="px-6 py-16">
        <motion.div {...reveal} className="material-card container mx-auto grid max-w-5xl gap-8 rounded-3xl p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <p className="text-sm font-bold text-pulse-orange">AGMA OS · بوابة العميل</p>
            <h2 className="mt-2 text-3xl font-black text-snow">تتابع كل شيء من بوابتك</h2>
            <p className="mt-4 leading-relaxed text-gray-light">المهام والتسليمات والاعتمادات والتقارير والفواتير في مكان واحد. تعرف ماذا يحدث اليوم وماذا يأتي غداً بلا رسائل متفرقة.</p>
            <a href="https://ops.agma.com.sa/portal/demo/" target="_blank" rel="noreferrer" className="btn-secondary mt-6 inline-flex px-6 py-3">جرّب البوابة الآن</a>
          </div>
          <ul className="grid gap-3 text-gray-light">
            {['تقدّم كل خدمة من الخمس بنسبة ومهلة', 'اعتماد التصاميم والتقويم من جوالك', 'تقارير شهرية بلغة عمل لا مصطلحات', 'الفواتير الضريبية والمدفوعات في سجل واحد'].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{t}</li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* ٥) خريطة السنة: الحرير يخيط المحطات */}
      <section id="roadmap" className="px-6 py-20">
        <motion.div {...reveal} className="container mx-auto mb-12 text-center">
          <h2 className="text-3xl font-black text-snow sm:text-4xl">خريطة السنة</h2>
          <p className="mt-3 text-gray-medium">أربع مراحل، والضوء ينتقل معك من واحدة إلى التالية.</p>
        </motion.div>
        <div className="container mx-auto grid max-w-4xl gap-12">
          {ROADMAP.map((m, i) => (
            <motion.div key={m.when} data-silk="0.7" {...reveal} className="material-card flex flex-col gap-4 rounded-2xl p-8 sm:flex-row sm:items-start sm:gap-8">
              <div className="shrink-0 sm:w-40">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-pulse-orange text-xl font-black text-snow">{i + 1}</span>
                <p className="mt-3 text-sm font-bold text-pulse-orange">{m.when}</p>
                <h3 className="text-xl font-bold text-snow">{m.title}</h3>
              </div>
              <ul className="grid flex-1 gap-2 text-gray-light">
                {m.items.map((t) => (<li key={t} className="flex items-start gap-2 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{t}</li>))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ٦) الأسئلة التي تمنع الشراء */}
      <section data-silk="0.4" className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <motion.h2 {...reveal} className="mb-8 text-center text-3xl font-black text-snow">قبل أن تقرر</motion.h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="material-card rounded-2xl">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 p-5 text-right">
                  <span className="text-base font-bold text-snow">{f.q}</span>
                  <span className={`shrink-0 text-pulse-orange transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-gray-light">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ٧) الطلب */}
      <section id="contact" data-silk="0.9" className="px-6 pb-32 pt-8">
        <motion.div {...reveal} className="material-panel container mx-auto max-w-2xl rounded-[32px] p-8 lg:p-12">
          <h2 className="text-center text-3xl font-black text-snow">اطلب الباقة</h2>
          <p className="mt-2 text-center text-sm text-gray-medium">{summary}</p>
          {status === 'ok' ? (
            <p className="mt-8 rounded-2xl border border-pulse-orange/40 bg-pulse-orange/10 p-6 text-center text-lg text-snow">وصل طلبك. سيتصل بك الفريق خلال يوم عمل لتثبيت النطاق وموعد المكالمة الاستكشافية.</p>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))} required minLength={2} placeholder="اسمك" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                <input value={lead.company} onChange={(e) => setLead((l) => ({ ...l, company: e.target.value }))} placeholder="اسم الشركة (اختياري)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={lead.sector} onChange={(e) => setLead((l) => ({ ...l, sector: e.target.value }))} aria-label="قطاعك" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow focus:border-pulse-orange focus:outline-none">
                  <option value="" className="bg-black">قطاعك</option>
                  {SECTORS.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
                </select>
                <select value={lead.when} onChange={(e) => setLead((l) => ({ ...l, when: e.target.value }))} aria-label="أفضل وقت للاتصال" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow focus:border-pulse-orange focus:outline-none">
                  <option value="" className="bg-black">أفضل وقت للاتصال</option>
                  {['صباحاً (٩–١٢)', 'ظهراً (١٢–٣)', 'عصراً (٣–٦)', 'مساءً (٦–٩)'].map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
                </select>
              </div>
              {/* L2: المفتاح يسار والرقم يمين · L11: الجوال إلزامي */}
              <div dir="ltr" className="flex gap-2">
                <select value={lead.dial} aria-label="مفتاح الدولة" onChange={(e) => setLead((l) => ({ ...l, dial: e.target.value }))} className="w-36 shrink-0 rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-sm text-snow focus:border-pulse-orange focus:outline-none">
                  {DIAL_CODES.map((d) => <option key={d.code} value={d.code} className="bg-black">{d.flag} {d.code} {d.country}</option>)}
                </select>
                <input value={lead.phone} onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))} inputMode="tel" required placeholder="5XXXXXXXX" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              <textarea value={lead.message} onChange={(e) => setLead((l) => ({ ...l, message: e.target.value }))} rows={3} placeholder="أخبرنا بسطر عن علامتك وما تريد تطويره (اختياري)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button type="submit" data-silk-ignite disabled={status === 'busy' || lead.name.trim().length < 2 || lead.phone.trim().length < 7} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
                {status === 'busy' ? 'جارٍ الإرسال…' : 'أرسل الطلب'}
              </button>
              {status === 'err' && <p className="text-center text-sm text-pulse-orange">تعذر الإرسال. جرّب مرة أخرى أو من <Link href="/contact" className="underline">صفحة التواصل</Link>.</p>}
              <p className="text-center text-xs text-gray-medium">رد خلال يوم عمل · بياناتك تُستخدم للتواصل معك فقط</p>
            </form>
          )}
        </motion.div>
      </section>

      {/* شريط الجوال الثابت: السعر والفعل دائماً في متناول الإبهام */}
      {/* الزر يميناً (أول عنصر في RTL) والسعر يساراً مع مساحة لفقاعة المساعد */}
      <div className="glass-panel fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 py-3 pl-24 pr-4 lg:hidden">
        <a href="#contact" className="btn-primary px-6 py-3 text-sm">اطلب الباقة</a>
        <div className="text-left"><span className="block text-lg font-black text-snow" dir="ltr">{fmt(PRICE)} <span className="text-xs font-medium text-gray-light">ر.س/شهر</span></span><span className="block text-[11px] text-gray-medium">١٢ شهراً</span></div>
      </div>

      <Footer />
    </main>
  );
}

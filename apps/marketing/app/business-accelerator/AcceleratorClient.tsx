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
 * ثلاث لحظات بارزة فقط (دخول الدليل، تبديل الخدمة، الوصول للتواصل) وبقية
 * الحركة هادئة. الحرير هو الخط الذي يرافق الرحلة: مشتعل في البداية، يهدأ
 * خلف الدليل، يرسو خلف مسرح الخدمات، يخيط محطات البداية، ويشتعل عند الطلب.
 * الباقة: خمس خدمات متكاملة بـ 9,500 ر.س شهرياً لمدة سنة (قرار المالك).
 * L12: لا قائمة مغلقة — «أضف خدمة أخرى» حرّ دائماً.
 */

type Svc = {
  id: string; name: string; promise: string; monthly: string[];
};
const SERVICES: Svc[] = [
  { id: 'web', name: 'الموقع والمنصة', promise: 'موقع يبيع ٢٤/٧ ويتكامل مع حملاتك.',
    monthly: ['موقع سريع بهوية علامتك', 'صفحات هبوط لكل حملة', 'تحسين مستمر على أرقام حقيقية'] },
  { id: 'brand', name: 'الهوية البصرية', promise: 'شعار يتحوّل إلى نظام كامل.',
    monthly: ['هوية وتطبيقاتها الرقمية والمطبوعة', 'دليل استخدام حي', 'قوالب محتوى جاهزة'] },
  { id: 'photo', name: 'تصوير المنتجات', promise: 'منتجك كما يستحق أن يُرى.',
    monthly: ['جلسة تصوير شهرية', 'معالجة وقصّ للمنصات', 'مقاطع قصيرة للمنتج'] },
  { id: 'social', name: 'السوشال ميديا', promise: 'حضور يومي يبني مجتمعاً لا متابعين فقط.',
    monthly: ['تقويم محتوى شهري', 'تصميم ونشر وإدارة تفاعل', 'تقرير أداء شهري'] },
  { id: 'systems', name: 'الأنظمة والأتمتة', promise: 'طلباتك تمشي وحدها من الاستقبال إلى التسليم.',
    monthly: ['أتمتة استقبال الطلبات والرد', 'لوحة متابعة حية', 'تكامل مع واتساب وأدواتك'] },
];

const PRICE = '9,500';
const WAS_PRICE = '15,000';   /* السعر السابق (قرار المالك) */
const MONTHS = 12;

function pulseAt(el: Element | null, amp = 26) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('agma:silk-pulse', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, amp } }));
}

/* ── مسرح العرض: رسم بسيط يوضح قيمة كل خدمة ─────────────────────────── */
function Stage({ id }: { id: string }) {
  const [flip, setFlip] = useState(false);
  useEffect(() => { const t = window.setInterval(() => setFlip((f) => !f), 2600); return () => window.clearInterval(t); }, []);
  const spring = { type: 'spring' as const, bounce: 0, duration: 0.7 };
  return (
    <div className="relative flex h-[300px] items-center justify-center sm:h-[360px]">
      <AnimatePresence mode="wait">
        {id === 'web' && (
          <motion.div key="web" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} exit={{ opacity: 0 }} className="flex items-end gap-6">
            <motion.div layout transition={spring} animate={{ width: flip ? 120 : 340, height: flip ? 220 : 210 }}
              className="material-card overflow-hidden rounded-2xl p-3">
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
          <motion.div key="brand" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} exit={{ opacity: 0 }} className="relative h-64 w-full max-w-md">
            <motion.div animate={{ scale: flip ? 0.55 : 1, x: flip ? 150 : 0, y: flip ? -70 : 0 }} transition={spring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-pulse-orange">AG</motion.div>
            {[['موقع', 0, 80], ['بطاقة', -150, 60], ['منشور', -60, 120]].map(([l, x, y], i) => (
              <motion.div key={l} animate={{ opacity: flip ? 1 : 0, x: flip ? Number(x) : 0, y: flip ? Number(y) : 40 }} transition={{ ...spring, delay: i * 0.08 }}
                className="material-card absolute left-1/2 top-1/2 flex h-16 w-28 items-center justify-center rounded-xl text-xs text-gray-light">{l}</motion.div>
            ))}
          </motion.div>
        )}
        {id === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} exit={{ opacity: 0 }}
            className="material-card relative h-56 w-full max-w-md overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-dark to-[#1a1a1f]" />
            <motion.div animate={{ width: flip ? '78%' : '32%' }} transition={spring}
              className="absolute inset-y-0 right-0 bg-gradient-to-bl from-pulse-orange/70 via-[#3a1a12] to-[#1a1a1f]" />
            <motion.div animate={{ right: flip ? '78%' : '32%' }} transition={spring}
              className="absolute inset-y-0 w-0.5 bg-snow shadow-[0_0_12px_rgba(255,255,255,.6)]" />
            <span className="absolute bottom-3 left-3 text-xs text-gray-medium">قبل</span>
            <span className="absolute bottom-3 right-3 text-xs font-bold text-snow">بعد</span>
          </motion.div>
        )}
        {id === 'social' && (
          <motion.div key="social" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div key={i} animate={{ opacity: flip ? 1 : i % 2 ? 0.25 : 1, scale: flip ? 1 : 0.9, rotate: flip ? 0 : (i % 3 - 1) * 4 }}
                transition={{ ...spring, delay: i * 0.03 }}
                className={`material-card h-16 w-16 rounded-lg sm:h-20 sm:w-20 ${i === 4 ? 'is-active' : ''}`} />
            ))}
          </motion.div>
        )}
        {id === 'systems' && (
          <motion.div key="systems" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} exit={{ opacity: 0 }}
            className="flex w-full max-w-md items-center justify-between gap-2" dir="rtl">
            {['طلب', 'ردّ آلي', 'تسعير', 'تنفيذ', 'تسليم'].map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-2">
                <motion.div animate={{ scale: (flip ? i >= 2 : i < 2) ? 1.15 : 1, borderColor: (flip ? i >= 2 : i < 2) ? 'rgba(244,77,43,.9)' : 'rgba(255,255,255,.1)' }}
                  transition={spring} className="material-card grid h-12 w-12 place-items-center rounded-full text-xs font-bold text-snow">{i + 1}</motion.div>
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
  const stageRef = useRef<HTMLDivElement>(null);

  const [lead, setLead] = useState({ name: '', company: '', dial: '+966', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const summary = useMemo(() => {
    const base = `باقة مسرّع الأعمال Business Accelerator (${PRICE} ر.س/شهر بدلاً من ${WAS_PRICE} × ${MONTHS} شهراً): ` + SERVICES.map((s) => s.name).join('، ');
    return extras.length ? `${base} + إضافات: ${extras.join('، ')}` : base;
  }, [extras]);

  function pick(s: Svc, btn: HTMLElement) {
    setActive(s);
    pulseAt(btn, 22);
    window.setTimeout(() => pulseAt(stageRef.current, 18), 180);
  }
  function addExtra() {
    const v = extraDraft.trim();
    if (v.length < 2) return;
    setExtras((x) => (x.includes(v) ? x : [...x, v]));
    setExtraDraft('');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'busy') return;
    setStatus('busy');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          name: lead.name.trim(), company: lead.company.trim() || undefined,
          phone: lead.dial + lead.phone.trim().replace(/^0+/, ''),
          services: summary, message: lead.message.trim() || `اهتمام من صفحة مسرّع الأعمال — الخدمة المعروضة عند الطلب: ${active.name}`,
          source: 'site', website: '',
        }),
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

  return (
    <main data-silk-mood="home" className="min-h-screen relative overflow-hidden" suppressHydrationWarning>
      <Header />

      {/* ١) الفكرة */}
      <section data-silk="1" className="relative px-6 pb-24 pt-40 text-center lg:pt-52">
        <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-[#0A0A0A]/60 via-transparent to-[#0A0A0A]/60 opacity-40" />
        <p className="mx-auto mb-6 inline-block rounded-full border border-pulse-orange/40 bg-pulse-orange/10 px-4 py-1.5 text-sm font-bold text-pulse-orange">Business Accelerator</p>
        <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.25] text-snow sm:text-6xl lg:text-7xl">
          <motion.span className="block" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8 }}>باقة مسرّع الأعمال</motion.span>
          <motion.span className="block text-gradient" initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }} transition={{ type: 'spring', bounce: 0, duration: 0.8, delay: 0.35 }}>من الفكرة إلى الأثر</motion.span>
        </h1>
        <motion.p {...reveal} className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-light">
          خمس خدمات تعمل كفريق واحد على علامتك، بباقة واحدة وسعر واحد، لمدة سنة. تابع الضوء.
        </motion.p>
        <motion.div {...reveal} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#package" className="btn-primary px-10 py-4 text-lg">اكتشف الباقة</a>
          <a href="#start" className="btn-secondary px-10 py-4 text-lg">كيف نبدأ؟</a>
        </motion.div>
      </section>

      {/* ٢) الدليل */}
      <section data-silk="0.45" className="px-6 py-20">
        <motion.div {...reveal} className="container mx-auto mb-4 text-center">
          <h2 className="text-3xl font-black text-snow sm:text-4xl">الدليل قبل الكلام</h2>
          <p className="mt-3 text-gray-medium">آراء عملاء وافقوا على نشرها من استبيان الرضا. لا نعرض قصصاً بلا إذن أصحابها.</p>
        </motion.div>
        <Testimonials />
      </section>

      {/* ٣) مسرح الخدمات + الباقة */}
      <section id="package" data-silk="0.6" className="px-6 py-24">
        <div className="container mx-auto">
          <motion.div {...reveal} className="mb-12 text-center">
            <h2 className="text-3xl font-black text-snow sm:text-4xl">الباقة المتكاملة</h2>
            <p className="mt-3 text-gray-medium">اختر خدمة لترى ما تفعله بعلامتك. الضوء يتبع اختيارك.</p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* قائمة الخدمات */}
            <div className="flex flex-col gap-3 lg:col-span-4">
              {SERVICES.map((s) => (
                <button key={s.id} type="button" onClick={(e) => pick(s, e.currentTarget)}
                  className={`material-card rounded-2xl p-5 text-right transition-opacity ${active.id === s.id ? 'is-active' : 'opacity-75 hover:opacity-100'}`}>
                  <span className="block text-lg font-bold text-snow">{s.name}</span>
                  <span className="mt-1 block text-sm text-gray-light">{s.promise}</span>
                </button>
              ))}
            </div>

            {/* المسرح */}
            <div ref={stageRef} className="material-panel rounded-3xl p-6 lg:col-span-8 lg:p-10">
              <Stage id={active.id} />
              <div className="mt-6 border-t border-white/[0.06] pt-6">
                <h3 className="text-xl font-bold text-snow">{active.name}</h3>
                <ul className="mt-3 grid gap-2 text-gray-light sm:grid-cols-3">
                  {active.monthly.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-orange" />{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* كرت الباقة */}
          <motion.div {...reveal} className="material-panel mx-auto mt-12 max-w-4xl rounded-[32px] p-8 text-center lg:p-12">
            <p className="text-sm font-bold text-pulse-orange">باقة مسرّع الأعمال · Business Accelerator</p>
            <div className="mt-4 flex flex-wrap items-baseline justify-center gap-3">
              <span className="text-2xl text-gray-medium line-through decoration-pulse-orange/70" dir="ltr">{WAS_PRICE}</span>
              <span className="text-5xl font-black text-snow sm:text-6xl" dir="ltr">{PRICE}</span>
              <span className="text-xl text-gray-light">ر.س شهرياً</span>
            </div>
            <p className="mt-1 text-sm font-bold text-pulse-orange">وفّر 5,500 ر.س شهرياً · 66,000 ر.س في السنة</p>
            <p className="mt-2 text-gray-medium">التزام {MONTHS} شهراً · الخدمات الخمس معاً · نطاق شهري يُثبَّت في العقد · غير شامل ضريبة القيمة المضافة</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SERVICES.map((s) => (
                <span key={s.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-light">{s.name}</span>
              ))}
              {extras.map((x) => (
                <button key={x} type="button" onClick={() => setExtras((e) => e.filter((v) => v !== x))}
                  className="rounded-full border border-pulse-orange/60 bg-pulse-orange/10 px-3 py-1 text-sm text-pulse-orange" title="إزالة">{x} ✕</button>
              ))}
            </div>
            {/* L12: لا قائمة مغلقة */}
            <form onSubmit={(e) => { e.preventDefault(); addExtra(); }} className="mx-auto mt-6 flex max-w-md gap-2">
              <input value={extraDraft} onChange={(e) => setExtraDraft(e.target.value)} placeholder="أضف خدمة أخرى تحتاجها… (مونتاج، إعلانات، سيو)"
                className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <button type="submit" className="btn-secondary rounded-full px-5 py-2.5 text-sm">أضف</button>
            </form>
            <a href="#contact" className="btn-primary mt-8 inline-flex px-10 py-4 text-lg">أريد هذه الباقة</a>
          </motion.div>
        </div>
      </section>

      {/* ٤) كيف نبدأ: الحرير يخيط المحطات */}
      <section id="start" className="px-6 py-24">
        <motion.div {...reveal} className="container mx-auto mb-12 text-center">
          <h2 className="text-3xl font-black text-snow sm:text-4xl">كيف نبدأ؟</h2>
          <p className="mt-3 text-gray-medium">ثلاث محطات، والضوء ينتقل معك من واحدة إلى التالية.</p>
        </motion.div>
        <div className="container mx-auto grid max-w-4xl gap-16">
          {[
            ['١', 'مكالمة استكشافية', 'نسمع قصة علامتك ونحدد التحدي الحقيقي خلال ٤٥ دقيقة.'],
            ['٢', 'خطة الشهر الأول', 'نطاق شهري مكتوب لكل خدمة من الخمس، وجدول تسليم واضح.'],
            ['٣', 'الانطلاق', 'الفريق الكامل يبدأ، ولوحة متابعة حية بين يديك من اليوم الأول.'],
          ].map(([n, t, d]) => (
            <motion.div key={n} data-silk="0.7" {...reveal} className="material-card flex items-start gap-6 rounded-2xl p-8">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pulse-orange text-xl font-black text-snow">{n}</span>
              <div>
                <h3 className="text-xl font-bold text-snow">{t}</h3>
                <p className="mt-2 text-gray-light">{d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ٥) تواصل: الخط ينتهي عند الطلب */}
      <section id="contact" data-silk="0.9" className="px-6 pb-32 pt-12">
        <motion.div {...reveal} className="material-panel container mx-auto max-w-2xl rounded-[32px] p-8 lg:p-12">
          <h2 className="text-center text-3xl font-black text-snow">اطلب الباقة</h2>
          <p className="mt-2 text-center text-sm text-gray-medium">{summary}</p>
          {status === 'ok' ? (
            <p className="mt-8 rounded-2xl border border-pulse-orange/40 bg-pulse-orange/10 p-6 text-center text-lg text-snow">
              وصل طلبك. سيتصل بك الفريق خلال يوم عمل لتثبيت النطاق وموعد المكالمة الاستكشافية.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))} required minLength={2} placeholder="اسمك"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                <input value={lead.company} onChange={(e) => setLead((l) => ({ ...l, company: e.target.value }))} placeholder="اسم الشركة (اختياري)"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              {/* L2: المفتاح يسار والرقم يمين · L11: الجوال إلزامي */}
              <div dir="ltr" className="flex gap-2">
                <select value={lead.dial} aria-label="مفتاح الدولة" onChange={(e) => setLead((l) => ({ ...l, dial: e.target.value }))}
                  className="w-36 shrink-0 rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-sm text-snow focus:border-pulse-orange focus:outline-none">
                  {DIAL_CODES.map((d) => <option key={d.code} value={d.code} className="bg-black">{d.flag} {d.code} {d.country}</option>)}
                </select>
                <input value={lead.phone} onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))} inputMode="tel" required placeholder="5XXXXXXXX"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              </div>
              <textarea value={lead.message} onChange={(e) => setLead((l) => ({ ...l, message: e.target.value }))} rows={3} placeholder="أخبرنا بسطر عن علامتك وما تريد تطويره (اختياري)"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button type="submit" data-silk-ignite disabled={status === 'busy' || lead.name.trim().length < 2 || lead.phone.trim().length < 7}
                className="btn-primary w-full py-4 text-lg disabled:opacity-60">
                {status === 'busy' ? 'جارٍ الإرسال…' : 'أرسل الطلب'}
              </button>
              {status === 'err' && <p className="text-center text-sm text-pulse-orange">تعذر الإرسال. جرّب مرة أخرى أو من <Link href="/contact" className="underline">صفحة التواصل</Link>.</p>}
              <p className="text-center text-xs text-gray-medium">رد خلال يوم عمل · بياناتك تُستخدم للتواصل معك فقط</p>
            </form>
          )}
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

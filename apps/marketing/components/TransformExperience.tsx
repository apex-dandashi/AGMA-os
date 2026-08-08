'use client';

import React, { useState } from 'react';
import { SUPABASE_URL } from '@/lib/publicConfig';
import { DIAL_CODES } from '@agma/ui';
import {
  ArrowLeft, Bot, CheckCircle2, Megaphone, Palette, RotateCcw, Sparkles, Globe2,
} from 'lucide-react';

/**
 * «ماذا تريد أن تحوّل؟» — تجربة استشارية مصغرة داخل الموقع (WOW الكبرى):
 * مسار ← ثلاثة أسئلة ← فرص محددة + خريطة رحلة تتوهج عقدها القابلة للتحويل
 * ← النتيجة تُحفظ عميلاً محتملاً مهيكلاً في نظام AGMA (بموافقة الزائر).
 */

type Path = 'business' | 'website' | 'marketing' | 'brand';

const PATHS: Record<Path, {
  icon: React.ElementType; title: string; nodes: string[];
  questions: { q: string; options: string[]; multi?: boolean }[];
  // لكل خيار: العقد التي يوهجها + الفرصة التي يضيفها
  effects: Record<string, { glow: number[]; opportunity: string }>;
}> = {
  business: {
    icon: Bot, title: 'أعمالي',
    nodes: ['عميل محتمل', 'تأهيل', 'عرض سعر', 'عقد', 'تنفيذ', 'تقرير'],
    questions: [
      { q: 'أين يضيع وقت فريقك أكثر؟', multi: true,
        options: ['متابعة العملاء والعروض', 'التقارير والتنسيق اليدوي', 'الفوترة والتحصيل', 'توزيع المهام والمتابعة'] },
      { q: 'كيف تدار العمليات اليوم؟',
        options: ['واتساب وجداول Excel', 'أنظمة متفرقة لا تتكلم', 'نظام واحد لكنه محدود'] },
      { q: 'حجم الفريق؟', options: ['1–5', '6–20', 'أكثر من 20'] },
    ],
    effects: {
      'متابعة العملاء والعروض': { glow: [0, 1, 2], opportunity: 'متابعة آلية للعملاء المحتملين والعروض المفتوحة — لا فرصة تموت بالنسيان' },
      'التقارير والتنسيق اليدوي': { glow: [5], opportunity: 'تقارير تتولد وحدها من بيانات التشغيل بدل ساعات التجميع' },
      'الفوترة والتحصيل': { glow: [3, 4], opportunity: 'فوترة وتذكيرات تحصيل آلية بمهل متدرجة' },
      'توزيع المهام والمتابعة': { glow: [4], opportunity: 'مسارات تنفيذ جاهزة توزع المهام وتراقب المواعيد' },
      'واتساب وجداول Excel': { glow: [1], opportunity: 'نظام تشغيل واحد يجمع كل شيء — نبنيه معك كما بنينا نظامنا' },
      'أنظمة متفرقة لا تتكلم': { glow: [1], opportunity: 'ربط أنظمتك الحالية بأتمتة تنقل البيانات بينها' },
    },
  },
  website: {
    icon: Globe2, title: 'موقعي',
    nodes: ['زيارة', 'انطباع أول', 'تصفح', 'تحويل', 'متابعة'],
    questions: [
      { q: 'ما الهدف الأول من الموقع؟',
        options: ['عملاء ومبيعات', 'حجوزات ومواعيد', 'حضور وهوية'] },
      { q: 'ما أكثر ما يزعجك فيه اليوم؟', multi: true,
        options: ['بطيء على الجوال', 'لا يجلب عملاء', 'تصميمه قديم', 'لا أعرف من يزوره'] },
      { q: 'منصته الحالية؟', options: ['ووردبريس', 'سلة / زد / Shopify', 'مخصص', 'لا يوجد موقع'] },
    ],
    effects: {
      'بطيء على الجوال': { glow: [1], opportunity: 'تحسين الأداء وCore Web Vitals — الانطباع الأول يُبنى في ثوانٍ' },
      'لا يجلب عملاء': { glow: [3], opportunity: 'إعادة هندسة مسار التحويل: عرض واضح ودعوة فعل لا تُفوَّت' },
      'تصميمه قديم': { glow: [1, 2], opportunity: 'واجهة عصرية بهوية متسقة تليق بمكانتك' },
      'لا أعرف من يزوره': { glow: [4], opportunity: 'قياس وتتبع صحيح — قرارات بالأرقام لا بالحدس' },
      'عملاء ومبيعات': { glow: [3], opportunity: 'صفحات هبوط مبنية للتحويل مع اختبارات مستمرة' },
      'حجوزات ومواعيد': { glow: [3], opportunity: 'مسار حجز سلس يقلل التسرب قبل التأكيد' },
    },
  },
  marketing: {
    icon: Megaphone, title: 'تسويقي',
    nodes: ['وصول', 'اهتمام', 'تحويل', 'عائد', 'ولاء'],
    questions: [
      { q: 'أين تركز اليوم؟', multi: true,
        options: ['إعلانات مدفوعة', 'سوشال ميديا', 'سيو ومحتوى', 'لا نشاط منتظم'] },
      { q: 'ما أكبر عائق؟',
        options: ['تكلفة بلا نتائج واضحة', 'لا نعرف ما ينجح', 'لا وقت للاستمرارية'] },
      { q: 'هل تقيس العائد على الإنفاق؟', options: ['نعم بدقة', 'تقريبياً', 'لا'] },
    ],
    effects: {
      'تكلفة بلا نتائج واضحة': { glow: [2, 3], opportunity: 'إعادة بناء الحملات على التحويل الفعلي لا النقرات' },
      'لا نعرف ما ينجح': { glow: [3], opportunity: 'تتبع كامل بإسناد صحيح — كل ريال يُعرف أثره' },
      'لا وقت للاستمرارية': { glow: [1], opportunity: 'محتوى مؤتمت الجدولة بمراجعة بشرية — حضور لا ينقطع' },
      'لا نشاط منتظم': { glow: [0], opportunity: 'خطة قنوات مركزة تبدأ صغيرة وتتوسع بالدليل' },
      'لا': { glow: [3], opportunity: 'قياس العائد قبل زيادة أي ميزانية' },
      'تقريبياً': { glow: [3], opportunity: 'ترقية القياس من التقريب إلى الدقة' },
    },
  },
  brand: {
    icon: Palette, title: 'علامتي',
    nodes: ['تموضع', 'هوية بصرية', 'صوت ولغة', 'اتساق', 'تجربة'],
    questions: [
      { q: 'أين علامتك اليوم؟',
        options: ['جديدة تحت التأسيس', 'قائمة وتحتاج تجديداً', 'قوية وتحتاج اتساقاً'] },
      { q: 'ما التحدي الأبرز؟', multi: true,
        options: ['نشبه المنافسين', 'هوية غير متسقة بين القنوات', 'لا نعرف كيف نتحدث عن أنفسنا'] },
      { q: 'جمهورك الأول؟', options: ['أفراد', 'شركات', 'الاثنان'] },
    ],
    effects: {
      'نشبه المنافسين': { glow: [0], opportunity: 'تموضع تفاضلي واضح — لماذا أنت لا غيرك' },
      'هوية غير متسقة بين القنوات': { glow: [1, 3], opportunity: 'نظام هوية بقواعد تطبيق تحفظ الاتساق أينما ظهرت' },
      'لا نعرف كيف نتحدث عن أنفسنا': { glow: [2], opportunity: 'صوت لفظي ورسائل جاهزة لكل موقف' },
      'جديدة تحت التأسيس': { glow: [0, 1], opportunity: 'تأسيس صحيح من أول يوم أرخص من تصحيح لاحق' },
      'قائمة وتحتاج تجديداً': { glow: [1], opportunity: 'تجديد يحفظ رصيدك ويواكب طموحك' },
    },
  },
};

export default function TransformExperience() {
  const [path, setPath] = useState<Path | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([[], [], []]);
  const [contact, setContact] = useState({ name: '', email: '', dial: '+966', phone: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const cfg = path ? PATHS[path] : null;
  const done = cfg && step >= cfg.questions.length;

  const chosen = answers.flat();
  const opportunities = cfg
    ? [...new Set(chosen.map((a) => cfg.effects[a]?.opportunity).filter(Boolean))] as string[]
    : [];
  const glow = new Set(cfg
    ? chosen.flatMap((a) => cfg.effects[a]?.glow ?? []) : []);
  const complexity = opportunities.length <= 1 ? 'بسيط'
    : opportunities.length <= 3 ? 'متوسط' : 'متقدم';

  function toggle(qi: number, opt: string, multi?: boolean) {
    setAnswers((prev) => {
      const next = prev.map((x) => [...x]);
      if (multi) {
        next[qi] = next[qi].includes(opt)
          ? next[qi].filter((x) => x !== opt) : [...next[qi], opt];
      } else {
        next[qi] = [opt];
      }
      return next;
    });
  }

  function reset() {
    setPath(null); setStep(0); setAnswers([[], [], []]);
    setSent(false); setContact({ name: '', email: '', dial: '+966', phone: '' });
  }

  async function sendLead() {
    if (!cfg) return;
    setBusy(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim().startsWith('+')
            ? contact.phone.trim()
            : contact.dial + contact.phone.trim().replace(/^0+/, ''),
          services: `تجربة التحويل: ${cfg.title}`,
          message: [
            `المسار: ${cfg.title} · التعقيد: ${complexity}`,
            ...cfg.questions.map((q, i) => `${q.q} ← ${answers[i].join('، ') || '—'}`),
            `الفرص (${opportunities.length}): ${opportunities.join(' | ')}`,
          ].join('\n'),
        }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section dir="rtl" className="border-y border-gray-dark bg-gray-dark/10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        {!path && (
          <>
            <h2 className="mb-2 text-center text-3xl font-black">
              ماذا تريد أن <span className="text-pulse-orange">تحوّل</span>؟
            </h2>
            <p className="mb-8 text-center text-sm text-gray-light">
              ثلاث إجابات سريعة — ونريك أين الفرص بالضبط.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(Object.entries(PATHS) as [Path, typeof PATHS[Path]][]).map(([k, p]) => (
                <button key={k} type="button" onClick={() => setPath(k)}
                  className="group rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-all hover:-translate-y-1 hover:border-pulse-orange/60">
                  <p.icon className="mx-auto mb-3 h-8 w-8 text-pulse-orange transition-transform group-hover:scale-110" aria-hidden />
                  <p className="font-black">{p.title}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {cfg && !done && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center gap-2 text-xs text-gray-medium">
              <button type="button" onClick={reset} className="hover:text-pulse-orange">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span>تحويل: {cfg.title}</span>
              <span className="ms-auto">{step + 1} / {cfg.questions.length}</span>
            </div>
            <h3 className="mb-5 text-xl font-black">{cfg.questions[step].q}</h3>
            <div className="flex flex-wrap gap-2">
              {cfg.questions[step].options.map((opt) => (
                <button key={opt} type="button"
                  onClick={() => toggle(step, opt, cfg.questions[step].multi)}
                  aria-pressed={answers[step].includes(opt)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    answers[step].includes(opt)
                      ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                      : 'border-white/15 text-gray-light hover:border-white/40'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <button type="button" disabled={answers[step].length === 0}
              onClick={() => setStep((s) => s + 1)}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-40">
              {step === cfg.questions.length - 1 ? 'أرني الفرص' : 'التالي'}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {cfg && done && (
          <div>
            <div className="mb-6 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-pulse-orange" aria-hidden />
              <h3 className="text-2xl font-black">
                وجدنا لك {opportunities.length} {opportunities.length === 1 ? 'فرصة' : 'فرص'} للتحويل
              </h3>
              <p className="mt-1 text-xs text-gray-medium">التعقيد التقديري: {complexity}</p>
            </div>

            {/* خريطة الرحلة — العقد المتوهجة قابلة للتحويل */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {cfg.nodes.map((n, i) => (
                <React.Fragment key={n}>
                  <span className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                    glow.has(i)
                      ? 'animate-pulse border-pulse-orange bg-pulse-orange/20 text-pulse-orange shadow-[0_0_18px_rgba(232,84,47,0.35)]'
                      : 'border-white/15 text-gray-light'}`}>
                    {n}
                  </span>
                  {i < cfg.nodes.length - 1 && (
                    <span className="text-gray-medium" aria-hidden>←</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="mb-6 text-center text-sm text-gray-light">
              العقد المتوهجة هي ما يمكن لـAGMA تحويله في رحلتك.
            </p>

            <ul className="mx-auto mb-8 max-w-2xl space-y-2">
              {opportunities.map((o) => (
                <li key={o} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pulse-orange" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>

            {sent ? (
              <p className="text-center text-sm font-bold text-pulse-orange">
                وصلتنا خريطتك — سيتواصل معك فريق AGMA بخطة البناء خلال يوم عمل.
              </p>
            ) : (
              <div className="mx-auto max-w-md rounded-xl border border-pulse-orange/40 bg-white/5 p-5 text-center">
                <p className="mb-3 text-sm font-bold">شاهد كيف تبنيها AGMA لك</p>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <input aria-label="الاسم" placeholder="اسمك" value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                  <input aria-label="البريد" type="email" dir="ltr" placeholder="بريدك" value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                  <select aria-label="مفتاح الدولة" dir="ltr" value={contact.dial}
                    onChange={(e) => setContact((c) => ({ ...c, dial: e.target.value }))}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow focus:border-pulse-orange focus:outline-none">
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>{d.country} {d.code}</option>
                    ))}
                  </select>
                  <input aria-label="رقم الجوال" inputMode="tel" dir="ltr" placeholder="5XXXXXXXX"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    className="rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
                </div>
                <button type="button" disabled={busy || contact.name.trim().length < 2
                  || !/.+@.+\..+/.test(contact.email) || contact.phone.trim().length < 7}
                  onClick={sendLead}
                  className="w-full rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-40">
                  {busy ? 'جارٍ الإرسال…' : 'أرسل لي خطة البناء'}
                </button>
                <p className="mt-2 text-[11px] text-gray-medium">
                  تُحفظ إجاباتك مع طلبك ليصلك رد مخصص لا قالباً عاماً.
                </p>
              </div>
            )}
            <div className="mt-4 text-center">
              <button type="button" onClick={reset}
                className="text-xs text-gray-medium hover:text-pulse-orange">
                جرّب مساراً آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

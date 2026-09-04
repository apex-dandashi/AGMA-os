'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * مختبر الهيرو: نفس نص الهيرو المعتمد فوق خلفية فيديو مرشحة، بثلاث معالجات
 * تُبدَّل بزر واحد. الفيديو يُقرأ من مصدره الخارجي كما هو (للتجربة فقط —
 * الإنتاج يحتاج نسخة 1080p مضغوطة + WebM + صورة بداية).
 */

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4';

type Variant = 'raw' | 'warm' | 'dim';
const VARIANTS: { id: Variant; label: string; hint: string }[] = [
  { id: 'raw', label: 'خام', hint: 'الفيديو كما هو، أزرق' },
  { id: 'warm', label: 'دافئ', hint: 'مصبوغ ببرتقالي AGMA (مصدر ضوء واحد)' },
  { id: 'dim', label: 'مطفأ', hint: 'خافت وخلفه حجاب للقراءة' },
];

const FILTERS: Record<Variant, string> = {
  raw: 'none',
  /* أزرق → برتقالي: إزالة اللون ثم صبغه ثم تدوير الصبغة نحو البرتقالي */
  warm: 'sepia(1) saturate(2.6) hue-rotate(-18deg) brightness(0.95) contrast(1.08)',
  dim: 'sepia(0.6) saturate(1.4) hue-rotate(-12deg) brightness(0.55)',
};

export default function LabClient() {
  const [v, setV] = useState<Variant>('warm');
  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden text-snow">
      {/* مبدّل المعالجات */}
      <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full glass-panel p-1">
        {VARIANTS.map((o) => (
          <button key={o.id} type="button" onClick={() => setV(o.id)} title={o.hint}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              v === o.id ? 'bg-pulse-orange text-snow' : 'text-gray-light hover:text-snow'
            }`}>
            {o.label}
          </button>
        ))}
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-gray-medium hover:text-snow">الرئيسية</Link>
      </div>

      {/* طبقة الفيديو */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* عنصر واحد لا يُعاد تركيبه عند التبديل (كان key يعيد تنزيل ١٤MB) */}
        <video
          src={VIDEO}
          poster="/lab-poster.jpg"
          autoPlay muted loop playsInline preload="auto"
          className="h-full w-full object-cover"
          style={{ filter: FILTERS[v], objectPosition: '50% 35%' }}
        />
        {/* حجاب القراءة: أثقل في المعالجة المطفأة */}
        <div className={`absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/35 to-[#0A0A0A] ${v === 'dim' ? 'opacity-90' : 'opacity-70'}`} />
      </div>

      {/* الهيرو المعتمد */}
      <section className="relative z-10 px-6 pb-24 pt-40 text-center lg:pt-52">
        <p className="mx-auto mb-6 inline-block rounded-full border border-pulse-orange/40 bg-pulse-orange/10 px-4 py-1.5 text-sm font-bold text-pulse-orange">
          وكالة سعودية · من الرياض، قلب المملكة
        </p>
        <h1 className="mx-auto mb-6 max-w-4xl py-2 text-4xl font-black leading-[1.25] tracking-normal text-snow sm:text-6xl lg:text-7xl">
          وكالتك الكاملة
          <br /> في عصر
          <br /> <span className="text-gradient">الذكاء الاصطناعي</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-light">
          AGMA هي وكالة جيل الذكاء الاصطناعي. نجمع بين الأتمتة المتقدمة والبيانات الدقيقة والإبداع البشري لتحقيق نمو استراتيجي لشركات المملكة الواعدة.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/contact" className="btn-primary px-10 py-4 text-lg">احجز مكالمة استراتيجية</Link>
          <Link href="/pricing" className="btn-secondary px-10 py-4 text-lg">تصفح الأسعار الإرشادية</Link>
        </div>
        <p className="mt-16 text-xs text-gray-medium">
          مختبر تجريبي · الفيديو 4K/١٤MB من مصدره الخارجي للتجربة فقط
        </p>
      </section>
    </main>
  );
}

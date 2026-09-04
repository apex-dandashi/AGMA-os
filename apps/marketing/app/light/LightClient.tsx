'use client';

import Link from 'next/link';

/**
 * النسخة الفاتحة (جولة الراحة والقراءة): نفس هيكل البيع بورقٍ دافئ وهواء
 * ونص كبير قليل الكلام — تُقارن ضد الرئيسية الداكنة باختبار الخمس ثوانٍ.
 * قواعدها: خلفية ورقية دافئة، جسد نص ١٨px، كل قسم يقول شيئاً واحداً.
 */

const CATEGORIES = [
  { title: 'الذكاء الاصطناعي والأتمتة', desc: 'وكلاء وأنظمة تشتغل عنك ٢٤/٧' },
  { title: 'الإعلانات والتسويق الأدائي', desc: 'حملات تُقاس بالطلبات لا بالمشاهدات' },
  { title: 'السيو والمحتوى', desc: 'تصدّر بحث جوجل ومحركات الذكاء' },
  { title: 'السوشال ميديا', desc: 'حضور يومي محترف بهوية ثابتة' },
  { title: 'الهوية والتصميم', desc: 'وجه بصري يليق بمستوى شركتك' },
  { title: 'المواقع والمتاجر', desc: 'صفحات سريعة مصممة لتبيع' },
];

const METHOD = [
  { n: 'A', ar: 'تحليل', desc: 'نفهم سوقك وجمهورك بالبيانات' },
  { n: 'G', ar: 'توليد', desc: 'ننتج الحلول والمحتوى بسرعة الذكاء' },
  { n: 'M', ar: 'تسويق', desc: 'نطلق للجمهور الصح في الوقت الصح' },
  { n: 'A', ar: 'تطوير', desc: 'نحسّن باستمرار على أرقام حقيقية' },
];

function ask(question: string) {
  window.dispatchEvent(new CustomEvent('agma:ask', { detail: { question } }));
}

export default function LightClient() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#FAF6F0] text-[#1C1814]"
      style={{ fontFamily: 'var(--font-ibm-plex), sans-serif' }}>
      {/* ترويسة خفيفة */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="AGMA" className="h-9 w-auto" style={{ filter: 'invert(0.85)' }} />
        <Link href="/contact"
          className="rounded-full bg-[#E8542F] px-6 py-2.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90">
          احجز مكالمة استراتيجية
        </Link>
      </header>

      {/* الهيرو */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-14 text-center">
        <p className="mb-5 inline-block rounded-full border border-[#E8542F]/30 bg-[#E8542F]/5 px-4 py-1.5 text-sm font-bold text-[#C2401F]">
          وكالة سعودية · الرياض
        </p>
        <h1 className="text-4xl font-black leading-[1.3] sm:text-6xl">
          نموّ يُقاس <span className="text-[#E8542F]">بالريال،</span>
          <br /> لا بالإعجابات.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-9 text-[#4A4238]">
          وكالة جيل الذكاء الاصطناعي — فريقك التسويقي الكامل من الرياض.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact"
            className="w-full rounded-full bg-[#E8542F] px-9 py-4 text-lg font-bold text-white shadow-lg shadow-[#E8542F]/25 transition-opacity hover:opacity-90 sm:w-auto">
            احجز مكالمة استراتيجية
          </Link>
          <Link href="/pricing"
            className="w-full rounded-full border-2 border-[#1C1814]/15 px-9 py-4 text-lg font-bold text-[#1C1814] transition-colors hover:border-[#E8542F] hover:text-[#E8542F] sm:w-auto">
            تصفح الأسعار الإرشادية
          </Link>
        </div>
        {/* مساعد الهيرو */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('q') as HTMLInputElement);
            if (input.value.trim().length >= 5) { ask(input.value.trim()); input.value = ''; }
          }}
          className="mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-[#1C1814]/15 bg-white p-1.5 pr-5 shadow-sm">
          <input name="q" placeholder="اشرح تحديك بسطر… ومساعدنا يقترح الحل"
            aria-label="اشرح تحديك ليقترح المساعد الحل"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-[#1C1814] placeholder:text-[#8A8178] focus:outline-none" />
          <button type="submit"
            className="shrink-0 rounded-full bg-[#1C1814] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85">
            اقترح لي
          </button>
        </form>
      </section>

      {/* الخدمات */}
      <section className="border-y border-[#1C1814]/8 bg-white/60 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-black">ماذا نتقن لأجلك؟</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button key={c.title} type="button"
                onClick={() => ask(`أبغى أعرف عن خدمات ${c.title} عندكم — وش تشمل وكيف تنفذونها؟`)}
                className="group rounded-2xl border border-[#1C1814]/8 bg-white p-6 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E8542F]/40 hover:shadow-md">
                <h3 className="text-lg font-bold group-hover:text-[#E8542F]">{c.title}</h3>
                <p className="mt-1.5 text-base leading-7 text-[#4A4238]">{c.desc}</p>
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[#8A8178]">
            ٣٧ خدمة في ٩ فئات — انقر أي فئة ليشرحها المساعد
          </p>
        </div>
      </section>

      {/* المنهجية */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-black">
            منهجية <span className="text-[#E8542F]">AGMA Method™</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD.map((m, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="text-3xl font-black text-[#E8542F]">{m.n}</span>
                <h3 className="mt-1 text-lg font-bold">{m.ar}</h3>
                <p className="mt-1 text-[15px] leading-7 text-[#4A4238]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الختام */}
      <section className="bg-[#1C1814] py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-black leading-snug">جاهز نبدأ؟</h2>
          <p className="mt-3 text-lg text-white/70">مكالمة واحدة تكفي لنرسم لك الطريق.</p>
          <Link href="/contact"
            className="mt-7 inline-block rounded-full bg-[#E8542F] px-10 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90">
            احجز مكالمة استراتيجية
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-[#8A8178]">
        AGMA™ 2026 · الرياض، المملكة العربية السعودية ·
        السجل التجاري <span dir="ltr">1009127528</span> · الرقم الضريبي <span dir="ltr">313630147</span>
      </footer>
    </main>
  );
}

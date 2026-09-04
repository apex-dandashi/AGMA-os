'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL } from '@/lib/publicConfig';
import { CheckCircle2, Star } from 'lucide-react';

const ASPECTS = [
  'الاستراتيجية', 'جودة التنفيذ', 'سرعة التنفيذ', 'التواصل', 'فهم احتياجنا',
  'التصميم', 'المحتوى', 'الحملات', 'التطوير التقني', 'الأتمتة والذكاء الاصطناعي',
  'التقارير', 'القيمة مقابل الاستثمار', 'تجربة الموقع', 'أخرى',
];

const field =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none';
const label = 'mb-1.5 block text-xs font-bold text-gray-light';

export default function FeedbackClient() {
  const [rating, setRating] = useState(0);
  const [aspect, setAspect] = useState('');
  const [positive, setPositive] = useState('');
  const [improve, setImprove] = useState('');
  const [permission, setPermission] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating === 0) { setError('اختر تقييماً من نجمة إلى خمس.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-forms`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          rating,
          aspect: aspect || undefined,
          positive_comment: positive.trim() || undefined,
          improvement_comment: improve.trim() || undefined,
          contact_permission: permission,
          name: permission ? name.trim() || undefined : undefined,
          email: permission ? email.trim() || undefined : undefined,
          source_page: '/feedback',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setDone(true);
    } catch {
      setError('تعذر الإرسال — حاول مجدداً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main data-silk-mood="silence" className="mx-auto max-w-2xl px-4 pb-24 pt-32">
        {done ? (
          <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-pulse-orange" aria-hidden />
            <p className="text-lg font-black">شكراً لك — تقييمك وصل</p>
            <p className="mt-2 text-sm text-gray-light">
              كل تقييم يدخل مباشرة في نظام تحسيننا الداخلي.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="mb-2 text-3xl font-black">كيف تقيّم تجربتك مع AGMA؟</h1>
            <p className="mb-6 text-sm text-gray-light">
              دقيقة واحدة — ويمكنك البقاء مجهولاً تماماً إن لم ترغب بالمتابعة.
            </p>
            <div className="mb-6 flex gap-2" role="radiogroup" aria-label="التقييم من ١ إلى ٥">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n}
                  aria-label={`${n} من ٥`} onClick={() => setRating(n)}
                  className="p-1 transition-transform hover:scale-110">
                  <Star className={`h-9 w-9 ${n <= rating ? 'fill-pulse-orange text-pulse-orange' : 'text-gray-medium'}`} aria-hidden />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="f-aspect" className={label}>أي جانب تقيّم؟</label>
                <select id="f-aspect" className={field} value={aspect}
                  onChange={(e) => setAspect(e.target.value)}>
                  <option value="">— اختياري —</option>
                  {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="f-pos" className={label}>ما الشيء الذي قمنا به بشكل ممتاز؟</label>
                <textarea id="f-pos" rows={2} className={field} value={positive}
                  onChange={(e) => setPositive(e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-imp" className={label}>ما الشيء الوحيد الذي تتمنى أن نحسّنه؟</label>
                <textarea id="f-imp" rows={2} className={field} value={improve}
                  onChange={(e) => setImprove(e.target.value)} />
              </div>
              <label className="flex items-start gap-2 text-xs text-gray-light">
                <input type="checkbox" className="mt-0.5" checked={permission}
                  onChange={(e) => setPermission(e.target.checked)} />
                أسمح لفريق AGMA بالتواصل معي بشأن تقييمي
              </label>
              {permission && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-name" className={label}>الاسم</label>
                    <input id="f-name" className={field} value={name}
                      onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="f-email" className={label}>البريد الإلكتروني</label>
                    <input id="f-email" type="email" dir="ltr" className={field} value={email}
                      onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
              )}
              {error && <p role="alert" className="text-sm font-bold text-pulse-orange">{error}</p>}
              <button type="submit" disabled={busy}
                className="rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-50">
                {busy ? 'جارٍ الإرسال…' : 'إرسال التقييم'}
              </button>
              <p className="text-[11px] leading-relaxed text-gray-medium">
                دون إذن التواصل لا نخزن اسمك أو بريدك إطلاقاً — نجمع الحد الأدنى
                اللازم فقط وفق نظام حماية البيانات الشخصية.
              </p>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL } from '@/lib/publicConfig';
import { Gauge, Search, Sparkles } from 'lucide-react';

const field =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none';
const label = 'mb-1.5 block text-xs font-bold text-gray-light';

type Result = {
  overall: number;
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number };
  opportunities: string[];
  lcp: string | null;
};

function ScoreRing({ value, title }: { value: number; title: string }) {
  const color = value >= 90 ? 'text-green-400' : value >= 50 ? 'text-pulse-orange' : 'text-red-400';
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-light">{title}</p>
    </div>
  );
}

export default function AuditClient() {
  const [form, setForm] = useState({ url: '', name: '', company: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [manualFollowup, setManualFollowup] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.url.trim()) { setError('أدخل رابط موقعك.'); return; }
    if (form.name.trim().length < 2) { setError('اكتب اسمك.'); return; }
    if (!/.+@.+\..+/.test(form.email.trim())) { setError('أدخل بريداً إلكترونياً صالحاً.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/website-audit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: form.url.trim(), name: form.name.trim(),
          company: form.company.trim() || undefined, email: form.email.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult(data);
      } else if (data.error === 'audit_failed') {
        // الطلب وصلنا (Lead) — الفحص الآلي مزدحم؛ متابعة يدوية
        setManualFollowup(true);
      } else if (data.error === 'rate_limited') {
        setError('محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة.');
      } else {
        setError('تعذر الفحص — تأكد من الرابط وحاول مجدداً.');
      }
    } catch {
      setError('تعذر الاتصال — حاول مجدداً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-black">
          <Gauge className="h-8 w-8 text-pulse-orange" aria-hidden />
          ما مدى صحة موقعك؟
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-light">
          فحص فوري مجاني بأدوات Google: الأداء، السيو، إمكانية الوصول، وأفضل
          الممارسات — مع أهم فرص التحسين بالعربية.
        </p>

        {!result && !manualFollowup && (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="w-url" className={label}>رابط موقعك *</label>
              <input id="w-url" dir="ltr" placeholder="example.com" className={field}
                value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="w-name" className={label}>الاسم *</label>
                <input id="w-name" className={field} value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="w-company" className={label}>المنشأة</label>
                <input id="w-company" className={field} value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="w-email" className={label}>البريد الإلكتروني *</label>
                <input id="w-email" type="email" dir="ltr" className={field} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            {error && <p role="alert" className="text-sm font-bold text-pulse-orange">{error}</p>}
            <button type="submit" disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-50">
              <Search className="h-4 w-4" aria-hidden />
              {busy ? 'جارٍ الفحص… (٣٠–٦٠ ثانية)' : 'افحص موقعي الآن'}
            </button>
            <p className="text-[11px] text-gray-medium">
              بإرسال الطلب توافق على تواصل فريق AGMA معك بشأن نتائج الفحص وفق
              سياسة الخصوصية.
            </p>
          </form>
        )}

        {manualFollowup && (
          <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-pulse-orange" aria-hidden />
            <p className="mb-2 text-lg font-black">استلمنا طلبك</p>
            <p className="text-sm leading-relaxed text-gray-light">
              أداة الفحص الآلي مزدحمة حالياً — سيجري فريقنا الفحص يدوياً ويرسل
              لك تقريراً مفصلاً على بريدك خلال يوم عمل.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-pulse-orange">
                AGMA Website Score
              </p>
              <p className="mt-2 text-6xl font-black">{result.overall}<span className="text-2xl text-gray-medium">/100</span></p>
              {result.lcp && (
                <p className="mt-2 text-xs text-gray-light">
                  أكبر عنصر ظاهر (LCP): <span dir="ltr">{result.lcp}</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreRing value={result.scores.performance} title="الأداء" />
              <ScoreRing value={result.scores.seo} title="السيو" />
              <ScoreRing value={result.scores.accessibility} title="إمكانية الوصول" />
              <ScoreRing value={result.scores.bestPractices} title="أفضل الممارسات" />
            </div>
            {result.opportunities.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 font-black">أهم فرص التحسين</p>
                <ul className="space-y-2 text-sm text-gray-light">
                  {result.opportunities.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-pulse-orange">/</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-6 text-center">
              <p className="mb-3 text-sm text-gray-light">
                تريد رفع الدرجة؟ فريق الويب والسيو في AGMA يتواصل معك بخطة عملية.
              </p>
              <a href="/contact"
                className="inline-block rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void hover:opacity-90">
                اطلب خطة التحسين
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

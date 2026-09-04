'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL } from '@/lib/publicConfig';
import { DIAL_CODES } from '@agma/ui';
import {
  CheckCircle2, FileWarning, MessageSquareHeart, SearchCheck, ShieldAlert,
} from 'lucide-react';

const CATEGORIES = [
  'جودة الخدمة', 'التأخر في التسليم', 'نطاق العمل', 'الفواتير والمدفوعات',
  'العقد', 'التواصل والمتابعة', 'الحملات الإعلانية', 'المحتوى أو التصميم',
  'الموقع أو النظام التقني', 'الذكاء الاصطناعي أو الأتمتة',
  'الخصوصية والبيانات الشخصية', 'الأمن السيبراني',
  'سلوك أحد أعضاء الفريق', 'حقوق الملكية الفكرية', 'أخرى',
];

const field =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none';
const label = 'mb-1.5 block text-xs font-bold text-gray-light';

export default function ComplaintsClient() {
  const [mode, setMode] = useState<'choose' | 'complaint' | 'track'>('choose');
  const [form, setForm] = useState({
    complainant_type: 'client', name: '', email: '', dial: '+966', phone: '', organization: '',
    category: '', subject: '', description: '', desired_resolution: '',
    confidential_flag: false, privacy_ok: false,
  });
  const [track, setTrack] = useState({ reference: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<string | null>(null);

  const STATUS_AR: Record<string, string> = {
    received: 'تم الاستلام', triage: 'قيد الفرز', assigned: 'أُسندت للمعالجة',
    in_progress: 'قيد المعالجة', waiting_customer: 'بانتظار ردّكم',
    resolution_proposed: 'حل مقترح بانتظار تأكيدكم', resolved: 'تم الحل',
    closed: 'مغلقة', duplicate: 'مكررة', withdrawn: 'مسحوبة',
  };

  async function submitComplaint(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.category) { setError('اختر تصنيف الشكوى.'); return; }
    if (form.subject.trim().length < 3) { setError('اكتب عنواناً موجزاً للشكوى.'); return; }
    if (form.description.trim().length < 10) { setError('اشرح ما حدث بتفصيل كافٍ (١٠ أحرف على الأقل).'); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError('أدخل بريداً إلكترونياً أو رقم جوال للمتابعة.'); return; }
    if (!form.privacy_ok) { setError('أقرّ بإشعار الخصوصية للمتابعة.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-forms`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'complaint',
          complainant_type: form.complainant_type,
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim()
            ? (form.phone.trim().startsWith('+')
                ? form.phone.trim()
                : form.dial + form.phone.trim().replace(/^0+/, ''))
            : undefined,
          organization: form.organization.trim() || undefined,
          category: form.category,
          subject: form.subject.trim(),
          description: form.description.trim(),
          desired_resolution: form.desired_resolution.trim() || undefined,
          confidential_flag: form.confidential_flag,
          source_page: '/complaints',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setDoneRef(data.reference);
    } catch {
      setError('تعذر الإرسال — حاول مجدداً أو راسلنا على care@agma.com.sa');
    } finally {
      setBusy(false);
    }
  }

  async function submitTrack(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTrackResult(null);
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-forms`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'track',
          reference: track.reference.trim().toUpperCase(),
          email: track.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError('لم نجد شكوى بهذا الرقم والبريد — تأكد منهما.');
      } else {
        setTrackResult(STATUS_AR[data.status] ?? data.status);
      }
    } catch {
      setError('تعذر الاستعلام — حاول مجدداً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main data-silk-mood="silence" className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <h1 className="mb-2 text-3xl font-black">نحن نستمع، ونتعامل مع كل شكوى بجدية.</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-light">
          في AGMA نعتبر الشكوى فرصة لتصحيح المشكلة وتحسين نظام العمل. بعد
          الإرسال ستحصل على رقم مرجعي لمتابعة الحالة، ويصلك الرد الأول خلال
          يوم عمل بحسب سياسة الخدمة لدينا.
        </p>

        {mode === 'choose' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: FileWarning, title: 'لدي شكوى رسمية',
                desc: 'مشكلة تتطلب متابعة وحلاً ورقماً مرجعياً.',
                act: () => setMode('complaint') },
              { icon: MessageSquareHeart, title: 'لدي ملاحظة أو تقييم',
                desc: 'فكرة أو تقييم سريع لا يستغرق دقيقة.', href: '/feedback' },
              { icon: SearchCheck, title: 'تتبع شكوى سابقة',
                desc: 'استعلم عن الحالة برقمك المرجعي وبريدك.',
                act: () => setMode('track') },
              { icon: ShieldAlert, title: 'بلاغ خصوصية أو أمن معلومات',
                desc: 'يُعالج بسرية من الفريق المختص وبمهل نظامية.',
                act: () => { setForm((f) => ({ ...f, category: 'الخصوصية والبيانات الشخصية' })); setMode('complaint'); } },
            ].map((c) => {
              const inner = (
                <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-5 text-start transition-colors hover:border-pulse-orange/60">
                  <c.icon className="mb-3 h-6 w-6 text-pulse-orange" aria-hidden />
                  <p className="mb-1 font-bold">{c.title}</p>
                  <p className="text-xs leading-relaxed text-gray-light">{c.desc}</p>
                </div>
              );
              return c.href
                ? <Link key={c.title} href={c.href}>{inner}</Link>
                : <button key={c.title} type="button" onClick={c.act}>{inner}</button>;
            })}
          </div>
        )}

        {mode === 'complaint' && !doneRef && (
          <form onSubmit={submitComplaint} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-type" className={label}>صفتك</label>
                <select id="c-type" className={field} value={form.complainant_type}
                  onChange={(e) => setForm((f) => ({ ...f, complainant_type: e.target.value }))}>
                  <option value="client">عميل حالي</option>
                  <option value="prospect">عميل محتمل</option>
                  <option value="supplier">مورد</option>
                  <option value="partner">شريك</option>
                  <option value="visitor">زائر للموقع</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-cat" className={label}>تصنيف الشكوى *</label>
                <select id="c-cat" className={field} required value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="c-name" className={label}>الاسم الكامل</label>
                <input id="c-name" className={field} value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="c-org" className={label}>المنشأة (اختياري)</label>
                <input id="c-org" className={field} value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="c-email" className={label}>البريد الإلكتروني *</label>
                <input id="c-email" type="email" dir="ltr" className={field} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="c-phone" className={label}>رقم الجوال</label>
                {/* المفتاح يسار والرقم يمين — حاوية LTR (قانون L8) */}
                <div dir="ltr" className="flex gap-2">
                  <select aria-label="مفتاح الدولة" className={`${field} w-36 shrink-0`}
                    value={form.dial}
                    onChange={(e) => setForm((f) => ({ ...f, dial: e.target.value }))}>
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>{d.flag} {d.code} {d.country}</option>
                    ))}
                  </select>
                  <input id="c-phone" inputMode="tel" className={`${field} min-w-0 flex-1`}
                    placeholder="5XXXXXXXX" value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="c-subject" className={label}>عنوان الشكوى *</label>
              <input id="c-subject" className={field} required value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="c-desc" className={label}>ماذا حدث؟ *</label>
              <textarea id="c-desc" rows={5} className={field} required value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="c-res" className={label}>ما الحل الذي تتوقعه؟ (اختياري)</label>
              <textarea id="c-res" rows={2} className={field} value={form.desired_resolution}
                onChange={(e) => setForm((f) => ({ ...f, desired_resolution: e.target.value }))} />
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-light">
              <input type="checkbox" className="mt-0.5" checked={form.confidential_flag}
                onChange={(e) => setForm((f) => ({ ...f, confidential_flag: e.target.checked }))} />
              أطلب التعامل مع هذه الشكوى بسرية إضافية
            </label>
            <label className="flex items-start gap-2 text-xs text-gray-light">
              <input type="checkbox" className="mt-0.5" required checked={form.privacy_ok}
                onChange={(e) => setForm((f) => ({ ...f, privacy_ok: e.target.checked }))} />
              <span>
                قرأت <Link href="/privacy-policy" className="text-pulse-orange underline-offset-2 hover:underline">إشعار الخصوصية</Link>{' '}
                وأفهم أن مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية
                («AGMA») تعالج بياناتي لغرض معالجة هذه الشكوى فقط. *
              </span>
            </label>
            {error && <p role="alert" className="text-sm font-bold text-pulse-orange">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy}
                className="rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-50">
                {busy ? 'جارٍ الإرسال…' : 'إرسال الشكوى'}
              </button>
              <button type="button" onClick={() => setMode('choose')}
                className="text-sm text-gray-light hover:text-snow">رجوع</button>
            </div>
          </form>
        )}

        {doneRef && (
          <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-pulse-orange" aria-hidden />
            <p className="mb-1 text-lg font-black">تم استلام شكواك</p>
            <p className="mb-4 text-sm text-gray-light">احتفظ بالرقم المرجعي لمتابعة الحالة:</p>
            <p dir="ltr" className="mb-4 text-2xl font-black tracking-wider text-pulse-orange">{doneRef}</p>
            <p className="text-xs text-gray-light">
              الحالة: تم الاستلام · سيصلك ردنا الأول خلال يوم عمل.
            </p>
          </div>
        )}

        {mode === 'track' && (
          <form onSubmit={submitTrack} noValidate className="space-y-4">
            <div>
              <label htmlFor="t-ref" className={label}>الرقم المرجعي (مثل CMP-2026-00001) *</label>
              <input id="t-ref" dir="ltr" className={field} required value={track.reference}
                onChange={(e) => setTrack((t) => ({ ...t, reference: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="t-email" className={label}>البريد المستخدم في الشكوى *</label>
              <input id="t-email" type="email" dir="ltr" className={field} required value={track.email}
                onChange={(e) => setTrack((t) => ({ ...t, email: e.target.value }))} />
            </div>
            {trackResult && (
              <p className="rounded-md border border-pulse-orange/40 bg-white/5 p-4 text-sm">
                حالة الشكوى: <b className="text-pulse-orange">{trackResult}</b>
              </p>
            )}
            {error && <p role="alert" className="text-sm font-bold text-pulse-orange">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy}
                className="rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-50">
                {busy ? 'جارٍ الاستعلام…' : 'استعلام'}
              </button>
              <button type="button" onClick={() => setMode('choose')}
                className="text-sm text-gray-light hover:text-snow">رجوع</button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

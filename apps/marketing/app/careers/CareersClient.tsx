'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/publicConfig';
import { Briefcase, CheckCircle2, Sparkles } from 'lucide-react';

type Job = {
  id: string; slug: string; public_title_ar: string; description_ar: string | null;
  employment_type: string | null; work_model: string | null; location: string | null;
  close_date: string | null; role_id: string;
};
type Role = {
  id: string; title_ar: string; portfolio_label: string | null;
  department_id: string; assessment_bank: string | null;
};
type Question = {
  id: string; bank: string; sort: number; text_ar: string;
  options: { v: string; label: string }[];
};
type Dept = { id: string; name_ar: string; sort: number };

const field =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none';
const label = 'mb-1.5 block text-xs font-bold text-gray-light';

const VALUES = [
  'حكم بشري × رافعة ذكاء اصطناعي', 'ملكية المهمة قبل المسمى',
  'البيانات قبل الافتراضات', 'الحِرفة ما زالت مهمة',
  'تعلّم بسرعة', 'ابنِ أنظمة', 'احترم العميل', 'وثّق كل شيء',
];

async function fetchPublic<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [talentOpen, setTalentOpen] = useState(false);
  const [form, setForm] = useState({
    role_id: '', full_name: '', email: '', phone: '', city: '',
    experience_level: '', work_model_pref: '', start_availability: '',
    arabic_level: '', english_level: '', salary_range: '',
    portfolio_url: '', linkedin_url: '', accommodations: '', accommodations_show: 'لا',
    cover_note: '', talent_pool_consent: false, privacy_ok: false,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cv, setCv] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  useEffect(() => {
    fetchPublic<Job>('career_jobs?select=id,slug,public_title_ar,description_ar,employment_type,work_model,location,close_date,role_id&order=created_at.desc').then(setJobs);
    fetchPublic<Role>('career_roles?select=id,title_ar,portfolio_label,department_id,assessment_bank').then(setRoles);
    fetchPublic<Question>('assessment_questions?select=id,bank,sort,text_ar,options&order=bank,sort').then(setQuestions);
    fetchPublic<Dept>('career_departments?select=id,name_ar,sort&order=sort').then(setDepts);
  }, []);

  const selectedRole = roles.find((r) => r.id === (applyJob?.role_id ?? form.role_id));
  // أسئلة التقييم: المشتركة + بنك التخصص المختار
  const activeQuestions = questions.filter((q) =>
    q.bank === 'COMMON' || (selectedRole?.assessment_bank && q.bank === selectedRole.assessment_bank));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!applyJob && !form.role_id) { setError('اختر التخصص الأقرب لك.'); return; }
    if (form.full_name.trim().length < 2) { setError('اكتب اسمك الكامل.'); return; }
    if (!/.+@.+\..+/.test(form.email.trim())) { setError('أدخل بريداً إلكترونياً صالحاً.'); return; }
    if (!form.privacy_ok) { setError('أقرّ بإشعار خصوصية المتقدمين للمتابعة.'); return; }
    if (activeQuestions.length > 0
        && activeQuestions.some((q) => !answers[q.id])) {
      setError('أكمل أسئلة التقييم — لكل سؤال إجابة واحدة.');
      return;
    }
    if (cv) {
      if (!/\.(pdf|docx?)$/i.test(cv.name)) { setError('ارفع السيرة الذاتية بصيغة PDF أو DOC أو DOCX.'); return; }
      if (cv.size > 5 * 1024 * 1024) { setError('حجم السيرة الذاتية يتجاوز ٥ ميغابايت — صغّر الملف.'); return; }
    }
    setBusy(true);
    try {
      const payload = JSON.stringify({
          action: 'apply',
          job_id: applyJob?.id,
          role_id: applyJob ? undefined : form.role_id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          city: form.city.trim() || undefined,
          experience_level: form.experience_level || undefined,
          work_model_pref: form.work_model_pref || undefined,
          start_availability: form.start_availability || undefined,
          arabic_level: form.arabic_level || undefined,
          english_level: form.english_level || undefined,
          salary_range: form.salary_range || undefined,
          portfolio_url: form.portfolio_url.trim() || undefined,
          linkedin_url: form.linkedin_url.trim() || undefined,
          accommodations_needed:
            form.accommodations_show === 'نعم' ? form.accommodations.trim() || 'نعم' : undefined,
          cover_note: form.cover_note.trim() || undefined,
          talent_pool_consent: form.talent_pool_consent,
          answers: Object.keys(answers).length ? answers : undefined,
        });
      let res: Response;
      if (cv) {
        const fd = new FormData();
        fd.append('payload', payload);
        fd.append('cv', cv);
        res = await fetch(`${SUPABASE_URL}/functions/v1/public-forms`, {
          method: 'POST', body: fd,
        });
      } else {
        res = await fetch(`${SUPABASE_URL}/functions/v1/public-forms`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
        });
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === 'cv_type') throw new Error('ارفع السيرة الذاتية بصيغة PDF أو DOC أو DOCX.');
        if (data.error === 'cv_size') throw new Error('حجم السيرة الذاتية يتجاوز ٥ ميغابايت.');
        if (data.error === 'rate_limited') throw new Error('محاولات كثيرة — انتظر قليلاً ثم أعد الإرسال.');
        throw new Error();
      }
      setDoneRef(data.reference);
    } catch (err) {
      setError((err as Error).message || 'تعذر الإرسال — حاول مجدداً أو راسلنا على care@agma.com.sa');
    } finally {
      setBusy(false);
    }
  }

  const showForm = applyJob !== null || talentOpen;

  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <h1 className="mb-3 text-3xl font-black">ابنِ معنا وكالة جيل الذكاء الاصطناعي.</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-light">
          نبحث عن أشخاص يجمعون بين الفضول والحِرفة والبيانات والإبداع. في AGMA
          لا نريد من يستخدم الأدوات فقط — نريد من يفهم المشكلة ثم يختار الأداة
          الصحيحة.
        </p>

        <div className="mb-10 flex flex-wrap gap-2">
          {VALUES.map((v) => (
            <span key={v} className="rounded-full border border-white/15 px-3 py-1 text-xs text-gray-light">
              {v}
            </span>
          ))}
        </div>

        {!showForm && !doneRef && (
          <>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
              <Briefcase className="h-5 w-5 text-pulse-orange" aria-hidden /> الفرص المفتوحة
            </h2>
            {jobs.length === 0 ? (
              <p className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-gray-light">
                لا توجد وظائف منشورة حالياً — انضم إلى شبكة المواهب وسنتواصل عند
                فتح فرصة تناسبك.
              </p>
            ) : (
              <div className="mb-8 space-y-3">
                {jobs.map((j) => (
                  <div key={j.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-bold">{j.public_title_ar}</p>
                      <span className="text-xs text-gray-light">
                        {[j.employment_type, j.work_model, j.location].filter(Boolean).join(' · ')}
                      </span>
                      {j.close_date && (
                        <span dir="ltr" className="text-xs text-gray-medium">حتى {j.close_date}</span>
                      )}
                      <button type="button" onClick={() => setApplyJob(j)}
                        className="ms-auto rounded-md bg-pulse-orange px-4 py-1.5 text-xs font-bold text-void hover:opacity-90">
                        قدّم الآن
                      </button>
                    </div>
                    {j.description_ar && (
                      <p className="mt-2 text-xs leading-relaxed text-gray-light">{j.description_ar}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-black">
                <Sparkles className="h-5 w-5 text-pulse-orange" aria-hidden />
                لم تجد وظيفة مفتوحة تناسبك؟
              </h2>
              <p className="mb-4 text-sm text-gray-light">
                انضم إلى شبكة المواهب — نحتفظ بملفك (بموافقتك) ١٢ شهراً ونتواصل
                عند فتح الفرصة المناسبة.
              </p>
              <button type="button" onClick={() => setTalentOpen(true)}
                className="rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void hover:opacity-90">
                انضم إلى شبكة المواهب
              </button>
            </div>
          </>
        )}

        {showForm && !doneRef && (
          <form onSubmit={submit} noValidate className="space-y-4">
            <h2 className="text-xl font-black">
              {applyJob ? `التقديم على: ${applyJob.public_title_ar}` : 'الانضمام إلى شبكة المواهب'}
            </h2>
            {!applyJob && (
              <div>
                <label htmlFor="a-role" className={label}>التخصص الأقرب لك *</label>
                <select id="a-role" className={field} required value={form.role_id}
                  onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {depts.map((d) => (
                    <optgroup key={d.id} label={d.name_ar}>
                      {roles.filter((r) => r.department_id === d.id).map((r) => (
                        <option key={r.id} value={r.id}>{r.title_ar}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="a-name" className={label}>الاسم الكامل *</label>
                <input id="a-name" className={field} required value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="a-email" className={label}>البريد الإلكتروني *</label>
                <input id="a-email" type="email" dir="ltr" className={field} required value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="a-phone" className={label}>رقم الجوال</label>
                <input id="a-phone" inputMode="tel" dir="ltr" className={field} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="a-city" className={label}>المدينة الحالية</label>
                <input id="a-city" className={field} value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="a-exp" className={label}>مستوى الخبرة</label>
                <select id="a-exp" className={field} value={form.experience_level}
                  onChange={(e) => setForm((f) => ({ ...f, experience_level: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {['طالب/ـة', 'حديث تخرج', 'أقل من سنتين', '2–4 سنوات', '5–7 سنوات', '8–12 سنة', 'أكثر من 12 سنة']
                    .map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-model" className={label}>نموذج العمل المفضل</label>
                <select id="a-model" className={field} value={form.work_model_pref}
                  onChange={(e) => setForm((f) => ({ ...f, work_model_pref: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {['حضوري في الرياض', 'هجين', 'عن بعد', 'مرن حسب الدور']
                    .map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-start" className={label}>متى يمكنك البدء؟</label>
                <select id="a-start" className={field} value={form.start_availability}
                  onChange={(e) => setForm((f) => ({ ...f, start_availability: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {['فوراً', 'خلال أسبوعين', 'خلال شهر', 'خلال شهرين', 'أكثر من شهرين']
                    .map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-salary" className={label}>نطاق الراتب المتوقع (SAR)</label>
                <select id="a-salary" className={field} value={form.salary_range}
                  onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}>
                  <option value="">— اختياري —</option>
                  {['أقل من 5,000', '5,000–7,499', '7,500–9,999', '10,000–14,999',
                    '15,000–19,999', '20,000–29,999', '30,000+', 'أفضل مناقشته لاحقاً']
                    .map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-ar" className={label}>العربية المهنية</label>
                <select id="a-ar" className={field} value={form.arabic_level}
                  onChange={(e) => setForm((f) => ({ ...f, arabic_level: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {['أساسي', 'جيد', 'متقدم', 'احترافي'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-en" className={label}>الإنجليزية المهنية</label>
                <select id="a-en" className={field} value={form.english_level}
                  onChange={(e) => setForm((f) => ({ ...f, english_level: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {['أساسي', 'جيد', 'متقدم', 'احترافي'].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="a-pf" className={label}>
                  {selectedRole?.portfolio_label ?? 'رابط أعمالك (Portfolio / GitHub / Behance)'}
                </label>
                <input id="a-pf" dir="ltr" placeholder="https://…" className={field} value={form.portfolio_url}
                  onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="a-li" className={label}>LinkedIn</label>
                <input id="a-li" dir="ltr" placeholder="https://linkedin.com/in/…" className={field} value={form.linkedin_url}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} />
              </div>
            </div>
            {activeQuestions.length > 0 && (
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-black">
                  أسئلة التقييم ({activeQuestions.length})
                  <span className="ms-2 text-xs font-normal text-gray-light">
                    لا توجد إجابة «مثالية» محفوظة — أجب كما تعمل فعلاً.
                  </span>
                </p>
                {activeQuestions.map((q, i) => (
                  <fieldset key={q.id}>
                    <legend className="mb-2 text-sm font-bold leading-relaxed">
                      {i + 1}. {q.text_ar}
                    </legend>
                    <div className="space-y-1.5">
                      {q.options.map((o) => (
                        <label key={o.v}
                          className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            answers[q.id] === o.v
                              ? 'border-pulse-orange bg-pulse-orange/10'
                              : 'border-white/10 hover:border-white/30'}`}>
                          <input type="radio" name={`q-${q.id}`} value={o.v}
                            checked={answers[q.id] === o.v} className="mt-1"
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.v }))} />
                          <span className="leading-relaxed text-gray-light">{o.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
            <div>
              <label htmlFor="a-cv" className={label}>السيرة الذاتية (PDF أو DOCX، حتى ٥MB)</label>
              <input id="a-cv" type="file" accept=".pdf,.doc,.docx"
                className="w-full text-sm text-gray-light file:me-3 file:rounded-md file:border file:border-white/20 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:text-snow"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
              {cv && <p className="mt-1 text-xs text-gray-light">{cv.name}</p>}
            </div>
            <p className="text-[11px] text-gray-medium">
              لا ترفع أو تشارك أي ملفات أو بيانات سرية مملوكة لعملائك أو أصحاب
              العمل السابقين.
            </p>
            <div>
              <label htmlFor="a-note" className={label}>لماذا أنت مناسب؟ (اختياري)</label>
              <textarea id="a-note" rows={3} className={field} value={form.cover_note}
                onChange={(e) => setForm((f) => ({ ...f, cover_note: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="a-acc" className={label}>
                هل تحتاج أي ترتيبات تيسيرية أثناء عملية التوظيف؟
              </label>
              <select id="a-acc" className={field} value={form.accommodations_show}
                onChange={(e) => setForm((f) => ({ ...f, accommodations_show: e.target.value }))}>
                {['لا', 'نعم', 'أفضل مناقشته لاحقاً'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              {form.accommodations_show === 'نعم' && (
                <>
                  <textarea rows={2} className={`${field} mt-2`} value={form.accommodations}
                    aria-label="الترتيبات التي تحتاجها"
                    onChange={(e) => setForm((f) => ({ ...f, accommodations: e.target.value }))} />
                  <p className="mt-1 text-[11px] text-gray-medium">
                    اذكر الترتيب الذي تحتاجه فقط — لا حاجة لذكر أي تشخيص طبي،
                    وهذه المعلومة لا تدخل في تقييمك إطلاقاً.
                  </p>
                </>
              )}
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-light">
              <input type="checkbox" className="mt-0.5" required checked={form.privacy_ok}
                onChange={(e) => setForm((f) => ({ ...f, privacy_ok: e.target.checked }))} />
              <span>
                قرأت إشعار خصوصية المتقدمين: تعالج مؤسسة عامر عبدالله بن عثمان
                الغامدي للخدمات التسويقية («AGMA») بيانات هذا الطلب لغرض إدارة
                طلبك وتقييم ملاءمتك والتواصل بشأن إجراءات الاختيار فقط. *
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-gray-light">
              <input type="checkbox" className="mt-0.5" checked={form.talent_pool_consent}
                onChange={(e) => setForm((f) => ({ ...f, talent_pool_consent: e.target.checked }))} />
              أوافق (اختيارياً) على الاحتفاظ ببياناتي ضمن شبكة مواهب AGMA لفرص
              مستقبلية لمدة ١٢ شهراً — وبدونها تُحذف بياناتي بعد انتهاء المعالجة.
            </label>
            {error && <p role="alert" className="text-sm font-bold text-pulse-orange">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy}
                className="rounded-md bg-pulse-orange px-6 py-2.5 text-sm font-bold text-void transition-opacity hover:opacity-90 disabled:opacity-50">
                {busy ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
              </button>
              <button type="button" onClick={() => { setApplyJob(null); setTalentOpen(false); }}
                className="text-sm text-gray-light hover:text-snow">رجوع</button>
            </div>
          </form>
        )}

        {doneRef && (
          <div className="rounded-xl border border-pulse-orange/40 bg-white/5 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-pulse-orange" aria-hidden />
            <p className="mb-1 text-lg font-black">شكراً لانضمامك إلى رحلة AGMA</p>
            <p className="mb-4 text-sm text-gray-light">استلمنا طلبك تحت الرقم:</p>
            <p dir="ltr" className="text-2xl font-black tracking-wider text-pulse-orange">{doneRef}</p>
            <p className="mt-4 text-xs text-gray-light">
              سيراجع فريقنا الطلب وفق متطلبات الدور، وسنشعرك عند وجود تحديث.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

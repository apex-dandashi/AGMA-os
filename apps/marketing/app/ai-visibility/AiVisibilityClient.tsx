'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DIAL_CODES } from '@agma/ui';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/publicConfig';

/**
 * حصة الذكاء — أداة قياس مجانية: هل تذكر محركات الذكاء علامتك حين يسأل
 * عميلك سؤال شراء؟ قياس لحظي صادق من نموذج واحد (يُقال ذلك)، ثم طلب التقرير
 * الكامل يصل كعميل محتمل مع ملخص الفحص. L2/L11 في النموذج. مزاج الحرير: ai.
 */

const SECTORS = ['عيادة أسنان', 'مطعم', 'متجر إلكتروني', 'شركة عقارية', 'مركز تجميل', 'مدرسة أو أكاديمية', 'شركة مقاولات', 'مكتب محاماة', 'صالة رياضية', 'شركة تقنية', 'وكالة تسويق', 'أخرى (اكتبها)'];
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'أبها', 'تبوك', 'القصيم', 'أخرى (اكتبها)'];

type Result = { q: string; mentioned: boolean; brands: string[] };
type Check = { score: number; total: number; mentions: number; results: Result[]; competitors: { name: string; count: number }[]; model: string };

function pulseAt(el: Element | null, amp = 30) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('agma:silk-pulse', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, amp } }));
}

export default function AiVisibilityClient() {
  const [form, setForm] = useState({ brand: '', sector: SECTORS[0], sectorOther: '', city: CITIES[0], cityOther: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [check, setCheck] = useState<Check | null>(null);
  const [lead, setLead] = useState({ name: '', dial: '+966', phone: '' });
  const [leadState, setLeadState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  const sector = form.sector.startsWith('أخرى') ? form.sectorOther.trim() : form.sector;
  const city = form.city.startsWith('أخرى') ? form.cityOther.trim() : form.city;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || form.brand.trim().length < 2 || sector.length < 2 || city.length < 2) return;
    setState('busy'); setErrMsg('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-visibility`, {
        method: 'POST', headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ brand: form.brand.trim(), sector, city, website: '' }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) { setCheck(data); setState('done'); window.setTimeout(() => pulseAt(document.getElementById('score'), 40), 300); }
      else { setErrMsg(data?.message ?? 'تعذر القياس الآن — جرّب بعد قليل.'); setState('err'); }
    } catch { setErrMsg('انقطع الاتصال — أعد المحاولة.'); setState('err'); }
  }

  async function sendLead(e: React.FormEvent) {
    e.preventDefault(); if (leadState === 'busy' || !check) return; setLeadState('busy');
    const summary = `تقرير حصة الذكاء الكامل — ${form.brand.trim()} (${sector}، ${city}): ${check.mentions}/${check.total} ذكر (${check.score}٪)` + (check.competitors.length ? ` · منافسون مذكورون: ${check.competitors.map((c) => c.name).join('، ')}` : '');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST', headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ name: lead.name.trim(), company: form.brand.trim(), phone: lead.dial + lead.phone.trim().replace(/^0+/, ''), services: summary, message: 'من أداة حصة الذكاء — يطلب التقرير الكامل (٣ نماذج × ٣٠ سؤالاً)', source: 'site', website: '' }),
      });
      setLeadState(res.ok ? 'ok' : 'err');
    } catch { setLeadState('err'); }
  }

  const reveal = { initial: { opacity: 0, y: 18, filter: 'blur(8px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }, viewport: { once: true, margin: '-60px' } };
  const input = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none';
  const verdict = check ? (check.score >= 67 ? 'حضورك قوي في إجابات الذكاء. المطلوب حمايته قبل أن يزاحمك أحد.' : check.score >= 34 ? 'تُذكر أحياناً لا دائماً. هذه المنطقة التي يُكسب فيها العملاء ويُخسرون.' : 'محركات الذكاء لا تعرفك بعد، وعملاؤك يسألونها اليوم.') : '';

  return (
    <main data-silk-mood="ai" className="min-h-screen relative overflow-hidden" suppressHydrationWarning>
      <Header />
      <section data-silk="1" className="relative px-6 pb-16 pt-40 text-center lg:pt-52">
        <p className="mx-auto mb-6 inline-block rounded-full border border-pulse-orange/40 bg-pulse-orange/10 px-4 py-1.5 text-sm font-bold text-pulse-orange">حصة الذكاء · أداة مجانية</p>
        <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.25] text-snow sm:text-6xl">
          هل يذكرك الذكاء الاصطناعي
          <br /><span className="text-gradient">حين يسأل عميلك؟</span>
        </h1>
        <motion.p {...reveal} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-light">
          عملاؤك اليوم يسألون ChatGPT وGemini قبل جوجل: «أفضل {SECTORS[0]} في {CITIES[0]}؟». نطرح ستة أسئلة شراء حقيقية في قطاعك ومدينتك ونخبرك هل ذُكرت، ومن ذُكر بدلك.
        </motion.p>

        <motion.form {...reveal} onSubmit={run} className="material-panel mx-auto mt-10 grid max-w-3xl gap-4 rounded-3xl p-6 text-right lg:p-8">
          <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required minLength={2} maxLength={80} placeholder="اسم علامتك كما يعرفها الناس" className={input} />
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} aria-label="القطاع" className={input}>{SECTORS.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}</select>
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} aria-label="المدينة" className={input}>{CITIES.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}</select>
          </div>
          {(form.sector.startsWith('أخرى') || form.city.startsWith('أخرى')) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {form.sector.startsWith('أخرى') && <input value={form.sectorOther} onChange={(e) => setForm((f) => ({ ...f, sectorOther: e.target.value }))} maxLength={60} placeholder="قطاعك (مثال: مغسلة سيارات)" className={input} />}
              {form.city.startsWith('أخرى') && <input value={form.cityOther} onChange={(e) => setForm((f) => ({ ...f, cityOther: e.target.value }))} maxLength={40} placeholder="مدينتك" className={input} />}
            </div>
          )}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button type="submit" data-silk-ignite disabled={state === 'busy'} className="btn-primary w-full py-4 text-lg disabled:opacity-60">{state === 'busy' ? 'نسأل الذكاء الاصطناعي الآن… (٢٠ ثانية تقريباً)' : 'قِس حصتي الآن'}</button>
          {state === 'err' && <p className="text-center text-sm text-pulse-orange">{errMsg}</p>}
          <p className="text-center text-xs text-gray-medium">قياس لحظي من نموذج واحد وستة أسئلة. لا نحفظ اسمك ولا جوالك في هذه الخطوة.</p>
        </motion.form>
      </section>

      {check && (
        <section data-silk="0.85" className="scroll-mt-28 px-6 pb-20">
          <div className="container mx-auto max-w-3xl space-y-6">
            <motion.div {...reveal} id="score" className="material-panel rounded-3xl p-8 text-center">
              <p className="text-sm font-bold text-pulse-orange">حصة {form.brand.trim()} في إجابات الذكاء · {sector} · {city}</p>
              <div className="mt-3 flex items-baseline justify-center gap-2"><span className="text-6xl font-black text-snow sm:text-7xl" dir="ltr">{check.score}٪</span></div>
              <p className="mt-1 text-gray-light">ذُكرت في {check.mentions} من {check.total} أسئلة شراء</p>
              <p className="mt-4 text-lg font-bold text-snow">{verdict}</p>
              <p className="mt-2 text-xs text-gray-medium">النموذج: {check.model} · قياس لحظي؛ الإجابات تتغير مع الوقت.</p>
            </motion.div>

            <motion.div {...reveal} className="material-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-snow">الأسئلة الستة</h2>
              <ul className="mt-4 space-y-3">
                {check.results.map((r) => (
                  <li key={r.q} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${r.mentioned ? 'bg-pulse-orange text-snow' : 'border border-white/20 text-gray-medium'}`}>{r.mentioned ? '✓' : '—'}</span>
                    <div><p className="text-snow">{r.q}</p>{r.brands.length > 0 && <p className="mt-1 text-xs text-gray-medium">ذُكر: {r.brands.join('، ')}</p>}</div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {check.competitors.length > 0 && (
              <motion.div {...reveal} className="material-card rounded-2xl p-6">
                <h2 className="text-xl font-bold text-snow">من يأخذ الإجابات بدلك؟</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {check.competitors.map((c) => <span key={c.name} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-light">{c.name} <span className="text-gray-medium">×{c.count}</span></span>)}
                </div>
              </motion.div>
            )}

            <motion.div {...reveal} className="material-panel rounded-3xl p-8">
              <h2 className="text-2xl font-black text-snow">التقرير الكامل: ٣ نماذج × ٣٠ سؤالاً، ويُعاد شهرياً</h2>
              <p className="mt-2 text-gray-light">نقيس ChatGPT وGemini وPerplexity بثلاثين سؤالاً من قطاعك، نحدد ما يجعل المنافس يُذكر، ونضع خطة الظهور في محركات الذكاء ضمن <Link href="/business-accelerator/#packages" className="text-pulse-orange underline">باقة قيادة السوق</Link> أو كخدمة منفردة.</p>
              {leadState === 'ok' ? (
                <p className="mt-6 rounded-2xl border border-pulse-orange/40 bg-pulse-orange/10 p-5 text-snow">وصل طلبك. يصلك التقرير الكامل خلال يومي عمل مع مكالمة لشرحه.</p>
              ) : (
                <form onSubmit={sendLead} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))} required minLength={2} placeholder="اسمك" className={input} />
                    <div dir="ltr" className="flex gap-2">
                      <select value={lead.dial} aria-label="مفتاح الدولة" onChange={(e) => setLead((l) => ({ ...l, dial: e.target.value }))} className="w-32 shrink-0 rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-sm text-snow focus:border-pulse-orange focus:outline-none">{DIAL_CODES.map((d) => <option key={d.code} value={d.code} className="bg-black">{d.flag} {d.code} {d.country}</option>)}</select>
                      <input value={lead.phone} onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))} inputMode="tel" required placeholder="5XXXXXXXX" className={input} />
                    </div>
                  </div>
                  <button type="submit" disabled={leadState === 'busy' || lead.name.trim().length < 2 || lead.phone.trim().length < 7} className="btn-primary px-6 py-3 disabled:opacity-60">{leadState === 'busy' ? 'جارٍ…' : 'أرسل لي التقرير الكامل'}</button>
                  {leadState === 'err' && <p className="text-sm text-pulse-orange sm:col-span-2">تعذر الإرسال. جرّب من <Link href="/contact" className="underline">صفحة التواصل</Link>.</p>}
                </form>
              )}
            </motion.div>
          </div>
        </section>
      )}
      <Footer />
    </main>
  );
}

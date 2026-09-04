'use client';

import { useEffect, useRef, useState } from 'react';
import { DIAL_CODES } from '@agma/ui';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/publicConfig';

/**
 * بوت الموقع: يجيب من قاعدة معرفة AGMA المعتمدة فقط ويستشهد بمصدره؛ وحين
 * لا يثق يتحول أداة التقاط عميل محتمل (اسم + جوال إلزامي — قانون L11).
 * البوت جهاز إدخال للـ CRM لا مجرد واجهة كلام.
 */

type Msg = {
  role: 'user' | 'bot'; text: string;
  citations?: string[]; offerLead?: boolean; general?: boolean;
};

const sessionKey = `w-${Math.random().toString(36).slice(2, 10)}`;

export default function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'bot',
    text: 'حياك الله في AGMA 👋 اسألني عن خدماتنا أو طريقة عملنا أو أي شيء يخص التسويق معنا.',
  }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [leadMode, setLeadMode] = useState(false);
  const [lead, setLead] = useState({ name: '', dial: '+966', phone: '' });
  const [leadSent, setLeadSent] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // الأسئلة المقترحة = عناوين قاعدة المعرفة المنشورة — تتجدد مع كل مقال جديد
  useEffect(() => {
    if (!open || suggestions.length) return;
    fetch(`${SUPABASE_URL}/rest/v1/kb_articles?published=eq.true&audience=eq.public&select=title&limit=6`,
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { title: string }[]) => setSuggestions(rows.map((r) => r.title)))
      .catch(() => null);
  }, [open, suggestions.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, leadMode, open]);

  // مساعد الهيرو (2026-09-04): سؤال من صندوق الهيرو يفتح البوت ويُسأل فوراً
  const askRef = useRef<(q: string) => void>(() => {});
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      if (!q) return;
      setOpen(true);
      setTimeout(() => askRef.current(q), 350);
    };
    window.addEventListener('agma:ask', onAsk);
    return () => window.removeEventListener('agma:ask', onAsk);
  }, []);

  askRef.current = (q: string) => { void askQuestion(q); };
  async function askQuestion(q: string) {
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setDraft('');
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/assistant-ask`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ question: q, surface: 'site', session_key: sessionKey, website: '' }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setMsgs((m) => [...m, {
          role: 'bot', text: data.answer,
          citations: data.citations?.length ? data.citations : undefined,
          offerLead: !data.confident,
          general: !!data.general,
        }]);
      } else {
        setMsgs((m) => [...m, {
          role: 'bot',
          text: data?.message ?? 'تعذر الرد الآن — جرّب بعد قليل أو كلمنا من صفحة التواصل.',
          offerLead: true,
        }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'انقطع الاتصال — أعد المحاولة.', offerLead: true }]);
    }
    setBusy(false);
  }

  async function sendLead(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const transcript = msgs.filter((m) => m.role === 'user').map((m) => m.text).slice(-5);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-intake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: lead.name.trim(),
          phone: lead.dial + lead.phone.trim().replace(/^0+/, ''),
          source: 'site',
          message: `من مساعد الموقع — آخر أسئلته:\n${transcript.join('\n')}`,
          website: '',
        }),
      });
      if (res.ok) {
        setLeadSent(true);
        setLeadMode(false);
        setMsgs((m) => [...m, {
          role: 'bot',
          text: `شكراً يا ${lead.name.split(' ')[0]} — وصلت بياناتك لفريقنا وسيتصل بك خلال يوم عمل.`,
        }]);
      } else {
        setMsgs((m) => [...m, { role: 'bot', text: 'تعذر الإرسال — جرّب من صفحة تواصل معنا.' }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'تعذر الإرسال — جرّب من صفحة تواصل معنا.' }]);
    }
    setBusy(false);
  }

  return (
    <div dir="rtl" className="fixed bottom-5 left-5 z-50">
      {open && (
        <div className="mb-3 flex h-[480px] w-[min(360px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0A0A0A] shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="AGMA" className="h-5 w-auto" />
            <span className="text-sm font-bold text-white">مساعد AGMA</span>
            <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)}
              className="ms-auto text-gray-400 transition-colors hover:text-white">✕</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start flex-row-reverse' : ''}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user' ? 'bg-[#E8542F]/20 text-white' : 'bg-white/8 text-gray-200'
                }`}>
                  {m.general && (
                    <p className="mb-1 text-[10px] font-bold text-[#E8542F]">نصيحة عامة</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.citations && (
                    <p className="mt-1.5 border-t border-white/10 pt-1 text-[10px] text-gray-400">
                      المصدر: {m.citations.join(' · ')}
                    </p>
                  )}
                  {m.offerLead && !leadSent && (
                    <button type="button" onClick={() => setLeadMode(true)}
                      className="mt-2 rounded-md bg-[#E8542F] px-3 py-1.5 text-[12px] font-bold text-black transition-opacity hover:opacity-90">
                      اطلب اتصالاً من الفريق
                    </button>
                  )}
                </div>
              </div>
            ))}
            {msgs.length === 1 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((q) => (
                  <button key={q} type="button" onClick={() => askQuestion(q)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-gray-300 transition-colors hover:border-[#E8542F] hover:text-[#E8542F]">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {busy && <p className="text-[11px] text-gray-500">يكتب…</p>}
            <div ref={endRef} />
          </div>

          {leadMode ? (
            <form onSubmit={sendLead} className="space-y-2 border-t border-white/10 p-3">
              <input value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                placeholder="اسمك" required
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-gray-500 focus:border-[#E8542F] focus:outline-none" />
              {/* المفتاح يسار والرقم يمين (L2) — والجوال إلزامي (L11) */}
              <div dir="ltr" className="flex gap-2">
                <select value={lead.dial} aria-label="مفتاح الدولة"
                  onChange={(e) => setLead((l) => ({ ...l, dial: e.target.value }))}
                  className="w-32 shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-2 text-[12px] text-white focus:border-[#E8542F] focus:outline-none">
                  {DIAL_CODES.map((d) => (
                    <option key={d.code} value={d.code} className="bg-black">
                      {d.flag} {d.code} {d.country}
                    </option>
                  ))}
                </select>
                <input value={lead.phone} inputMode="tel" required placeholder="5XXXXXXXX"
                  onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))}
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-gray-500 focus:border-[#E8542F] focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy || lead.name.trim().length < 2 || lead.phone.trim().length < 7}
                  className="flex-1 rounded-md bg-[#E8542F] px-3 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                  {busy ? 'جارٍ…' : 'اتصلوا بي'}
                </button>
                <button type="button" onClick={() => setLeadMode(false)}
                  className="rounded-md border border-white/15 px-3 text-[12px] text-gray-300">رجوع</button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); askQuestion(draft.trim()); }}
              className="flex gap-2 border-t border-white/10 p-3">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={600}
                placeholder="اكتب سؤالك…"
                className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-gray-500 focus:border-[#E8542F] focus:outline-none" />
              <button type="submit" disabled={busy || !draft.trim()}
                className="rounded-md bg-[#E8542F] px-3 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                أرسل
              </button>
            </form>
          )}
        </div>
      )}

      <button type="button" aria-label={open ? 'إغلاق المساعد' : 'افتح مساعد AGMA'}
        onClick={() => setOpen(!open)}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#E8542F] text-black shadow-lg shadow-[#E8542F]/30 transition-transform hover:scale-105">
        {open ? (
          <span className="text-xl font-black">✕</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPABASE_URL } from '@/lib/publicConfig';
import { Activity, Radio } from 'lucide-react';

type Live = {
  operational: boolean;
  metrics: { label: string; value: string }[];
  feed: { label: string; at: string }[];
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  return `قبل ${Math.round(hrs / 24)} يوماً`;
}

export default function LiveClient() {
  const [data, setData] = useState<Live | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch(`${SUPABASE_URL}/functions/v1/live-stats`)
        .then((r) => r.json())
        .then((d) => (d.ok ? setData(d) : setFailed(true)))
        .catch(() => setFailed(true));
    load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-void text-snow">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-black">
          <Radio className="h-8 w-8 text-pulse-orange" aria-hidden />
          AGMA Live
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-light">
          نبض أنظمتنا الآن — أرقام حقيقية من نظام تشغيل AGMA، بلا أسماء عملاء
          وبلا عدّادات مزيفة.
        </p>

        {failed && (
          <p className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-gray-light">
            تعذر جلب البث اللحظي — أعد المحاولة بعد قليل.
          </p>
        )}
        {!data && !failed && (
          <p className="animate-pulse text-sm text-gray-medium">جارٍ الاتصال بالنظام…</p>
        )}

        {data && (
          <>
            <div className="mb-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <span className={`inline-block h-3 w-3 rounded-full ${
                data.operational ? 'animate-pulse bg-green-400' : 'bg-pulse-orange'}`} aria-hidden />
              <span className="font-bold">
                {data.operational ? 'أنظمة AGMA تعمل بكامل جاهزيتها' : 'أنظمة AGMA — جاهزية جزئية'}
              </span>
            </div>

            {data.metrics.length > 0 && (
              <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <p className="text-3xl font-black text-pulse-orange">{m.value}</p>
                    <p className="mt-1 text-xs text-gray-light">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            {data.feed.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
                  <Activity className="h-5 w-5 text-pulse-orange" aria-hidden />
                  ماذا يفعل نظام AGMA الآن
                </h2>
                <ul className="space-y-2">
                  {data.feed.map((e, i) => (
                    <li key={i}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <span className="font-mono text-pulse-orange">/</span>
                      <span>{e.label}</span>
                      <span className="ms-auto text-xs text-gray-medium">{timeAgo(e.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

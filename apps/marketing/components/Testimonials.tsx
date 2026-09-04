'use client';

import { useEffect, useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/publicConfig';

/**
 * قالوا عنا (تدقيق التحويل 2026-09-04): آراء حقيقية من تقييمات CSAT بإذن
 * موثق — تُنشر من النظام وتظهر هنا. القسم يختفي كلياً حين لا آراء منشورة:
 * قسم شهادات فارغ أسوأ من غيابه.
 */

type Testimonial = { id: string; quote: string; author_company: string | null };

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/testimonials?published=eq.true&select=id,quote,author_company&order=created_at.desc&limit=6`,
      { headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Testimonial[]) => setItems(rows))
      .catch(() => null);
  }, []);

  if (items.length === 0) return null;

  return (
    <section dir="rtl" className="container mx-auto px-4 py-20" aria-label="آراء عملائنا">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-snow">قالوا عنا — بكلماتهم هم</h2>
        <p className="mt-3 text-gray-medium text-sm">
          آراء حقيقية من تقييمات مشاريع مكتملة، تُنشر بإذن أصحابها الموثق.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {items.map((t) => (
          <figure key={t.id}
            className="rounded-lg border border-white/10 bg-[#0d0d0d]/60 p-6 flex flex-col">
            <span className="text-pulse-orange text-3xl leading-none" aria-hidden>”</span>
            <blockquote className="mt-2 flex-1 text-gray-light text-[15px] leading-8">
              {t.quote}
            </blockquote>
            <figcaption className="mt-4 text-sm font-bold text-snow">
              {t.author_company ?? 'عميل AGMA'}
              <span className="block text-[11px] font-normal text-gray-medium mt-0.5">
                من تقييم مشروع مكتمل ✓
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/publicConfig';

interface PublishedClient {
  id: string;
  display_name_ar: string;
  display_name_en: string | null;
  logo_url: string | null;
  sort: number;
}

/**
 * Website live-sync (docs/05 §B1): renders clients the ops app has published
 * (rows where published AND consent_public — enforced server-side by RLS).
 * Renders nothing while the list is empty, so the section is invisible until
 * the first client is published.
 */
export default function ClientLogos() {
  const [clients, setClients] = useState<PublishedClient[]>([]);

  useEffect(() => {
    const base = SUPABASE_URL;
    const key = SUPABASE_ANON_KEY;
    fetch(
      `${base}/rest/v1/website_clients?select=id,display_name_ar,display_name_en,logo_url,sort&order=sort.asc`,
      { headers: { apikey: key, authorization: `Bearer ${key}` } }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: PublishedClient[]) => setClients(rows))
      .catch(() => {});
  }, []);

  if (clients.length === 0) return null;

  return (
    <section className="py-20 px-6 border-t border-gray-dark/50">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mb-10 text-3xl font-black text-snow sm:text-4xl">
          شركاء <span className="text-pulse-orange">النجاح</span>
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center opacity-70 transition-opacity hover:opacity-100">
              {c.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logo_url}
                  alt={c.display_name_ar}
                  className="max-h-12 w-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-lg font-bold text-gray-light">{c.display_name_ar}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

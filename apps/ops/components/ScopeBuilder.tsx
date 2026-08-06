'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@agma/ui';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

type Category = Tables<'service_categories'>;
type Service = Tables<'services_catalog'>;

/**
 * Scope builder (docs/02 §3.1): pick from the 32-service catalog →
 * SoW draft preview → save as draft scope. Default commercial terms from
 * docs/06 §3.5. The Phase 3 legal generator turns approved scopes into
 * real documents; this preview is the working draft.
 */
export default function ScopeBuilder({ clientId, onDone }:
  { clientId: string; onDone: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.from('service_categories').select('*').order('sort')
      .then(({ data }) => setCategories(data ?? []));
    supabase.from('services_catalog').select('*').eq('active', true).order('sort')
      .then(({ data }) => setServices(data ?? []));
  }, []);

  const sowPreview = useMemo(() => {
    const chosen = services.filter((s) => picked.has(s.id));
    if (chosen.length === 0) return '';
    const lines = chosen.map((s, i) => `${i + 1}. ${s.name_ar}`);
    return [
      'مسودة نطاق العمل (SoW)',
      '',
      'الخدمات المتفق عليها:',
      ...lines,
      '',
      timeline && `الإطار الزمني: ${timeline}`,
      responsibilities && `المسؤوليات: ${responsibilities}`,
      '',
      'الشروط التجارية الافتراضية: دفعة ٥٠٪ عند التوقيع، ٢٥٪ عند اعتماد التصميم،',
      '٢٥٪ عند التسليم · صلاحية العرض ٣٠ يوماً · تنتقل الملكية الفكرية بعد السداد الكامل.',
    ]
      .filter((l) => typeof l === 'string')
      .join('\n');
  }, [services, picked, timeline, responsibilities]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (picked.size === 0) return;
    setBusy(true);
    await getSupabase().from('scopes').insert({
      client_id: clientId,
      service_ids: [...picked],
      timeline: timeline || null,
      responsibilities: responsibilities || null,
    });
    setBusy(false);
    onDone();
  }

  return (
    <div className="mb-4 rounded-sm border border-gray-dark p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <p className="mb-1 text-sm font-bold text-pulse-orange">{cat.name_ar}</p>
              <div className="flex flex-wrap gap-1.5">
                {services
                  .filter((s) => s.category_id === cat.id)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        picked.has(s.id)
                          ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                          : 'border-gray-dark text-gray-light hover:border-gray-medium'
                      }`}
                    >
                      {s.name_ar}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <input
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="الإطار الزمني (مثال: ٨ أسابيع)"
            className="w-full rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm"
          />
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="المسؤوليات…"
            rows={2}
            className="w-full rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm"
          />
          <Button onClick={save} disabled={busy || picked.size === 0} className="px-4 py-1.5 text-sm">
            حفظ كمسودة ({picked.size} خدمة)
          </Button>
        </div>
        <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-gray-dark/30 p-3 text-xs leading-relaxed text-gray-light">
          {sowPreview || 'اختر خدمات لعرض مسودة نطاق العمل…'}
        </pre>
      </div>
    </div>
  );
}

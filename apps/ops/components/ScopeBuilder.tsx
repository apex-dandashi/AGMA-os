'use client';

import { useMemo, useState } from 'react';
import { Button, Input, SkeletonList, Textarea } from '@agma/ui';
import { scopeInputSchema } from '@agma/db/schemas';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useCatalog } from '../lib/queries';

/**
 * Scope builder (docs/02 §3.1): pick from the 32-service catalog →
 * SoW draft preview → save as draft scope (docs/06 §3.5 default terms).
 */
export default function ScopeBuilder({ clientId, onDone }:
  { clientId: string; onDone: () => void }) {
  const { data: catalog, isLoading } = useCatalog();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [err, setErr] = useState<string | undefined>();

  const save = useAppMutation(
    async () => {
      const parsed = scopeInputSchema.safeParse({
        service_ids: [...picked],
        timeline,
        responsibilities,
      });
      if (!parsed.success) {
        setErr(parsed.error.issues[0]?.message);
        throw new Error(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة');
      }
      const { error } = await getSupabase().from('scopes').insert({
        client_id: clientId,
        service_ids: parsed.data.service_ids,
        timeline: parsed.data.timeline ?? null,
        responsibilities: parsed.data.responsibilities ?? null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'حُفظ النطاق كمسودة' }
  );

  const sowPreview = useMemo(() => {
    if (!catalog) return '';
    const chosen = catalog.services.filter((s) => picked.has(s.id));
    if (chosen.length === 0) return '';
    return [
      'مسودة نطاق العمل (SoW)',
      '',
      'الخدمات المتفق عليها:',
      ...chosen.map((s, i) => `${i + 1}. ${s.name_ar}`),
      '',
      timeline ? `الإطار الزمني: ${timeline}` : '',
      responsibilities ? `المسؤوليات: ${responsibilities}` : '',
      '',
      'الشروط التجارية الافتراضية: دفعة ٥٠٪ عند التوقيع، ٢٥٪ عند اعتماد التصميم،',
      '٢٥٪ عند التسليم · صلاحية العرض ٣٠ يوماً · تنتقل الملكية الفكرية بعد السداد الكامل.',
    ]
      .filter((l) => l !== '')
      .join('\n');
  }, [catalog, picked, timeline, responsibilities]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading || !catalog) return <SkeletonList rows={3} />;

  return (
    <div className="mb-4 rounded-sm border border-gray-dark p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {catalog.categories.map((cat) => (
            <div key={cat.id}>
              <p className="mb-1 text-sm font-bold text-pulse-orange">{cat.name_ar}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={cat.name_ar}>
                {catalog.services
                  .filter((s) => s.category_id === cat.id)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={picked.has(s.id)}
                      onClick={() => toggle(s.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
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
          <Input
            label="الإطار الزمني"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="مثال: ٨ أسابيع"
          />
          <Textarea
            label="المسؤوليات"
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            loading={save.isPending}
            disabled={picked.size === 0}
            onClick={async () => {
              await save.mutateAsync(undefined as never);
              onDone();
            }}
          >
            حفظ كمسودة ({picked.size} خدمة)
          </Button>
          {err && <p role="alert" className="text-xs text-pulse-orange">{err}</p>}
        </div>
        <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-gray-dark/30 p-3 text-xs leading-relaxed text-gray-light">
          {sowPreview || 'اختر خدمات لعرض مسودة نطاق العمل…'}
        </pre>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input, SkeletonList, Textarea } from '@agma/ui';
import { Package } from 'lucide-react';
import { scopeInputSchema } from '@agma/db/schemas';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useCatalog } from '../lib/queries';

/**
 * Scope builder (docs/02 §3.1 + docs/10 §2.5): packages first — a custom
 * scope is allowed but second-class and requires a why_no_package_fit reason
 * (mined quarterly; recurring reasons become the next package).
 */
export default function ScopeBuilder({ clientId, onDone }:
  { clientId: string; onDone: () => void }) {
  const { data: catalog, isLoading } = useCatalog();
  const { data: packages } = useQuery({
    queryKey: ['scope-packages'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('service_packages').select('*').order('sort');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [packageId, setPackageId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [whyCustom, setWhyCustom] = useState('');
  const [premiumPct, setPremiumPct] = useState('');
  const [err, setErr] = useState<string | undefined>();

  const selectedPackage = packages?.find((p) => p.id === packageId) ?? null;

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
        package_id: packageId,
        why_no_package_fit: packageId ? null : whyCustom.trim() || null,
        custom_premium_pct: packageId ? 0 : Number(premiumPct) || 0,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'حُفظ النطاق كمسودة' }
  );

  function choosePackage(id: string | null) {
    setPackageId(id);
    const pkg = packages?.find((p) => p.id === id);
    if (pkg) {
      setPicked(new Set(pkg.service_ids));
      if (pkg.timeline_weeks) setTimeline(`${pkg.timeline_weeks} أسابيع`);
    }
  }

  const sowPreview = useMemo(() => {
    if (!catalog) return '';
    const chosen = catalog.services.filter((s) => picked.has(s.id));
    if (chosen.length === 0) return '';
    return [
      'مسودة نطاق العمل',
      '',
      selectedPackage ? `${selectedPackage.name_ar} — ${selectedPackage.tagline_ar ?? ''}` : '',
      selectedPackage ? '' : 'نطاق مخصص',
      'الخدمات المتفق عليها:',
      ...chosen.map((s, i) => `${i + 1}. ${s.name_ar}`),
      '',
      timeline ? `الإطار الزمني: ${timeline}` : '',
      responsibilities ? `المسؤوليات: ${responsibilities}` : '',
      '',
      selectedPackage?.payment_terms === 'upfront_100'
        ? 'الشروط التجارية: سداد كامل مقدّماً مع حافز الباقة · صلاحية العرض ٣٠ يوماً ·'
        : selectedPackage?.payment_terms === 'monthly'
          ? 'الشروط التجارية: فوترة شهرية مقدَّمة · صلاحية العرض ٣٠ يوماً ·'
          : 'الشروط التجارية الافتراضية: دفعة ٥٠٪ عند التوقيع، ٢٥٪ عند اعتماد التصميم،',
      selectedPackage
        ? 'تنتقل الملكية الفكرية بعد السداد الكامل.'
        : '٢٥٪ عند التسليم · صلاحية العرض ٣٠ يوماً · تنتقل الملكية الفكرية بعد السداد الكامل.',
    ]
      .filter((l) => l !== '')
      .join('\n');
  }, [catalog, picked, timeline, responsibilities, selectedPackage]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading || !catalog) return <SkeletonList rows={3} />;

  const customBlocked = !packageId && whyCustom.trim().length < 5;

  return (
    <div className="mb-4 rounded-sm border border-gray-dark p-4">
      <div className="mb-3">
        <p className="mb-1.5 text-sm font-bold text-gray-light">ابدأ من باقة — المخصص استثناء له سبب:</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="الباقات">
          {(packages ?? []).map((pkg) => (
            <button key={pkg.id} type="button"
              aria-pressed={packageId === pkg.id}
              disabled={!pkg.active}
              onClick={() => choosePackage(pkg.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
                packageId === pkg.id
                  ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                  : 'border-gray-dark text-gray-light hover:border-gray-medium'
              }`}>
              <Package className="h-3 w-3" aria-hidden />
              {pkg.name_ar}
              {!pkg.active && <span className="text-gray-medium">(قريباً)</span>}
            </button>
          ))}
          <button type="button" aria-pressed={!packageId}
            onClick={() => setPackageId(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
              !packageId
                ? 'border-gray-medium bg-gray-dark/40 text-gray-light'
                : 'border-gray-dark text-gray-medium hover:border-gray-medium'
            }`}>
            نطاق مخصص
          </button>
        </div>
        {selectedPackage && (
          <p className="mt-1.5 text-xs text-gray-medium">
            {selectedPackage.tagline_ar} —{' '}
            {selectedPackage.base_price
              ? `SAR ${Number(selectedPackage.base_price).toLocaleString('en-US')}`
              : 'السعر بانتظار الاعتماد'}
          </p>
        )}
      </div>

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
          {!packageId && (
            <div className="space-y-2 rounded-sm border border-gray-dark bg-gray-dark/20 p-3">
              <Textarea
                label="لماذا لا تناسبه أي باقة؟ (يُعدَّن ربعياً — السبب المتكرر يصبح باقة)"
                value={whyCustom}
                onChange={(e) => setWhyCustom(e.target.value)}
                rows={2}
              />
              <Input
                label="علاوة التخصيص % (قول «لا» بلطف — بالريال)"
                type="number" dir="ltr" value={premiumPct}
                onChange={(e) => setPremiumPct(e.target.value)}
              />
            </div>
          )}
          {(() => {
            const est = catalog.services
              .filter((s) => picked.has(s.id))
              .reduce((sum, s) => sum + Number(s.default_price ?? 0), 0);
            return est > 0 ? (
              <p className="text-xs text-gray-medium">
                تقدير مبدئي من أسعار الكتالوج: <b dir="ltr">SAR {est.toLocaleString('en-US')}</b>
                {' '}— يُضبط نهائياً في عرض السعر.
              </p>
            ) : null;
          })()}
          <Button
            size="sm"
            loading={save.isPending}
            disabled={picked.size === 0 || customBlocked}
            onClick={async () => {
              await save.mutateAsync(undefined as never);
              onDone();
            }}
          >
            حفظ كمسودة ({picked.size} خدمة)
          </Button>
          {customBlocked && picked.size > 0 && (
            <p className="text-xs text-gray-medium">النطاق المخصص يتطلب سبباً قبل الحفظ.</p>
          )}
          {err && <p role="alert" className="text-xs text-pulse-orange">{err}</p>}
        </div>
        <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-gray-dark/30 p-3 text-xs leading-relaxed text-gray-light">
          {sowPreview || 'اختر باقة أو خدمات لعرض مسودة نطاق العمل…'}
        </pre>
      </div>
    </div>
  );
}

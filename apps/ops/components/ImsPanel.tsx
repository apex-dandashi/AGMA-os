'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, EmptyState, Hint, Input, Select, SkeletonList,
  Switch, Tabs, Textarea,
} from '@agma/ui';
import { ShieldCheck } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

/**
 * الحوكمة والامتثال (docs/15 — IMS Phase 1): معايير مُصدَّرة، ضوابط بربط
 * متعدد، مخاطر موحدة، التزامات، ROPA/DSAR/تسريبات PDPL، عدم المطابقة CAPA،
 * وسجل أنظمة AI. الحواجز الفعلية في قاعدة البيانات — الواجهة تعرضها بصدق.
 */
export default function ImsPanel() {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-black">الحوكمة والامتثال</h1>
        <Hint text="عملية واحدة ← دليل واحد ← عدة متطلبات. وجود الشاشات لا يمنح شهادة — الشهادة تتطلب تطبيقاً فعلياً يفحصه مدقق معتمد. المرجع: docs/15." />
      </div>
      <p className="mb-3 text-sm text-gray-medium">
        سجلات المطابقة والتدقيق: الضوابط والمخاطر والالتزامات والخصوصية والإجراءات التصحيحية.
      </p>
      <Tabs active={tab} onChange={setTab} tabs={[
        { key: 'overview', label: 'نظرة عامة' },
        { key: 'controls', label: 'الضوابط' },
        { key: 'risks', label: 'المخاطر' },
        { key: 'obligations', label: 'الالتزامات' },
        { key: 'privacy', label: 'الخصوصية' },
        { key: 'capa', label: 'عدم المطابقة' },
        { key: 'ai', label: 'الذكاء الاصطناعي' },
      ]} />
      <div className="mt-4">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'controls' && <ControlsTab />}
        {tab === 'risks' && <RisksTab />}
        {tab === 'obligations' && <ObligationsTab />}
        {tab === 'privacy' && <PrivacyTab />}
        {tab === 'capa' && <CapaTab />}
        {tab === 'ai' && <AiTab />}
      </div>
    </div>
  );
}

const CONTROL_STATUS: Record<string, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  implemented: { label: 'مطبَّق', variant: 'accent' },
  partial: { label: 'جزئي', variant: 'outline' },
  required: { label: 'مطلوب', variant: 'neutral' },
  review_required: { label: 'يلزم مراجعة', variant: 'outline' },
  not_applicable: { label: 'لا ينطبق', variant: 'neutral' },
};

const IMPL_MODE: Record<string, string> = {
  system_enforced: 'يفرضه النظام',
  workflow_enforced: 'مسار عمل',
  automated_evidence: 'دليل آلي',
  manual_evidence: 'دليل يدوي',
  external_technical: 'تقني خارجي',
  organizational: 'تنظيمي',
  contractual: 'تعاقدي',
  not_applicable: 'لا ينطبق',
};

/* ------------------------------------------------------------- overview */

function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['ims-overview'],
    queryFn: async () => {
      const s = getSupabase();
      const [controls, risks, obligations, dsar, breaches, ncr] = await Promise.all([
        s.from('ims_controls').select('status, framework_id, applicable'),
        s.from('risks').select('status, residual_score'),
        s.from('legal_obligations').select('status, next_due_on, applicable'),
        s.from('data_subject_requests').select('status, statutory_due_on, extended_due_on'),
        s.from('privacy_breaches').select('status, authority_deadline_at, authority_notified_at'),
        s.from('nonconformities').select('status, severity'),
      ]);
      return {
        controls: controls.data ?? [], risks: risks.data ?? [],
        obligations: obligations.data ?? [], dsar: dsar.data ?? [],
        breaches: breaches.data ?? [], ncr: ncr.data ?? [],
      };
    },
  });
  if (isLoading || !data) return <SkeletonList rows={4} />;

  const applicable = data.controls.filter((c) => c.applicable && c.status !== 'not_applicable');
  const implemented = applicable.filter((c) => c.status === 'implemented').length;
  const openRisks = data.risks.filter((r) => r.status === 'open' || r.status === 'treating');
  const highRisks = openRisks.filter((r) => (r.residual_score ?? 0) >= 12).length;
  const dueSoon = data.obligations.filter((o) => o.applicable && o.status !== 'met'
    && o.next_due_on && new Date(o.next_due_on) <= new Date(Date.now() + 30 * 864e5)).length;
  const openDsar = data.dsar.filter((d) => !['responded', 'closed', 'rejected'].includes(d.status)).length;
  const runningBreaches = data.breaches.filter((b) => b.status === 'open' && !b.authority_notified_at).length;
  const openNcr = data.ncr.filter((n) => n.status !== 'closed').length;

  const cards: { label: string; value: string; hint: string; alarm?: boolean }[] = [
    { label: 'الضوابط المطبَّقة', value: `${implemented} / ${applicable.length}`,
      hint: 'ضوابط منطبقة حالتها «مطبَّق» — الحالات صادقة: ما يفرضه النظام مطبَّق، وما ينتظر دليلاً يدوياً «مطلوب». التفاصيل في تبويب الضوابط.' },
    { label: 'مخاطر عالية مفتوحة', value: String(highRisks), alarm: highRisks > 0,
      hint: 'درجة متبقية ≥ ١٢ — قبولها قرار شريك حصراً بمسوغ مكتوب.' },
    { label: 'التزامات مستحقة (٣٠ يوماً)', value: String(dueSoon), alarm: dueSoon > 0,
      hint: 'من السجل القانوني — تنبيهات آلية قبل ٣٠ و٧ أيام.' },
    { label: 'طلبات أصحاب بيانات مفتوحة', value: String(openDsar), alarm: openDsar > 0,
      hint: 'المهلة النظامية ٣٠ يوماً تُحسب آلياً — تنبيهات 15/7/3/1 وتجاوز.' },
    { label: 'تسريبات بساعة ٧٢ تعمل', value: String(runningBreaches), alarm: runningBreaches > 0,
      hint: 'تسريب مفتوح بلا قرار إشعار جهة — العداد من لحظة العلم.' },
    { label: 'عدم مطابقة مفتوح', value: String(openNcr), alarm: openNcr > 3,
      hint: 'شكاوى وحوادث وملاحظات تدقيق — الإغلاق يتطلب تحققاً من الفعالية بيد غير المالك.' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} className={`p-4 ${c.alarm ? 'border-pulse-orange/60' : ''}`}>
          <p className="flex items-center gap-1.5 text-xs text-gray-medium">
            {c.label} <Hint text={c.hint} />
          </p>
          <p className={`mt-1 text-2xl font-black ${c.alarm ? 'text-pulse-orange' : ''}`}>{c.value}</p>
        </Card>
      ))}
      <Card className="p-4 sm:col-span-2 lg:col-span-3">
        <p className="text-xs leading-relaxed text-gray-medium">
          <ShieldCheck className="ms-0 me-1.5 inline h-4 w-4 text-pulse-orange" aria-hidden />
          الجاهزية هنا جاهزية أدلة لا شهادة: المعايير مُصدَّرة (ISO 9001، ISO 27001،
          PDPL، NCA استرشادياً، ISO 42001 مخططاً) والضابط الواحد يرتبط بعدة معايير.
          قرارات الشركاء المفتوحة: أي شهادة نستهدف أولاً، وتقييم تعيين مسؤول
          حماية البيانات في الأداة الحكومية — التفاصيل في docs/15.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------- controls */

function ControlsTab() {
  const key = ['ims-controls'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [fws, controls, maps] = await Promise.all([
        s.from('ims_frameworks').select('*').order('key'),
        s.from('ims_controls').select('*').order('ref_code'),
        s.from('control_mappings').select('source_control_id'),
      ]);
      return { fws: fws.data ?? [], controls: controls.data ?? [], maps: maps.data ?? [] };
    },
  });
  const [fw, setFw] = useState('all');
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('ims_controls').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={6} />;

  const visible = data.controls.filter((c) => fw === 'all' || c.framework_id === fw);
  const mapCount = new Map<string, number>();
  for (const m of data.maps) {
    mapCount.set(m.source_control_id, (mapCount.get(m.source_control_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={fw} onChange={(e) => setFw(e.target.value)} aria-label="المعيار">
          <option value="all">كل المعايير</option>
          {data.fws.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name_ar} — {f.version}{f.status === 'planned' ? ' (مخطط)' : ''}
            </option>
          ))}
        </Select>
        <Hint text="المعايير مُصدَّرة: الإصدار الجديد يُضاف صفاً جديداً ويتعايش مع القديم مع ترحيل الربط — لا إعادة بناء. نصوص المعيار الكاملة تُستورد من نسخة مرخصة عند قرار الشهادة." />
      </div>
      <div className="space-y-1.5">
        {visible.map((c) => {
          const st = CONTROL_STATUS[c.status] ?? CONTROL_STATUS.required;
          return (
            <Card key={c.id} className="p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <b dir="ltr" className="text-xs text-gray-medium">{c.ref_code}</b>
                <span className="font-bold">{c.title_ar}</span>
                <Badge variant={st.variant}>{st.label}</Badge>
                <Badge variant="outline">{IMPL_MODE[c.implementation_mode]}</Badge>
                {(mapCount.get(c.id) ?? 0) > 0 && (
                  <Badge variant="outline">يخدم +{mapCount.get(c.id)} معايير</Badge>
                )}
                <span className="ms-auto flex items-center gap-2">
                  <Select value={c.status} aria-label={`حالة ${c.ref_code}`}
                    className="w-32 py-1 text-xs"
                    onChange={(e) => patch.mutate({ id: c.id, p: {
                      status: e.target.value,
                      last_reviewed_on: new Date().toISOString().slice(0, 10),
                      next_review_on: new Date(Date.now() + c.review_months * 30 * 864e5)
                        .toISOString().slice(0, 10),
                    } })}>
                    {Object.entries(CONTROL_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </span>
              </div>
              {c.implementation_note && (
                <p className="mt-1.5 text-xs text-gray-medium">{c.implementation_note}</p>
              )}
              {c.next_review_on && (
                <p className="mt-1 text-xs text-gray-medium">
                  المراجعة التالية: <span dir="ltr">{c.next_review_on}</span>
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- risks */

const RISK_CAT: Record<string, string> = {
  business: 'أعمال', quality: 'جودة', security: 'أمن', privacy: 'خصوصية',
  continuity: 'استمرارية', ai: 'ذكاء اصطناعي', compliance: 'امتثال',
  supplier: 'مورد', project: 'مشروع',
};

function riskColor(score: number) {
  return score >= 20 ? 'text-red-400' : score >= 12 ? 'text-pulse-orange' : 'text-gray-light';
}

function RisksTab() {
  const key = ['ims-risks'];
  const me = useProfile();
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('risks')
        .select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [form, setForm] = useState({ category: 'security', title: '', likelihood: '3', impact: '3' });
  const [accepting, setAccepting] = useState<{ id: string; reason: string } | null>(null);

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('risks').insert({
        category: form.category as Enums<'risk_category'>,
        title: form.title.trim(),
        likelihood: Number(form.likelihood),
        impact: Number(form.impact),
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'سُجل الخطر' }
  );
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('risks').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Select label="الفئة" value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {Object.entries(RISK_CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="الخطر" className="min-w-56" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Select label="الاحتمال (١-٥)" value={form.likelihood}
            onChange={(e) => setForm((f) => ({ ...f, likelihood: e.target.value }))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          <Select label="الأثر (١-٥)" value={form.impact}
            onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          <Button size="sm" loading={add.isPending} disabled={form.title.trim().length < 3}
            onClick={() => add.mutate(undefined as never)}>
            + سجّل الخطر
          </Button>
          <Hint text="سجل موحد لكل الفئات (المبدأ: محرك مخاطر واحد لا عشرة). الدرجة = احتمال × أثر؛ ≥١٢ عالٍ و≥٢٠ حرج — قبولهما للشريك فقط بمسوغ." />
        </div>
      </Card>
      {data.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-8 w-8" aria-hidden />}
          title="لا مخاطر مسجلة" hint="سجّل أول خطر — التفكير المبني على المخاطر أساس كل المعايير." />
      ) : data.map((r) => (
        <Card key={r.id} className="p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{RISK_CAT[r.category]}</Badge>
            <span className="font-bold">{r.title}</span>
            <span className={`text-xs font-black ${riskColor(r.inherent_score ?? 0)}`}>
              كامن {r.inherent_score}
            </span>
            <span className={`text-xs font-black ${riskColor(r.residual_score ?? 0)}`}>
              متبقٍّ {r.residual_score}
            </span>
            <Badge variant={r.status === 'open' ? 'neutral' : r.status === 'accepted' ? 'outline' : 'accent'}>
              {{ open: 'مفتوح', treating: 'قيد المعالجة', accepted: 'مقبول', closed: 'مغلق' }[r.status]}
            </Badge>
            <span className="ms-auto flex gap-2">
              {r.status !== 'closed' && r.status !== 'accepted' && (
                <>
                  <Button variant="ghost" size="xs"
                    onClick={() => patch.mutate({ id: r.id, p: { status: 'treating', treatment: 'mitigate' } })}>
                    معالجة
                  </Button>
                  <Button variant="ghost" size="xs"
                    onClick={() => setAccepting({ id: r.id, reason: '' })}>
                    قبول
                  </Button>
                  <Button variant="ghost" size="xs"
                    onClick={() => patch.mutate({ id: r.id, p: { status: 'closed' } })}>
                    إغلاق
                  </Button>
                </>
              )}
            </span>
          </div>
          {accepting?.id === r.id && (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
              <Input label="مسوغ القبول (إلزامي)" className="min-w-64" value={accepting.reason}
                onChange={(e) => setAccepting({ id: r.id, reason: e.target.value })} />
              <Button size="xs" disabled={accepting.reason.trim().length < 5}
                onClick={async () => {
                  await patch.mutateAsync({ id: r.id, p: {
                    status: 'accepted', acceptance_reason: accepting.reason.trim() } });
                  setAccepting(null);
                }}>
                تأكيد القبول
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setAccepting(null)}>إلغاء</Button>
              {(r.residual_score ?? 0) >= 12 && me.role !== 'admin' && (
                <p className="text-xs text-pulse-orange">درجته ≥١٢ — القاعدة سترفض قبوله من غير الشريك.</p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- obligations */

function ObligationsTab() {
  const key = ['ims-obligations'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('legal_obligations')
        .select('*').order('next_due_on', { ascending: true, nullsFirst: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('legal_obligations').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={4} />;
  return (
    <div className="space-y-1.5">
      <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-medium">
        السجل القانوني والتنظيمي — تنبيهات آلية قبل الاستحقاق بـ٣٠ و٧ أيام
        <Hint text="PDPL وZATCA والسجل التجاري ومراجعات الوصول الدورية. علِّم «مستوفى» بعد التنفيذ وحدّث تاريخ الاستحقاق التالي." />
      </p>
      {data.map((o) => (
        <Card key={o.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
          <Badge variant="outline">{o.law}</Badge>
          <span>{o.summary_ar}</span>
          {o.next_due_on && (
            <span dir="ltr" className={`text-xs ${
              new Date(o.next_due_on) <= new Date(Date.now() + 30 * 864e5)
                ? 'font-bold text-pulse-orange' : 'text-gray-medium'}`}>
              {o.next_due_on}
            </span>
          )}
          <span className="ms-auto">
            <Select value={o.status} aria-label={`حالة ${o.law}`} className="w-28 py-1 text-xs"
              onChange={(e) => patch.mutate({ id: o.id, p: {
                status: e.target.value,
                last_review_on: new Date().toISOString().slice(0, 10) } })}>
              <option value="open">قائم</option>
              <option value="met">مستوفى</option>
              <option value="at_risk">متعثر</option>
            </Select>
          </span>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- privacy */

const DSAR_KIND: Record<string, string> = {
  access: 'اطلاع', copy: 'نسخة', correction: 'تصحيح', destruction: 'إتلاف',
  consent_withdrawal: 'سحب موافقة', complaint: 'شكوى', other: 'أخرى',
};

function PrivacyTab() {
  const key = ['ims-privacy'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [ropa, dsar, breaches] = await Promise.all([
        s.from('processing_activities').select('*').order('created_at'),
        s.from('data_subject_requests').select('*').order('created_at', { ascending: false }),
        s.from('privacy_breaches').select('*').order('created_at', { ascending: false }),
      ]);
      return { ropa: ropa.data ?? [], dsar: dsar.data ?? [], breaches: breaches.data ?? [] };
    },
  });
  const [dsarForm, setDsarForm] = useState({ kind: 'access', subject: '', contact: '' });
  const [breachForm, setBreachForm] = useState({ title: '', categories: '' });
  const [ropaForm, setRopaForm] = useState({ name: '', purpose: '', basis: 'contract' });

  const addDsar = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('data_subject_requests').insert({
        kind: dsarForm.kind as Enums<'dsar_kind'>,
        subject_name: dsarForm.subject.trim(),
        contact: dsarForm.contact.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'سُجل الطلب — المهلة النظامية ٣٠ يوماً بدأت' }
  );
  const addBreach = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('privacy_breaches').insert({
        title: breachForm.title.trim(),
        data_categories: breachForm.categories.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'فُتحت حالة التسريب — ساعة الـ٧٢ تعمل وتم تصعيدها' }
  );
  const addRopa = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('processing_activities').insert({
        name: ropaForm.name.trim(),
        purpose: ropaForm.purpose.trim(),
        legal_basis: ropaForm.basis as Enums<'pdpl_legal_basis'>,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'أُضيف نشاط المعالجة للسجل' }
  );
  const patchDsar = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('data_subject_requests').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const patchBreach = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('privacy_breaches').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={6} />;

  return (
    <div className="space-y-5">
      {/* التسريبات أولاً — الأخطر زمنياً */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          تسريب البيانات الشخصية
          <Hint text="اللائحة: إشعار الجهة خلال ٧٢ ساعة من لحظة العلم عند احتمال الضرر. الحالة الجديدة تصعّد فوراً للشريك ومسؤول الخصوصية والقانوني، والعداد يذكّر يومياً حتى تسجيل القرار." />
        </p>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Input label="وصف الحادثة" className="min-w-56" value={breachForm.title}
            onChange={(e) => setBreachForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="فئات البيانات" value={breachForm.categories}
            onChange={(e) => setBreachForm((f) => ({ ...f, categories: e.target.value }))} />
          <Button size="sm" loading={addBreach.isPending}
            disabled={breachForm.title.trim().length < 3}
            onClick={() => addBreach.mutate(undefined as never)}>
            فتح حالة تسريب
          </Button>
        </div>
        {data.breaches.map((b) => {
          const hoursLeft = Math.round(
            (new Date(b.authority_deadline_at).getTime() - Date.now()) / 36e5);
          const running = b.status === 'open' && !b.authority_notified_at;
          return (
            <Card key={b.id} className={`mb-1.5 flex flex-wrap items-center gap-2 p-3 text-sm ${
              running ? 'border-pulse-orange' : ''}`}>
              <span className="font-bold">{b.title}</span>
              {running && (
                <Badge variant="accent">
                  {hoursLeft > 0 ? `بقي ${hoursLeft} ساعة` : 'تجاوز المهلة!'}
                </Badge>
              )}
              <Badge variant="outline">
                {{ open: 'مفتوح', assessed: 'مُقيَّم', notified: 'أُشعرت الجهة', closed: 'مغلق' }[b.status]}
              </Badge>
              <span className="ms-auto flex gap-2">
                {running && (
                  <Button variant="outline" size="xs"
                    onClick={() => patchBreach.mutate({ id: b.id, p: {
                      status: 'notified', authority_notified_at: new Date().toISOString() } })}>
                    سُجّل إشعار الجهة
                  </Button>
                )}
                {b.status !== 'closed' && (
                  <Button variant="ghost" size="xs"
                    onClick={() => patchBreach.mutate({ id: b.id, p: { status: 'closed' } })}>
                    إغلاق
                  </Button>
                )}
              </span>
            </Card>
          );
        })}
      </section>

      {/* DSAR */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          طلبات أصحاب البيانات
          <Hint text="المهلة النظامية ٣٠ يوماً تُحسب آلياً من الاستلام، والتمديد ٣٠ يوماً كحد أقصى بمسوغ مكتوب مع إبلاغ صاحب البيانات. تنبيهات آلية عند 15/7/3/1 يوماً وعند التجاوز." />
        </p>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Select label="النوع" value={dsarForm.kind}
            onChange={(e) => setDsarForm((f) => ({ ...f, kind: e.target.value }))}>
            {Object.entries(DSAR_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="صاحب البيانات" value={dsarForm.subject}
            onChange={(e) => setDsarForm((f) => ({ ...f, subject: e.target.value }))} />
          <Input label="وسيلة التواصل" value={dsarForm.contact}
            onChange={(e) => setDsarForm((f) => ({ ...f, contact: e.target.value }))} />
          <Button size="sm" loading={addDsar.isPending}
            disabled={dsarForm.subject.trim().length < 2}
            onClick={() => addDsar.mutate(undefined as never)}>
            + سجّل الطلب
          </Button>
        </div>
        {data.dsar.map((d) => {
          const due = d.extended_due_on ?? d.statutory_due_on;
          const daysLeft = Math.ceil((new Date(due).getTime() - Date.now()) / 864e5);
          const open = !['responded', 'closed', 'rejected'].includes(d.status);
          return (
            <Card key={d.id} className="mb-1.5 flex flex-wrap items-center gap-2 p-3 text-sm">
              <Badge variant="outline">{DSAR_KIND[d.kind]}</Badge>
              <span className="font-bold">{d.subject_name}</span>
              {open && (
                <span className={`text-xs ${daysLeft <= 7 ? 'font-bold text-pulse-orange' : 'text-gray-medium'}`}>
                  {daysLeft >= 0 ? `بقي ${daysLeft} يوماً` : `متجاوز بـ${-daysLeft} يوماً!`}
                </span>
              )}
              <Badge variant={open ? 'neutral' : 'accent'}>
                {{ received: 'مستلم', identity_verification: 'تحقق هوية', in_progress: 'قيد المعالجة',
                   responded: 'تم الرد', closed: 'مغلق', rejected: 'مرفوض بمسوغ' }[d.status]}
              </Badge>
              <span className="ms-auto flex gap-2">
                {open && (
                  <>
                    <Button variant="ghost" size="xs"
                      onClick={() => patchDsar.mutate({ id: d.id, p: { status: 'in_progress',
                        identity_verified_at: d.identity_verified_at ?? new Date().toISOString() } })}>
                      قيد المعالجة
                    </Button>
                    <Button variant="outline" size="xs"
                      onClick={() => patchDsar.mutate({ id: d.id, p: { status: 'responded' } })}>
                      تم الرد
                    </Button>
                  </>
                )}
              </span>
            </Card>
          );
        })}
      </section>

      {/* ROPA */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          سجل أنشطة المعالجة (ROPA)
          <Hint text="اللائحة: سجل مكتوب محدث طوال المعالجة ويُحتفظ به ٥ سنوات بعد انتهاء النشاط — لذلك النشاط المنتهي يُعلَّم «منتهٍ» ولا يُحذف. البيانات الحساسة أو النقل الخارجي يوجبان تقييم أثر آلياً." />
        </p>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Input label="النشاط" value={ropaForm.name}
            onChange={(e) => setRopaForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="الغرض" className="min-w-56" value={ropaForm.purpose}
            onChange={(e) => setRopaForm((f) => ({ ...f, purpose: e.target.value }))} />
          <Select label="الأساس النظامي" value={ropaForm.basis}
            onChange={(e) => setRopaForm((f) => ({ ...f, basis: e.target.value }))}>
            <option value="consent">موافقة</option>
            <option value="contract">تنفيذ عقد</option>
            <option value="legal_obligation">التزام نظامي</option>
            <option value="legitimate_interest">مصلحة مشروعة (تقييم موثق)</option>
          </Select>
          <Button size="sm" loading={addRopa.isPending}
            disabled={ropaForm.name.trim().length < 3 || ropaForm.purpose.trim().length < 5}
            onClick={() => addRopa.mutate(undefined as never)}>
            + أضف نشاطاً
          </Button>
        </div>
        {data.ropa.map((p) => (
          <Card key={p.id} className="mb-1.5 flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-bold">{p.name}</span>
            <span className="text-xs text-gray-medium">{p.purpose}</span>
            <Badge variant="outline">
              {{ consent: 'موافقة', contract: 'عقد', legal_obligation: 'التزام نظامي',
                 vital_interest: 'مصلحة حيوية', public_interest: 'مصلحة عامة',
                 legitimate_interest: 'مصلحة مشروعة' }[p.legal_basis]}
            </Badge>
            {p.dpia_required && <Badge variant="accent">يلزم تقييم أثر</Badge>}
            {p.status === 'ended' && <Badge variant="neutral">منتهٍ (محفوظ ٥ سنوات)</Badge>}
          </Card>
        ))}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- capa */

const NCR_STATUS: Record<string, string> = {
  open: 'مفتوح', containment: 'احتواء', root_cause: 'تحليل الجذر',
  action_plan: 'خطة إجراء', implementation: 'تنفيذ',
  effectiveness_review: 'مراجعة الفعالية', closed: 'مغلق',
};

function CapaTab() {
  const key = ['ims-ncr'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('nonconformities')
        .select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [form, setForm] = useState({ source: 'complaint', title: '', severity: 'minor' });
  const [closing, setClosing] = useState<{ id: string; note: string } | null>(null);

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('nonconformities').insert({
        source: form.source, title: form.title.trim(), severity: form.severity,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'سُجلت الحالة' }
  );
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('nonconformities').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Select label="المصدر" value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
            <option value="complaint">شكوى عميل</option>
            <option value="delivery">مخرج غير مطابق</option>
            <option value="incident">حادث</option>
            <option value="audit">ملاحظة تدقيق</option>
            <option value="supplier">مورد</option>
            <option value="internal">داخلي</option>
          </Select>
          <Input label="الوصف" className="min-w-64" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Select label="الخطورة" value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
            <option value="minor">بسيطة</option>
            <option value="major">جوهرية</option>
            <option value="critical">حرجة</option>
          </Select>
          <Button size="sm" loading={add.isPending} disabled={form.title.trim().length < 3}
            onClick={() => add.mutate(undefined as never)}>
            + سجّل
          </Button>
          <Hint text="المسار: احتواء ← تحليل جذر ← خطة ← تنفيذ ← تحقق فعالية ← إغلاق. القاعدة تمنع الإغلاق بلا توثيق التحقق، ومالك الإجراء لا يغلقه بنفسه." />
        </div>
      </Card>
      {data.map((n) => (
        <Card key={n.id} className="p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={n.severity === 'critical' ? 'accent' : 'outline'}>
              {{ minor: 'بسيطة', major: 'جوهرية', critical: 'حرجة' }[n.severity]}
            </Badge>
            <span className="font-bold">{n.title}</span>
            <Badge variant={n.status === 'closed' ? 'accent' : 'neutral'}>{NCR_STATUS[n.status]}</Badge>
            <span className="ms-auto flex gap-2">
              {n.status !== 'closed' && (
                <>
                  <Select value={n.status} aria-label="المرحلة" className="w-36 py-1 text-xs"
                    onChange={(e) => {
                      if (e.target.value === 'closed') setClosing({ id: n.id, note: '' });
                      else patch.mutate({ id: n.id, p: { status: e.target.value } });
                    }}>
                    {Object.entries(NCR_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </>
              )}
            </span>
          </div>
          {closing?.id === n.id && (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
              <Textarea label="توثيق التحقق من الفعالية (كيف تأكدت أن المشكلة لن تتكرر؟)"
                rows={2} className="min-w-72" value={closing.note}
                onChange={(e) => setClosing({ id: n.id, note: e.target.value })} />
              <Button size="xs" disabled={closing.note.trim().length < 10}
                onClick={async () => {
                  await patch.mutateAsync({ id: n.id, p: {
                    status: 'closed', effectiveness_note: closing.note.trim() } });
                  setClosing(null);
                }}>
                إغلاق بالتحقق
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setClosing(null)}>إلغاء</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- ai */

function AiTab() {
  const key = ['ims-ai'];
  const me = useProfile();
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('ai_systems')
        .select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [form, setForm] = useState({ name: '', provider: '', purpose: '' });
  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('ai_systems').insert({
        name: form.name.trim(), provider: form.provider.trim(),
        purpose: form.purpose.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'سُجل النظام — يلزم اعتماد الشريك قبل الاستخدام الفعلي' }
  );
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('ai_systems').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  if (isLoading || !data) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Input label="النظام / الأداة" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="المزود" value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
          <Input label="الغرض" className="min-w-56" value={form.purpose}
            onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
          <Button size="sm" loading={add.isPending}
            disabled={form.name.trim().length < 2 || form.provider.trim().length < 2}
            onClick={() => add.mutate(undefined as never)}>
            + سجّل نظام AI
          </Button>
          <Hint text="أجما AI-Native — كل أداة ذكاء اصطناعي تُسجَّل هنا قبل استخدامها (ISO 42001 لاحقاً يبنى فوق هذا السجل). الاعتماد قرار شريك، خاصة عند لمس بيانات شخصية أو سرية عميل." />
        </div>
      </Card>
      {data.map((a) => (
        <Card key={a.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="font-bold">{a.name}</span>
          <span className="text-xs text-gray-medium">{a.provider}</span>
          {a.personal_data && <Badge variant="outline">بيانات شخصية</Badge>}
          {a.client_confidential && <Badge variant="outline">سرية عميل</Badge>}
          <Badge variant={a.approved ? 'accent' : 'neutral'}>
            {a.approved ? 'معتمد' : 'بانتظار اعتماد الشريك'}
          </Badge>
          <span className="ms-auto flex items-center gap-3">
            <Switch label="مراجعة بشرية" checked={a.human_review}
              onChange={(v) => patch.mutate({ id: a.id, p: { human_review: v } })} />
            {!a.approved && me.role === 'admin' && (
              <Button variant="outline" size="xs"
                onClick={() => patch.mutate({ id: a.id, p: { approved: true } })}>
                اعتماد
              </Button>
            )}
          </span>
          {a.risk_note && <p className="w-full text-xs text-gray-medium">{a.risk_note}</p>}
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Hint,
  Input,
  Modal,
  Select,
  SkeletonList,
  Table,
  Td,
  Textarea,
  Tr,
} from '@agma/ui';
import { BookOpenCheck, DatabaseZap, FlaskConical, Package, Rocket } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

const TERMS_LABEL: Record<Enums<'package_terms'>, string> = {
  upfront_100: '١٠٠٪ مقدّماً',
  split_50_25_25: '٥٠ / ٢٥ / ٢٥',
  monthly: 'شهري مقدّم',
};

const GRADE_HINT: Record<Enums<'documentation_grade'>, string> = {
  A: 'موثّق بالكامل — قابل للبيع والتفويض',
  B: 'موثّق جزئياً — قابل للبيع بإشراف',
  C: 'غير موثّق — لا يُباع كباقة',
};

/* ------------------------------------------------------------ الباقات + TVR */

export function PackagesTab() {
  const me = useProfile();
  const key = ['sellable-packages'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = getSupabase();
      const [packages, services, playbooks] = await Promise.all([
        supabase.from('service_packages').select('*').order('sort'),
        supabase.from('services_catalog').select('*').eq('active', true).order('sort'),
        supabase.from('playbooks').select('*'),
      ]);
      if (packages.error) throw new Error(packages.error.message);
      return {
        packages: packages.data ?? [],
        services: services.data ?? [],
        playbooks: playbooks.data ?? [],
      };
    },
  });

  const patchPackage = useAppMutation(
    async ({ id, patch }: { id: string; patch: Partial<Tables<'service_packages'>> }) => {
      const { error } = await getSupabase().from('service_packages')
        .update(patch as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  const patchTvr = useAppMutation(
    async ({ id, field, value }: { id: string; field: string; value: number | null }) => {
      const { error } = await getSupabase().from('services_catalog')
        .update({ [field]: value } as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});

  if (isLoading || !data) return <SkeletonList rows={5} />;
  const isAdmin = me.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm text-gray-medium">
          الباقات تُباع باسم «منهجية أجما™» — التفعيل يتطلب دليلاً موثّقاً (درجة A أو B)
          وسعراً معتمداً (قرار شركاء). العروض المخصصة مسموحة لكنها من الدرجة الثانية.
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.packages.map((pkg) => {
            const pbs = data.playbooks.filter((p) => pkg.playbook_ids.includes(p.id));
            const blocked = pbs.some((p) => p.documentation_grade === 'C');
            return (
              <Card key={pkg.id} className={`p-4 ${pkg.active ? 'border-pulse-orange/50' : ''}`}>
                <div className="mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-pulse-orange" aria-hidden />
                  <h3 className="font-bold">{pkg.name_ar}</h3>
                  <Badge variant={pkg.active ? 'accent' : 'outline'}>
                    {pkg.active ? 'مفعّلة' : 'مسودة'}
                  </Badge>
                </div>
                <p className="text-xs text-pulse-orange/90">{pkg.tagline_ar}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-light">{pkg.description_ar}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="outline">{TERMS_LABEL[pkg.payment_terms]}</Badge>
                  {pkg.timeline_weeks && <Badge variant="outline">{pkg.timeline_weeks} أسابيع</Badge>}
                  <Badge variant="outline" >
                    {pkg.base_price ? `SAR ${Number(pkg.base_price).toLocaleString('en-US')}` : 'السعر: قرار شركاء'}
                  </Badge>
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-gray-medium">
                  {pbs.map((p) => (
                    <p key={p.id}>
                      دليل {p.name_ar}: <b className={p.documentation_grade === 'C' ? 'text-pulse-orange' : ''}>
                        {p.documentation_grade}</b>
                    </p>
                  ))}
                </div>
                {isAdmin && (
                  <div className="mt-3 flex items-end gap-2">
                    <Input label="السعر (SAR)" type="number" dir="ltr" className="flex-1"
                      value={priceDraft[pkg.id] ?? (pkg.base_price ? String(pkg.base_price) : '')}
                      onChange={(e) => setPriceDraft((d) => ({ ...d, [pkg.id]: e.target.value }))}
                      onBlur={() => {
                        const v = priceDraft[pkg.id];
                        if (v !== undefined && Number(v) !== Number(pkg.base_price ?? 0)) {
                          patchPackage.mutate({ id: pkg.id, patch: { base_price: v ? Number(v) : null } as never });
                        }
                      }} />
                    <Button size="xs" variant={pkg.active ? 'outline' : 'primary'} className="mb-1"
                      disabled={!pkg.active && (blocked || !pkg.base_price)}
                      onClick={() => patchPackage.mutate({ id: pkg.id, patch: { active: !pkg.active } as never })}>
                      {pkg.active ? 'إيقاف' : 'تفعيل'}
                    </Button>
                  </div>
                )}
                {!pkg.active && blocked && (
                  <p className="mt-1 text-xs text-gray-medium">بانتظار توثيق الدليل (درجة C لا تُباع).</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-1 flex items-center gap-1.5 font-bold text-gray-light">فلتر TVR — قابلة للتعليم / ذات قيمة / قابلة للتكرار <Hint wide text="من كتاب Built to Sell: الخدمة الجاهزة لتصبح باقة هي التي يمكن تعليمها لموظف (قابلة للتعليم)، ويدفع العميل فيها سعراً مجزياً (ذات قيمة)، وتُنفَّذ بنفس الخطوات كل مرة (قابلة للتكرار). قيّموها في الجلسة الربعية." /></h3>
        <p className="mb-2 text-xs text-gray-medium">
          قيّم كل خدمة من ١ إلى ٥ في الجلسة الربعية — مجموع ١٢+ يرشّحها باقةً قادمة.
        </p>
        <Table head={['الخدمة', 'تعليم', 'قيمة', 'تكرار', 'المجموع']}>
          {data.services.map((s) => {
            const sum = (s.tvr_teachable ?? 0) + (s.tvr_valuable ?? 0) + (s.tvr_repeatable ?? 0);
            const scored = s.tvr_teachable && s.tvr_valuable && s.tvr_repeatable;
            return (
              <Tr key={s.id}>
                <Td className="font-medium">{s.name_ar}</Td>
                {(['tvr_teachable', 'tvr_valuable', 'tvr_repeatable'] as const).map((f) => (
                  <Td key={f}>
                    {isAdmin ? (
                      <Select value={s[f] ? String(s[f]) : ''} aria-label={f}
                        onChange={(e) => patchTvr.mutate({
                          id: s.id, field: f, value: e.target.value ? Number(e.target.value) : null,
                        })}>
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    ) : (
                      <span dir="ltr">{s[f] ?? '—'}</span>
                    )}
                  </Td>
                ))}
                <Td>
                  {scored ? (
                    <Badge variant={sum >= 12 ? 'accent' : 'outline'}>
                      {sum}{sum >= 12 ? ' — مرشّحة كباقة' : ''}
                    </Badge>
                  ) : (
                    <span className="text-gray-medium">لم تُقيَّم</span>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}

/* ------------------------------------- التحسين: تجارب + أدلة + تعدين الأسباب */

export function ImproveTab() {
  const me = useProfile();
  const key = ['sellable-improve'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = getSupabase();
      const [experiments, playbooks, versions, customScopes, quality] = await Promise.all([
        supabase.from('experiments').select('*').order('created_at', { ascending: false }),
        supabase.from('playbooks').select('*').order('slug'),
        supabase.from('playbook_versions').select('*').order('released_at', { ascending: false }),
        supabase.from('scopes')
          .select('why_no_package_fit, custom_premium_pct, created_at, clients(company)')
          .not('why_no_package_fit', 'is', null)
          .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('data_quality').select('*'),
      ]);
      if (experiments.error) throw new Error(experiments.error.message);
      return {
        experiments: experiments.data ?? [],
        playbooks: playbooks.data ?? [],
        versions: versions.data ?? [],
        customScopes: customScopes.data ?? [],
        quality: quality.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <SkeletonList rows={5} />;

  return (
    <div className="space-y-6">
      <ExperimentsSection experiments={data.experiments} playbooks={data.playbooks}
        canManage={me.role === 'admin' || me.role === 'strategist'} invalidate={key} />
      <PlaybookDocsSection playbooks={data.playbooks} versions={data.versions}
        isAdmin={me.role === 'admin'} invalidate={key} />
      <ReasonMiningSection customScopes={data.customScopes} />
      <DataQualitySection rows={data.quality} />
    </div>
  );
}

function DataQualitySection({ rows }: {
  rows: { entity: string | null; entity_id: string | null; label: string | null; issue: string | null }[];
}) {
  const grouped = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.issue) continue;
    const list = grouped.get(r.issue) ?? [];
    list.push(r.label ?? '—');
    grouped.set(r.issue, list);
  }
  return (
    <div>
      <h3 className="mb-1 font-bold text-gray-light">جودة البيانات — الفجوات المسماة</h3>
      <p className="mb-2 text-xs text-gray-medium">
        سجلٌ ناقص لا يخدم تقريراً ولا نموذج ذكاء لاحقاً — تُراجع في اجتماع الأسبوع.
      </p>
      {grouped.size === 0 ? (
        <EmptyState icon={<DatabaseZap className="h-8 w-8" aria-hidden />}
          title="لا فجوات"
          hint="كل السجلات مكتملة — البيانات جاهزة لأي تقرير أو نموذج." />
      ) : (
        <div className="space-y-1.5">
          {[...grouped.entries()].sort((a, b) => b[1].length - a[1].length).map(([issue, labels]) => (
            <Card key={issue} className="flex items-start gap-3 p-2.5 text-sm">
              <Badge variant="outline">{labels.length}</Badge>
              <div className="min-w-0">
                <p className="font-medium">{issue}</p>
                <p className="truncate text-xs text-gray-medium">{labels.slice(0, 6).join(' · ')}
                  {labels.length > 6 ? ` (+${labels.length - 6})` : ''}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const EXP_STATUS: Record<Enums<'experiment_status'>, { label: string; accent: boolean }> = {
  proposed: { label: 'مقترحة', accent: false },
  running: { label: 'جارية', accent: true },
  won: { label: 'نجحت', accent: true },
  lost: { label: 'خسرت', accent: false },
};

/** بنك أفكار التجارب — نقاط انطلاق مجربة لوكالة بحجمنا، لا قوالب ملزمة. */
const EXPERIMENT_IDEAS: { title: string; hypothesis: string; metric: string; weeks: string }[] = [
  { title: 'متابعة آلية للعروض المفتوحة',
    hypothesis: 'إذا أرسلنا تذكيراً آلياً بعد ٣ أيام من كل عرض مفتوح، سترتفع نسبة الإغلاق وينخفض تأخر الاعتمادات ٣٠٪ خلال شهر.',
    metric: 'approval_lag_h', weeks: '4' },
  { title: 'عرض باقة بدل التسعير المخصص',
    hypothesis: 'إذا قدمنا باقة جاهزة في أول اجتماع بدل عرض مخصص، سترتفع نسبة إيراد الباقات إلى ٥٠٪ خلال ٦ أسابيع.',
    metric: 'package_revenue_pct', weeks: '6' },
  { title: 'أتمتة خطوة تسليم متكررة بالذكاء الاصطناعي',
    hypothesis: 'إذا أتمتنا [الخطوة] في دليل اللعب، سيرتفع الإنجاز في الموعد إلى ٩٠٪ خلال شهر دون زيادة ساعات.',
    metric: 'on_time_tasks_pct', weeks: '4' },
  { title: 'الدفعة المقدمة ٥٠٪ شرطاً للبدء',
    hypothesis: 'إذا لم نبدأ أي مشروع قبل تحصيل الدفعة الأولى، ستنخفض الذمم المتأخرة ٤٠٪ خلال ٨ أسابيع.',
    metric: 'overdue_ar', weeks: '8' },
  { title: 'تفويض التسليم لغير الشركاء في خدمة واحدة',
    hypothesis: 'إذا سلّم الفريق خدمة [س] كاملة بدون تدخل الشركاء، سترتفع نسبة التسليم بغير الشركاء مع بقاء NPS ثابتاً خلال ٦ أسابيع.',
    metric: 'delivery_by_team_pct', weeks: '6' },
  { title: 'قناة توليد عملاء جديدة',
    hypothesis: 'إذا جربنا [القناة] بميزانية محدودة، سنحصل على ٥ محتملين مؤهلين خلال ٤ أسابيع بتكلفة أقل من القنوات الحالية.',
    metric: 'new_leads', weeks: '4' },
];

function ExperimentsSection({ experiments, playbooks, canManage, invalidate }: {
  experiments: Tables<'experiments'>[];
  playbooks: Tables<'playbooks'>[];
  canManage: boolean;
  invalidate: readonly string[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [deciding, setDeciding] = useState<Tables<'experiments'> | null>(null);
  const [form, setForm] = useState({ title: '', hypothesis: '', metric_key: '', playbook_id: '', duration_weeks: '' });

  // مؤشرات اللوحة بأسمائها العربية — لا مفاتيح برمجية على المستخدم
  const { data: metrics } = useQuery({
    queryKey: ['scorecard-metric-names'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('scorecard_metrics').select('key, name_ar').order('sort');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [decision, setDecision] = useState({ status: 'won' as 'won' | 'lost', note: '', result: '' });

  const create = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('experiments').insert({
        title: form.title,
        hypothesis: form.hypothesis,
        metric_key: form.metric_key || null,
        playbook_id: form.playbook_id || null,
        duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate], successMessage: 'سُجّلت التجربة' }
  );

  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('experiments').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate] }
  );

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <h3 className="font-bold text-gray-light">التجارب — ابتكار ← قياس ← ترسيخ</h3>
        {canManage && (
          <Button variant="outline" size="xs" onClick={() => setShowNew(true)}>
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> تجربة جديدة
          </Button>
        )}
      </div>
      <p className="mb-2 text-xs text-gray-medium">
        لا شيء يتحسن بالانطباعات: كل تغيير في طريقة العمل يبدأ فرضيةً تُقاس —
        الفوز يرقّي الدليل تلقائياً، والخسارة تُوثَّق كي لا تتكرر.
      </p>
      {experiments.length === 0 ? (
        <EmptyState icon={<FlaskConical className="h-8 w-8" aria-hidden />}
          title="لا تجارب بعد"
          hint="أول فكرة تحسين تسمعها في اجتماع الأسبوع — سجّلها هنا." />
      ) : (
        <div className="space-y-1.5">
          {experiments.map((ex) => {
            const pb = playbooks.find((p) => p.id === ex.playbook_id);
            const st = EXP_STATUS[ex.status];
            return (
              <Card key={ex.id} className="p-3 text-sm">
                <div className="flex items-center gap-2">
                  <b>{ex.title}</b>
                  <Badge variant={st.accent ? 'accent' : 'outline'}>{st.label}</Badge>
                  {pb && <span className="text-xs text-gray-medium">دليل {pb.name_ar}</span>}
                  <span className="ms-auto flex gap-1.5">
                    {ex.status === 'proposed' && (
                      <Button size="xs" variant="outline"
                        onClick={() => patch.mutate({ id: ex.id, p: { status: 'running', started_at: new Date().toISOString().slice(0, 10) } })}>
                        <Rocket className="h-3 w-3" aria-hidden /> ابدأ
                      </Button>
                    )}
                    {ex.status === 'running' && (
                      <Button size="xs" variant="outline" onClick={() => {
                        setDecision({ status: 'won', note: '', result: '' });
                        setDeciding(ex);
                      }}>
                        احسم النتيجة
                      </Button>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-light">{ex.hypothesis}</p>
                {ex.decision_note && (
                  <p className="mt-1 text-xs text-gray-medium">القرار: {ex.decision_note}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="تجربة جديدة">
        <div className="space-y-3">
          {/* بنك أفكار — يشعل التجربة بنقرة ثم تعدلها */}
          {!form.title && (
            <div>
              <p className="mb-1.5 text-xs text-gray-medium">أفكار جاهزة للتجربة — انقر واحدة وعدّلها:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXPERIMENT_IDEAS.map((idea) => (
                  <button key={idea.title} type="button"
                    onClick={() => setForm((f) => ({ ...f, title: idea.title,
                      hypothesis: idea.hypothesis, metric_key: idea.metric,
                      duration_weeks: idea.weeks }))}
                    className="rounded-full border border-gray-dark px-2.5 py-1 text-xs text-gray-light transition-colors hover:border-pulse-orange hover:text-pulse-orange">
                    {idea.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Input label="العنوان" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="الفرضية (ماذا سيتحسن وكم؟)" rows={2} value={form.hypothesis}
            placeholder="إذا فعلنا [التغيير] فسيتحسن [المؤشر] من [كذا] إلى [كذا] خلال [المدة]"
            onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select label="المؤشر المتأثر (من لوحة المؤشرات)" value={form.metric_key}
              onChange={(e) => setForm((f) => ({ ...f, metric_key: e.target.value }))}>
              <option value="">— بلا مؤشر (لا يُنصح) —</option>
              {(metrics ?? []).map((m) => (
                <option key={m.key} value={m.key}>{m.name_ar}</option>
              ))}
            </Select>
            <Input label="المدة (أسابيع)" type="number" dir="ltr" value={form.duration_weeks}
              onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))} />
          </div>
          <Select label="الدليل المعني (اختياري)" value={form.playbook_id}
            onChange={(e) => setForm((f) => ({ ...f, playbook_id: e.target.value }))}>
            <option value="">بلا دليل</option>
            {playbooks.map((p) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
          </Select>
          <Button size="sm" className="w-full" loading={create.isPending}
            disabled={form.title.trim().length < 3 || form.hypothesis.trim().length < 5}
            onClick={async () => {
              await create.mutateAsync(undefined as never);
              setForm({ title: '', hypothesis: '', metric_key: '', playbook_id: '', duration_weeks: '' });
              setShowNew(false);
            }}>
            سجّل التجربة
          </Button>
        </div>
      </Modal>

      <Modal open={!!deciding} onClose={() => setDeciding(null)} title={`حسم: ${deciding?.title ?? ''}`}>
        <div className="space-y-3">
          <Select label="النتيجة" value={decision.status}
            onChange={(e) => setDecision((d) => ({ ...d, status: e.target.value as 'won' | 'lost' }))}>
            <option value="won">نجحت — رقِّ الدليل</option>
            <option value="lost">خسرت — وثّق الدرس</option>
          </Select>
          <Input label="القيمة المقاسة (اختياري)" type="number" dir="ltr" value={decision.result}
            onChange={(e) => setDecision((d) => ({ ...d, result: e.target.value }))} />
          <Textarea label="خلاصة القرار" rows={2} value={decision.note}
            onChange={(e) => setDecision((d) => ({ ...d, note: e.target.value }))} />
          <Button size="sm" className="w-full" loading={patch.isPending}
            disabled={decision.note.trim().length < 5}
            onClick={async () => {
              if (!deciding) return;
              await patch.mutateAsync({
                id: deciding.id,
                p: {
                  status: decision.status,
                  decision_note: decision.note,
                  result: decision.result ? Number(decision.result) : null,
                },
              });
              setDeciding(null);
            }}>
            احسم ووثّق
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PlaybookDocsSection({ playbooks, versions, isAdmin, invalidate }: {
  playbooks: Tables<'playbooks'>[];
  versions: Tables<'playbook_versions'>[];
  isAdmin: boolean;
  invalidate: readonly string[];
}) {
  const grade = useAppMutation(
    async ({ id, g }: { id: string; g: Enums<'documentation_grade'> }) => {
      const { error } = await getSupabase().from('playbooks')
        .update({ documentation_grade: g }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate] }
  );

  return (
    <div>
      <h3 className="mb-1 font-bold text-gray-light">توثيق الأدلة — النموذج القابل للامتياز</h3>
      <p className="mb-2 text-xs text-gray-medium">
        تغيير طريقة التسليم إصدارٌ له رقم، لا انجرافَ عادات. درجة C لا تُباع كباقة.
      </p>
      <Table head={['الدليل', 'الدرجة', 'آخر إصدار', 'الإصدارات']}>
        {playbooks.map((p) => {
          const pv = versions.filter((v) => v.playbook_id === p.id);
          return (
            <Tr key={p.id}>
              <Td className="font-medium">{p.name_ar}</Td>
              <Td>
                {isAdmin ? (
                  <Select value={p.documentation_grade} aria-label={`درجة ${p.name_ar}`}
                    onChange={(e) => grade.mutate({ id: p.id, g: e.target.value as Enums<'documentation_grade'> })}>
                    {(['A', 'B', 'C'] as const).map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                ) : (
                  <Badge variant={p.documentation_grade === 'C' ? 'outline' : 'accent'}>
                    {p.documentation_grade}
                  </Badge>
                )}
                <span className="ms-2 text-xs text-gray-medium">{GRADE_HINT[p.documentation_grade]}</span>
              </Td>
              <Td dir="ltr">{pv[0]?.version ?? '1.0.0'}</Td>
              <Td className="text-xs text-gray-light">
                {pv.length === 0 ? '—' : pv.slice(0, 3).map((v) => (
                  <p key={v.id}><b dir="ltr">{v.version}</b> — {v.changelog}</p>
                ))}
              </Td>
            </Tr>
          );
        })}
      </Table>
    </div>
  );
}

function ReasonMiningSection({ customScopes }: {
  customScopes: { why_no_package_fit: string | null; custom_premium_pct: number | null; created_at: string; clients: { company: string } | null }[];
}) {
  return (
    <div>
      <h3 className="mb-1 font-bold text-gray-light">تعدين أسباب «خارج الباقات» — آخر ٩٠ يوماً</h3>
      <p className="mb-2 text-xs text-gray-medium">
        يُراجع ربعياً: السبب المتكرر يصبح الباقة القادمة (السوق يصمّم منتجاتك)،
        والفريد يُسعَّر بعلاوة تخصيص.
      </p>
      {customScopes.length === 0 ? (
        <EmptyState icon={<BookOpenCheck className="h-8 w-8" aria-hidden />}
          title="لا نطاقات مخصصة"
          hint="كل الطلبات الحالية ضمن الباقات — إشارة ممتازة." />
      ) : (
        <div className="space-y-1.5">
          {customScopes.map((s, i) => (
            <Card key={i} className="flex items-center gap-3 p-2.5 text-sm">
              <span className="flex-1">{s.why_no_package_fit}</span>
              <span className="text-xs text-gray-medium">{s.clients?.company ?? '—'}</span>
              {Number(s.custom_premium_pct) > 0 && (
                <Badge variant="outline">علاوة {s.custom_premium_pct}%</Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

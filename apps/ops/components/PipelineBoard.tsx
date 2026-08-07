'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  SkeletonList,
  Textarea,
  useToast,
} from '@agma/ui';
import { LEAD_STAGES, type Enums, type Tables } from '@agma/db';
import { leadInputSchema } from '@agma/db/schemas';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useLeads, useMoveLeadStage } from '../lib/queries';
import { AlertTriangle, Clock, Download, KanbanSquare, Trophy } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { activitiesKey, useOpenActivities } from './ActivitiesBell';

type Lead = Tables<'leads'>;
type Stage = Enums<'lead_stage'>;
type Activity = Tables<'activities'>;

const STAGE_LABELS: Record<Stage, string> = {
  discovery_call: 'مكالمة استكشافية',
  opportunity_analysis: 'تحليل الفرص',
  scoping: 'تحديد النطاق',
  roadmap: 'خارطة الطريق',
  live: 'مباشر',
  optimize: 'تحسين',
};

const SOURCE_LABELS: Record<Enums<'lead_source'>, string> = {
  call: 'مكالمة',
  whatsapp: 'واتساب',
  email: 'بريد',
  site: 'الموقع',
};

export default function PipelineBoard() {
  const { data: leads, isLoading, error } = useLeads();
  const { data: openActivities } = useOpenActivities();
  const move = useMoveLeadStage();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [converting, setConverting] = useState<Lead | null>(null);
  const [dragging, setDragging] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim();
    if (!q) return leads;
    return leads.filter(
      (l) => l.name.includes(q) || (l.company ?? '').includes(q) || (l.notes ?? '').includes(q)
    );
  }, [leads, query]);

  // Next open activity per lead — the Pipedrive discipline signal.
  const nextActivityByLead = useMemo(() => {
    const map = new Map<string, Activity>();
    for (const a of openActivities ?? []) {
      if (!a.lead_id) continue;
      const cur = map.get(a.lead_id);
      if (!cur || a.due_at < cur.due_at) map.set(a.lead_id, a);
    }
    return map;
  }, [openActivities]);

  const pipelineValue = useMemo(
    () =>
      (leads ?? [])
        .filter((l) => l.outcome === 'open' && l.value)
        .reduce((s, l) => s + Number(l.value), 0),
    [leads]
  );

  const convert = useAppMutation(
    async (lead: Lead) => {
      const supabase = getSupabase();
      const { data: client, error } = await supabase
        .from('clients')
        .insert({ company: lead.company || lead.name })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await supabase
        .from('leads')
        .update({ client_id: client.id, stage: 'live' })
        .eq('id', lead.id);
      if (e2) throw new Error(e2.message);
    },
    { invalidate: [keys.leads, keys.clients], successMessage: 'تم تحويل المحتمل إلى عميل' }
  );

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const lead = e.active.data.current?.lead as Lead | undefined;
    const stage = e.over?.id as Stage | undefined;
    if (!lead || !stage || lead.stage === stage) return;
    move.mutate({ id: lead.id, stage });
  }

  if (error) {
    return (
      <EmptyState
        title="تعذر تحميل المسار"
        hint={String((error as Error).message)}
        action={<Button size="sm" onClick={() => location.reload()}>إعادة المحاولة</Button>}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black">مسار المبيعات</h1>
        <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>
          + عميل محتمل
        </Button>
        {pipelineValue > 0 && (
          <Badge variant="outline" aria-label="قيمة المسار المفتوح">
            قيمة المسار: <b dir="ltr">SAR {pipelineValue.toLocaleString('en-US')}</b>
          </Badge>
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو الشركة…"
          className="ms-auto w-56"
        />
        <Button variant="ghost" size="xs" aria-label="تصدير CSV"
          disabled={filtered.length === 0}
          onClick={() => exportCsv('pipeline',
            ['الاسم', 'الشركة', 'المرحلة', 'المصدر', 'القيمة', 'الإغلاق المتوقع', 'النتيجة', 'أنشئ في'],
            filtered.map((l) => [l.name, l.company, STAGE_LABELS[l.stage], SOURCE_LABELS[l.source],
              l.value, l.expected_close, l.outcome, l.created_at.slice(0, 10)]))}>
          <Download className="h-3.5 w-3.5" aria-hidden /> CSV
        </Button>
      </div>

      <SourceAnalytics />

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 && !query ? (
        <EmptyState
          icon={<KanbanSquare className="h-8 w-8" aria-hidden />}
          title="المسار فارغ"
          hint="أضف عميلاً محتملاً يدوياً، أو انتظر وصول الطلبات من نموذج الموقع."
          action={<Button size="sm" onClick={() => setShowNew(true)}>+ عميل محتمل</Button>}
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setDragging((e.active.data.current?.lead as Lead) ?? null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
        >
          <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
            {LEAD_STAGES.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                leads={filtered.filter((l) => l.stage === stage)}
                nextActivityByLead={nextActivityByLead}
                onEdit={setEditing}
                onConvert={setConverting}
              />
            ))}
          </div>
          <DragOverlay>
            {dragging && <LeadCard lead={dragging} overlay onEdit={() => {}} onConvert={() => {}} />}
          </DragOverlay>
        </DndContext>
      )}

      <NewLeadModal open={showNew} onClose={() => setShowNew(false)} />
      <EditLeadModal lead={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!converting}
        onClose={() => setConverting(null)}
        title="تحويل إلى عميل"
        message={`سيتم إنشاء سجل عميل باسم «${converting?.company || converting?.name}» ونقل البطاقة إلى مرحلة «مباشر». هذا الإجراء يظهر في سجل التدقيق.`}
        confirmLabel="تحويل"
        onConfirm={async () => {
          if (converting) await convert.mutateAsync(converting);
        }}
      />
    </div>
  );
}

/** Win rate + cycle time per source (pipeline_analytics view) — the numbers
 *  behind «أي مصدر يستحق الميزانية». Hidden until a deal has closed. */
function SourceAnalytics() {
  const { data } = useQuery({
    queryKey: ['pipeline-analytics'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('pipeline_analytics').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const rows = (data ?? []).filter((r) => (r.won ?? 0) + (r.lost ?? 0) > 0);
  if (rows.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-2 text-xs" aria-label="أداء المصادر">
      {rows.map((r) => (
        <Badge key={r.source} variant="outline">
          {SOURCE_LABELS[r.source as Enums<'lead_source'>]}: فوز{' '}
          <b dir="ltr">{r.win_rate_pct ?? 0}%</b>
          {r.avg_days_to_win != null && (
            <> · <b dir="ltr">{r.avg_days_to_win}</b> يوماً للإغلاق</>
          )}
        </Badge>
      ))}
    </div>
  );
}

function StageColumn({
  stage,
  leads,
  nextActivityByLead,
  onEdit,
  onConvert,
}: {
  stage: Stage;
  leads: Lead[];
  nextActivityByLead: Map<string, Activity>;
  onEdit: (l: Lead) => void;
  onConvert: (l: Lead) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-44 rounded-sm p-1 transition-colors ${
        isOver ? 'bg-pulse-orange/10 ring-1 ring-pulse-orange/40' : ''
      }`}
    >
      <h2 className="mb-2 px-1 text-sm font-bold text-gray-light">
        {STAGE_LABELS[stage]}
        <span className="ms-2 text-gray-medium">{leads.length}</span>
      </h2>
      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead}
            nextActivity={nextActivityByLead.get(lead.id)}
            onEdit={onEdit} onConvert={onConvert} />
        ))}
      </div>
    </div>
  );
}

/** Next-action chip: the Pipedrive rule — an open deal without a scheduled
 *  next step is a stalled deal, and it glows. */
function NextActionChip({ lead, activity }: { lead: Lead; activity?: Activity }) {
  if (lead.outcome === 'won') return <Badge variant="accent"><Trophy className="h-3 w-3" aria-hidden /> فوز</Badge>;
  if (lead.outcome === 'lost') return <Badge>خسارة</Badge>;
  if (!activity) {
    return (
      <span className="rounded-full border border-pulse-orange/60 px-2 py-0.5 text-xs text-pulse-orange">
        <AlertTriangle className="-mt-0.5 me-0.5 inline h-3 w-3" aria-hidden /> لا خطوة تالية
      </span>
    );
  }
  const overdue = new Date(activity.due_at) < new Date();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        overdue ? 'bg-pulse-orange/20 text-pulse-orange' : 'bg-gray-dark text-gray-light'
      }`}
      title={activity.title}
    >
      <Clock className="-mt-0.5 me-0.5 inline h-3 w-3" aria-hidden /> {new Date(activity.due_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
    </span>
  );
}

function LeadCard({
  lead,
  nextActivity,
  overlay,
  onEdit,
  onConvert,
}: {
  lead: Lead;
  nextActivity?: Activity;
  overlay?: boolean;
  onEdit: (l: Lead) => void;
  onConvert: (l: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
    disabled: overlay,
  });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab p-3 text-sm active:cursor-grabbing ${
        isDragging ? 'opacity-30' : ''
      } ${overlay ? 'rotate-2 shadow-2xl' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{lead.name}</p>
        {!lead.client_id && (
          <Badge variant="outline">{SOURCE_LABELS[lead.source]}</Badge>
        )}
      </div>
      {lead.company && <p className="text-gray-light">{lead.company}</p>}
      {lead.value != null && Number(lead.value) > 0 && (
        <p dir="ltr" className="mt-0.5 text-xs font-bold text-snow">
          SAR {Number(lead.value).toLocaleString('en-US')}
        </p>
      )}
      {lead.notes && (
        <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-gray-medium">
          {lead.notes}
        </p>
      )}
      <div className="mt-1.5">
        <NextActionChip lead={lead} activity={nextActivity} />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onEdit(lead)}
          className="text-xs text-gray-medium hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
        >
          تعديل
        </button>
        {!lead.client_id && (
          <button
            onClick={() => onConvert(lead)}
            className="text-xs text-pulse-orange hover:opacity-80 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            ← عميل
          </button>
        )}
        {lead.client_id && <Badge variant="accent">عميل</Badge>}
      </div>
    </Card>
  );
}

function NewLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState<Enums<'lead_source'>>('call');
  const [notes, setNotes] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Duplicate detection (docs/08 §1): warn, never block.
  const probe = (company || name).trim();
  const { data: dupes } = useQuery({
    queryKey: ['lead-dupes', probe],
    enabled: open && probe.length >= 3,
    queryFn: async () => {
      const supabase = getSupabase();
      const [leads, clients] = await Promise.all([
        supabase.from('leads').select('name, company')
          .or(`name.ilike.%${probe}%,company.ilike.%${probe}%`).limit(3),
        supabase.from('clients').select('company').ilike('company', `%${probe}%`).limit(3),
      ]);
      return [
        ...(leads.data ?? []).map((l) => l.company || l.name),
        ...(clients.data ?? []).map((c) => c.company),
      ];
    },
  });

  const create = useAppMutation(
    async (input: { name: string; company?: string; source: Enums<'lead_source'>; notes?: string }) => {
      const { error } = await getSupabase().from('leads').insert(input);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.leads], successMessage: 'أُضيف العميل المحتمل' }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = leadInputSchema.safeParse({ name, company, source, notes });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة');
      return;
    }
    setFieldError(null);
    await create.mutateAsync(parsed.data);
    setName(''); setCompany(''); setNotes('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="عميل محتمل جديد">
      <form onSubmit={submit} className="space-y-3">
        <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} error={fieldError ?? undefined} />
        <Input label="الشركة" value={company} onChange={(e) => setCompany(e.target.value)} />
        {(dupes?.length ?? 0) > 0 && (
          <p className="text-xs text-pulse-orange" role="status">
            تنبيه: سجلات مشابهة موجودة — {dupes!.slice(0, 3).join(' · ')}. تحقّق قبل الإنشاء.
          </p>
        )}
        <Select label="المصدر" value={source} onChange={(e) => setSource(e.target.value as Enums<'lead_source'>)}>
          {(Object.keys(SOURCE_LABELS) as Enums<'lead_source'>[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </Select>
        <Textarea label="ملاحظات" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" loading={create.isPending} className="w-full" size="sm">
          حفظ
        </Button>
      </form>
    </Modal>
  );
}

function EditLeadModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [stage, setStage] = useState<Stage>('discovery_call');
  const [value, setValue] = useState<number>(0);
  const [expectedClose, setExpectedClose] = useState('');
  const [outcome, setOutcome] = useState<Enums<'lead_outcome'>>('open');
  const [lostReason, setLostReason] = useState('');
  const [tags, setTags] = useState('');
  const [nextTitle, setNextTitle] = useState('');
  const [nextDue, setNextDue] = useState('');

  // Sync form when a lead is opened.
  const [last, setLast] = useState<string | null>(null);
  if (lead && lead.id !== last) {
    setLast(lead.id);
    setName(lead.name);
    setCompany(lead.company ?? '');
    setNotes(lead.notes ?? '');
    setStage(lead.stage);
    setValue(lead.value ? Number(lead.value) : 0);
    setExpectedClose(lead.expected_close ?? '');
    setOutcome(lead.outcome);
    setLostReason(lead.lost_reason ?? '');
    setTags((lead.tags ?? []).join('، '));
    setNextTitle('');
    setNextDue('');
  }

  const save = useAppMutation(
    async () => {
      if (!lead) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from('leads')
        .update({
          name,
          company: company || null,
          notes: notes || null,
          stage,
          value: value > 0 ? value : null,
          expected_close: expectedClose || null,
          outcome,
          lost_reason: outcome === 'lost' ? lostReason || null : null,
          tags: tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
        })
        .eq('id', lead.id);
      if (error) throw new Error(error.message);
      // Optional next action in the same save (Pipedrive discipline).
      if (nextTitle.trim() && nextDue) {
        const { error: e2 } = await supabase.from('activities').insert({
          title: nextTitle.trim(),
          kind: 'followup',
          due_at: new Date(nextDue).toISOString(),
          lead_id: lead.id,
        });
        if (e2) throw new Error(e2.message);
      }
    },
    {
      invalidate: [keys.leads, activitiesKey as unknown as readonly string[]],
      successMessage: 'تم الحفظ',
    }
  );

  return (
    <Modal open={!!lead} onClose={onClose} title="تعديل العميل المحتمل" wide>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="الشركة" value={company} onChange={(e) => setCompany(e.target.value)} />
          {/* Keyboard/touch fallback for moving stages — drag is not the only path */}
          <Select label="المرحلة" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </Select>
          <Select label="النتيجة" value={outcome}
            onChange={(e) => setOutcome(e.target.value as Enums<'lead_outcome'>)}>
            <option value="open">مفتوح</option>
            <option value="won">فوز</option>
            <option value="lost">خسارة</option>
          </Select>
          <Input label="قيمة الصفقة (SAR)" type="number" dir="ltr"
            value={value || ''} onChange={(e) => setValue(Number(e.target.value))} />
          <Input label="تاريخ الإغلاق المتوقع" type="date" dir="ltr"
            value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} />
        </div>
        {outcome === 'lost' && (
          <Input label="سبب الخسارة" value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="السعر · التوقيت · منافس · لا ميزانية…" />
        )}
        <Input label="وسوم" value={tags} onChange={(e) => setTags(e.target.value)}
          hint="افصل بين الوسوم بفاصلة" placeholder="عقارات، أولوية عالية" />
        <Textarea label="ملاحظات" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <fieldset className="rounded-sm border border-gray-dark p-3">
          <legend className="px-1 text-xs text-gray-light">الخطوة التالية (اختياري)</legend>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-40 flex-1">
              <Input value={nextTitle} onChange={(e) => setNextTitle(e.target.value)}
                placeholder="مثال: مكالمة متابعة العرض" />
            </div>
            <Input type="datetime-local" dir="ltr" value={nextDue}
              onChange={(e) => setNextDue(e.target.value)} className="w-52" />
          </div>
        </fieldset>
        <Button size="sm" className="w-full" loading={save.isPending}
          onClick={async () => {
            await save.mutateAsync(undefined as never);
            onClose();
          }}>
          حفظ التعديلات
        </Button>
      </div>
    </Modal>
  );
}

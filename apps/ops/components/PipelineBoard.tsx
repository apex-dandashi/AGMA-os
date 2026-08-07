'use client';

import { useMemo, useState, type FormEvent } from 'react';
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

type Lead = Tables<'leads'>;
type Stage = Enums<'lead_stage'>;

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
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو الشركة…"
          className="ms-auto w-56"
        />
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 && !query ? (
        <EmptyState
          icon="📊"
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

function StageColumn({
  stage,
  leads,
  onEdit,
  onConvert,
}: {
  stage: Stage;
  leads: Lead[];
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
          <LeadCard key={lead.id} lead={lead} onEdit={onEdit} onConvert={onConvert} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  overlay,
  onEdit,
  onConvert,
}: {
  lead: Lead;
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
      {lead.notes && (
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-gray-medium">
          {lead.notes}
        </p>
      )}
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

  // Sync form when a lead is opened.
  const [last, setLast] = useState<string | null>(null);
  if (lead && lead.id !== last) {
    setLast(lead.id);
    setName(lead.name);
    setCompany(lead.company ?? '');
    setNotes(lead.notes ?? '');
    setStage(lead.stage);
  }

  const save = useAppMutation(
    async () => {
      if (!lead) return;
      const { error } = await getSupabase()
        .from('leads')
        .update({ name, company: company || null, notes: notes || null, stage })
        .eq('id', lead.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.leads], successMessage: 'تم الحفظ' }
  );

  return (
    <Modal open={!!lead} onClose={onClose} title="تعديل العميل المحتمل">
      <div className="space-y-3">
        <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="الشركة" value={company} onChange={(e) => setCompany(e.target.value)} />
        {/* Keyboard/touch fallback for moving stages — drag is not the only path */}
        <Select label="المرحلة" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </Select>
        <Textarea label="ملاحظات" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button
          size="sm"
          className="w-full"
          loading={save.isPending}
          onClick={async () => {
            await save.mutateAsync(undefined as never);
            onClose();
          }}
        >
          حفظ التعديلات
        </Button>
      </div>
    </Modal>
  );
}

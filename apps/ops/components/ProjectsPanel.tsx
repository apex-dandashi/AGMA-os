'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  Spinner,
} from '@agma/ui';
import { Download, FolderKanban, Lock, Pencil, ShieldCheck, Timer, Trash2 } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import ChecklistRunModal from './ChecklistRunModal';
import { METHOD_PHASES, type Enums, type Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClients } from '../lib/queries';
import { useProfile } from './AppShell';

type Project = Tables<'projects'>;
type Task = Tables<'tasks'>;
type Stage = Tables<'playbook_stages'>;

const PHASE_LABELS: Record<Enums<'method_phase'>, string> = {
  analyze: 'تحليل',
  generate: 'توليد',
  market: 'تسويق',
  adapt: 'تكيّف',
};

const PROJECT_STATUS: Record<Enums<'project_status'>, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  paused: 'متوقف',
  completed: 'مكتمل',
  archived: 'مؤرشف',
};

const TASK_STATUS: Record<Enums<'task_status'>, string> = {
  todo: 'للتنفيذ',
  in_progress: 'قيد العمل',
  review: 'مراجعة',
  done: 'منجزة',
  blocked: 'معلّقة',
};

export const projectsKey = ['projects'] as const;

function useProjects() {
  return useQuery({
    queryKey: projectsKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export default function ProjectsPanel() {
  const { data: projects, isLoading } = useProjects();
  const { data: clients } = useClients();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');
  const selected = projects?.find((p) => p.id === selectedId) ?? null;
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');

  const visible = useMemo(
    () =>
      (projects ?? []).filter((p) =>
        statusFilter === 'open'
          ? p.status === 'planning' || p.status === 'active'
          : statusFilter === 'all'
            ? true
            : p.status === statusFilter
      ),
    [projects, statusFilter]
  );

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        clientName={clients?.find((c) => c.id === selected.client_id)?.company ?? ''}
        onBack={() => router.replace('/projects/')}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black">المشاريع</h1>
        <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>
          + مشروع
        </Button>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="تصفية بالحالة" className="ms-auto w-40">
          <option value="open">المفتوحة</option>
          <option value="all">الكل</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <ProjectsCsvButton />
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" aria-hidden />}
          title="لا مشاريع بعد"
          hint="أنشئ مشروعاً من بلاي بوك، أو اعتمد نطاقاً — المشاريع تتولد تلقائياً من النطاقات المعتمدة."
          action={<Button size="sm" onClick={() => setShowNew(true)}>+ مشروع</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p}
              clientName={clients?.find((c) => c.id === p.client_id)?.company ?? ''}
              onOpen={() => router.replace(`/projects/?id=${p.id}`)} />
          ))}
        </div>
      )}

      <NewProjectModal open={showNew} onClose={() => setShowNew(false)}
        clients={clients ?? []} />
    </div>
  );
}

/** Export via project_costs view — includes hours logged and labor cost,
 *  the profitability side the list itself doesn't show. */
function ProjectsCsvButton() {
  const { data } = useQuery({
    queryKey: ['project-costs'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('project_costs').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  return (
    <Button variant="ghost" size="xs" aria-label="تصدير CSV"
      disabled={!data?.length}
      onClick={() => exportCsv('projects',
        ['المشروع', 'الحالة', 'النمط', 'المهام', 'المنجزة', 'الساعات', 'كلفة العمل'],
        (data ?? []).map((p) => [p.name, p.status, p.mode, p.tasks_total,
          p.tasks_done, p.hours_logged, p.labor_cost]))}>
      <Download className="h-3.5 w-3.5" aria-hidden /> CSV
    </Button>
  );
}

function ProjectCard({ project, clientName, onOpen }:
  { project: Project; clientName: string; onOpen: () => void }) {
  return (
    <Card className="cursor-pointer p-4" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{project.name}</p>
        <Badge variant={project.status === 'active' ? 'accent' : 'neutral'}>
          {PROJECT_STATUS[project.status]}
        </Badge>
      </div>
      <p className="mt-0.5 text-sm text-gray-light">{clientName}</p>
      <div className="mt-3 flex items-center gap-1" aria-label="مرحلة منهجية AGMA">
        {METHOD_PHASES.map((ph) => (
          <span key={ph}
            className={`rounded-full px-2 py-0.5 text-xs ${
              ph === project.method_phase
                ? 'bg-pulse-orange/20 font-bold text-pulse-orange'
                : 'text-gray-medium'
            }`}>
            {PHASE_LABELS[ph]}
          </span>
        ))}
        <Badge variant="outline" className="ms-auto">
          {project.mode === 'recurring' ? 'دوري' : 'معالم'}
        </Badge>
      </div>
    </Card>
  );
}

function NewProjectModal({ open, onClose, clients }:
  { open: boolean; onClose: () => void; clients: Tables<'clients'>[] }) {
  const [clientId, setClientId] = useState('');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const { data: playbooks } = useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('playbooks').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const create = useAppMutation(
    async () => {
      const { error } = await getSupabase().rpc('create_project_from_playbook', {
        p_client_id: clientId,
        p_playbook_slug: slug,
        p_name: name,
      });
      if (error) throw new Error(error.message);
    },
    {
      invalidate: [projectsKey as unknown as readonly string[]],
      successMessage: 'أُنشئ المشروع بمهامه من البلاي بوك',
    }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !slug || !name.trim()) return;
    await create.mutateAsync(undefined as never);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="مشروع جديد من بلاي بوك">
      <form onSubmit={submit} className="space-y-3">
        <Select label="العميل" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">— اختر —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </Select>
        <Select label="البلاي بوك" value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">— اختر —</option>
          {(playbooks ?? []).map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name_ar} ({p.mode === 'recurring' ? 'دوري' : 'معالم'})
            </option>
          ))}
        </Select>
        <Input label="اسم المشروع" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" size="sm" className="w-full" loading={create.isPending}
          disabled={!clientId || !slug || !name.trim()}>
          إنشاء — تتولد المهام تلقائياً
        </Button>
      </form>
    </Modal>
  );
}

/* ----------------------------------------------------------- detail board */

function ProjectDetail({ project, clientName, onBack }:
  { project: Project; clientName: string; onBack: () => void }) {
  const detailKey = ['project', project.id];
  const { data, isLoading } = useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [tasks, stages, members, templates] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', project.id).order('sort'),
        supabase.from('playbook_stages').select('*').eq('playbook_id', project.playbook_id).order('sort'),
        supabase.from('profiles').select('id, full_name, email').neq('role', 'client'),
        supabase.from('task_templates').select('id, checklist_key'),
      ]);
      if (tasks.error) throw new Error(tasks.error.message);
      return {
        tasks: tasks.data ?? [],
        stages: stages.data ?? [],
        members: members.data ?? [],
        checklistByTemplate: new Map(
          (templates.data ?? [])
            .filter((t) => t.checklist_key)
            .map((t) => [t.id, t.checklist_key as string])
        ),
      };
    },
  });

  const setPhase = useAppMutation(
    async (phase: Enums<'method_phase'>) => {
      const { error } = await getSupabase().from('projects')
        .update({ method_phase: phase, status: 'active' }).eq('id', project.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [projectsKey as unknown as readonly string[]] }
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="xs" onClick={onBack}>← المشاريع</Button>
        <h1 className="text-xl font-black">{project.name}</h1>
        <span className="text-sm text-gray-light">{clientName}</span>
        <div className="ms-auto flex items-center gap-1">
          {METHOD_PHASES.map((ph) => (
            <button key={ph} onClick={() => setPhase.mutate(ph)}
              aria-pressed={project.method_phase === ph}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                project.method_phase === ph
                  ? 'bg-pulse-orange/20 font-bold text-pulse-orange'
                  : 'text-gray-medium hover:text-gray-light'
              }`}>
              {PHASE_LABELS[ph]}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <SkeletonList rows={6} />
      ) : (
        <div className="space-y-5">
          {data.stages.map((stage) => (
            <StageBlock key={stage.id} stage={stage}
              tasks={data.tasks.filter((t) => t.stage_id === stage.id)}
              allTasks={data.tasks} members={data.members}
              checklistByTemplate={data.checklistByTemplate}
              detailKey={detailKey} projectId={project.id} />
          ))}
          {data.tasks.filter((t) => !t.stage_id).length > 0 && (
            <StageBlock
              stage={{ id: 'none', name_ar: 'مهام إضافية', name_en: '', method_phase: 'analyze', playbook_id: '', sort: 999 } as Stage}
              tasks={data.tasks.filter((t) => !t.stage_id)}
              allTasks={data.tasks} members={data.members}
              checklistByTemplate={data.checklistByTemplate} detailKey={detailKey} projectId={project.id} />
          )}
        </div>
      )}
    </div>
  );
}

function StageBlock({ stage, tasks, allTasks, members, checklistByTemplate, detailKey, projectId }: {
  stage: Stage;
  tasks: Task[];
  allTasks: Task[];
  members: { id: string; full_name: string | null; email: string | null }[];
  checklistByTemplate: Map<string, string>;
  detailKey: readonly unknown[];
  projectId: string;
}) {
  const me = useProfile();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const addTask = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('tasks').insert({
        project_id: projectId,
        stage_id: stage.id === 'none' ? null : stage.id,
        title: title.trim(),
        due: due || null,
        sort: tasks.length,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [detailKey], successMessage: 'أُضيفت المهمة — بلا قالب تُحتسب تسرب نطاق' }
  );

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-light">
        <Badge variant="outline">{PHASE_LABELS[stage.method_phase]}</Badge>
        {stage.name_ar}
        <span className="text-xs text-gray-medium">{doneCount}/{tasks.length}</span>
        {me.role !== 'executor' && (
          <Button variant="ghost" size="xs" onClick={() => setAdding((v) => !v)}>
            {adding ? 'إغلاق' : '+ مهمة'}
          </Button>
        )}
      </h2>
      {adding && (
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Input label="عنوان المهمة" value={title} className="min-w-52 flex-1"
            onChange={(e) => setTitle(e.target.value)} />
          <Input label="الاستحقاق" type="date" dir="ltr" value={due} className="w-36"
            onChange={(e) => setDue(e.target.value)} />
          <Button size="sm" className="mb-0.5" loading={addTask.isPending}
            disabled={title.trim().length < 3}
            onClick={async () => {
              await addTask.mutateAsync(undefined as never);
              setTitle(''); setDue(''); setAdding(false);
            }}>
            أضف
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} allTasks={allTasks}
            members={members} detailKey={detailKey}
            checklistKey={task.template_id ? checklistByTemplate.get(task.template_id) : undefined}
            stageAssignees={tasks
              .filter((t) => t.assignee)
              .map((t) => ({
                name: members.find((m) => m.id === t.assignee)?.full_name ?? '؟',
                taskTitle: t.title,
              }))} />
        ))}
      </div>
    </section>
  );
}

function TaskRow({ task, allTasks, members, detailKey, checklistKey, stageAssignees }: {
  task: Task;
  allTasks: Task[];
  members: { id: string; full_name: string | null; email: string | null }[];
  detailKey: readonly unknown[];
  checklistKey?: string;
  stageAssignees?: { name: string; taskTitle: string }[];
}) {
  const me = useProfile();
  const [logOpen, setLogOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({ title: task.title, due: task.due ?? '' });
  const blocker = task.blocked_by ? allTasks.find((t) => t.id === task.blocked_by) : null;
  const isBlocked = !!blocker && blocker.status !== 'done';
  const canManage = me.role !== 'executor';

  const update = useAppMutation(
    async (patch: Partial<Task>) => {
      const { error } = await getSupabase().from('tasks').update(patch as never).eq('id', task.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [detailKey] }
  );
  const remove = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('tasks').delete().eq('id', task.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [detailKey], successMessage: 'حُذفت المهمة (موثّق في التدقيق)' }
  );

  const overdue = task.due && task.status !== 'done' && new Date(task.due) < new Date();

  return (
    <Card className={`flex flex-wrap items-center gap-2 p-2.5 text-sm ${task.status === 'done' ? 'opacity-60' : ''}`}>
      <Select value={task.status} aria-label={`حالة ${task.title}`}
        disabled={isBlocked && task.status === 'todo'}
        onChange={(e) => update.mutate({ status: e.target.value as Enums<'task_status'> })}
        className="w-28 py-1 text-xs">
        {Object.entries(TASK_STATUS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </Select>
      {editing ? (
        <span className="flex flex-wrap items-center gap-1.5">
          <Input value={draft.title} aria-label="عنوان المهمة" className="w-56"
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <Input type="date" dir="ltr" value={draft.due} aria-label="الاستحقاق" className="w-36"
            onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))} />
          <Button size="xs" loading={update.isPending} disabled={draft.title.trim().length < 3}
            onClick={async () => {
              await update.mutateAsync({ title: draft.title.trim(), due: draft.due || null });
              setEditing(false);
            }}>حفظ</Button>
          <Button variant="ghost" size="xs" onClick={() => setEditing(false)}>إلغاء</Button>
        </span>
      ) : (
        <span className={task.status === 'done' ? 'line-through' : ''}>{task.title}</span>
      )}
      {task.needs_client_approval && (
        <Badge variant="accent" title="بوابة اعتماد عميل">
          <ShieldCheck className="h-3 w-3" aria-hidden /> اعتماد
        </Badge>
      )}
      {isBlocked && (
        <Badge title={`بانتظار: ${blocker?.title}`}>
          <Lock className="h-3 w-3" aria-hidden /> معلّقة
        </Badge>
      )}
      <span className="ms-auto flex items-center gap-2">
        {task.due && (
          <span dir="ltr" className={`text-xs ${overdue ? 'font-bold text-pulse-orange' : 'text-gray-medium'}`}>
            {task.due}
          </span>
        )}
        <Select value={task.assignee ?? ''} aria-label="المكلّف"
          onChange={(e) => update.mutate({ assignee: e.target.value || null })}
          className="w-32 py-1 text-xs">
          <option value="">— بلا مكلّف —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </Select>
        {checklistKey && task.status !== 'done' && (
          <Button variant="outline" size="xs" onClick={() => setChecklistOpen(true)}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> فحص الإطلاق
          </Button>
        )}
        <Button variant="ghost" size="xs" onClick={() => setLogOpen(true)}
          aria-label="تسجيل وقت">
          <Timer className="h-3.5 w-3.5" aria-hidden />
        </Button>
        {canManage && !editing && (
          <>
            <Button variant="ghost" size="xs" aria-label={`تعديل ${task.title}`}
              onClick={() => {
                setDraft({ title: task.title, due: task.due ?? '' });
                setEditing(true);
              }}>
              <Pencil className="h-3 w-3" aria-hidden />
            </Button>
            <Button variant="ghost" size="xs" aria-label={`حذف ${task.title}`}
              onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3 w-3" aria-hidden />
            </Button>
          </>
        )}
      </span>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
        title="حذف المهمة"
        message={`حذف «${task.title}»؟ تُحذف معها سجلات وقتها، والإجراء موثّق في التدقيق.`}
        confirmLabel="حذف"
        onConfirm={async () => { await remove.mutateAsync(undefined as never); }} />
      <TimeLogModal open={logOpen} onClose={() => setLogOpen(false)} task={task} />
      {checklistKey && (
        <ChecklistRunModal open={checklistOpen} onClose={() => setChecklistOpen(false)}
          checklistKey={checklistKey} task={task}
          stageAssignees={stageAssignees ?? []} invalidate={detailKey} />
      )}
    </Card>
  );
}

function TimeLogModal({ open, onClose, task }:
  { open: boolean; onClose: () => void; task: Task }) {
  const me = useProfile();
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState('');
  const entriesKey = ['time-entries', task.id];

  const { data: entries } = useQuery({
    queryKey: entriesKey,
    enabled: open,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('time_entries')
        .select('*, profiles(full_name)').eq('task_id', task.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const log = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('time_entries').insert({
        task_id: task.id,
        minutes,
        note: note || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [entriesKey], successMessage: 'سُجّل الوقت' }
  );

  const removeEntry = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('time_entries').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [entriesKey], successMessage: 'حُذف الإدخال' }
  );

  return (
    <Modal open={open} onClose={onClose} title={`تسجيل وقت — ${task.title}`}>
      <div className="space-y-3">
        <div className="flex gap-2">
          {[15, 30, 60, 120].map((m) => (
            <button key={m} onClick={() => setMinutes(m)}
              className={`rounded-full border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                minutes === m
                  ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                  : 'border-gray-dark text-gray-light'
              }`}>
              {m < 60 ? `${m} د` : `${m / 60} س`}
            </button>
          ))}
          <Input type="number" dir="ltr" value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="دقائق" className="w-24" />
        </div>
        <Input label="ملاحظة" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button size="sm" className="w-full" loading={log.isPending}
          disabled={minutes <= 0}
          onClick={async () => {
            await log.mutateAsync(undefined as never);
            onClose();
          }}>
          تسجيل
        </Button>
        {(entries?.length ?? 0) > 0 && (
          <div className="space-y-1 border-t border-gray-dark pt-2">
            <p className="text-xs font-bold text-gray-light">الإدخالات السابقة</p>
            {entries!.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs text-gray-light">
                <span dir="ltr">{e.minutes} د</span>
                <span className="text-gray-medium">
                  {(e as { profiles?: { full_name: string | null } | null }).profiles?.full_name ?? ''}
                </span>
                {e.note && <span className="min-w-0 flex-1 truncate text-gray-medium">{e.note}</span>}
                {(e.member === me.id || me.role !== 'executor') && (
                  <Button variant="ghost" size="xs" className="ms-auto" aria-label="حذف الإدخال"
                    onClick={() => removeEntry.mutate(e.id)}>
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

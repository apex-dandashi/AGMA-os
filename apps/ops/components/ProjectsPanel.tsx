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
import { FolderKanban, Lock, ShieldCheck, Timer } from 'lucide-react';
import { METHOD_PHASES, type Enums, type Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClients } from '../lib/queries';

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
      const [tasks, stages, members] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', project.id).order('sort'),
        supabase.from('playbook_stages').select('*').eq('playbook_id', project.playbook_id).order('sort'),
        supabase.from('profiles').select('id, full_name, email').neq('role', 'client'),
      ]);
      if (tasks.error) throw new Error(tasks.error.message);
      return {
        tasks: tasks.data ?? [],
        stages: stages.data ?? [],
        members: members.data ?? [],
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
              detailKey={detailKey} />
          ))}
          {data.tasks.filter((t) => !t.stage_id).length > 0 && (
            <StageBlock
              stage={{ id: 'none', name_ar: 'مهام إضافية', name_en: '', method_phase: 'analyze', playbook_id: '', sort: 999 } as Stage}
              tasks={data.tasks.filter((t) => !t.stage_id)}
              allTasks={data.tasks} members={data.members} detailKey={detailKey} />
          )}
        </div>
      )}
    </div>
  );
}

function StageBlock({ stage, tasks, allTasks, members, detailKey }: {
  stage: Stage;
  tasks: Task[];
  allTasks: Task[];
  members: { id: string; full_name: string | null; email: string | null }[];
  detailKey: readonly unknown[];
}) {
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-light">
        <Badge variant="outline">{PHASE_LABELS[stage.method_phase]}</Badge>
        {stage.name_ar}
        <span className="text-xs text-gray-medium">{doneCount}/{tasks.length}</span>
      </h2>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} allTasks={allTasks}
            members={members} detailKey={detailKey} />
        ))}
      </div>
    </section>
  );
}

function TaskRow({ task, allTasks, members, detailKey }: {
  task: Task;
  allTasks: Task[];
  members: { id: string; full_name: string | null; email: string | null }[];
  detailKey: readonly unknown[];
}) {
  const [logOpen, setLogOpen] = useState(false);
  const blocker = task.blocked_by ? allTasks.find((t) => t.id === task.blocked_by) : null;
  const isBlocked = !!blocker && blocker.status !== 'done';

  const update = useAppMutation(
    async (patch: Partial<Task>) => {
      const { error } = await getSupabase().from('tasks').update(patch as never).eq('id', task.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [detailKey] }
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
      <span className={task.status === 'done' ? 'line-through' : ''}>{task.title}</span>
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
        <Button variant="ghost" size="xs" onClick={() => setLogOpen(true)}
          aria-label="تسجيل وقت">
          <Timer className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </span>
      <TimeLogModal open={logOpen} onClose={() => setLogOpen(false)} task={task} />
    </Card>
  );
}

function TimeLogModal({ open, onClose, task }:
  { open: boolean; onClose: () => void; task: Task }) {
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState('');

  const log = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('time_entries').insert({
        task_id: task.id,
        minutes,
        note: note || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [], successMessage: 'سُجّل الوقت' }
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
      </div>
    </Modal>
  );
}

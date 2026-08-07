'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, EmptyState, Select, SkeletonList } from '@agma/ui';
import { ArrowUpLeft, Sunrise } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';
import { useOpenActivities } from './ActivitiesBell';

type Task = Tables<'tasks'>;

const TASK_STATUS: Record<Enums<'task_status'>, string> = {
  todo: 'للتنفيذ',
  in_progress: 'قيد العمل',
  review: 'مراجعة',
  done: 'منجزة',
  blocked: 'معلّقة',
};

/** "My day" (docs/05 §B9): my open tasks across projects + my activities. */
export default function MyDayPanel() {
  const me = useProfile();
  // «مهامي» أو «كل المهام» — الكل يعرض ما تسمح به صلاحيتك (المنفذ: مشاريعه فقط)
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const myKey = ['my-day', me.id, scope];
  const { data, isLoading } = useQuery({
    queryKey: myKey,
    queryFn: async () => {
      const supabase = getSupabase();
      let q = supabase
        .from('tasks')
        .select('*')
        .neq('status', 'done')
        .order('due', { ascending: true, nullsFirst: false });
      if (scope === 'mine') q = q.eq('assignee', me.id);
      const [tasks, projects, people] = await Promise.all([
        q,
        supabase.from('projects').select('id, name'),
        supabase.from('profiles').select('id, full_name'),
      ]);
      if (tasks.error) throw new Error(tasks.error.message);
      return {
        tasks: tasks.data ?? [],
        projects: projects.data ?? [],
        people: people.data ?? [],
      };
    },
  });
  const { data: activities } = useOpenActivities();
  const myActivities = (activities ?? []).filter((a) => a.assignee === me.id);

  const update = useAppMutation(
    async ({ task, status }: { task: Task; status: Enums<'task_status'> }) => {
      const { error } = await getSupabase().from('tasks').update({ status }).eq('id', task.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [myKey] }
  );

  if (isLoading || !data) return <SkeletonList rows={5} />;

  const overdue = data.tasks.filter((t) => t.due && new Date(t.due) < new Date());
  const upcoming = data.tasks.filter((t) => !t.due || new Date(t.due) >= new Date());

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-black">يومي</h1>
        <div className="flex rounded-sm border border-gray-dark text-xs" role="group" aria-label="نطاق المهام">
          {([['mine', 'مهامي'], ['all', 'كل المهام']] as const).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={scope === k}
              onClick={() => setScope(k)}
              className={`px-2.5 py-1 transition-colors ${
                scope === k ? 'bg-pulse-orange/15 text-pulse-orange' : 'text-gray-light'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-medium">
        {data.tasks.length} مهمة مفتوحة · {overdue.length} متأخرة · {myActivities.length} نشاط مجدول
        — انقر اسم المشروع بجانب أي مهمة لفتح تفاصيلها وتعديلها
      </p>

      {data.tasks.length === 0 ? (
        <EmptyState icon={<Sunrise className="h-8 w-8" aria-hidden />}
          title="لا مهام عليك اليوم"
          hint="المهام المكلّف بها تظهر هنا مرتبةً بموعد الاستحقاق." />
      ) : (
        <div className="space-y-1.5">
          {[...overdue, ...upcoming].map((task) => {
            const project = data.projects.find((p) => p.id === task.project_id);
            const assignee = scope === 'all' && task.assignee !== me.id
              ? data.people.find((p) => p.id === task.assignee)?.full_name : null;
            const isOverdue = task.due && new Date(task.due) < new Date();
            return (
              <Card key={task.id} className="flex flex-wrap items-center gap-2 p-2.5 text-sm">
                <Select value={task.status} aria-label={`حالة ${task.title}`}
                  onChange={(e) =>
                    update.mutate({ task, status: e.target.value as Enums<'task_status'> })}
                  className="w-28 py-1 text-xs">
                  {Object.entries(TASK_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                <span>{task.title}</span>
                {assignee && <span className="text-xs text-gray-medium">({assignee})</span>}
                {project && (
                  <Link href={`/projects/?id=${project.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-dark px-2 py-0.5 text-xs text-gray-light transition-colors hover:border-pulse-orange hover:text-pulse-orange"
                    title="افتح المشروع — التفاصيل والتعليقات والتعديل هناك">
                    {project.name}
                    <ArrowUpLeft className="h-3 w-3" aria-hidden />
                  </Link>
                )}
                {task.due && (
                  <span dir="ltr"
                    className={`ms-auto text-xs ${isOverdue ? 'font-bold text-pulse-orange' : 'text-gray-medium'}`}>
                    {task.due}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

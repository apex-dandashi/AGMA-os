'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Select, SkeletonList } from '@agma/ui';
import { Sunrise } from 'lucide-react';
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
  const myKey = ['my-day', me.id];
  const { data, isLoading } = useQuery({
    queryKey: myKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [tasks, projects] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('assignee', me.id)
          .neq('status', 'done')
          .order('due', { ascending: true, nullsFirst: false }),
        supabase.from('projects').select('id, name'),
      ]);
      if (tasks.error) throw new Error(tasks.error.message);
      return { tasks: tasks.data ?? [], projects: projects.data ?? [] };
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
      <h1 className="mb-1 text-xl font-black">يومي</h1>
      <p className="mb-4 text-sm text-gray-medium">
        {data.tasks.length} مهمة مفتوحة · {overdue.length} متأخرة · {myActivities.length} نشاط مجدول
      </p>

      {data.tasks.length === 0 ? (
        <EmptyState icon={<Sunrise className="h-8 w-8" aria-hidden />}
          title="لا مهام عليك اليوم"
          hint="المهام المكلّف بها تظهر هنا مرتبةً بموعد الاستحقاق." />
      ) : (
        <div className="space-y-1.5">
          {[...overdue, ...upcoming].map((task) => {
            const project = data.projects.find((p) => p.id === task.project_id);
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
                {project && <Badge variant="outline">{project.name}</Badge>}
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

'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, EmptyState, Input, Modal, Select, SkeletonList } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation } from '../lib/queries';
import { useLocale } from '../lib/i18n';

type Activity = Tables<'activities'>;

const KIND_LABELS: Record<Enums<'activity_kind'>, string> = {
  call: 'مكالمة',
  meeting: 'اجتماع',
  task: 'مهمة',
  deadline: 'موعد نهائي',
  followup: 'متابعة',
};

export const activitiesKey = ['activities', 'open'] as const;

export function useOpenActivities() {
  return useQuery({
    queryKey: activitiesKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('activities')
        .select('*')
        .is('done_at', null)
        .order('due_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export default function ActivitiesBell() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const { data: activities, isLoading } = useOpenActivities();

  const overdue = (activities ?? []).filter((a) => new Date(a.due_at) < new Date()).length;

  const markDone = useAppMutation(
    async (a: Activity) => {
      const { error } = await getSupabase()
        .from('activities')
        .update({ done_at: new Date().toISOString() })
        .eq('id', a.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [activitiesKey as unknown as readonly string[]], successMessage: 'أُنجزت ✓' }
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('chrome.activities')}
        className="relative rounded-sm px-2 py-1.5 text-gray-light hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
      >
        ⏰
        {overdue > 0 && (
          <span className="absolute -top-0.5 start-5 rounded-full bg-pulse-orange px-1.5 text-xs font-bold text-snow">
            {overdue}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('chrome.activities')} wide>
        <QuickAdd />
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : (activities ?? []).length === 0 ? (
          <EmptyState icon="✅" title="لا مهام مفتوحة"
            hint="كل عميل محتمل نشط يجب أن يحمل خطوة تالية مجدولة — هذا هو الانضباط الذي يحرّك المسار." />
        ) : (
          <ul className="mt-3 space-y-2">
            {(activities ?? []).map((a) => {
              const isOverdue = new Date(a.due_at) < new Date();
              return (
                <li key={a.id}
                  className="flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark p-2.5 text-sm">
                  <Badge variant={isOverdue ? 'accent' : 'neutral'}>
                    {KIND_LABELS[a.kind]}
                  </Badge>
                  <span className="font-medium">{a.title}</span>
                  <span dir="ltr" className={`ms-auto text-xs ${isOverdue ? 'text-pulse-orange' : 'text-gray-medium'}`}>
                    {new Date(a.due_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <Button variant="outline" size="xs" loading={markDone.isPending}
                    onClick={() => markDone.mutate(a)}>
                    تم ✓
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
}

function QuickAdd() {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Enums<'activity_kind'>>('task');
  const [due, setDue] = useState('');

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('activities').insert({
        title,
        kind,
        due_at: new Date(due).toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [activitiesKey as unknown as readonly string[]], successMessage: 'أُضيفت' }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !due) return;
    await add.mutateAsync(undefined as never);
    setTitle('');
    setDue('');
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <Select value={kind} onChange={(e) => setKind(e.target.value as Enums<'activity_kind'>)} className="w-32">
        {(Object.keys(KIND_LABELS) as Enums<'activity_kind'>[]).map((k) => (
          <option key={k} value={k}>{KIND_LABELS[k]}</option>
        ))}
      </Select>
      <div className="min-w-40 flex-1">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ماذا بعد؟" />
      </div>
      <Input type="datetime-local" dir="ltr" value={due} onChange={(e) => setDue(e.target.value)} className="w-52" />
      <Button type="submit" size="sm" loading={add.isPending} disabled={!title.trim() || !due}>+</Button>
    </form>
  );
}

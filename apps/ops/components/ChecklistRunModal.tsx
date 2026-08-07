'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Checkbox, Modal, Spinner, Textarea, useToast } from '@agma/ui';
import { Flag, ShieldCheck } from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

interface ItemState {
  checked: boolean;
  by?: string;
  at?: string;
}

/**
 * DO-CONFIRM checklist run at a pause point (docs/10 §2.3). All items checked
 * → pass; anyone can Flag & Hold with a reason (files an Issue + blocks the
 * task). The huddle card names who owns what before launch.
 */
export default function ChecklistRunModal({ open, onClose, checklistKey, task, stageAssignees, invalidate }: {
  open: boolean;
  onClose: () => void;
  checklistKey: string;
  task: Tables<'tasks'>;
  stageAssignees: { name: string; taskTitle: string }[];
  invalidate: readonly unknown[];
}) {
  const me = useProfile();
  const toast = useToast();
  const runKey = ['checklist-run', task.id];
  const [flagMode, setFlagMode] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: runKey,
    enabled: open,
    queryFn: async () => {
      const supabase = getSupabase();
      const [checklist, runs] = await Promise.all([
        supabase.from('pause_checklists').select('*').eq('key', checklistKey).single(),
        supabase.from('checklist_runs').select('*').eq('task_id', task.id)
          .order('created_at', { ascending: false }).limit(1),
      ]);
      if (checklist.error) throw new Error(checklist.error.message);
      let run = runs.data?.[0] ?? null;
      if (!run) {
        const items = (checklist.data.items as { text: string }[]).map(() => ({ checked: false }));
        const { data: created, error } = await supabase.from('checklist_runs')
          .insert({ checklist_key: checklistKey, task_id: task.id, states: items as never })
          .select().single();
        if (error) throw new Error(error.message);
        run = created;
      }
      return { checklist: checklist.data, run };
    },
  });

  const save = useAppMutation(
    async ({ states, status }: { states: ItemState[]; status?: 'passed' | 'flagged' }) => {
      if (!data?.run) return;
      const patch: Record<string, unknown> = { states };
      if (status === 'passed') {
        patch.status = 'passed';
        patch.completed_at = new Date().toISOString();
      }
      if (status === 'flagged') {
        patch.status = 'flagged';
        patch.flagged_by = me.id;
        patch.flag_reason = flagReason;
      }
      const { error } = await getSupabase().from('checklist_runs')
        .update(patch as never).eq('id', data.run.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [runKey, invalidate] }
  );

  const restart = useAppMutation(
    async () => {
      if (!data) return;
      const items = (data.checklist.items as { text: string }[]).map(() => ({ checked: false }));
      const { error } = await getSupabase().from('checklist_runs')
        .insert({ checklist_key: checklistKey, task_id: task.id, states: items as never });
      if (error) throw new Error(error.message);
    },
    { invalidate: [runKey], successMessage: 'بدأ فحص جديد من أول بند' }
  );

  if (!open) return null;
  const items = (data?.checklist.items as { text: string }[]) ?? [];
  const states = ((data?.run?.states as unknown as ItemState[]) ?? []);
  const allChecked = items.length > 0 && states.length === items.length &&
    states.every((s) => s.checked);
  const alreadyPassed = data?.run?.status === 'passed';
  const isFlagged = data?.run?.status === 'flagged';

  async function toggle(idx: number) {
    const next = items.map((_, i) => ({
      ...(states[i] ?? { checked: false }),
      ...(i === idx
        ? { checked: !states[idx]?.checked, by: me.full_name ?? me.email ?? '', at: new Date().toISOString() }
        : {}),
    }));
    await save.mutateAsync({ states: next });
    refetch();
  }

  return (
    <Modal open={open} onClose={onClose} title={data?.checklist.name_ar ?? '…'} wide>
      {isLoading || !data ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {stageAssignees.length > 1 && (
            <div className="rounded-sm border border-pulse-orange/40 bg-pulse-orange/5 p-3 text-sm">
              <p className="mb-1 font-bold text-pulse-orange">وقفة سريعة قبل الإطلاق (دقيقتان — كلٌّ باسمه):</p>
              {stageAssignees.map((a, i) => (
                <p key={i} className="text-gray-light">• {a.name} — {a.taskTitle}</p>
              ))}
              <p className="mt-1 text-xs text-gray-medium">اسألوا بصوت عالٍ: «في أي ملاحظات؟» — أصغر عضو في الفريق له كامل الحق في إيقاف الإطلاق.</p>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Checkbox
                  label={item.text}
                  checked={states[i]?.checked ?? false}
                  disabled={alreadyPassed || isFlagged}
                  onChange={() => toggle(i)}
                />
                {states[i]?.checked && states[i]?.by && (
                  <span className="mt-0.5 text-xs text-gray-medium">— {states[i].by}</span>
                )}
              </div>
            ))}
          </div>

          {isFlagged ? (
            <div className="space-y-2 rounded-sm border border-pulse-orange/50 bg-pulse-orange/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-pulse-orange">
                <Flag className="h-3.5 w-3.5" aria-hidden /> الإطلاق موقوف — يوجد اعتراض قائم
              </p>
              <p className="text-sm text-gray-light">السبب: {data.run?.flag_reason ?? '—'}</p>
              <p className="text-xs text-gray-medium">
                سُجّلت مشكلة تلقائياً في نظام التشغيل — عالجوا السبب ثم أعيدوا الفحص من أوله (لا استكمال من المنتصف).
              </p>
              <Button size="sm" variant="outline" loading={restart.isPending}
                onClick={() => restart.mutate(undefined as never)}>
                إعادة الفحص من البداية
              </Button>
            </div>
          ) : alreadyPassed ? (
            <Badge variant="accent">
              <ShieldCheck className="h-3 w-3" aria-hidden /> مُجتازة
            </Badge>
          ) : flagMode ? (
            <div className="space-y-2 rounded-sm border border-pulse-orange/50 p-3">
              <Textarea label="سبب الإيقاف (تُسجَّل مشكلة تلقائياً — لا عتب على من يوقف، هذه القاعدة)"
                rows={2} value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" loading={save.isPending}
                  disabled={flagReason.trim().length < 5}
                  onClick={async () => {
                    await save.mutateAsync({ states, status: 'flagged' });
                    toast.info('أُوقف الإطلاق وسُجّلت المشكلة');
                    onClose();
                  }}>
                  <Flag className="h-3.5 w-3.5" aria-hidden /> أوقِف الإطلاق
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setFlagMode(false)}>تراجع</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" loading={save.isPending} disabled={!allChecked}
                onClick={async () => {
                  await save.mutateAsync({ states, status: 'passed' });
                  toast.success('اكتمل الفحص — يمكن الإطلاق');
                  onClose();
                }}>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> اجتياز ({states.filter((s) => s.checked).length}/{items.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setFlagMode(true)}>
                <Flag className="h-3.5 w-3.5" aria-hidden /> أوقِف وراجِع
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Modal, Spinner, Textarea } from '@agma/ui';
import { MessageSquare, Trash2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

type Member = { id: string; full_name: string | null; email: string | null };

/**
 * Record-level collaboration (package A): the discussion lives ON the task,
 * not in a WhatsApp thread nobody can find later. Mentions + the assignee
 * get in-app notifications (DB trigger).
 */
export function TaskCommentsButton({ taskId, taskTitle, members }: {
  taskId: string;
  taskTitle: string;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const key = ['task-comments', taskId];
  const { data: comments, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('task_comments')
        .select('*').eq('task_id', taskId).order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const count = comments?.length ?? 0;

  return (
    <>
      <Button variant="ghost" size="xs" aria-label={`نقاش ${taskTitle}`}
        onClick={() => setOpen(true)}>
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        {count > 0 && <Badge variant="outline">{count}</Badge>}
      </Button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title={`نقاش — ${taskTitle}`}>
          <CommentsThread taskId={taskId} members={members}
            comments={comments ?? []} loading={isLoading} invalidate={key} />
        </Modal>
      )}
    </>
  );
}

function CommentsThread({ taskId, members, comments, loading, invalidate }: {
  taskId: string;
  members: Member[];
  comments: { id: string; author: string; body: string; mentions: string[]; created_at: string }[];
  loading: boolean;
  invalidate: readonly string[];
}) {
  const me = useProfile();
  const [body, setBody] = useState('');
  const [mentions, setMentions] = useState<Set<string>>(new Set());

  const post = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('task_comments').insert({
        task_id: taskId,
        body: body.trim(),
        mentions: [...mentions],
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate], successMessage: 'نُشر التعليق — المذكورون أُشعروا' }
  );
  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('task_comments').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate] }
  );

  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.full_name
    ?? members.find((m) => m.id === id)?.email ?? '؟';

  return (
    <div className="space-y-3">
      {loading ? (
        <Spinner />
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-medium">لا نقاش بعد — ابدأه هنا لا في واتساب.</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="group rounded-sm bg-gray-dark/25 p-2.5 text-sm">
              <div className="mb-0.5 flex items-center gap-2 text-xs text-gray-medium">
                <b className="text-gray-light">{nameOf(c.author)}</b>
                <span dir="ltr">{c.created_at.slice(0, 16).replace('T', ' ')}</span>
                {(c.author === me.id || me.role === 'admin') && (
                  <Button variant="ghost" size="xs" aria-label="حذف التعليق"
                    className="ms-auto opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                    onClick={() => remove.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-gray-light">{c.body}</p>
              {c.mentions.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1">
                  {c.mentions.map((m) => (
                    <Badge key={m} variant="outline">@{nameOf(m)}</Badge>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-gray-dark pt-3">
        <Textarea label="تعليق جديد" rows={2} value={body}
          onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="إشارة إلى">
          <span className="text-xs text-gray-medium">أشِر إلى:</span>
          {members.filter((m) => m.id !== me.id).map((m) => (
            <button key={m.id} type="button" aria-pressed={mentions.has(m.id)}
              onClick={() => setMentions((prev) => {
                const next = new Set(prev);
                if (next.has(m.id)) next.delete(m.id);
                else next.add(m.id);
                return next;
              })}
              className={`rounded-full border px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                mentions.has(m.id)
                  ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                  : 'border-gray-dark text-gray-light hover:border-gray-medium'
              }`}>
              @{m.full_name ?? m.email}
            </button>
          ))}
        </div>
        <Button size="sm" loading={post.isPending} disabled={body.trim().length === 0}
          onClick={async () => {
            await post.mutateAsync(undefined as never);
            setBody('');
            setMentions(new Set());
          }}>
          نشر
        </Button>
      </div>
    </div>
  );
}

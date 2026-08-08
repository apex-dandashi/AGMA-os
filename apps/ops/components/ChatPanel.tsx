'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, EmptyState, Hint, SkeletonList } from '@agma/ui';
import { Hash, Send, Trash2, UserRound, Users } from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { avatarUrl } from './ProfilePanel';

/**
 * دردشة الفريق: قناة #عام لكل الفريق + رسائل خاصة بين الموظفين. لحظية عبر
 * بث Supabase، والعزل في القاعدة (العملاء خارجها كلياً، والخاص لطرفيه فقط).
 */

export default function ChatPanel() {
  const qc = useQueryClient();
  const key = ['team_chat'];
  const [thread, setThread] = useState<string | 'general'>('general');
  const [draft, setDraft] = useState('');
  const [meId, setMeId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [msgs, team] = await Promise.all([
        s.from('team_chat').select('*').order('created_at', { ascending: true }).limit(500),
        s.from('profiles').select('id, full_name, job_title, role, avatar_path, active')
          .neq('role', 'client').eq('active', true).order('full_name'),
      ]);
      return { msgs: msgs.data ?? [], team: team.data ?? [] };
    },
  });

  // بث لحظي — أي رسالة جديدة تحدث القائمة فوراً
  useEffect(() => {
    const s = getSupabase();
    const ch = s.channel('team-chat-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_chat' },
        () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { s.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const msgs = data?.msgs ?? [];
    if (thread === 'general') return msgs.filter((m) => m.recipient === null);
    return msgs.filter((m) =>
      (m.sender === thread && m.recipient === meId)
      || (m.sender === meId && m.recipient === thread));
  }, [data, thread, meId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [visible.length, thread]);

  const send = useAppMutation(
    async () => {
      const body = draft.trim();
      if (!body) return;
      const { error } = await getSupabase().from('team_chat').insert({
        body, recipient: thread === 'general' ? null : thread,
      });
      if (error) throw new Error(error.message);
      setDraft('');
    },
    { invalidate: [key] }
  );

  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('team_chat').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data || !meId) return <SkeletonList rows={4} />;

  const teammates = data.team.filter((t) => t.id !== meId);
  const who = (id: string) => data.team.find((t) => t.id === id);
  const active = thread === 'general' ? null : who(thread);

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      {/* القنوات */}
      <Card className="h-fit p-2 md:sticky md:top-4">
        <button type="button"
          onClick={() => setThread('general')}
          className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
            thread === 'general' ? 'bg-pulse-orange/15 font-bold text-pulse-orange' : 'text-gray-light hover:bg-white/5'
          }`}>
          <Hash className="h-4 w-4" aria-hidden /> عام — كل الفريق
        </button>
        <p className="mt-3 flex items-center gap-1 px-3 pb-1 text-[11px] font-bold text-gray-medium">
          <Users className="h-3 w-3" aria-hidden /> رسائل خاصة
        </p>
        {teammates.map((t) => {
          const photo = avatarUrl(t.avatar_path);
          return (
            <button key={t.id} type="button" onClick={() => setThread(t.id)}
              className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                thread === t.id ? 'bg-pulse-orange/15 font-bold text-pulse-orange' : 'text-gray-light hover:bg-white/5'
              }`}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gray-dark">
                  <UserRound className="h-3 w-3 text-gray-medium" aria-hidden />
                </span>
              )}
              <span className="truncate">{t.full_name ?? '—'}</span>
            </button>
          );
        })}
        {teammates.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-medium">لا زملاء بعد.</p>
        )}
      </Card>

      {/* الرسائل */}
      <Card className="flex min-h-[60vh] flex-col p-0">
        <div className="flex items-center gap-2 border-b border-gray-dark px-4 py-3 text-sm font-bold">
          {thread === 'general'
            ? <><Hash className="h-4 w-4 text-pulse-orange" aria-hidden /> عام — كل الفريق</>
            : <>{active?.full_name ?? '—'}
                {active?.job_title && <Badge variant="outline">{active.job_title}</Badge>}</>}
          <Hint text="القناة العامة يراها كل الفريق؛ الرسائل الخاصة لطرفيها فقط — معزولة في قاعدة البيانات نفسها. العملاء لا يصلون هنا إطلاقاً." />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {visible.length === 0 && (
            <EmptyState icon={<Send className="h-8 w-8" aria-hidden />}
              title="لا رسائل بعد" hint="ابدأ الحديث — الرسائل تصل لحظياً." />
          )}
          {visible.map((m) => {
            const mine = m.sender === meId;
            const author = who(m.sender);
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start flex-row-reverse' : ''} gap-2`}>
                <div className={`group max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-pulse-orange/15' : 'bg-white/5'
                }`}>
                  {!mine && thread === 'general' && (
                    <p className="mb-0.5 text-[11px] font-bold text-pulse-orange">
                      {author?.full_name ?? '—'}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-gray-medium">
                    {new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    {mine && (
                      <button type="button" aria-label="احذف الرسالة"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => remove.mutate(m.id)}>
                        <Trash2 className="h-3 w-3 text-gray-medium hover:text-pulse-orange" aria-hidden />
                      </button>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="flex gap-2 border-t border-gray-dark p-3"
          onSubmit={(e) => { e.preventDefault(); send.mutate(undefined as never); }}>
          <input
            className="min-w-0 flex-1 rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none"
            placeholder={thread === 'general' ? 'اكتب للفريق كله…' : `اكتب لـ${active?.full_name ?? ''}…`}
            value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} />
          <Button type="submit" size="sm" loading={send.isPending} disabled={!draft.trim()}>
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      </Card>
    </div>
  );
}

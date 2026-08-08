'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Button, Card, EmptyState, Hint, SkeletonList, useToast,
} from '@agma/ui';
import {
  Eye, Hash, LifeBuoy, Lock, Send, Trash2, UserRound, Users,
} from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';
import { avatarUrl } from './ProfilePanel';

/**
 * مركز المحادثات: #عام + خاص بين الموظفين + دعم العملاء الموجه للأقسام،
 * وشارات غير المقروء. لمدير النظام تبويب «الإشراف» المنفصل: قراءة كل
 * المحادثات (سياسة معلنة في القاعدة) والرد في الدعم بدل المختص.
 */

export const DEPT_AR: Record<Enums<'support_department'>, string> = {
  general: 'عام', projects: 'المشاريع', finance: 'المالية',
  legal: 'القانونية', technical: 'تقني',
};

type ThreadKey = string; // 'general' | 'dm:<uuid>' | 'support:<uuid>'

export default function ChatPanel() {
  const me = useProfile();
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['chat_center'];
  const [thread, setThread] = useState<ThreadKey>('general');
  const [oversight, setOversight] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [msgs, team, threads, supMsgs, reads, clients] = await Promise.all([
        s.from('team_chat').select('*').order('created_at', { ascending: true }).limit(800),
        s.from('profiles').select('id, full_name, job_title, role, avatar_path, active')
          .neq('role', 'client').eq('active', true).order('full_name'),
        s.from('support_threads').select('*').order('last_message_at', { ascending: false }),
        s.from('support_messages').select('*').order('created_at', { ascending: true }).limit(800),
        s.from('chat_reads').select('*'),
        s.from('clients').select('id, company'),
      ]);
      return {
        msgs: msgs.data ?? [], team: team.data ?? [],
        threads: threads.data ?? [], supMsgs: supMsgs.data ?? [],
        reads: reads.data ?? [], clients: clients.data ?? [],
      };
    },
  });

  useEffect(() => {
    const s = getSupabase();
    const ch = s.channel('chat-center-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_chat' },
        () => qc.invalidateQueries({ queryKey: key }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' },
        () => qc.invalidateQueries({ queryKey: key }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' },
        () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { s.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = useAppMutation(
    async (k: ThreadKey) => {
      await getSupabase().from('chat_reads').upsert({
        user_id: me.id, thread_key: k, last_read_at: new Date().toISOString(),
      });
    },
    { invalidate: [key] }
  );

  useEffect(() => {
    if (thread) markRead.mutate(thread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, data?.msgs.length, data?.supMsgs.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.msgs.length, data?.supMsgs.length, thread]);

  const lastRead = (k: ThreadKey) =>
    data?.reads.find((r) => r.thread_key === k)?.last_read_at ?? '1970-01-01';

  const unreadGeneral = useMemo(() =>
    (data?.msgs ?? []).filter((m) => m.recipient === null
      && m.sender !== me.id && m.created_at > lastRead('general')).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]);

  const unreadDm = (peer: string) =>
    (data?.msgs ?? []).filter((m) => m.sender === peer && m.recipient === me.id
      && m.created_at > lastRead(`dm:${peer}`)).length;

  const unreadSupport = (t: Tables<'support_threads'>) =>
    (data?.supMsgs ?? []).filter((m) => m.thread_id === t.id
      && m.sender !== me.id && m.created_at > lastRead(`support:${t.id}`)).length;

  const send = useAppMutation(
    async () => {
      const body = draft.trim();
      if (!body) return;
      const s = getSupabase();
      if (thread.startsWith('support:')) {
        const { error } = await s.from('support_messages').insert({
          thread_id: thread.slice(8), body,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await s.from('team_chat').insert({
          body, recipient: thread === 'general' ? null : thread.slice(3),
        });
        if (error) throw new Error(error.message);
      }
      setDraft('');
    },
    { invalidate: [key] }
  );

  const removeMsg = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('team_chat').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  const closeThread = useAppMutation(
    async (t: Tables<'support_threads'>) => {
      const { error } = await getSupabase().from('support_threads')
        .update({ status: t.status === 'open' ? 'closed' : 'open' }).eq('id', t.id);
      if (error) throw new Error(error.message);
      toast.success(t.status === 'open' ? 'أُغلقت المحادثة' : 'أُعيد فتحها');
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;

  const isAdmin = me.role === 'admin';
  const teammates = data.team.filter((t) => t.id !== me.id);
  const who = (id: string) => data.team.find((t) => t.id === id);
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.company ?? 'عميل';

  // الإشراف: أزواج الخاص بين الآخرين (للمدير فقط — RLS تكشفها له وحده)
  const dmPairs = isAdmin ? [...new Set(
    data.msgs.filter((m) => m.recipient !== null && m.sender !== me.id && m.recipient !== me.id)
      .map((m) => [m.sender, m.recipient!].sort().join('|')),
  )] : [];

  /* الرسائل المعروضة بحسب المحادثة المختارة */
  let visible: { id: string; sender: string; body: string; created_at: string; deletable?: boolean }[] = [];
  let headerNode: React.ReactNode = null;
  let canSend = true;

  if (thread === 'general') {
    visible = data.msgs.filter((m) => m.recipient === null);
    headerNode = <><Hash className="h-4 w-4 text-pulse-orange" aria-hidden /> عام — كل الفريق</>;
  } else if (thread.startsWith('dm:')) {
    const peer = thread.slice(3);
    visible = data.msgs.filter((m) =>
      (m.sender === peer && m.recipient === me.id) || (m.sender === me.id && m.recipient === peer));
    const p = who(peer);
    headerNode = <>{p?.full_name ?? '—'}
      {p?.job_title && <Badge variant="outline">{p.job_title}</Badge>}</>;
  } else if (thread.startsWith('ov:')) {
    const [a, b] = thread.slice(3).split('|');
    visible = data.msgs.filter((m) =>
      (m.sender === a && m.recipient === b) || (m.sender === b && m.recipient === a));
    headerNode = <><Eye className="h-4 w-4 text-pulse-orange" aria-hidden />
      إشراف: {who(a)?.full_name ?? '—'} ↔ {who(b)?.full_name ?? '—'}
      <Badge variant="outline">قراءة فقط</Badge></>;
    canSend = false;
  } else if (thread.startsWith('support:')) {
    const t = data.threads.find((x) => x.id === thread.slice(8));
    visible = data.supMsgs.filter((m) => m.thread_id === thread.slice(8));
    headerNode = t ? <>
      <LifeBuoy className="h-4 w-4 text-pulse-orange" aria-hidden />
      {t.subject}
      <Badge variant="outline">{DEPT_AR[t.department]}</Badge>
      <Badge variant="neutral">{clientName(t.client_id)}</Badge>
      {t.status === 'closed' && <Badge variant="neutral"><Lock className="h-3 w-3" aria-hidden /> مغلقة</Badge>}
      <Button variant="ghost" size="xs" className="ms-2"
        onClick={() => closeThread.mutate(t)}>
        {t.status === 'open' ? 'أغلقها' : 'أعد فتحها'}
      </Button>
    </> : null;
    canSend = t?.status === 'open';
  }

  const UnreadDot = ({ n }: { n: number }) => n > 0
    ? <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-pulse-orange px-1 text-[10px] font-black text-void">{n}</span>
    : null;

  const itemCls = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
      active ? 'bg-pulse-orange/15 font-bold text-pulse-orange' : 'text-gray-light hover:bg-white/5'
    }`;

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <Card className="h-fit max-h-[80vh] overflow-y-auto p-2 md:sticky md:top-4">
        {isAdmin && (
          <div className="mb-2 flex gap-1">
            <Button size="xs" variant={oversight ? 'ghost' : 'primary'}
              onClick={() => setOversight(false)}>محادثاتي</Button>
            <Button size="xs" variant={oversight ? 'primary' : 'ghost'}
              onClick={() => setOversight(true)}>
              <Eye className="h-3 w-3" aria-hidden /> الإشراف
            </Button>
          </div>
        )}

        {!oversight ? (
          <>
            <button type="button" onClick={() => setThread('general')}
              className={itemCls(thread === 'general')}>
              <Hash className="h-4 w-4" aria-hidden /> عام — كل الفريق
              <UnreadDot n={unreadGeneral} />
            </button>

            <p className="mt-3 flex items-center gap-1 px-3 pb-1 text-[11px] font-bold text-gray-medium">
              <LifeBuoy className="h-3 w-3" aria-hidden /> دعم العملاء
              <Hint text="محادثات يفتحها العملاء من بواباتهم موجهة لقسمك. رُد بسرعة — العميل يُشعر فوراً، ومدير النظام يرى كل الأقسام." />
            </p>
            {data.threads.length === 0 && (
              <p className="px-3 pb-1 text-[11px] text-gray-medium">لا محادثات دعم.</p>
            )}
            {data.threads.map((t) => (
              <button key={t.id} type="button" onClick={() => setThread(`support:${t.id}`)}
                className={itemCls(thread === `support:${t.id}`)}>
                <span className="truncate">{clientName(t.client_id)} — {t.subject}</span>
                {t.status === 'closed' && <Lock className="h-3 w-3 shrink-0 text-gray-medium" aria-hidden />}
                <UnreadDot n={unreadSupport(t)} />
              </button>
            ))}

            <p className="mt-3 flex items-center gap-1 px-3 pb-1 text-[11px] font-bold text-gray-medium">
              <Users className="h-3 w-3" aria-hidden /> رسائل خاصة
            </p>
            {teammates.map((t) => {
              const photo = avatarUrl(t.avatar_path);
              return (
                <button key={t.id} type="button" onClick={() => setThread(`dm:${t.id}`)}
                  className={itemCls(thread === `dm:${t.id}`)}>
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                    : <span className="grid h-6 w-6 place-items-center rounded-full bg-gray-dark">
                        <UserRound className="h-3 w-3 text-gray-medium" aria-hidden />
                      </span>}
                  <span className="truncate">{t.full_name ?? '—'}</span>
                  <UnreadDot n={unreadDm(t.id)} />
                </button>
              );
            })}
          </>
        ) : (
          <>
            <p className="flex items-center gap-1 px-3 pb-1 text-[11px] font-bold text-gray-medium">
              <Eye className="h-3 w-3" aria-hidden /> كل المحادثات
              <Hint text="آلية إشراف إدارية معلنة: قراءة كل الخاص بين الموظفين (قراءة فقط)، وكل محادثات الدعم بكل الأقسام مع حق الرد بدل المختص." />
            </p>
            <p className="px-3 pb-1 text-[10px] font-bold text-gray-medium">دعم — كل الأقسام</p>
            {data.threads.map((t) => (
              <button key={t.id} type="button" onClick={() => setThread(`support:${t.id}`)}
                className={itemCls(thread === `support:${t.id}`)}>
                <Badge variant="outline">{DEPT_AR[t.department]}</Badge>
                <span className="truncate">{clientName(t.client_id)} — {t.subject}</span>
              </button>
            ))}
            <p className="mt-2 px-3 pb-1 text-[10px] font-bold text-gray-medium">خاص بين الموظفين (قراءة فقط)</p>
            {dmPairs.length === 0 && (
              <p className="px-3 pb-1 text-[11px] text-gray-medium">لا محادثات خاصة بين الآخرين.</p>
            )}
            {dmPairs.map((pair) => {
              const [a, b] = pair.split('|');
              return (
                <button key={pair} type="button" onClick={() => setThread(`ov:${pair}`)}
                  className={itemCls(thread === `ov:${pair}`)}>
                  <span className="truncate">{who(a)?.full_name ?? '—'} ↔ {who(b)?.full_name ?? '—'}</span>
                </button>
              );
            })}
          </>
        )}
      </Card>

      <Card className="flex min-h-[60vh] flex-col p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-dark px-4 py-3 text-sm font-bold">
          {headerNode}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {visible.length === 0 && (
            <EmptyState icon={<Send className="h-8 w-8" aria-hidden />}
              title="لا رسائل" hint="الرسائل تصل لحظياً." />
          )}
          {visible.map((m) => {
            const mine = m.sender === me.id;
            const author = who(m.sender);
            const isClientMsg = !author; // مرسل خارج الفريق = حساب عميل
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start flex-row-reverse' : ''} gap-2`}>
                <div className={`group max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-pulse-orange/15' : isClientMsg ? 'bg-white/10' : 'bg-white/5'
                }`}>
                  {!mine && (
                    <p className="mb-0.5 text-[11px] font-bold text-pulse-orange">
                      {author?.full_name ?? 'العميل'}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-gray-medium">
                    {new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    {mine && !thread.startsWith('support:') && (
                      <button type="button" aria-label="احذف الرسالة"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeMsg.mutate(m.id)}>
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

        {canSend && (
          <form className="flex gap-2 border-t border-gray-dark p-3"
            onSubmit={(e) => { e.preventDefault(); send.mutate(undefined as never); }}>
            <input
              className="min-w-0 flex-1 rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none"
              placeholder={thread.startsWith('support:') ? 'رُد على العميل…' : 'اكتب رسالتك…'}
              value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} />
            <Button type="submit" size="sm" loading={send.isPending} disabled={!draft.trim()}>
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

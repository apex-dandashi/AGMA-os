'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, EmptyState, Modal, SkeletonList } from '@agma/ui';
import { Inbox, MailCheck } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';
import { renderNotificationText } from '../lib/notificationText';

export const inboxKey = ['inbox'] as const;

export function useInbox() {
  const me = useProfile();
  return useQuery({
    queryKey: [...inboxKey, me.id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notifications')
        .select('*')
        .eq('channel', 'inapp')
        .eq('recipient_profile', me.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export default function NotificationsInbox() {
  const me = useProfile();
  const [open, setOpen] = useState(false);
  const { data: items, isLoading } = useInbox();
  const unread = (items ?? []).filter((n) => !n.read_at);

  const markAllRead = useAppMutation(
    async () => {
      const { error } = await getSupabase()
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_profile', me.id)
        .eq('channel', 'inapp')
        .is('read_at', null);
      if (error) throw new Error(error.message);
    },
    { invalidate: [[...inboxKey, me.id]] }
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="صندوق الإشعارات"
        className="relative rounded-sm px-2 py-1.5 text-gray-light hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
      >
        <Inbox className="h-4 w-4" aria-hidden />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 start-5 rounded-full bg-pulse-orange px-1.5 text-xs font-bold text-snow">
            {unread.length}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="الإشعارات">
        <div className="mb-2 flex items-center justify-between">
          {unread.length > 0 ? (
            <Button variant="ghost" size="xs" loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate(undefined as never)}>
              <MailCheck className="h-3.5 w-3.5" aria-hidden /> تمييز الكل كمقروء
            </Button>
          ) : <span />}
          {me.role === 'admin' && (
            <Link href="/notifications/" onClick={() => setOpen(false)}
              className="text-xs text-gray-medium hover:text-snow">
              سجل الإرسال الكامل
            </Link>
          )}
        </div>
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : (items ?? []).length === 0 ? (
          <EmptyState icon={<Inbox className="h-8 w-8" aria-hidden />}
            title="لا إشعارات" hint="أحداث النظام الموجهة لك تصل هنا لحظياً." />
        ) : (
          <ul className="space-y-1.5">
            {(items ?? []).map((n) => (
              <li key={n.id}
                className={`rounded-sm border p-2.5 text-sm ${
                  n.read_at ? 'border-gray-dark text-gray-medium' : 'border-pulse-orange/40 text-snow'
                }`}>
                {renderNotificationText(n)}
                <span dir="ltr" className="ms-2 text-xs text-gray-medium">
                  {n.sent_at ? new Date(n.sent_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}

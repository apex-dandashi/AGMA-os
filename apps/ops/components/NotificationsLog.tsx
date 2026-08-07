'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, SkeletonList, Table, Td, Tr } from '@agma/ui';
import type { Enums } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useClients } from '../lib/queries';

const STATUS_LABELS: Record<Enums<'notification_status'>, string> = {
  queued: 'بالانتظار',
  sent: 'أُرسل',
  failed: 'فشل',
  skipped: 'تُخطي',
  cancelled: 'أُلغي',
};

const CHANNEL_LABELS: Record<Enums<'notification_channel'>, string> = {
  inapp: 'داخل النظام',
  email: 'بريد',
  whatsapp: 'واتساب',
};

/** Full send log (docs/05 §B8: full send log for audit). Admin view. */
export default function NotificationsLog() {
  const { data: clients } = useClients();
  const { data: rows, isLoading } = useQuery({
    queryKey: ['notifications-log'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  if (isLoading) return <SkeletonList rows={6} />;

  return (
    <div>
      <h1 className="mb-1 text-xl font-black">سجل الإشعارات</h1>
      <p className="mb-4 text-sm text-gray-medium">
        كل إرسال يمر من محرك واحد ويُسجَّل هنا (القاعدة 6). رسائل البريد تبقى
        «بالانتظار» حتى إضافة مفتاح SendGrid إلى Vault — راجع SETUP.md.
      </p>
      <Table head={['الحدث', 'القناة', 'المستلم', 'العميل', 'الحالة', 'مجدول لـ', 'أُرسل']}>
        {(rows ?? []).map((n) => (
          <Tr key={n.id}>
            <Td className="font-medium">{n.event_key}</Td>
            <Td><Badge variant="outline">{CHANNEL_LABELS[n.channel]}</Badge></Td>
            <Td dir="ltr" className="text-gray-light">
              {n.recipient_email ?? (n.recipient_profile ? 'فريق' : '—')}
            </Td>
            <Td className="text-gray-light">
              {(clients ?? []).find((c) => c.id === n.client_id)?.company ?? '—'}
            </Td>
            <Td>
              <Badge variant={
                n.status === 'sent' ? 'accent' :
                n.status === 'failed' ? 'accent' : 'neutral'
              }>
                {STATUS_LABELS[n.status]}
              </Badge>
            </Td>
            <Td dir="ltr" className="text-xs text-gray-medium">
              {new Date(n.scheduled_for).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
            </Td>
            <Td dir="ltr" className="text-xs text-gray-medium">
              {n.sent_at ? new Date(n.sent_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

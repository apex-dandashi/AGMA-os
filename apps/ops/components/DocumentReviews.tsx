'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Modal, Select, Spinner, Textarea } from '@agma/ui';
import { Stamp } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

const REVIEWER_ROLES: { value: Enums<'user_role'>; label: string }[] = [
  { value: 'legal', label: 'المستشار القانوني' },
  { value: 'cfo', label: 'المدير المالي' },
  { value: 'accountant', label: 'المحاسب' },
  { value: 'auditor', label: 'مدقق الحوكمة' },
  { value: 'admin', label: 'الشريك' },
];

const roleLabel = (r: string) =>
  REVIEWER_ROLES.find((x) => x.value === r)?.label ?? r;

/**
 * اعتمادات المستندات (طلب المالك): اطلب مراجعة المحامي/المدير المالي/المدقق
 * قبل الاعتماد — قاعدة البيانات ترفض ترقيم مستند عليه مراجعة معلقة أو مرفوضة.
 */
export function ReviewsButton({ documentId, title, docStatus }: {
  documentId: string;
  title: string;
  docStatus: string;
}) {
  const me = useProfile();
  const [open, setOpen] = useState(false);
  const [roleToAsk, setRoleToAsk] = useState<Enums<'user_role'>>('legal');
  const [note, setNote] = useState('');
  const key = ['doc-reviews', documentId];

  const { data: reviews, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('document_reviews')
        .select('*, requester:profiles!document_reviews_requested_by_fkey(full_name), decider:profiles!document_reviews_reviewer_fkey(full_name)')
        .eq('document_id', documentId).order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const request = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('document_reviews').insert({
        document_id: documentId,
        reviewer_role: roleToAsk,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'طُلب الاعتماد — وصل إشعار لصاحب الدور' }
  );

  const decide = useAppMutation(
    async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await getSupabase().from('document_reviews').update({
        status,
        reviewer: me.id,
        note: note.trim() || null,
        decided_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw new Error(error.message);
      setNote('');
    },
    { invalidate: [key], successMessage: 'سُجّل قرارك وأُشعر الطالب' }
  );

  const pending = (reviews ?? []).filter((r) => r.status === 'pending');
  const rejected = (reviews ?? []).filter((r) => r.status === 'rejected');
  const mine = pending.filter((r) => r.reviewer_role === me.role || me.role === 'admin');

  return (
    <>
      <Button variant="ghost" size="xs" aria-label={`اعتمادات ${title}`}
        onClick={() => setOpen(true)}>
        <Stamp className="h-3.5 w-3.5" aria-hidden />
        {pending.length > 0 && <Badge variant="accent">{pending.length} بانتظار</Badge>}
        {rejected.length > 0 && pending.length === 0 && <Badge variant="accent">مرفوض</Badge>}
        {mine.length > 0 && <Badge variant="accent">قرارك مطلوب</Badge>}
      </Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} title={`اعتمادات — ${title}`}>
          <div className="space-y-3">
            {isLoading ? (
              <Spinner />
            ) : (reviews ?? []).length === 0 ? (
              <p className="text-sm text-gray-medium">
                لا طلبات اعتماد على هذا المستند. اطلبها قبل الاعتماد والترقيم —
                وما دام طلبٌ معلقاً فالنظام يمنع الترقيم.
              </p>
            ) : (
              <div className="space-y-2">
                {(reviews ?? []).map((r) => (
                  <div key={r.id} className="rounded-sm bg-gray-dark/25 p-2.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{roleLabel(r.reviewer_role)}</b>
                      <Badge variant={r.status === 'approved' ? 'accent'
                        : r.status === 'rejected' ? 'accent' : 'outline'}>
                        {r.status === 'approved' ? 'اعتمد'
                          : r.status === 'rejected' ? 'رفض' : 'بانتظار القرار'}
                      </Badge>
                      <span className="text-xs text-gray-medium">
                        طلبها {(r as { requester?: { full_name: string | null } | null }).requester?.full_name ?? '—'}
                        {r.status !== 'pending' &&
                          ` · قررها ${(r as { decider?: { full_name: string | null } | null }).decider?.full_name ?? '—'}`}
                      </span>
                    </div>
                    {r.note && <p className="mt-1 text-xs text-gray-light">الملاحظة: {r.note}</p>}
                    {r.status === 'pending' && (r.reviewer_role === me.role || me.role === 'admin') && (
                      <div className="mt-2 space-y-2">
                        <Textarea label="ملاحظتك (تصل للطالب)" rows={2}
                          value={note} onChange={(e) => setNote(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="xs" loading={decide.isPending}
                            onClick={() => decide.mutate({ id: r.id, status: 'approved' })}>
                            اعتماد
                          </Button>
                          <Button variant="outline" size="xs" loading={decide.isPending}
                            disabled={note.trim().length < 3}
                            onClick={() => decide.mutate({ id: r.id, status: 'rejected' })}>
                            رفض (بسبب مكتوب)
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {docStatus === 'draft' && (
              <div className="flex items-end gap-2 border-t border-gray-dark pt-3">
                <Select label="اطلب اعتماد" value={roleToAsk}
                  onChange={(e) => setRoleToAsk(e.target.value as Enums<'user_role'>)}
                  className="w-44">
                  {REVIEWER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>
                <Button size="sm" className="mb-0.5" loading={request.isPending}
                  onClick={() => request.mutate(undefined as never)}>
                  أرسل الطلب
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

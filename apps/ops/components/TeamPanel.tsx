'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input, Select, SkeletonList, Table, Td, Tr, useToast } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation } from '../lib/queries';

const ROLE_LABELS: Record<Enums<'user_role'>, string> = {
  admin: 'مدير النظام',
  strategist: 'استراتيجي',
  executor: 'منفّذ',
  client: 'عميل',
};

export default function TeamPanel({ me }: { me: Tables<'profiles'> }) {
  const isAdmin = me.role === 'admin';
  const toast = useToast();
  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('profiles').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'strategist' | 'executor'>('strategist');
  const [inviting, setInviting] = useState(false);

  const changeRole = useAppMutation(
    async ({ id, newRole }: { id: string; newRole: Enums<'user_role'> }) => {
      const { error } = await getSupabase().from('profiles').update({ role: newRole }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [['profiles']], successMessage: 'حُدّث الدور' }
  );

  async function invite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const { data: session } = await getSupabase().auth.getSession();
      const token = session.session?.access_token;
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gjaheqlgheizvebvakfd.supabase.co';
      const res = await fetch(`${base}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role, full_name: fullName }),
      });
      if (!res.ok) throw new Error('invite failed');
      toast.success('أُرسلت الدعوة بالبريد');
      setEmail('');
      setFullName('');
      refetch();
    } catch {
      toast.error('تعذر إرسال الدعوة');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-black">الفريق</h1>

      {isAdmin && (
        <form onSubmit={invite} className="mb-5 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
          <Input label="البريد الإلكتروني" dir="ltr" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} className="w-64" />
          <Input label="الاسم" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-48" />
          <Select label="الدور" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="strategist">استراتيجي</option>
            <option value="executor">منفّذ</option>
            <option value="admin">مدير النظام</option>
          </Select>
          <Button type="submit" size="sm" loading={inviting}>دعوة</Button>
        </form>
      )}

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <Table head={['الاسم', 'البريد', 'الدور', 'الحالة']}>
          {(profiles ?? []).map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium">{p.full_name || '—'}</Td>
              <Td dir="ltr" className="text-gray-light">{p.email}</Td>
              <Td>
                {isAdmin && p.id !== me.id && p.role !== 'client' ? (
                  <Select
                    value={p.role}
                    aria-label={`دور ${p.email}`}
                    onChange={(e) =>
                      changeRole.mutate({ id: p.id, newRole: e.target.value as Enums<'user_role'> })
                    }
                    className="w-36"
                  >
                    <option value="admin">مدير النظام</option>
                    <option value="strategist">استراتيجي</option>
                    <option value="executor">منفّذ</option>
                  </Select>
                ) : (
                  <Badge variant={p.role === 'admin' ? 'accent' : 'neutral'}>
                    {ROLE_LABELS[p.role]}
                  </Badge>
                )}
              </Td>
              <Td>
                <Badge variant={p.active ? 'accent' : 'neutral'}>
                  {p.active ? 'نشط' : 'موقوف'}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

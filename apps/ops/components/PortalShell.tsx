'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import {
  Badge, Button, Card, EmptyState, Input, Modal, SkeletonList, Spinner,
  Tabs, ToastProvider, useToast,
} from '@agma/ui';
import {
  CheckCircle2, FileText, Landmark, LogOut, PenLine, Sparkles,
} from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import {
  formatIBAN, renderContract, renderInvoice, renderQuote,
  type ContractPayload, type InvoicePayload, type QuotePayload,
} from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import { DLV_STATUS, PinViewer } from './DeliverablesBlock';

/**
 * بوابة العميل (المرحلة ٧): دخول برابط سحري بلا كلمة مرور ولا MFA —
 * صلاحيات العميل محدودة أصلاً بعزل RLS المُثبت (مستنداته المرسلة، اعتماداته،
 * مشاريعه، دفعاته). كل فعل جوهري (توقيع/اعتماد) عبر دوال مقيدة في القاعدة.
 */

const qc = new QueryClient();

export default function PortalShell() {
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <PortalGate />
      </ToastProvider>
    </QueryClientProvider>
  );
}

function PortalGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    getSupabase().from('profiles').select('*').eq('id', session.user.id)
      .single().then(({ data }) => setProfile(data));
  }, [session]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6" /></div>;
  }
  if (!session) return <MagicLogin />;
  if (!profile) {
    return <div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6" /></div>;
  }
  if (profile.role !== 'client' || !profile.client_id) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="mb-4">هذه بوابة العملاء — حسابك حساب فريق، استخدم النظام الرئيسي.</p>
          <Button size="sm" onClick={() => (location.href = '/')}>إلى النظام</Button>
        </div>
      </div>
    );
  }
  return <Portal profile={profile} />;
}

/** دخول برابط سحري — بلا كلمات مرور للعملاء (لحسابات موجودة فقط). */
function MagicLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${location.origin}/portal/`,
      },
    });
    setBusy(false);
    if (error) setError('تعذر الإرسال — تأكد أن هذا البريد مسجل لدى AGMA.');
    else setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-1 text-xl font-black">بوابة عملاء AGMA</h1>
        <p className="mb-6 text-sm text-gray-medium">
          مستنداتك واعتماداتك وفواتيرك في مكان واحد — دخول بلا كلمة مرور.
        </p>
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-pulse-orange" aria-hidden />
            <p className="font-bold">أرسلنا رابط الدخول إلى بريدك</p>
            <p className="mt-1 text-sm text-gray-medium">افتح الرسالة واضغط الرابط — صالح لدقائق.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input label="بريدك المسجل لدى AGMA" type="email" dir="ltr" required
              value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
            <Button className="w-full" loading={busy} disabled={!/.+@.+\..+/.test(email)}>
              أرسل رابط الدخول
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ portal */

const DOC_AR: Record<string, string> = {
  quote: 'عرض سعر', invoice: 'فاتورة', credit_note: 'إشعار دائن',
  sow: 'بيان نطاق عمل', nda: 'اتفاقية سرية', msa: 'اتفاقية رئيسية',
  service: 'اتفاقية خدمات', retainer: 'اشتراك شهري', sla: 'مستوى خدمة',
};

const CONTENT_CHANNEL_AR: Record<string, string> = {
  article: 'مقال', social_post: 'منشور سوشيال', reel_script: 'سكربت ريل',
  email: 'إيميل', ad_copy: 'نص إعلان',
};

const CONTENT_STATUS_AR: Record<string, string> = {
  client_review: 'بمراجعتكم', approved: 'معتمد ✓', scheduled: 'مجدول للنشر',
  published: 'منشور',
};

const PROJECT_STATUS: Record<string, string> = {
  planning: 'التخطيط', active: 'قيد التنفيذ', paused: 'موقوف مؤقتاً',
  completed: 'مكتمل', archived: 'مؤرشف',
};

function Portal({ profile }: { profile: Tables<'profiles'> }) {
  const [tab, setTab] = useState('home');
  const toast = useToast();
  const key = ['portal', profile.client_id];

  const { data, isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [client, docs, approvals, projects, payments, accounts, signatures, content] =
        await Promise.all([
          s.from('clients').select('company').eq('id', profile.client_id!).single(),
          s.from('documents').select('*').order('created_at', { ascending: false }),
          s.from('approvals').select('*').order('created_at', { ascending: false }),
          s.from('projects').select('id, name, status, created_at'),
          s.from('payments').select('*').order('paid_on', { ascending: false }),
          s.from('payment_accounts').select('iban, bank_name, beneficiary_name, is_default')
            .eq('active', true),
          s.from('document_signatures').select('document_id, signer_name, signed_at'),
          // RLS: يرى فقط محتواه من مرحلة «بمراجعتكم» فصاعداً
          s.from('content_items').select('*').order('created_at', { ascending: false }),
        ]);
      return {
        company: client.data?.company ?? '',
        docs: docs.data ?? [], approvals: approvals.data ?? [],
        projects: projects.data ?? [], payments: payments.data ?? [],
        accounts: accounts.data ?? [], signatures: signatures.data ?? [],
        content: content.data ?? [],
      };
    },
  });

  const [signing, setSigning] = useState<Tables<'documents'> | null>(null);

  function openPrint(doc: Tables<'documents'>) {
    const html = doc.type === 'quote'
      ? renderQuote(doc.payload as unknown as QuotePayload)
      : doc.type === 'invoice' || doc.type === 'credit_note'
        ? renderInvoice(doc.payload as unknown as InvoicePayload)
        : renderContract(doc.payload as unknown as ContractPayload);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  async function decideApproval(id: string, status: 'approved' | 'rejected', note?: string) {
    const { error } = await getSupabase().from('approvals')
      .update({ status, note: note?.trim() || null,
        decided_at: new Date().toISOString(), decided_by: profile.id })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === 'approved' ? 'تم الاعتماد — شكراً لكم' : 'وصلت ملاحظتكم للفريق');
      setRejecting(null); setRejectNote('');
      refetch();
    }
  }

  // إعادة محتوى بملاحظة: الملاحظة إلزامية حتى يعرف الفريق ماذا يعدل
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [readingContent, setReadingContent] = useState<Tables<'content_items'> | null>(null);

  if (isLoading || !data) {
    return <div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6" /></div>;
  }

  const pendingApprovals = data.approvals.filter((a) => a.status === 'pending');
  const pendingSign = data.docs.filter((d) => d.status === 'sent'
    && !['quote', 'invoice', 'credit_note'].includes(d.type));
  const invoices = data.docs.filter((d) => d.type === 'invoice' && d.status !== 'draft');
  const paidByInvoice = new Map<string, number>();
  for (const p of data.payments) {
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  }

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="border-b border-gray-dark px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="AGMA" className="h-7 w-auto" />
          <span className="border-s border-gray-dark ps-3 text-sm text-gray-light">
            بوابة {data.company}
          </span>
          <Button variant="ghost" size="xs" className="ms-auto"
            onClick={() => getSupabase().auth.signOut()}>
            <LogOut className="h-3.5 w-3.5" aria-hidden /> خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Tabs active={tab} onChange={setTab} tabs={[
          { key: 'home', label: 'نظرة عامة' },
          { key: 'dlv', label: 'المخرجات' },
          { key: 'docs', label: 'المستندات' },
          { key: 'pay', label: 'الفواتير والدفع' },
          { key: 'support', label: 'الدعم' },
        ]} />

        <div className="mt-5 space-y-4">
          {tab === 'home' && (
            <>
              {(pendingApprovals.length > 0 || pendingSign.length > 0) ? (
                <Card className="border-pulse-orange/50 p-4">
                  <p className="mb-3 flex items-center gap-2 font-bold">
                    <Sparkles className="h-4 w-4 text-pulse-orange" aria-hidden />
                    بانتظار قراركم
                  </p>
                  {pendingApprovals.map((a) => {
                    const cnt = a.item_type === 'content'
                      ? data.content.find((c) => c.id === a.item_id) : null;
                    return (
                      <div key={a.id} className="mb-2 rounded-sm border border-gray-dark p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          {cnt ? (
                            <>
                              <Badge variant="outline">{CONTENT_CHANNEL_AR[cnt.channel] ?? 'محتوى'}</Badge>
                              <span className="font-bold">{cnt.title}</span>
                            </>
                          ) : (
                            <span>طلب اعتماد {a.item_type === 'scope' ? 'نطاق عمل' : 'بند'}</span>
                          )}
                          <span className="ms-auto flex gap-2">
                            {cnt?.body && (
                              <Button variant="ghost" size="xs" onClick={() => setReadingContent(cnt)}>
                                اقرأه كاملاً
                              </Button>
                            )}
                            <Button size="xs" onClick={() => decideApproval(a.id, 'approved')}>
                              اعتماد
                            </Button>
                            <Button variant="ghost" size="xs"
                              onClick={() => (a.item_type === 'content'
                                ? setRejecting(rejecting === a.id ? null : a.id)
                                : decideApproval(a.id, 'rejected'))}>
                              لدي ملاحظات
                            </Button>
                          </span>
                        </div>
                        {cnt?.body && (
                          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-gray-light">
                            {cnt.body}
                          </p>
                        )}
                        {rejecting === a.id && (
                          <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
                            <Input label="ما الذي تريدون تعديله؟ (إلزامي)" className="min-w-64 flex-1"
                              value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                            <Button size="xs" disabled={rejectNote.trim().length < 3}
                              onClick={() => decideApproval(a.id, 'rejected', rejectNote)}>
                              أرسل الملاحظة
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {pendingSign.map((d) => (
                    <div key={d.id} className="mb-2 flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark p-3 text-sm">
                      <FileText className="h-4 w-4 text-pulse-orange" aria-hidden />
                      <span>{DOC_AR[d.type] ?? d.type} {d.number ?? ''} بانتظار توقيعكم</span>
                      <span className="ms-auto flex gap-2">
                        <Button variant="ghost" size="xs" onClick={() => openPrint(d)}>اقرأه</Button>
                        <Button size="xs" onClick={() => setSigning(d)}>
                          <PenLine className="h-3.5 w-3.5" aria-hidden /> وقّع الآن
                        </Button>
                      </span>
                    </div>
                  ))}
                </Card>
              ) : (
                <Card className="p-4 text-sm text-gray-light">
                  لا إجراءات معلقة عليكم — كل شيء تحت السيطرة.
                </Card>
              )}
              {data.projects.length > 0 && (
                <Card className="p-4">
                  <p className="mb-2 font-bold">مشاريعكم</p>
                  {data.projects.map((p) => (
                    <div key={p.id} className="mb-1.5 flex items-center gap-2 text-sm">
                      <span>{p.name}</span>
                      <Badge variant={p.status === 'active' ? 'accent' : 'outline'}>
                        {PROJECT_STATUS[p.status] ?? p.status}
                      </Badge>
                    </div>
                  ))}
                </Card>
              )}
              {data.content.length > 0 && (
                <Card className="p-4">
                  <p className="mb-2 font-bold">محتواكم</p>
                  {data.content.map((c) => (
                    <div key={c.id} className="mb-1.5 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{CONTENT_CHANNEL_AR[c.channel] ?? c.channel}</Badge>
                      <span>{c.title}</span>
                      <Badge variant={c.status === 'approved' || c.status === 'published' ? 'accent' : 'neutral'}>
                        {CONTENT_STATUS_AR[c.status] ?? c.status}
                      </Badge>
                      {c.body && (
                        <Button variant="ghost" size="xs" onClick={() => setReadingContent(c)}>
                          اقرأه
                        </Button>
                      )}
                      {c.publish_url && (
                        <a className="text-xs text-pulse-orange underline" href={c.publish_url}
                          target="_blank" rel="noreferrer" dir="ltr">
                          رابط النشر
                        </a>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {tab === 'dlv' && <ClientDeliverables refetchAll={refetch} />}

          {tab === 'docs' && (
            data.docs.length === 0 ? (
              <EmptyState icon={<FileText className="h-8 w-8" aria-hidden />}
                title="لا مستندات بعد" hint="عندما يرسل لكم فريق AGMA مستنداً سيظهر هنا." />
            ) : data.docs.map((d) => {
              const sig = data.signatures.find((s) => s.document_id === d.id);
              return (
                <Card key={d.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Badge>{DOC_AR[d.type] ?? d.type}</Badge>
                  <b dir="ltr">{d.number ?? '—'}</b>
                  <Badge variant={d.status === 'signed' || d.status === 'active' ? 'accent' : 'neutral'}>
                    {{ sent: 'بانتظاركم', signed: 'موقَّع', active: 'نشط',
                       expired: 'منتهي', void: 'ملغى', draft: '' }[d.status]}
                  </Badge>
                  {sig && (
                    <span className="text-xs text-gray-medium">
                      وقّعه {sig.signer_name} · {new Date(sig.signed_at).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                  <span className="ms-auto flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => openPrint(d)}>
                      معاينة / طباعة
                    </Button>
                    {d.status === 'sent' && !['quote', 'invoice', 'credit_note'].includes(d.type) && (
                      <Button size="xs" onClick={() => setSigning(d)}>وقّع</Button>
                    )}
                  </span>
                </Card>
              );
            })
          )}

          {tab === 'support' && <ClientSupport profile={profile} />}

          {tab === 'pay' && (
            <>
              {invoices.length === 0 ? (
                <Card className="p-4 text-sm text-gray-light">لا فواتير مستحقة.</Card>
              ) : invoices.map((d) => {
                const paid = paidByInvoice.get(d.id) ?? 0;
                const total = Number(d.total ?? 0);
                const balance = total - paid;
                return (
                  <Card key={d.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <b dir="ltr">{d.number}</b>
                    <span dir="ltr" className="font-bold">SAR {total.toLocaleString('en-US')}</span>
                    <Badge variant={balance <= 0 ? 'accent' : 'outline'}>
                      {balance <= 0 ? 'مسددة — شكراً لكم' : `متبقٍ SAR ${balance.toLocaleString('en-US')}`}
                    </Badge>
                    <Button variant="ghost" size="xs" className="ms-auto" onClick={() => openPrint(d)}>
                      الفاتورة
                    </Button>
                  </Card>
                );
              })}
              <Card className="p-4">
                <p className="mb-2 flex items-center gap-2 font-bold">
                  <Landmark className="h-4 w-4 text-pulse-orange" aria-hidden />
                  حسابات التحويل البنكي
                </p>
                {data.accounts.map((a) => (
                  <p key={a.iban} className="mb-1 text-sm">
                    <span className="text-gray-light">{a.bank_name}</span>
                    {' · '}
                    <span dir="ltr" className="font-mono text-xs">{formatIBAN(a.iban)}</span>
                    {a.is_default && <Badge variant="outline" className="ms-2">المفضل</Badge>}
                  </p>
                ))}
                <p className="mt-2 text-xs text-gray-medium">
                  المستفيد: مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية —
                  أرسلوا إيصال التحويل لمدير حسابكم ليُقيد فوراً.
                </p>
              </Card>
            </>
          )}
        </div>
      </main>

      <Modal open={readingContent != null} onClose={() => setReadingContent(null)}
        title={readingContent?.title ?? ''}>
        <div className="space-y-2">
          <Badge variant="outline">
            {CONTENT_CHANNEL_AR[readingContent?.channel ?? ''] ?? 'محتوى'}
          </Badge>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-snow">
            {readingContent?.body}
          </p>
        </div>
      </Modal>

      <SignModal doc={signing} onClose={() => setSigning(null)}
        onDone={() => { setSigning(null); refetch(); }} />
    </div>
  );
}

/* ---------------------------------------------------------- deliverables */

/** مخرجات العميل: صورة أحدث إصدار، اضغط أي نقطة لتعليق مثبت، ثم قرارك. */

/* ------------------------------------------------------------ support */

const SUPPORT_DEPT_AR: Record<string, string> = {
  general: 'استفسار عام', projects: 'المشاريع والتنفيذ', finance: 'الفواتير والمالية',
  legal: 'قانوني وعقود', technical: 'دعم تقني',
};

function ClientSupport({ profile }: { profile: Tables<'profiles'> }) {
  const toast = useToast();
  const key = ['portal_support'];
  const qc = useQueryClient();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dept, setDept] = useState('general');
  const [subject, setSubject] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [reply, setReply] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [threads, msgs] = await Promise.all([
        s.from('support_threads').select('*').order('last_message_at', { ascending: false }),
        s.from('support_messages').select('*').order('created_at', { ascending: true }),
      ]);
      return { threads: threads.data ?? [], msgs: msgs.data ?? [] };
    },
  });

  useEffect(() => {
    const s = getSupabase();
    const ch = s.channel('portal-support-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' },
        () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { s.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.msgs.length, openThread]);

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    const s = getSupabase();
    const { data: th, error } = await s.from('support_threads').insert({
      client_id: profile.client_id!, department: dept as Enums<'support_department'>,
      subject: subject.trim(),
    }).select('id').single();
    if (error || !th) { toast.error('تعذر فتح المحادثة — حاول مجدداً'); return; }
    if (firstMsg.trim()) {
      await s.from('support_messages').insert({ thread_id: th.id, body: firstMsg.trim() });
    }
    setCreating(false); setSubject(''); setFirstMsg(''); setDept('general');
    setOpenThread(th.id);
    toast.success('وصل طلبكم للقسم المختص — سنرد سريعاً');
    refetch();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!openThread || !reply.trim()) return;
    const { error } = await getSupabase().from('support_messages')
      .insert({ thread_id: openThread, body: reply.trim() });
    if (error) toast.error('تعذر الإرسال');
    else { setReply(''); refetch(); }
  }

  if (isLoading || !data) return <SkeletonList rows={3} />;
  const active = openThread ? data.threads.find((t) => t.id === openThread) : null;

  if (active) {
    const msgs = data.msgs.filter((m) => m.thread_id === active.id);
    return (
      <Card className="flex min-h-[50vh] flex-col p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-dark px-4 py-3 text-sm">
          <Button variant="ghost" size="xs" onClick={() => setOpenThread(null)}>→ كل الطلبات</Button>
          <b>{active.subject}</b>
          <Badge variant="outline">{SUPPORT_DEPT_AR[active.department] ?? active.department}</Badge>
          {active.status === 'closed' && <Badge variant="neutral">مغلقة</Badge>}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {msgs.map((m) => {
            const mine = m.sender === profile.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start flex-row-reverse' : ''}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-pulse-orange/15' : 'bg-white/5'
                }`}>
                  {!mine && <p className="mb-0.5 text-[11px] font-bold text-pulse-orange">فريق AGMA</p>}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="mt-1 text-[10px] text-gray-medium">
                    {new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        {active.status === 'open' ? (
          <form onSubmit={sendReply} className="flex gap-2 border-t border-gray-dark p-3">
            <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000}
              placeholder="اكتب ردكم…"
              className="min-w-0 flex-1 rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-sm text-snow placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none" />
            <Button type="submit" size="sm" disabled={!reply.trim()}>أرسل</Button>
          </form>
        ) : (
          <p className="border-t border-gray-dark p-3 text-xs text-gray-medium">
            أُغلقت هذه المحادثة — افتحوا طلباً جديداً إن احتجتم.
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <Card className="p-4">
          <p className="mb-3 text-sm font-bold">طلب دعم جديد</p>
          <form onSubmit={createThread} className="space-y-3">
            <label className="block text-xs text-gray-light">
              القسم
              <select value={dept} onChange={(e) => setDept(e.target.value)}
                className="mt-1 w-full rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-sm text-snow focus:border-pulse-orange focus:outline-none">
                {Object.entries(SUPPORT_DEPT_AR).map(([k, v]) => (
                  <option key={k} value={k} className="bg-pure-ink">{v}</option>
                ))}
              </select>
            </label>
            <Input label="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <label className="block text-xs text-gray-light">
              رسالتكم
              <textarea value={firstMsg} onChange={(e) => setFirstMsg(e.target.value)} rows={4}
                maxLength={4000}
                className="mt-1 w-full rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-sm text-snow focus:border-pulse-orange focus:outline-none" />
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm"
                disabled={subject.trim().length < 3 || firstMsg.trim().length < 2}>
                أرسل الطلب
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button size="sm" onClick={() => setCreating(true)}>+ طلب دعم جديد</Button>
      )}

      {data.threads.length === 0 && !creating ? (
        <Card className="p-4 text-sm text-gray-light">
          تحتاجون شيئاً؟ افتحوا طلب دعم وسيصل مباشرة للقسم المختص في AGMA —
          قانوني، مالي، مشاريع أو تقني.
        </Card>
      ) : data.threads.map((t) => {
        const last = [...data.msgs].reverse().find((m) => m.thread_id === t.id);
        return (
          <Card key={t.id} className="cursor-pointer p-3 text-sm transition-colors hover:border-pulse-orange/50"
            onClick={() => setOpenThread(t.id)}>
            <div className="flex flex-wrap items-center gap-2">
              <b>{t.subject}</b>
              <Badge variant="outline">{SUPPORT_DEPT_AR[t.department] ?? t.department}</Badge>
              <Badge variant={t.status === 'open' ? 'accent' : 'neutral'}>
                {t.status === 'open' ? 'مفتوحة' : 'مغلقة'}
              </Badge>
              <span className="ms-auto text-[11px] text-gray-medium">
                {new Date(t.last_message_at).toLocaleDateString('ar-SA')}
              </span>
            </div>
            {last && <p className="mt-1 truncate text-xs text-gray-medium">{last.body}</p>}
          </Card>
        );
      })}
    </div>
  );
}

function ClientDeliverables({ refetchAll }: { refetchAll: () => void }) {
  const toast = useToast();
  const key = ['portal-dlv'];
  const { data, isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [dlvs, versions, comments] = await Promise.all([
        s.from('deliverables').select('*').order('created_at', { ascending: false }),
        s.from('deliverable_versions').select('*').order('version_number'),
        s.from('deliverable_comments').select('*').order('created_at'),
      ]);
      return {
        dlvs: dlvs.data ?? [], versions: versions.data ?? [],
        comments: comments.data ?? [],
      };
    },
  });
  const [pin, setPin] = useState<{ versionId: string; x: number; y: number } | null>(null);
  const [pinText, setPinText] = useState('');
  const [changing, setChanging] = useState<{ versionId: string; note: string } | null>(null);

  async function addPin() {
    if (!pin) return;
    const { data: session } = await getSupabase().auth.getSession();
    const { error } = await getSupabase().from('deliverable_comments').insert({
      version_id: pin.versionId, body: pinText.trim(),
      pin_x: pin.x, pin_y: pin.y,
      author: session.session!.user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('ثُبّت تعليقك على النقطة — سيراه الفريق بمكانه بالضبط');
      setPin(null); setPinText(''); refetch();
    }
  }

  async function decide(versionId: string, decision: 'approved' | 'changes', note?: string) {
    const { error } = await getSupabase().rpc('client_decide_deliverable', {
      p_version: versionId, p_decision: decision, p_note: note ?? undefined,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(decision === 'approved'
        ? 'اعتمدت المخرج — شكراً لكم، الفريق أُشعر'
        : 'أُرسلت ملاحظاتك — سيصلك الإصدار المحدث قريباً');
      setChanging(null); refetch(); refetchAll();
    }
  }

  if (isLoading || !data) return <Card className="p-4"><Spinner className="h-5 w-5" /></Card>;
  if (data.dlvs.length === 0) {
    return <Card className="p-4 text-sm text-gray-light">لا مخرجات معروضة عليكم حالياً.</Card>;
  }

  return (
    <div className="space-y-4">
      {data.dlvs.map((d) => {
        const vers = data.versions.filter((v) => v.deliverable_id === d.id);
        const latest = vers[vers.length - 1];
        if (!latest) return null;
        const comments = data.comments.filter((c) => c.version_id === latest.id);
        const st = DLV_STATUS[d.status];
        const pending = d.status === 'pending_client';
        return (
          <Card key={d.id} className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold">{d.title}</span>
              <Badge variant="outline">الإصدار {latest.version_number}</Badge>
              <Badge variant={st.variant}>{st.label}</Badge>
            </div>
            {pending && (
              <p className="mb-2 text-xs text-pulse-orange">
                اضغط على أي نقطة من التصميم لتثبيت تعليق عليها بالضبط.
              </p>
            )}
            <PinViewer path={latest.file_path} comments={comments}
              onPin={pending ? (x, y) => setPin({ versionId: latest.id, x, y }) : undefined} />
            {pin?.versionId === latest.id && (
              <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
                <Input label="تعليقك على هذه النقطة" className="min-w-64" value={pinText}
                  onChange={(e) => setPinText(e.target.value)} />
                <Button size="xs" disabled={pinText.trim().length < 3} onClick={addPin}>
                  ثبّت التعليق
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setPin(null)}>إلغاء</Button>
              </div>
            )}
            {comments.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-gray-light">
                {comments.map((c, i) => (
                  <li key={c.id}>
                    {c.pin_x != null && <b className="text-pulse-orange">{i + 1}. </b>}
                    {c.body}
                  </li>
                ))}
              </ul>
            )}
            {pending && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide(latest.id, 'approved')}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> اعتماد المخرج
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => setChanging({ versionId: latest.id, note: '' })}>
                  أطلب تعديلات
                </Button>
              </div>
            )}
            {changing?.versionId === latest.id && (
              <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-2">
                <Input label="ما التعديلات المطلوبة؟ *" className="min-w-72" value={changing.note}
                  onChange={(e) => setChanging({ versionId: latest.id, note: e.target.value })} />
                <Button size="xs" disabled={changing.note.trim().length < 5}
                  onClick={() => decide(latest.id, 'changes', changing.note.trim())}>
                  إرسال الملاحظات
                </Button>
              </div>
            )}
            {vers.length > 1 && (
              <p className="mt-2 text-xs text-gray-medium">
                سجل الإصدارات: {vers.map((v) =>
                  `V${v.version_number}${v.decision === 'approved' ? ' ✓' : v.decision === 'changes' ? ' ↻' : ''}`
                ).join(' · ')}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- signature */

function SignModal({ doc, onClose, onDone }: {
  doc: Tables<'documents'> | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!doc) { setHasInk(false); setName(''); }
  }, [doc]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  async function sign() {
    if (!doc || !canvasRef.current) return;
    setBusy(true);
    const { error } = await getSupabase().rpc('client_sign_document', {
      p_document: doc.id,
      p_name: name.trim(),
      p_signature: canvasRef.current.toDataURL('image/png'),
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success('تم التوقيع — سجل الأدلة محفوظ وسيُشعر فريق AGMA');
      onDone();
    }
  }

  return (
    <Modal open={!!doc} onClose={onClose} title={`توقيع ${doc?.number ?? ''}`}>
      <div className="space-y-3">
        <p className="text-xs text-gray-medium">
          بتوقيعك أدناه تعتمد هذا المستند إلكترونياً وفق نظام التعاملات
          الإلكترونية — يُحفظ التوقيع مع الوقت وبصمة المحتوى في سجل الأدلة.
        </p>
        <Input label="الاسم الكامل للموقّع *" value={name}
          onChange={(e) => setName(e.target.value)} />
        <div>
          <p className="mb-1.5 text-xs font-bold text-gray-light">ارسم توقيعك *</p>
          <canvas ref={canvasRef} width={440} height={160}
            className="w-full touch-none rounded-sm border border-gray-dark bg-white"
            onPointerDown={(e) => {
              drawing.current = true;
              const ctx = e.currentTarget.getContext('2d')!;
              const { x, y } = pos(e);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.strokeStyle = '#1a1a1a';
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = e.currentTarget.getContext('2d')!;
              const { x, y } = pos(e);
              ctx.lineTo(x, y);
              ctx.stroke();
              setHasInk(true);
            }}
            onPointerUp={() => { drawing.current = false; }} />
          <Button variant="ghost" size="xs" className="mt-1"
            onClick={() => {
              const c = canvasRef.current;
              c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
              setHasInk(false);
            }}>
            مسح وإعادة الرسم
          </Button>
        </div>
        <Button className="w-full" loading={busy}
          disabled={!hasInk || name.trim().length < 3}
          onClick={sign}>
          <PenLine className="h-4 w-4" aria-hidden /> وقّع واعتمد المستند
        </Button>
      </div>
    </Modal>
  );
}

'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  SkeletonList,
  Switch,
  Tabs,
} from '@agma/ui';
import { Download, Pencil, Receipt, RefreshCw, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { fmtNum as fmt } from '../lib/format';
import type { Tables } from '@agma/db';
import {
  renderInvoice,
  type InvoicePayload,
  type QuotePayload,
} from '@agma/legal-templates';
import AllocationsTab from './AllocationsTab';
import { AttachmentsButton } from './AttachmentsBlock';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClients, useDocuments, usePaymentAccounts } from '../lib/queries';

type Doc = Tables<'documents'>;
type Payment = Tables<'payments'>;

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const todayAr = () => {
  const d = new Date();
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const paymentsKey = ['payments'] as const;

function usePayments() {
  return useQuery({
    queryKey: paymentsKey,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('payments').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export default function FinancePanel() {
  const [tab, setTab] = useState('invoices');
  return (
    <div>
      <h1 className="mb-3 text-xl font-black">المالية</h1>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'invoices', label: 'الفواتير' },
          { key: 'retainers', label: 'الاشتراكات' },
          { key: 'expenses', label: 'المصروفات' },
          { key: 'wallets', label: 'محافظ الإعلانات' },
          { key: 'allocations', label: 'توزيع الدخل' },
        ]}
      />
      <div className="mt-4">
        {tab === 'invoices' && <InvoicesTab />}
        {tab === 'retainers' && <RetainersTab />}
        {tab === 'expenses' && <ExpensesTab />}
        {tab === 'wallets' && <WalletsTab />}
        {tab === 'allocations' && <AllocationsTab />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- invoices */

function invoiceState(doc: Doc, paid: number) {
  if (doc.status === 'void') return { label: 'ملغاة', variant: 'neutral' as const };
  if (doc.status === 'draft') return { label: 'مسودة', variant: 'neutral' as const };
  const total = Number(doc.total ?? 0);
  if (paid >= total && total > 0) return { label: 'مدفوعة', variant: 'accent' as const };
  if (paid > 0) return { label: 'جزئي', variant: 'outline' as const };
  const overdue = doc.valid_until && new Date(doc.valid_until) < new Date();
  return overdue
    ? { label: 'متأخرة', variant: 'accent' as const }
    : { label: 'مستحقة', variant: 'outline' as const };
}

function InvoicesTab() {
  const { data: docs, isLoading } = useDocuments();
  const { data: payments } = usePayments();
  const { data: clients } = useClients();
  const [showNew, setShowNew] = useState(false);
  const [paying, setPaying] = useState<Doc | null>(null);
  const [crediting, setCrediting] = useState<Doc | null>(null);
  const [finalizing, setFinalizing] = useState<Doc | null>(null);

  const invoices = useMemo(
    () => (docs ?? []).filter((d) => d.type === 'invoice' || d.type === 'credit_note'),
    [docs]
  );
  const paidByInvoice = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments ?? []) {
      m.set(p.invoice_id, (m.get(p.invoice_id) ?? 0) + Number(p.amount));
    }
    return m;
  }, [payments]);

  // AR aging (docs/08 §3) — open finalized invoices by age bucket.
  const aging = useMemo(() => {
    const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
    for (const d of invoices) {
      if (d.type !== 'invoice' || d.status === 'draft' || d.status === 'void') continue;
      const balance = Number(d.total ?? 0) - (paidByInvoice.get(d.id) ?? 0);
      if (balance <= 0 || !d.issued_on) continue;
      const age = (Date.now() - new Date(d.issued_on).getTime()) / 86_400_000;
      if (age <= 30) buckets.current += balance;
      else if (age <= 60) buckets.d30 += balance;
      else if (age <= 90) buckets.d60 += balance;
      else buckets.d90 += balance;
    }
    return buckets;
  }, [invoices, paidByInvoice]);

  const finalize = useAppMutation(
    async (doc: Doc) => {
      const supabase = getSupabase();
      const prefix = doc.type === 'credit_note' ? 'CN' : 'INV';
      const { data: number, error: rpcErr } = await supabase.rpc('next_document_number', {
        p_prefix: prefix,
      });
      if (rpcErr || !number) throw new Error('تعذر حجز الرقم');
      const payload = doc.payload as unknown as InvoicePayload;
      const total = payload.items.reduce((s, i) => s + i.amount, 0)
        + (payload.vatEnabled ? payload.vatAmount ?? 0 : 0);
      const due = new Date();
      due.setDate(due.getDate() + 14);
      const { error } = await supabase
        .from('documents')
        .update({
          number,
          status: 'sent',
          total,
          // issuedAtIso arms the ZATCA Phase-1 QR in the renderer.
          payload: { ...payload, number, issuedAtIso: new Date().toISOString() } as never,
          issued_on: new Date().toISOString().slice(0, 10),
          valid_until: doc.type === 'invoice' ? due.toISOString().slice(0, 10) : null,
        })
        .eq('id', doc.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents], successMessage: 'اعتُمدت ورُقّمت' }
  );

  const createCreditNote = useAppMutation(
    async (invoice: Doc) => {
      const src = invoice.payload as unknown as InvoicePayload;
      const payload: InvoicePayload = {
        ...src,
        kind: 'credit_note',
        number: null,
        relatedNumber: invoice.number ?? undefined,
        paidAmount: undefined,
        issueDateAr: todayAr(),
      };
      const { error } = await getSupabase().from('documents').insert({
        type: 'credit_note',
        client_id: invoice.client_id,
        payload: payload as never,
        payment_account_id: invoice.payment_account_id,
        supersedes: invoice.id,
      });
      if (error) throw new Error(error.message);
    },
    {
      invalidate: [keys.documents],
      successMessage: 'أُنشئ إشعار دائن كمسودة — راجعه ثم اعتمده',
    }
  );

  function openPrint(doc: Doc) {
    const payload = {
      ...(doc.payload as unknown as InvoicePayload),
      paidAmount: paidByInvoice.get(doc.id) ?? 0,
    };
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(renderInvoice(payload));
    w.document.close();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>
          + فاتورة من عرض سعر
        </Button>
        <div className="ms-auto flex gap-2 text-xs" aria-label="أعمار الذمم">
          <Badge variant="outline">حالية: {fmt(aging.current)}</Badge>
          <Badge variant="outline">30+: {fmt(aging.d30)}</Badge>
          <Badge variant="outline">60+: {fmt(aging.d60)}</Badge>
          <Badge variant={aging.d90 > 0 ? 'accent' : 'outline'}>90+: {fmt(aging.d90)}</Badge>
        </div>
        <Button variant="ghost" size="xs" aria-label="تصدير CSV"
          disabled={invoices.length === 0}
          onClick={() => exportCsv('invoices',
            ['الرقم', 'النوع', 'الحالة', 'الإجمالي', 'المسدد', 'المتبقي', 'تاريخ الإصدار', 'الاستحقاق'],
            invoices.map((d) => [d.number, d.type, d.status, d.total,
              paidByInvoice.get(d.id) ?? 0,
              Number(d.total ?? 0) - (paidByInvoice.get(d.id) ?? 0),
              d.issued_on, d.valid_until]))}>
          <Download className="h-3.5 w-3.5" aria-hidden /> CSV
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="h-8 w-8" aria-hidden />}
          title="لا فواتير بعد"
          hint="أنشئ أول فاتورة من عرض سعر موقَّع — ستحمل الرقم INV-00053."
          action={<Button size="sm" onClick={() => setShowNew(true)}>+ فاتورة</Button>} />
      ) : (
        <div className="space-y-2">
          {invoices.map((doc) => {
            const client = (clients ?? []).find((c) => c.id === doc.client_id);
            const paid = paidByInvoice.get(doc.id) ?? 0;
            const st = invoiceState(doc, paid);
            const balance = Number(doc.total ?? 0) - paid;
            return (
              <Card key={doc.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge>{doc.type === 'credit_note' ? 'إشعار دائن' : 'فاتورة'}</Badge>
                <b dir="ltr">{doc.number ?? '—'}</b>
                <span className="text-gray-light">{client?.company}</span>
                {doc.total != null && (
                  <span dir="ltr" className="font-bold">SAR {fmt(Number(doc.total))}</span>
                )}
                <Badge variant={st.variant}>{st.label}</Badge>
                {doc.type === 'invoice' && doc.status !== 'draft' && balance > 0 && (
                  <span dir="ltr" className="text-xs text-gray-medium">
                    متبقي {fmt(balance)}
                  </span>
                )}
                <span className="ms-auto flex items-center gap-2">
                  <Button variant="ghost" size="xs" onClick={() => openPrint(doc)}>
                    معاينة / طباعة
                  </Button>
                  {doc.status === 'draft' && (
                    <Button size="xs" onClick={() => setFinalizing(doc)}>اعتماد وترقيم</Button>
                  )}
                  {doc.type === 'invoice' && doc.status !== 'draft' && doc.status !== 'void' && balance > 0 && (
                    <Button variant="outline" size="xs" onClick={() => setPaying(doc)}>
                      تسجيل دفعة
                    </Button>
                  )}
                  {doc.type === 'invoice' && doc.status !== 'draft' && doc.status !== 'void' && (
                    <Button variant="ghost" size="xs" onClick={() => setCrediting(doc)}>
                      إشعار دائن
                    </Button>
                  )}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <NewInvoiceModal open={showNew} onClose={() => setShowNew(false)} />
      <PaymentModal invoice={paying} paid={paying ? paidByInvoice.get(paying.id) ?? 0 : 0}
        onClose={() => setPaying(null)} />
      <ConfirmDialog open={!!finalizing} onClose={() => setFinalizing(null)}
        title="اعتماد وترقيم"
        message="سيُحجز الرقم التسلسلي نهائياً وتصبح الفاتورة غير قابلة للتعديل (رقم 3 من القواعد: التصحيح عبر إشعار دائن فقط). متابعة؟"
        confirmLabel="اعتماد"
        onConfirm={async () => {
          if (finalizing) await finalize.mutateAsync(finalizing);
        }} />
      <ConfirmDialog open={!!crediting} onClose={() => setCrediting(null)}
        title="إنشاء إشعار دائن"
        message={`سيُنشأ إشعار دائن (مسودة) يصحّح «${crediting?.number}» ببنودها كاملة — عدّل بنوده قبل الاعتماد إن lزم. متابعة؟`}
        confirmLabel="إنشاء"
        onConfirm={async () => {
          if (crediting) await createCreditNote.mutateAsync(crediting);
        }} />
    </div>
  );
}

function NewInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: docs } = useDocuments();
  const { data: clients } = useClients();
  const [quoteId, setQuoteId] = useState('');

  const eligibleQuotes = useMemo(
    () =>
      (docs ?? []).filter(
        (d) => d.type === 'quote' && ['sent', 'signed', 'active'].includes(d.status)
      ),
    [docs]
  );

  const create = useAppMutation(
    async () => {
      const quote = eligibleQuotes.find((q) => q.id === quoteId);
      if (!quote) throw new Error('اختر عرض سعر');
      const qp = quote.payload as unknown as QuotePayload;
      const payload: InvoicePayload = {
        kind: 'invoice',
        number: null,
        issueDateAr: todayAr(),
        city: qp.city,
        recipientName: qp.recipientName,
        recipientCompany: qp.recipientCompany,
        projectName: qp.projectName,
        relatedNumber: quote.number ?? undefined,
        items: qp.items,
        vatEnabled: qp.vatEnabled ?? false,
        vatAmount: qp.vatAmount,
        paymentAccount: qp.paymentAccount,
      };
      const { error } = await getSupabase().from('documents').insert({
        type: 'invoice',
        client_id: quote.client_id,
        scope_id: quote.scope_id,
        payload: payload as never,
        payment_account_id: quote.payment_account_id,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents], successMessage: 'أُنشئت الفاتورة كمسودة' }
  );

  return (
    <Modal open={open} onClose={onClose} title="فاتورة من عرض سعر">
      <div className="space-y-3">
        <Select label="عرض السعر المصدر" value={quoteId}
          onChange={(e) => setQuoteId(e.target.value)}>
          <option value="">— اختر —</option>
          {eligibleQuotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.number} — {(clients ?? []).find((c) => c.id === q.client_id)?.company}
            </option>
          ))}
        </Select>
        {eligibleQuotes.length === 0 && (
          <p className="text-xs text-gray-medium">
            لا عروض سعر معتمدة بعد — أنشئ واعتمد عرض سعر أولاً من صفحة المستندات.
          </p>
        )}
        <Button size="sm" className="w-full" loading={create.isPending} disabled={!quoteId}
          onClick={async () => {
            await create.mutateAsync(undefined as never);
            onClose();
          }}>
          إنشاء مسودة الفاتورة
        </Button>
      </div>
    </Modal>
  );
}

function PaymentModal({ invoice, paid, onClose }:
  { invoice: Doc | null; paid: number; onClose: () => void }) {
  const { data: accounts } = usePaymentAccounts();
  const [amount, setAmount] = useState(0);
  const [bankRef, setBankRef] = useState('');
  const [accountId, setAccountId] = useState('');

  const balance = invoice ? Number(invoice.total ?? 0) - paid : 0;

  const record = useAppMutation(
    async () => {
      if (!invoice) return;
      const { error } = await getSupabase().from('payments').insert({
        invoice_id: invoice.id,
        amount,
        bank_ref: bankRef || null,
        payment_account_id: accountId || invoice.payment_account_id,
      });
      if (error) throw new Error(error.message);
    },
    {
      invalidate: [paymentsKey as unknown as readonly string[], keys.documents],
      successMessage: 'سُجّلت الدفعة',
    }
  );

  return (
    <Modal open={!!invoice} onClose={onClose} title={`تسجيل دفعة — ${invoice?.number ?? ''}`}>
      <div className="space-y-3">
        <p className="text-sm text-gray-light">
          المتبقي: <b dir="ltr">SAR {balance.toLocaleString('en-US')}</b>
        </p>
        <div className="flex gap-2">
          <Input label="المبلغ" type="number" dir="ltr" value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))} />
          <Button variant="outline" size="xs" className="mt-5"
            onClick={() => setAmount(balance)}>
            كامل المتبقي
          </Button>
        </div>
        <Input label="مرجع الحوالة البنكية" dir="ltr" value={bankRef}
          onChange={(e) => setBankRef(e.target.value)} />
        <Select label="إلى حساب" value={accountId} dir="ltr"
          onChange={(e) => setAccountId(e.target.value)}>
          <option value="">حساب الفاتورة</option>
          {(accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.iban.slice(0, 4)}…{a.iban.slice(-4)}
            </option>
          ))}
        </Select>
        <Button size="sm" className="w-full" loading={record.isPending}
          disabled={amount <= 0 || amount > balance}
          onClick={async () => {
            await record.mutateAsync(undefined as never);
            onClose();
          }}>
          تسجيل
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------- retainers */

function RetainersTab() {
  const retainersKey = ['retainers'] as const;
  const { data: retainers, isLoading } = useQuery({
    queryKey: retainersKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('recurring_invoices').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const { data: clients } = useClients();
  const { data: accounts } = usePaymentAccounts();
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [day, setDay] = useState(1);

  const create = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('recurring_invoices').insert({
        client_id: clientId,
        title,
        amount,
        day_of_month: day,
        payment_account_id: (accounts ?? []).find((a) => a.is_default)?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    {
      invalidate: [retainersKey as unknown as readonly string[]],
      successMessage: 'أُنشئ الاشتراك',
    }
  );

  const generate = useAppMutation(
    async (r: Tables<'recurring_invoices'>) => {
      const supabase = getSupabase();
      const client = (clients ?? []).find((c) => c.id === r.client_id);
      const account = (accounts ?? []).find(
        (a) => a.id === r.payment_account_id || a.is_default
      );
      if (!account) throw new Error('لا حساب تحويل');
      const payload: InvoicePayload = {
        kind: 'invoice',
        number: null,
        issueDateAr: todayAr(),
        city: 'الرياض',
        recipientName: client?.company ?? '',
        projectName: r.title,
        items: [{ title: r.title, description: 'اشتراك شهري', amount: Number(r.amount) }],
        vatEnabled: false,
        paymentAccount: {
          iban: account.iban,
          bankName: account.bank_name,
          beneficiaryName: account.beneficiary_name,
        },
      };
      const { error } = await supabase.from('documents').insert({
        type: 'invoice',
        client_id: r.client_id,
        payload: payload as never,
        payment_account_id: account.id,
      });
      if (error) throw new Error(error.message);
      await supabase.from('recurring_invoices')
        .update({ last_generated: new Date().toISOString().slice(0, 10) })
        .eq('id', r.id);
    },
    {
      invalidate: [retainersKey as unknown as readonly string[], keys.documents],
      successMessage: 'وُلدت مسودة الفاتورة — راجعها في تبويب الفواتير',
    }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !title.trim() || amount <= 0) return;
    await create.mutateAsync(undefined as never);
    setTitle(''); setAmount(0);
  }

  if (isLoading) return <SkeletonList rows={3} />;

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
        <Select label="العميل" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">— اختر —</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </Select>
        <div className="min-w-40 flex-1">
          <Input label="عنوان الاشتراك" value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="ريتينر سوشال ميديا" />
        </div>
        <Input label="SAR / شهر" type="number" dir="ltr" value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))} className="w-28" />
        <Input label="يوم الإصدار" type="number" dir="ltr" value={day}
          onChange={(e) => setDay(Number(e.target.value))} className="w-24" min={1} max={28} />
        <Button type="submit" size="sm" loading={create.isPending}>+ اشتراك</Button>
      </form>

      {(retainers ?? []).length === 0 ? (
        <EmptyState icon={<RefreshCw className="h-8 w-8" aria-hidden />}
          title="لا اشتراكات بعد"
          hint="الاشتراكات الشهرية (مثل باقة النمو) تُولّد فواتيرها تلقائياً كل شهر من هنا." />
      ) : (
        <div className="space-y-2">
          {(retainers ?? []).map((r) => (
            <RetainerRow key={r.id} retainer={r}
              clientName={(clients ?? []).find((c) => c.id === r.client_id)?.company ?? ''}
              onGenerate={() => generate.mutate(r)}
              generating={generate.isPending}
              invalidate={retainersKey as unknown as readonly string[]} />
          ))}
        </div>
      )}
    </div>
  );
}

function RetainerRow({ retainer: r, clientName, onGenerate, generating, invalidate }: {
  retainer: Tables<'recurring_invoices'>;
  clientName: string;
  onGenerate: () => void;
  generating: boolean;
  invalidate: readonly string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: r.title, amount: String(r.amount), day: String(r.day_of_month),
  });

  const patch = useAppMutation(
    async (p: Record<string, unknown>) => {
      const { error } = await getSupabase().from('recurring_invoices')
        .update(p as never).eq('id', r.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate] }
  );

  if (editing) {
    return (
      <Card className="flex flex-wrap items-end gap-2 p-3 text-sm">
        <Input label="العنوان" value={draft.title} className="min-w-40 flex-1"
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        <Input label="SAR" type="number" dir="ltr" value={draft.amount} className="w-28"
          onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} />
        <Input label="يوم الشهر" type="number" dir="ltr" value={draft.day} className="w-24"
          onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))} />
        <Button size="xs" className="mb-1" loading={patch.isPending}
          disabled={draft.title.trim().length < 2 || Number(draft.amount) <= 0
            || Number(draft.day) < 1 || Number(draft.day) > 28}
          onClick={async () => {
            await patch.mutateAsync({
              title: draft.title.trim(),
              amount: Number(draft.amount),
              day_of_month: Number(draft.day),
            });
            setEditing(false);
          }}>
          حفظ
        </Button>
        <Button variant="ghost" size="xs" className="mb-1" onClick={() => setEditing(false)}>إلغاء</Button>
      </Card>
    );
  }
  return (
    <Card className={`group flex flex-wrap items-center gap-3 p-3 text-sm ${r.active ? '' : 'opacity-60'}`}>
      <span className="font-bold">{r.title}</span>
      <span className="text-gray-light">{clientName}</span>
      <span dir="ltr" className="font-bold">SAR {fmt(Number(r.amount))}</span>
      <Badge variant="outline">يوم {r.day_of_month}</Badge>
      {!r.active && <Badge variant="outline">موقوف مؤقتاً</Badge>}
      {r.last_generated && (
        <span className="text-xs text-gray-medium" dir="ltr">آخر توليد: {r.last_generated}</span>
      )}
      <span className="ms-auto flex items-center gap-2">
        <Button variant="ghost" size="xs" aria-label={`تعديل ${r.title}`}
          onClick={() => {
            setDraft({ title: r.title, amount: String(r.amount), day: String(r.day_of_month) });
            setEditing(true);
          }}>
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Switch label={r.active ? 'نشط' : 'موقوف'} checked={r.active}
          onChange={(v) => patch.mutate({ active: v })} />
        {r.active && (
          <Button variant="outline" size="xs" loading={generating} onClick={onGenerate}>
            توليد فاتورة الآن
          </Button>
        )}
      </span>
    </Card>
  );
}

/* -------------------------------------------------------------- expenses */

function ExpensesTab() {
  const expensesKey = ['expenses'] as const;
  const { data: expenses, isLoading } = useQuery({
    queryKey: expensesKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('expenses').select('*').order('expense_date', { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [category, setCategory] = useState('عام');
  const [amount, setAmount] = useState(0);
  const [supplier, setSupplier] = useState('');

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('expenses').insert({
        category, amount, supplier: supplier || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [expensesKey as unknown as readonly string[]], successMessage: 'سُجّل المصروف' }
  );

  const thisMonth = (expenses ?? []).filter((e) => {
    const d = new Date(e.expense_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, e) => s + Number(e.amount), 0);

  if (isLoading) return <SkeletonList rows={3} />;

  return (
    <div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (amount <= 0) return;
        await add.mutateAsync(undefined as never);
        setAmount(0); setSupplier('');
      }} className="mb-4 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
        <Select label="التصنيف" value={category} onChange={(e) => setCategory(e.target.value)}>
          {['عام','اشتراكات وأدوات','إعلانات','رواتب ومستقلون','ضيافة وتنقل','حكومي'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input label="SAR" type="number" dir="ltr" value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))} className="w-28" />
        <div className="min-w-40 flex-1">
          <Input label="المورّد" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </div>
        <Button type="submit" size="sm" loading={add.isPending}>+ مصروف</Button>
      </form>
      <div className="mb-3 flex items-center gap-3">
        <p className="text-sm text-gray-light">
          مصروفات هذا الشهر: <b dir="ltr">SAR {monthTotal.toLocaleString('en-US')}</b>
        </p>
        <Button variant="ghost" size="xs" aria-label="تصدير CSV"
          disabled={(expenses ?? []).length === 0}
          onClick={() => exportCsv('expenses',
            ['التاريخ', 'التصنيف', 'المورّد', 'SAR'],
            (expenses ?? []).map((e) => [e.expense_date, e.category, e.supplier, e.amount]))}>
          <Download className="h-3.5 w-3.5" aria-hidden /> CSV
        </Button>
      </div>
      <div className="space-y-1.5">
        {(expenses ?? []).map((e) => (
          <ExpenseRow key={e.id} expense={e} invalidate={expensesKey as unknown as readonly string[]} />
        ))}
      </div>
    </div>
  );
}

function ExpenseRow({ expense: e, invalidate }:
  { expense: Tables<'expenses'>; invalidate: readonly string[] }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    amount: String(e.amount), category: e.category, supplier: e.supplier ?? '',
  });

  const patch = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('expenses').update({
        amount: Number(draft.amount),
        category: draft.category,
        supplier: draft.supplier.trim() || null,
      }).eq('id', e.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate], successMessage: 'صُحّح المصروف (موثّق في التدقيق)' }
  );
  const remove = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('expenses').delete().eq('id', e.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate], successMessage: 'حُذف المصروف (موثّق في التدقيق)' }
  );

  if (editing) {
    return (
      <Card className="flex flex-wrap items-end gap-2 p-2.5 text-sm">
        <Select label="التصنيف" value={draft.category} className="w-40"
          onChange={(ev) => setDraft((d) => ({ ...d, category: ev.target.value }))}>
          {['عام','اشتراكات وأدوات','إعلانات','رواتب ومستقلون','ضيافة وتنقل','حكومي'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input label="SAR" type="number" dir="ltr" value={draft.amount} className="w-28"
          onChange={(ev) => setDraft((d) => ({ ...d, amount: ev.target.value }))} />
        <Input label="المورّد" value={draft.supplier} className="min-w-32 flex-1"
          onChange={(ev) => setDraft((d) => ({ ...d, supplier: ev.target.value }))} />
        <Button size="xs" className="mb-1" loading={patch.isPending}
          disabled={Number(draft.amount) <= 0}
          onClick={async () => { await patch.mutateAsync(undefined as never); setEditing(false); }}>
          حفظ
        </Button>
        <Button variant="ghost" size="xs" className="mb-1" onClick={() => setEditing(false)}>إلغاء</Button>
      </Card>
    );
  }
  return (
    <Card className="group flex items-center gap-3 p-2.5 text-sm">
      <Badge variant="outline">{e.category}</Badge>
      <span className="text-gray-light">{e.supplier ?? '—'}</span>
      <span dir="ltr" className="ms-auto font-bold">SAR {fmt(Number(e.amount))}</span>
      <span dir="ltr" className="text-xs text-gray-medium">{e.expense_date}</span>
      <AttachmentsButton entity="expense" entityId={e.id} title={e.category}
        hint="أرفق الإيصال أو الفاتورة الضريبية للمورّد" />
      <span className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button variant="ghost" size="xs" aria-label="تعديل المصروف" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Button variant="ghost" size="xs" aria-label="حذف المصروف" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3 w-3" aria-hidden />
        </Button>
      </span>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
        title="حذف المصروف"
        message={`حذف مصروف ${e.category} بقيمة SAR ${fmt(Number(e.amount))}؟ يؤثر على متوسط التشغيل وأشهر الخزينة، والإجراء موثّق.`}
        confirmLabel="حذف"
        onConfirm={async () => { await remove.mutateAsync(undefined as never); }} />
    </Card>
  );
}

/* --------------------------------------------------------------- wallets */

function WalletsTab() {
  const walletsKey = ['wallets'] as const;
  const { data, isLoading } = useQuery({
    queryKey: walletsKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [wallets, entries] = await Promise.all([
        supabase.from('wallets').select('*'),
        supabase.from('wallet_entries').select('*'),
      ]);
      if (wallets.error) throw new Error(wallets.error.message);
      return { wallets: wallets.data ?? [], entries: entries.data ?? [] };
    },
  });
  const { data: clients } = useClients();
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState(0);
  const [spendFor, setSpendFor] = useState<Tables<'wallets'> | null>(null);

  const createWallet = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('wallets').insert({
        client_id: clientId, budget,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [walletsKey as unknown as readonly string[]], successMessage: 'أُنشئت المحفظة' }
  );

  if (isLoading || !data) return <SkeletonList rows={3} />;

  const spentByWallet = new Map<string, number>();
  for (const e of data.entries) {
    spentByWallet.set(e.wallet_id, (spentByWallet.get(e.wallet_id) ?? 0) + Number(e.amount));
  }

  return (
    <div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!clientId || budget <= 0) return;
        await createWallet.mutateAsync(undefined as never);
        setBudget(0);
      }} className="mb-4 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
        <Select label="العميل" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">— اختر —</option>
          {(clients ?? [])
            .filter((c) => !data.wallets.some((w) => w.client_id === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
        </Select>
        <Input label="الميزانية المعتمدة (SAR)" type="number" dir="ltr" value={budget || ''}
          onChange={(e) => setBudget(Number(e.target.value))} className="w-36" />
        <Button type="submit" size="sm" loading={createWallet.isPending}>+ محفظة</Button>
      </form>

      {data.wallets.length === 0 ? (
        <EmptyState icon={<WalletIcon className="h-8 w-8" aria-hidden />}
          title="لا محافظ إعلانية"
          hint="ميزانيات إعلانات العملاء تُتتبع هنا منفصلة تماماً عن إيرادات الوكالة (قاعدة B3)." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.wallets.map((w) => {
            const spent = spentByWallet.get(w.id) ?? 0;
            const pct = Math.min(100, Math.round((spent / Number(w.budget)) * 100));
            return (
              <Card key={w.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {(clients ?? []).find((c) => c.id === w.client_id)?.company}
                  </span>
                  <Badge variant={pct >= 80 ? 'accent' : 'outline'}>{pct}%</Badge>
                  <Button variant="outline" size="xs" className="ms-auto"
                    onClick={() => setSpendFor(w)}>
                    + إنفاق
                  </Button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-dark"
                  role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full ${pct >= 80 ? 'bg-pulse-orange' : 'bg-gray-light'}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <p dir="ltr" className="mt-2 text-xs text-gray-medium">
                  SAR {spent.toLocaleString('en-US')} / {Number(w.budget).toLocaleString('en-US')}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <SpendModal wallet={spendFor} onClose={() => setSpendFor(null)}
        invalidate={walletsKey as unknown as readonly string[]} />
    </div>
  );
}

function SpendModal({ wallet, onClose, invalidate }:
  { wallet: Tables<'wallets'> | null; onClose: () => void; invalidate: readonly string[] }) {
  const [amount, setAmount] = useState(0);
  const [campaign, setCampaign] = useState('');

  const add = useAppMutation(
    async () => {
      if (!wallet) return;
      const { error } = await getSupabase().from('wallet_entries').insert({
        wallet_id: wallet.id, amount, campaign: campaign || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [invalidate], successMessage: 'سُجّل الإنفاق' }
  );

  return (
    <Modal open={!!wallet} onClose={onClose} title="تسجيل إنفاق إعلاني">
      <div className="space-y-3">
        <Input label="المبلغ (SAR)" type="number" dir="ltr" value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))} />
        <Input label="الحملة" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        <Button size="sm" className="w-full" loading={add.isPending} disabled={amount <= 0}
          onClick={async () => {
            await add.mutateAsync(undefined as never);
            onClose();
          }}>
          تسجيل
        </Button>
      </div>
    </Modal>
  );
}

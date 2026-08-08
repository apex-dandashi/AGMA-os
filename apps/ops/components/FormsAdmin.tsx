'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Hint, Input, Select,
  SkeletonList, Textarea, useToast,
} from '@agma/ui';
import {
  ArrowDown, ArrowUp, ClipboardList, Download, Inbox, Send, Trash2,
} from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import {
  FIELD_TYPE_AR, newFieldKey, parseFields,
  type FormFieldDef, type FormFieldType,
} from '../lib/formFields';

/**
 * منشئ Drop Forms (B5): الفريق يبني نموذجاً بلا كود ويرسله لعميل — التعبئة
 * تهبط صفوفاً منظمة هنا (لا PDF ضائعة) وتُصدَّر CSV بضغطة. نموذج الاستقبال
 * النظامي يُرسل تلقائياً لحظة توقيع العقد.
 */

export default function FormsAdmin() {
  const toast = useToast();
  const key = ['forms_admin'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [forms, requests, responses, clients] = await Promise.all([
        s.from('forms').select('*').order('is_system', { ascending: false }).order('created_at'),
        s.from('form_requests').select('*').order('created_at', { ascending: false }),
        s.from('form_responses').select('*').order('created_at', { ascending: false }),
        s.from('clients').select('id, company').eq('status', 'active').order('company'),
      ]);
      return {
        forms: forms.data ?? [], requests: requests.data ?? [],
        responses: responses.data ?? [], clients: clients.data ?? [],
      };
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<'build' | 'responses'>('build');
  const [sendClient, setSendClient] = useState('');
  const [confirmDel, setConfirmDel] = useState<Tables<'forms'> | null>(null);

  const patch = useAppMutation(
    async ({ id, values, msg }: {
      id: string; values: Partial<Tables<'forms'>>; msg?: string;
    }) => {
      const { error } = await getSupabase().from('forms').update(values).eq('id', id);
      if (error) throw new Error(error.message);
      if (msg) toast.success(msg);
    },
    { invalidate: [key] }
  );

  const create = useAppMutation(
    async () => {
      const { data: row, error } = await getSupabase().from('forms').insert({
        title: 'نموذج جديد — عدّل العنوان',
        fields: [{ key: 'f1', label: 'السؤال الأول', type: 'text', required: true }],
      }).select('id').single();
      if (error) throw new Error(error.message);
      setOpenId(row.id);
      setView('build');
    },
    { invalidate: [key], successMessage: 'أُنشئ — ابنِ حقوله وفعّله' }
  );

  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('forms').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setConfirmDel(null);
    },
    { invalidate: [key], successMessage: 'حُذف' }
  );

  const sendTo = useAppMutation(
    async ({ formId, clientId }: { formId: string; clientId: string }) => {
      const { error } = await getSupabase().from('form_requests').insert({
        form_id: formId, client_id: clientId,
      });
      if (error) {
        throw new Error(error.message.includes('duplicate')
          ? 'عنده طلب معلق لهذا النموذج أصلاً' : error.message);
      }
      setSendClient('');
    },
    { invalidate: [key], successMessage: 'أُرسل — سيُشعر العميل في بوابته فوراً' }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;

  const open = openId ? data.forms.find((f) => f.id === openId) : null;

  /* ------------------------------------------------ المحرر المفتوح */
  if (open) {
    const fields = parseFields(open.fields);
    const formRequests = data.requests.filter((r) => r.form_id === open.id);
    const formResponses = data.responses.filter((r) => r.form_id === open.id);
    const clientName = (id: string) =>
      data.clients.find((c) => c.id === id)?.company ?? 'عميل';

    const saveFields = (next: FormFieldDef[], msg?: string) =>
      patch.mutate({ id: open.id, values: { fields: next as never }, msg });

    const exportCsv = () => {
      const cols = fields.map((f) => f.key);
      const head = ['العميل', 'التاريخ', ...fields.map((f) => f.label)];
      const rows = formResponses.map((r) => {
        const a = (r.answers ?? {}) as Record<string, unknown>;
        return [clientName(r.client_id), new Date(r.created_at).toLocaleDateString('ar-SA'),
          ...cols.map((k) => {
            const v = a[k];
            return Array.isArray(v) ? v.join(' | ') : String(v ?? '');
          })];
      });
      const csv = '﻿' + [head, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${open.title}.csv`; a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>→ كل النماذج</Button>
          <Badge variant={open.status === 'active' ? 'accent' : 'neutral'}>
            {{ draft: 'مسودة', active: 'فعال', archived: 'مؤرشف' }[open.status]}
          </Badge>
          {open.is_system && <Badge variant="outline">نظامي — يُرسل تلقائياً عند توقيع العقد</Badge>}
          <span className="ms-auto flex gap-2">
            <Button size="xs" variant={view === 'build' ? 'primary' : 'ghost'}
              onClick={() => setView('build')}>البناء</Button>
            <Button size="xs" variant={view === 'responses' ? 'primary' : 'ghost'}
              onClick={() => setView('responses')}>
              الإجابات ({formResponses.length})
            </Button>
          </span>
        </div>

        {view === 'build' ? (
          <>
            <Card className="space-y-2 p-4">
              <Input label="عنوان النموذج" defaultValue={open.title}
                onBlur={(e) => e.target.value.trim() && e.target.value !== open.title
                  && patch.mutate({ id: open.id, values: { title: e.target.value.trim() } })} />
              <Textarea label="وصف يظهر للعميل أعلى النموذج" rows={2}
                defaultValue={open.description ?? ''}
                onBlur={(e) => e.target.value !== (open.description ?? '')
                  && patch.mutate({ id: open.id, values: { description: e.target.value || null } })} />
            </Card>

            {fields.map((f, i) => (
              <Card key={f.key} className="space-y-2 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <Input label="نص السؤال" className="min-w-64 flex-1" defaultValue={f.label}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== f.label) {
                        const next = [...fields];
                        next[i] = { ...f, label: e.target.value.trim() };
                        saveFields(next);
                      }
                    }} />
                  <Select label="النوع" className="w-40" value={f.type}
                    onChange={(e) => {
                      const next = [...fields];
                      next[i] = { ...f, type: e.target.value as FormFieldType };
                      saveFields(next);
                    }}>
                    {Object.entries(FIELD_TYPE_AR).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                  <label className="mb-2 flex items-center gap-1.5 text-xs text-gray-light">
                    <input type="checkbox" className="accent-pulse-orange" checked={!!f.required}
                      onChange={(e) => {
                        const next = [...fields];
                        next[i] = { ...f, required: e.target.checked };
                        saveFields(next);
                      }} />
                    إلزامي
                  </label>
                  <span className="mb-1 flex gap-1">
                    <Button variant="ghost" size="xs" disabled={i === 0}
                      aria-label="فوق"
                      onClick={() => {
                        const next = [...fields];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        saveFields(next);
                      }}>
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="xs" disabled={i === fields.length - 1}
                      aria-label="تحت"
                      onClick={() => {
                        const next = [...fields];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        saveFields(next);
                      }}>
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="xs" aria-label="احذف السؤال"
                      onClick={() => saveFields(fields.filter((_, j) => j !== i), 'حُذف السؤال')}>
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </Button>
                  </span>
                </div>
                {(f.type === 'select' || f.type === 'multi') && (
                  <Input label="الخيارات (افصل بفاصلة)"
                    defaultValue={(f.options ?? []).join('، ')}
                    onBlur={(e) => {
                      const options = e.target.value.split(/[,،]/).map((o) => o.trim()).filter(Boolean);
                      const next = [...fields];
                      next[i] = { ...f, options };
                      saveFields(next);
                    }} />
                )}
                <Input label="تلميح مساعد (اختياري)" defaultValue={f.hint ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (f.hint ?? '')) {
                      const next = [...fields];
                      next[i] = { ...f, hint: e.target.value || undefined };
                      saveFields(next);
                    }
                  }} />
              </Card>
            ))}

            <div className="flex flex-wrap items-end gap-2">
              <Button size="sm" variant="outline"
                onClick={() => saveFields([...fields,
                  { key: newFieldKey(fields), label: 'سؤال جديد', type: 'text' }], 'أُضيف سؤال')}>
                + أضف سؤالاً
              </Button>
              {open.status !== 'active' ? (
                <Button size="sm" disabled={fields.length === 0}
                  onClick={() => patch.mutate({ id: open.id, values: { status: 'active' },
                    msg: 'فُعّل — صار جاهزاً للإرسال' })}>
                  فعّله
                </Button>
              ) : (
                <span className="flex items-end gap-2">
                  <Select label="أرسله لعميل" className="w-48" value={sendClient}
                    onChange={(e) => setSendClient(e.target.value)}>
                    <option value="">— اختر —</option>
                    {data.clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.company}</option>
                    ))}
                  </Select>
                  <Button size="sm" loading={sendTo.isPending} disabled={!sendClient}
                    onClick={() => sendTo.mutate({ formId: open.id, clientId: sendClient })}>
                    <Send className="h-3.5 w-3.5" aria-hidden /> أرسل
                  </Button>
                </span>
              )}
            </div>

            {formRequests.length > 0 && (
              <Card className="p-3 text-xs">
                <p className="mb-2 font-bold">الطلبات</p>
                {formRequests.map((r) => (
                  <p key={r.id} className="flex items-center gap-2 py-0.5 text-gray-light">
                    {clientName(r.client_id)}
                    <Badge variant={r.status === 'completed' ? 'accent' : 'outline'}>
                      {{ pending: 'بانتظار التعبئة', completed: 'عُبّئ ✓', cancelled: 'ملغى' }[r.status]}
                    </Badge>
                  </p>
                ))}
              </Card>
            )}
          </>
        ) : (
          /* -------------------------------------------- الإجابات */
          <>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={formResponses.length === 0}
                onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" aria-hidden /> صدّر CSV
              </Button>
              <Hint text="كل تعبئة صف منظم — هذا ما يجعل التحليل ممكناً بدل ملفات PDF المتناثرة." />
            </div>
            {formResponses.length === 0 ? (
              <EmptyState icon={<Inbox className="h-8 w-8" aria-hidden />}
                title="لا إجابات بعد" hint="أرسل النموذج لعميل وستهبط تعبئته هنا فور إرسالها." />
            ) : formResponses.map((r) => {
              const a = (r.answers ?? {}) as Record<string, unknown>;
              return (
                <Card key={r.id} className="space-y-2 p-4 text-sm">
                  <p className="flex items-center gap-2 font-bold">
                    {clientName(r.client_id)}
                    <span className="text-xs font-normal text-gray-medium">
                      {new Date(r.created_at).toLocaleString('ar-SA')}
                    </span>
                  </p>
                  {fields.map((f) => {
                    const v = a[f.key];
                    if (v == null || v === '') return null;
                    return (
                      <div key={f.key} className="border-t border-gray-dark pt-2">
                        <p className="text-xs text-gray-medium">{f.label}</p>
                        {f.type === 'file' && typeof v === 'string' ? (
                          <button type="button"
                            className="text-pulse-orange hover:underline"
                            onClick={async () => {
                              const { data: signed } = await getSupabase().storage
                                .from('form-uploads').createSignedUrl(v, 300);
                              if (signed?.signedUrl) window.open(signed.signedUrl, '_blank');
                            }}>
                            افتح المرفق ↗
                          </button>
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {Array.isArray(v) ? v.join('، ') : String(v)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </>
        )}
      </div>
    );
  }

  /* -------------------------------------------------- القائمة */
  const pendingOf = (formId: string) =>
    data.requests.filter((r) => r.form_id === formId && r.status === 'pending').length;
  const responsesOf = (formId: string) =>
    data.responses.filter((r) => r.form_id === formId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => create.mutate(undefined as never)}
          loading={create.isPending}>
          + نموذج جديد
        </Button>
        <Hint text="ابنِ نموذجاً بلا كود (نصوص، اختيارات، ملفات، جوال…) وأرسله لأي عميل — يعبيه من بوابته وتهبط الإجابات صفوفاً منظمة تصدرها CSV. نموذج «استقبال عميل جديد» النظامي يُرسل تلقائياً لحظة توقيع أول عقد." />
      </div>
      {data.forms.map((f) => (
        <Card key={f.id} className="flex cursor-pointer flex-wrap items-center gap-2 p-3 text-sm transition-colors hover:border-pulse-orange/50"
          onClick={() => { setOpenId(f.id); setView('build'); }}>
          <ClipboardList className="h-4 w-4 text-pulse-orange" aria-hidden />
          <span className="font-bold">{f.title}</span>
          {f.is_system && <Badge variant="outline">نظامي</Badge>}
          <Badge variant={f.status === 'active' ? 'accent' : 'neutral'}>
            {{ draft: 'مسودة', active: 'فعال', archived: 'مؤرشف' }[f.status]}
          </Badge>
          <span className="ms-auto flex items-center gap-3 text-xs text-gray-medium">
            {pendingOf(f.id) > 0 && <span>{pendingOf(f.id)} بانتظار التعبئة</span>}
            <span>{responsesOf(f.id)} إجابة</span>
            {!f.is_system && (
              <Button variant="ghost" size="xs" aria-label="احذف"
                onClick={(e) => { e.stopPropagation(); setConfirmDel(f); }}>
                <Trash2 className="h-3 w-3" aria-hidden />
              </Button>
            )}
          </span>
        </Card>
      ))}

      <ConfirmDialog open={confirmDel != null} title="حذف النموذج؟"
        message={`«${confirmDel?.title ?? ''}» سيُحذف مع طلباته وإجاباته نهائياً.`}
        confirmLabel="احذف" danger
        onConfirm={() => { if (confirmDel) remove.mutate(confirmDel.id); }}
        onClose={() => setConfirmDel(null)} />
    </div>
  );
}

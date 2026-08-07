'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  Select,
  SkeletonList,
  Switch,
  Tabs,
  Textarea,
} from '@agma/ui';
import { Landmark, ListChecks, ScrollText, Settings as SettingsIcon } from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

/**
 * الإعدادات — everything DB-driven that partners tune without a deploy:
 * bank accounts, the legal clause library, pause checklists, allocation
 * CAP→TAP percentages, notification templates. Admin-only (RLS enforces;
 * the page just doesn't tease others).
 */
export default function SettingsPanel() {
  const me = useProfile();
  const [tab, setTab] = useState('accounts');

  if (me.role !== 'admin') {
    return (
      <EmptyState icon={<SettingsIcon className="h-8 w-8" aria-hidden />}
        title="الإعدادات للشركاء فقط"
        hint="نِسب التوزيع والحسابات البنكية والبنود القانونية قرارات شركاء." />
    );
  }

  return (
    <div>
      <h1 className="mb-3 text-xl font-black">الإعدادات</h1>
      <Tabs active={tab} onChange={setTab}
        tabs={[
          { key: 'accounts', label: 'الحسابات البنكية' },
          { key: 'clauses', label: 'البنود القانونية' },
          { key: 'checklists', label: 'قوائم الفحص' },
          { key: 'rules', label: 'نسب التوزيع' },
          { key: 'services', label: 'الخدمات' },
          { key: 'taskTemplates', label: 'قوالب المهام' },
          { key: 'templates', label: 'قوالب الإشعارات' },
        ]} />
      <div className="mt-4">
        {tab === 'accounts' && <AccountsTab />}
        {tab === 'clauses' && <ClausesTab />}
        {tab === 'checklists' && <ChecklistsTab />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'services' && <ServicesTab />}
        {tab === 'taskTemplates' && <TaskTemplatesTab />}
        {tab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- accounts */

function AccountsTab() {
  const key = ['settings-accounts'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('payment_accounts').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [form, setForm] = useState({ iban: '', bank_name: '', beneficiary_name: '', internal_label: '' });

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('payment_accounts').insert({
        iban: form.iban.replace(/\s/g, '').toUpperCase(),
        bank_name: form.bank_name.trim(),
        beneficiary_name: form.beneficiary_name.trim(),
        internal_label: form.internal_label.trim() || form.bank_name.trim(),
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'أُضيف الحساب' }
  );
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const supabase = getSupabase();
      if (p.is_default === true) {
        await supabase.from('payment_accounts').update({ is_default: false }).neq('id', id);
      }
      const { error } = await supabase.from('payment_accounts').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={3} />;
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {data.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <Landmark className="h-4 w-4 text-pulse-orange" aria-hidden />
            <span dir="ltr" className="font-mono text-xs">{a.iban}</span>
            <span className="text-gray-light">{a.bank_name}</span>
            <span className="text-gray-medium text-xs">{a.beneficiary_name}</span>
            {a.internal_label && <Badge variant="outline">{a.internal_label}</Badge>}
            <span className="ms-auto flex items-center gap-3">
              <Checkbox label="افتراضي" checked={a.is_default}
                onChange={(e) => patch.mutate({ id: a.id, p: { is_default: e.target.checked } })} />
              <Switch label={a.active ? 'نشط' : 'موقوف'} checked={a.active}
                onChange={(v) => patch.mutate({ id: a.id, p: { active: v } })} />
            </span>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <p className="mb-2 text-sm font-bold text-gray-light">حساب جديد</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="IBAN" dir="ltr" value={form.iban}
            onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} />
          <Input label="البنك" value={form.bank_name}
            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} />
          <Input label="اسم المستفيد" value={form.beneficiary_name}
            onChange={(e) => setForm((f) => ({ ...f, beneficiary_name: e.target.value }))} />
          <Input label="وسم داخلي (لا يظهر للعميل)" value={form.internal_label}
            onChange={(e) => setForm((f) => ({ ...f, internal_label: e.target.value }))} />
        </div>
        <Button size="sm" className="mt-3" loading={add.isPending}
          disabled={!/^SA[0-9]{22}$/.test(form.iban.replace(/\s/g, '').toUpperCase())
            || form.bank_name.trim().length < 2 || form.beneficiary_name.trim().length < 2}
          onClick={async () => {
            await add.mutateAsync(undefined as never);
            setForm({ iban: '', bank_name: '', beneficiary_name: '', internal_label: '' });
          }}>
          + أضف الحساب
        </Button>
        <p className="mt-1 text-xs text-gray-medium">آيبان سعودي: SA + ٢٢ رقماً.</p>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------- clauses */

function ClausesTab() {
  const key = ['settings-clauses'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('clause_library').select('*').order('category').order('sort');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [editing, setEditing] = useState<Tables<'clause_library'> | null>(null);
  const [draft, setDraft] = useState({ title_ar: '', body_ar: '', category: 'commercial' });

  const save = useAppMutation(
    async (input: { id?: string; title_ar: string; body_ar: string; category?: string }) => {
      const supabase = getSupabase();
      if (input.id) {
        const { error } = await supabase.from('clause_library')
          .update({ title_ar: input.title_ar, body_ar: input.body_ar }).eq('id', input.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('clause_library').insert({
          key: 'custom_' + input.title_ar.replace(/\s+/g, '_').slice(0, 40) + '_' + String(Date.now() % 100000),
          category: input.category ?? 'commercial',
          title_ar: input.title_ar,
          body_ar: input.body_ar,
          approved: true,
          sort: 99,
        });
        if (error) throw new Error(error.message);
      }
    },
    { invalidate: [key], successMessage: 'حُفظ البند' }
  );
  const toggle = useAppMutation(
    async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await getSupabase().from('clause_library')
        .update({ approved }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;
  const CAT: Record<string, string> = { commercial: 'تجاري', legal: 'قانوني', nda: 'عدم إفصاح' };
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {data.map((c) => (
          <Card key={c.id} className="p-3 text-sm">
            <div className="flex items-center gap-2">
              <ScrollText className="h-3.5 w-3.5 text-pulse-orange" aria-hidden />
              <b>{c.title_ar}</b>
              <Badge variant="outline">{CAT[c.category] ?? c.category}</Badge>
              <span className="ms-auto flex gap-2">
                <Switch label={c.approved ? 'معتمد' : 'غير معتمد'} checked={c.approved}
                  onChange={(v) => toggle.mutate({ id: c.id, approved: v })} />
                <Button variant="ghost" size="xs" onClick={() => setEditing(c)}>تعديل</Button>
              </span>
            </div>
            {editing?.id === c.id ? (
              <div className="mt-2 space-y-2">
                <Input value={editing.title_ar} aria-label="عنوان البند"
                  onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} />
                <Textarea rows={3} value={editing.body_ar} aria-label="نص البند"
                  onChange={(e) => setEditing({ ...editing, body_ar: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="xs" loading={save.isPending}
                    onClick={async () => {
                      await save.mutateAsync({ id: editing.id, title_ar: editing.title_ar, body_ar: editing.body_ar });
                      setEditing(null);
                    }}>حفظ</Button>
                  <Button variant="ghost" size="xs" onClick={() => setEditing(null)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 line-clamp-2 text-xs text-gray-medium">{c.body_ar}</p>
            )}
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <p className="mb-2 text-sm font-bold text-gray-light">بند جديد</p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input label="العنوان" value={draft.title_ar} className="flex-1"
              onChange={(e) => setDraft((d) => ({ ...d, title_ar: e.target.value }))} />
            <div className="w-40">
              <Input label="التصنيف" value={draft.category} list="clause-cats"
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
              <datalist id="clause-cats">
                {Object.keys(CAT).map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>
          </div>
          <Textarea label="النص" rows={3} value={draft.body_ar}
            onChange={(e) => setDraft((d) => ({ ...d, body_ar: e.target.value }))} />
          <Button size="sm" loading={save.isPending}
            disabled={draft.title_ar.trim().length < 2 || draft.body_ar.trim().length < 10}
            onClick={async () => {
              await save.mutateAsync(draft);
              setDraft({ title_ar: '', body_ar: '', category: 'commercial' });
            }}>
            + أضف البند
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------- checklists */

function ChecklistsTab() {
  const key = ['settings-checklists'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('pause_checklists').select('*').order('kind').order('key');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);

  const save = useAppMutation(
    async (checklistKey: string) => {
      const clean = items.map((t) => t.trim()).filter(Boolean);
      if (clean.length === 0 || clean.length > 9) {
        throw new Error('١–٩ بنود قاتلة فقط — القائمة الطويلة لا تُقرأ (Gawande)');
      }
      const { error } = await getSupabase().from('pause_checklists')
        .update({ items: clean.map((text) => ({ text })) as never })
        .eq('key', checklistKey);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'حُدّثت القائمة — تسري على الفحوصات القادمة' }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;
  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-xs text-gray-medium">
        القوائم وثائق حية — تُحدَّث بعد كل حادث. ٩ بنود قاتلة كحد أقصى.
      </p>
      {data.map((cl) => (
        <Card key={cl.key} className="p-3 text-sm">
          <div className="flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5 text-pulse-orange" aria-hidden />
            <b>{cl.name_ar}</b>
            <Badge variant="outline">{cl.kind === 'do_confirm' ? 'افعل ثم أكّد' : 'اقرأ ونفّذ'}</Badge>
            <Badge variant="outline">{(cl.items as { text: string }[]).length} بنود</Badge>
            <Button variant="ghost" size="xs" className="ms-auto"
              onClick={() => {
                if (editing === cl.key) { setEditing(null); return; }
                setEditing(cl.key);
                setItems((cl.items as { text: string }[]).map((i) => i.text));
              }}>
              {editing === cl.key ? 'إغلاق' : 'تعديل'}
            </Button>
          </div>
          {editing === cl.key && (
            <div className="mt-2 space-y-1.5">
              {items.map((t, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={t} aria-label={`البند ${i + 1}`} className="flex-1"
                    onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button variant="ghost" size="xs" aria-label="حذف البند"
                    onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>حذف</Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={items.length >= 9}
                  onClick={() => setItems((p) => [...p, ''])}>+ بند</Button>
                <Button size="xs" loading={save.isPending}
                  onClick={async () => {
                    await save.mutateAsync(cl.key);
                    setEditing(null);
                  }}>حفظ</Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- rules */

function RulesTab() {
  const key = ['settings-rules'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('allocation_rules').select('*').order('sort');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [draft, setDraft] = useState<Record<string, { cap: string; tap: string }>>({});

  const save = useAppMutation(
    async () => {
      const supabase = getSupabase();
      const rows = (data ?? []).map((r) => ({
        bucket: r.bucket,
        cap: Number(draft[r.bucket]?.cap ?? r.cap_pct),
        tap: Number(draft[r.bucket]?.tap ?? r.tap_pct),
      }));
      const capSum = rows.reduce((s, r) => s + r.cap, 0);
      if (Math.round(capSum * 100) / 100 !== 100) {
        throw new Error(`مجموع النسب الحالية ${capSum}٪ — يجب أن يساوي ١٠٠٪ تماماً`);
      }
      for (const r of rows) {
        const { error } = await supabase.from('allocation_rules')
          .update({ cap_pct: r.cap, tap_pct: r.tap }).eq('bucket', r.bucket);
        if (error) throw new Error(error.message);
      }
    },
    { invalidate: [key], successMessage: 'حُفظت النسب — تسري من التوزيع القادم' }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-medium">
        قرار شركاء (docs/10 Part 5): النِّسب الحالية (CAP) تُطبَّق في كل توزيع؛
        المستهدفة (TAP) وجهة ربع سنوية بخطوة ١–٢٪. المجموع الحالي يجب أن يساوي ١٠٠٪.
      </p>
      <div className="space-y-1.5">
        {data.map((r) => (
          <Card key={r.bucket} className="flex items-center gap-3 p-2.5 text-sm">
            <span className="flex-1">{r.name_ar}</span>
            <Input aria-label={`النسبة الحالية ${r.name_ar}`} type="number" dir="ltr" className="w-20"
              value={draft[r.bucket]?.cap ?? String(r.cap_pct)}
              onChange={(e) => setDraft((d) => ({
                ...d, [r.bucket]: { cap: e.target.value, tap: d[r.bucket]?.tap ?? String(r.tap_pct) },
              }))} />
            <span className="text-gray-medium">←</span>
            <Input aria-label={`النسبة المستهدفة ${r.name_ar}`} type="number" dir="ltr" className="w-20"
              value={draft[r.bucket]?.tap ?? String(r.tap_pct)}
              onChange={(e) => setDraft((d) => ({
                ...d, [r.bucket]: { cap: d[r.bucket]?.cap ?? String(r.cap_pct), tap: e.target.value },
              }))} />
          </Card>
        ))}
      </div>
      <Button size="sm" loading={save.isPending} disabled={Object.keys(draft).length === 0}
        onClick={() => save.mutate(undefined as never)}>
        حفظ النسب
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------- services */

function ServicesTab() {
  const key = ['settings-services'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = getSupabase();
      const [services, categories] = await Promise.all([
        supabase.from('services_catalog').select('*').order('sort'),
        supabase.from('service_categories').select('*').order('sort'),
      ]);
      if (services.error) throw new Error(services.error.message);
      return { services: services.data ?? [], categories: categories.data ?? [] };
    },
  });
  const [draft, setDraft] = useState({ name_ar: '', name_en: '', category_id: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('services_catalog')
        .update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const add = useAppMutation(
    async () => {
      const slug = draft.name_en.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const { error } = await getSupabase().from('services_catalog').insert({
        category_id: draft.category_id,
        slug,
        name_ar: draft.name_ar.trim(),
        name_en: draft.name_en.trim(),
        sort: 99,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'أُضيفت الخدمة — قيّمها TVR في الجلسة الربعية' }
  );

  if (isLoading || !data) return <SkeletonList rows={6} />;
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-medium">
        إيقاف الخدمة يخفيها من بناء النطاقات دون كسر السجلات القديمة. الحذف غير
        متاح عمداً — التاريخ لا يُمحى.
      </p>
      {data.categories.map((cat) => (
        <div key={cat.id}>
          <h3 className="mb-1.5 text-sm font-bold text-pulse-orange">{cat.name_ar}</h3>
          <div className="space-y-1">
            {data.services.filter((s) => s.category_id === cat.id).map((s) => (
              <Card key={s.id} className="flex items-center gap-3 p-2 text-sm">
                {editingId === s.id ? (
                  <>
                    <Input value={editName} aria-label="اسم الخدمة" className="w-56"
                      onChange={(e) => setEditName(e.target.value)} />
                    <Button size="xs" loading={patch.isPending}
                      disabled={editName.trim().length < 2}
                      onClick={async () => {
                        await patch.mutateAsync({ id: s.id, p: { name_ar: editName.trim() } });
                        setEditingId(null);
                      }}>حفظ</Button>
                    <Button variant="ghost" size="xs" onClick={() => setEditingId(null)}>إلغاء</Button>
                  </>
                ) : (
                  <>
                    <span className={s.active ? '' : 'text-gray-medium line-through'}>{s.name_ar}</span>
                    <span dir="ltr" className="text-xs text-gray-medium">{s.slug}</span>
                    <span className="ms-auto flex items-center gap-2">
                      <Button variant="ghost" size="xs" aria-label={`تعديل ${s.name_ar}`}
                        onClick={() => { setEditingId(s.id); setEditName(s.name_ar); }}>
                        تعديل
                      </Button>
                      <Switch label={s.active ? 'نشطة' : 'موقوفة'} checked={s.active}
                        onChange={(v) => patch.mutate({ id: s.id, p: { active: v } })} />
                    </span>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
      <Card className="p-4">
        <p className="mb-2 text-sm font-bold text-gray-light">خدمة جديدة</p>
        <div className="flex flex-wrap items-end gap-2">
          <Input label="الاسم عربي" value={draft.name_ar}
            onChange={(e) => setDraft((d) => ({ ...d, name_ar: e.target.value }))} />
          <Input label="الاسم إنجليزي" dir="ltr" value={draft.name_en}
            onChange={(e) => setDraft((d) => ({ ...d, name_en: e.target.value }))} />
          <Select label="الفئة" value={draft.category_id}
            onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))}>
            <option value="">— اختر —</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </Select>
          <Button size="sm" className="mb-0.5" loading={add.isPending}
            disabled={draft.name_ar.trim().length < 2 || draft.name_en.trim().length < 2 || !draft.category_id}
            onClick={async () => {
              await add.mutateAsync(undefined as never);
              setDraft({ name_ar: '', name_en: '', category_id: '' });
            }}>
            + أضف
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------- task templates */

const EMT_LABELS: Record<string, string> = {
  entrepreneur: 'ريادي', manager: 'إداري', technician: 'تنفيذي',
};

function TaskTemplatesTab() {
  const key = ['settings-task-templates'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const supabase = getSupabase();
      const [templates, stages, playbooks, checklists] = await Promise.all([
        supabase.from('task_templates').select('*').order('sort'),
        supabase.from('playbook_stages').select('id, name_ar, playbook_id'),
        supabase.from('playbooks').select('id, name_ar, slug').order('slug'),
        supabase.from('pause_checklists').select('key, name_ar'),
      ]);
      if (templates.error) throw new Error(templates.error.message);
      return {
        templates: templates.data ?? [],
        stages: stages.data ?? [],
        playbooks: playbooks.data ?? [],
        checklists: checklists.data ?? [],
      };
    },
  });
  const [playbookFilter, setPlaybookFilter] = useState('');

  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('task_templates')
        .update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={6} />;
  const stageById = new Map(data.stages.map((s) => [s.id, s]));
  const visible = data.templates.filter((t) => {
    if (!playbookFilter) return true;
    return stageById.get(t.stage_id ?? '')?.playbook_id === playbookFilter;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={playbookFilter} aria-label="تصفية بالدليل"
          onChange={(e) => setPlaybookFilter(e.target.value)} className="w-56">
          <option value="">كل الأدلة</option>
          {data.playbooks.map((p) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
        </Select>
        <p className="text-xs text-gray-medium">
          التصنيف (ريادي/إداري/تنفيذي) يغذي مقياس فخ المنفّذ؛ قائمة الفحص تجعل
          المهمة بوابة إطلاق لا تُنجز بدون اجتيازها.
        </p>
      </div>
      <div className="space-y-1">
        {visible.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center gap-2 p-2 text-sm">
            <span className="min-w-40 flex-1">{t.title_ar}</span>
            <span className="text-xs text-gray-medium">
              {stageById.get(t.stage_id ?? '')?.name_ar ?? '—'}
            </span>
            <Select value={t.emt_class} aria-label={`تصنيف ${t.title_ar}`}
              onChange={(e) => patch.mutate({ id: t.id, p: { emt_class: e.target.value } })}
              className="w-28 py-1 text-xs">
              {Object.entries(EMT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={t.checklist_key ?? ''} aria-label={`قائمة فحص ${t.title_ar}`}
              onChange={(e) => patch.mutate({ id: t.id, p: { checklist_key: e.target.value || null } })}
              className="w-44 py-1 text-xs">
              <option value="">بلا قائمة فحص</option>
              {data.checklists.map((c) => <option key={c.key} value={c.key}>{c.name_ar}</option>)}
            </Select>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ templates */

function TemplatesTab() {
  const key = ['settings-templates'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notification_templates').select('*').order('key');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const patch = useAppMutation(
    async ({ t, p }: { t: Tables<'notification_templates'>; p: Record<string, boolean> }) => {
      const { error } = await getSupabase().from('notification_templates')
        .update(p as never).eq('key', t.key).eq('channel', t.channel).eq('locale', t.locale);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={5} />;
  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-xs text-gray-medium">
        قاعدة docs/06: لا يُرسل قالب غير معتمد. الإيقاف يجمّد الإرسال دون حذف القالب.
      </p>
      {data.map((t) => (
        <Card key={`${t.key}-${t.channel}-${t.locale}`} className="flex flex-wrap items-center gap-3 p-2.5 text-sm">
          <b dir="ltr" className="text-xs">{t.key}</b>
          <Badge variant="outline">{t.channel}</Badge>
          <span className="min-w-0 flex-1 truncate text-xs text-gray-medium">{t.subject ?? t.body}</span>
          <Switch label={t.approved ? 'معتمد' : 'غير معتمد'} checked={t.approved}
            onChange={(v) => patch.mutate({ t, p: { approved: v } })} />
          <Switch label={t.active ? 'نشط' : 'موقوف'} checked={t.active}
            onChange={(v) => patch.mutate({ t, p: { active: v } })} />
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Hint,
  Input,
  Modal,
  SkeletonList,
} from '@agma/ui';
import { PiggyBank, Vault as VaultIcon } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { fmtNum as fmt } from '../lib/format';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';

/**
 * Profit First (docs/10 §2.4): the 10th/25th ritual, CAP→TAP path, Vault
 * months, quarterly distribution event. The system computes; humans transfer.
 */
export default function AllocationsTab() {
  const me = useProfile();
  const allocKey = ['allocations'];
  const { data, isLoading } = useQuery({
    queryKey: allocKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [rules, allocations, distributions, expenses] = await Promise.all([
        supabase.from('allocation_rules').select('*').order('sort'),
        supabase.from('allocations').select('*').order('run_date', { ascending: false }).limit(12),
        supabase.from('profit_distributions').select('*').order('distributed_on', { ascending: false }),
        supabase.from('expenses').select('amount, expense_date')
          .gte('expense_date', new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)),
      ]);
      if (rules.error) throw new Error(rules.error.message);
      return {
        rules: rules.data ?? [],
        allocations: allocations.data ?? [],
        distributions: distributions.data ?? [],
        expenses: expenses.data ?? [],
      };
    },
  });

  const confirm = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('allocations')
        .update({ status: 'confirmed', confirmed_by: me.id, confirmed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [allocKey], successMessage: 'تم توثيق التوزيع — الاحتياطي يكبر' }
  );

  const [confirming, setConfirming] = useState<string | null>(null);
  const [showDistribute, setShowDistribute] = useState(false);

  if (isLoading || !data) return <SkeletonList rows={4} />;

  // Vault math (mirrors compute_scorecard_extras): confirmed profit-bucket
  // inflows minus what was actually paid out; retained amounts stay in reserve.
  const profitReserve = data.allocations
    .filter((a) => a.status === 'confirmed')
    .flatMap((a) => (a.rows as { bucket: string; amount: number }[]))
    .filter((r) => r.bucket === 'profit')
    .reduce((s, r) => s + Number(r.amount), 0)
    - data.distributions.reduce((s, d) => s + Number(d.amount_distributed), 0);
  const opexMonthly = data.expenses.reduce((s, e) => s + Number(e.amount), 0) / 3;
  const vaultMonths = opexMonthly > 0 ? profitReserve / opexMonthly : 0;
  const pending = data.allocations.find((a) => a.status === 'pending');

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <VaultIcon className="mx-auto h-5 w-5 text-pulse-orange" aria-hidden />
          <p className="mt-1 text-2xl font-black" dir="ltr">{vaultMonths.toFixed(1)}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-gray-medium">كم شهراً يغطي الاحتياطي مصاريفنا؟ (الهدف ٣ أشهر) <Hint text="الصيغة: الاحتياطي المتجمع ÷ متوسط المصاريف الشهرية لآخر ٩٠ يوماً. يرتفع بتأكيد الجولات وينخفض بتوزيع الأرباح وارتفاع المصاريف." /></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="mt-1 text-2xl font-black" dir="ltr">SAR {fmt(Math.max(0, profitReserve))}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-gray-medium">احتياطي الربح المتجمّع <Hint text="مجموع بند «الربح» من كل الجولات المؤكدة، ناقص ما وُزّع على الشريكين. يكبر مع كل جولة تؤكدانها." /></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="mt-1 text-2xl font-black" dir="ltr">SAR {fmt(Math.round(opexMonthly))}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-gray-medium">متوسط مصاريفنا الشهرية (آخر ٩٠ يوماً) <Hint text="مجموع المصروفات المسجلة في آخر ٩٠ يوماً ÷ ٣. مصدره: المالية ← المصروفات — مصروف غير مسجّل يعني رقماً مضللاً هنا." /></p>
        </Card>
      </div>

      {pending && (
        <Card className="border-pulse-orange/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-pulse-orange" aria-hidden />
            <h3 className="font-bold">جولة توزيع الدخل — {pending.run_date}</h3>
            <Badge variant="accent">بانتظار تحويل المبالغ</Badge>
            <span dir="ltr" className="ms-auto font-black">SAR {fmt(Number(pending.income))}</span>
          </div>
          <div className="space-y-1 text-sm">
            {(pending.rows as { name_ar: string; pct: number; amount: number }[]).map((r, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-light">{r.name_ar} ({r.pct}%)</span>
                <b dir="ltr">SAR {fmt(Number(r.amount))}</b>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-medium">
            حوّل المبالغ أدناه بين الحسابات كما هي، بترتيب قائمة «جولة التوزيع» في
            قوائم الفحص، ثم اضغط تأكيد — أموال محافظ إعلانات العملاء لا تدخل
            هذه الحسبة أبداً لأنها ليست دخلاً لنا.
          </p>
          {me.role === 'admin' ? (
            <Button size="sm" className="mt-2" onClick={() => setConfirming(pending.id)}>
              تمّت التحويلات — تأكيد
            </Button>
          ) : (
            <p className="mt-2 text-xs text-gray-medium">التأكيد للشركاء فقط (التحويلات البنكية بيدهم).</p>
          )}
        </Card>
      )}

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 font-bold text-gray-light">نسب التوزيع: النسبة المطبّقة الآن ← النسبة التي نتدرج إليها <Hint text="تُعدَّل من: الإعدادات ← نسب التوزيع (للشركاء). مجموع النسب المطبّقة يجب أن يساوي ١٠٠٪." /></h3>
        <div className="space-y-1.5">
          {data.rules.map((r) => (
            <Card key={r.bucket} className="flex items-center gap-3 p-2.5 text-sm">
              <span className="flex-1">{r.name_ar}</span>
              <b dir="ltr">{r.cap_pct}%</b>
              <span className="text-gray-medium">←</span>
              <b dir="ltr" className="text-pulse-orange">{r.tap_pct}%</b>
            </Card>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-medium">
          نرفع النسب خطوة ١–٢٪ كل ثلاثة أشهر حتى نصل للهدف — تعديلها من الإعدادات (قرار شركاء).
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="font-bold text-gray-light">سجل الجولات السابقة</h3>
          {me.role === 'admin' && (
            <Button variant="outline" size="xs" onClick={() => setShowDistribute(true)}>
              توزيع أرباح ربعي
            </Button>
          )}
        </div>
        {data.allocations.length === 0 ? (
          <EmptyState icon={<PiggyBank className="h-8 w-8" aria-hidden />}
            title="لا توزيعات بعد"
            hint="تتولّد الجولة تلقائياً يومي ١٠ و٢٥ من كل شهر من دخل الفترة." />
        ) : (
          <div className="space-y-1.5">
            {data.allocations.map((a) => (
              <Card key={a.id} className="flex items-center gap-3 p-2.5 text-sm">
                <span dir="ltr">{a.run_date}</span>
                <b dir="ltr">SAR {fmt(Number(a.income))}</b>
                <Badge variant={a.status === 'confirmed' ? 'accent' : 'outline'}>
                  {a.status === 'confirmed' ? 'موثّق' : a.status === 'pending' ? 'معلّق' : 'متجاوز'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!confirming} onClose={() => setConfirming(null)}
        title="تأكيد جولة التوزيع"
        message="هل حوّلت المبالغ فعلياً بين الحسابات؟ التأكيد يُسجَّل باسمك ويُحدّث مؤشر «التوزيع في موعده»."
        confirmLabel="نُفّذت — وثّق"
        onConfirm={async () => {
          if (confirming) await confirm.mutateAsync(confirming);
        }} />
      <DistributeModal open={showDistribute} onClose={() => setShowDistribute(false)}
        reserve={Math.max(0, profitReserve)} allocKey={allocKey} />
    </div>
  );
}

function DistributeModal({ open, onClose, reserve, allocKey }:
  { open: boolean; onClose: () => void; reserve: number; allocKey: readonly string[] }) {
  const [amount, setAmount] = useState(0);
  const half = Math.round(reserve / 2);

  const distribute = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('profit_distributions').insert({
        amount_distributed: amount,
        amount_retained: Math.max(0, reserve - amount),
        note: 'التوزيع الربعي (٥٠٪ يوزَّع، ٥٠٪ يُستبقى — Profit First)',
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [allocKey], successMessage: 'وُزّعت الأرباح ووُثّقت — استحقّها الشريكان' }
  );

  return (
    <Modal open={open} onClose={onClose} title="التوزيع الربعي للأرباح">
      <div className="space-y-3">
        <p className="text-sm text-gray-light">
          الاحتياطي المتاح للتوزيع: <b dir="ltr">SAR {fmt(reserve)}</b> — قاعدة الكتاب:
          يوزَّع ٥٠٪ مكافأة للشريكين ويبقى ٥٠٪ يقوّي الاحتياطي.
        </p>
        <div className="flex items-end gap-2">
          <Input label="المبلغ الموزَّع" type="number" dir="ltr" value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))} />
          <Button variant="outline" size="xs" className="mb-1"
            onClick={() => setAmount(half)}>
            ٥٠٪ = {fmt(half)}
          </Button>
        </div>
        <Button size="sm" className="w-full" loading={distribute.isPending}
          disabled={amount <= 0 || amount > reserve}
          onClick={async () => {
            await distribute.mutateAsync(undefined as never);
            onClose();
          }}>
          وزّع ووثّق
        </Button>
      </div>
    </Modal>
  );
}

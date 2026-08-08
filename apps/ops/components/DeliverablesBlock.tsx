'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, Hint, Input, SkeletonList, Textarea, useToast,
} from '@agma/ui';
import { ImagePlus, MapPin, Send } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * المخرجات والاعتمادات (طلب المالك — WOW): الفريق يرفع إصدارات صورة، يرسلها
 * للعميل، ويرى تعليقاته المثبتة على النقاط وقراره. عارض الدبابيس مشترك مع
 * البوابة (PinViewer).
 */

export const DLV_STATUS: Record<Enums<'deliverable_status'>, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  draft: { label: 'مسودة داخلية', variant: 'neutral' },
  pending_client: { label: 'بانتظار العميل', variant: 'outline' },
  changes_requested: { label: 'طلب تعديلات', variant: 'outline' },
  approved: { label: 'معتمد ✓', variant: 'accent' },
};

/** صورة الإصدار + دبابيس التعليقات؛ onPin للعميل (إضافة)، بدونها عرض فقط. */
export function PinViewer({ path, comments, onPin }: {
  path: string;
  comments: Tables<'deliverable_comments'>[];
  onPin?: (x: number, y: number) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getSupabase().storage.from('deliverables').createSignedUrl(path, 600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);

  if (!url) return <div className="h-48 animate-pulse rounded-sm bg-gray-dark/40" />;
  return (
    <div className="relative inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="المخرج" className="max-h-[480px] w-auto max-w-full rounded-sm bg-white"
        onClick={(e) => {
          if (!onPin) return;
          const r = e.currentTarget.getBoundingClientRect();
          onPin((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        }}
        style={onPin ? { cursor: 'crosshair' } : undefined} />
      {comments.filter((c) => c.pin_x != null && c.pin_y != null).map((c, i) => (
        <span key={c.id}
          className="absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-pulse-orange text-xs font-black text-void shadow"
          style={{ left: `${Number(c.pin_x) * 100}%`, top: `${Number(c.pin_y) * 100}%` }}
          title={c.body}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}

export default function DeliverablesBlock({ projectId, clientId }: {
  projectId: string; clientId: string;
}) {
  const key = ['deliverables', projectId];
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const { data: dlvs, error } = await s.from('deliverables')
        .select('*').eq('project_id', projectId).order('created_at');
      if (error) throw new Error(error.message);
      const ids = (dlvs ?? []).map((d) => d.id);
      const [versions, comments] = await Promise.all([
        ids.length
          ? s.from('deliverable_versions').select('*').in('deliverable_id', ids)
              .order('version_number')
          : Promise.resolve({ data: [] as Tables<'deliverable_versions'>[] }),
        s.from('deliverable_comments').select('*'),
      ]);
      return {
        dlvs: dlvs ?? [],
        versions: versions.data ?? [],
        comments: (comments as { data: Tables<'deliverable_comments'>[] }).data ?? [],
      };
    },
  });
  const [title, setTitle] = useState('');
  const [openDlv, setOpenDlv] = useState<string | null>(null);

  const create = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('deliverables').insert({
        project_id: projectId, client_id: clientId, title: title.trim(),
      });
      if (error) throw new Error(error.message);
      setTitle('');
    },
    { invalidate: [key], successMessage: 'أُنشئ المخرج — ارفع أول إصدار' }
  );

  const upload = useAppMutation(
    async ({ dlvId, file, nextNum }: { dlvId: string; file: File; nextNum: number }) => {
      const s = getSupabase();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${clientId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await s.storage.from('deliverables')
        .upload(path, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { error } = await s.from('deliverable_versions').insert({
        deliverable_id: dlvId, version_number: nextNum, file_path: path,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'رُفع الإصدار' }
  );

  const send = useAppMutation(
    async (dlvId: string) => {
      const { error } = await getSupabase().from('deliverables')
        .update({ status: 'pending_client' }).eq('id', dlvId);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'عُرض على العميل في بوابته — سيُشعر فوراً' }
  );

  if (isLoading || !data) return <SkeletonList rows={2} />;

  return (
    <Card className="mt-4 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
        <ImagePlus className="h-4 w-4 text-pulse-orange" aria-hidden />
        المخرجات والاعتمادات
        <Hint text="ارفع التصميم إصداراً مرقّماً وأرسله — العميل في بوابته يضغط على أي نقطة من الصورة ليعلّق عليها بالضبط (📍) ثم يعتمد أو يطلب تعديلات بملاحظة إلزامية. كل إصدار وقراره محفوظان." />
      </p>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Input label="مخرج جديد (مثال: الشعار النهائي)" className="w-64" value={title}
          onChange={(e) => setTitle(e.target.value)} />
        <Button size="sm" loading={create.isPending} disabled={title.trim().length < 3}
          onClick={() => create.mutate(undefined as never)}>
          + أنشئ
        </Button>
      </div>

      <div className="space-y-2">
        {data.dlvs.map((d) => {
          const vers = data.versions.filter((v) => v.deliverable_id === d.id);
          const latest = vers[vers.length - 1];
          const st = DLV_STATUS[d.status];
          const latestComments = latest
            ? data.comments.filter((c) => c.version_id === latest.id) : [];
          return (
            <div key={d.id} className="rounded-sm border border-gray-dark p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{d.title}</span>
                {latest && <Badge variant="outline">V{latest.version_number}</Badge>}
                <Badge variant={st.variant}>{st.label}</Badge>
                {latest?.decision_note && (
                  <span className="text-xs text-pulse-orange">«{latest.decision_note}»</span>
                )}
                <span className="ms-auto flex items-center gap-2">
                  <label className="cursor-pointer text-xs text-gray-light hover:text-pulse-orange">
                    + إصدار
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 10 * 1024 * 1024) { toast.error('الصورة تتجاوز ١٠MB'); return; }
                        upload.mutate({ dlvId: d.id, file: f,
                          nextNum: (latest?.version_number ?? 0) + 1 });
                        e.target.value = '';
                      }} />
                  </label>
                  {latest && d.status !== 'pending_client' && d.status !== 'approved' && (
                    <Button variant="outline" size="xs" loading={send.isPending}
                      onClick={() => send.mutate(d.id)}>
                      <Send className="h-3 w-3" aria-hidden /> اعرضه على العميل
                    </Button>
                  )}
                  <Button variant="ghost" size="xs"
                    onClick={() => setOpenDlv(openDlv === d.id ? null : d.id)}>
                    {openDlv === d.id ? 'إغلاق' : 'عرض'}
                  </Button>
                </span>
              </div>
              {openDlv === d.id && latest && (
                <div className="mt-3 space-y-2">
                  <PinViewer path={latest.file_path} comments={latestComments} />
                  {latestComments.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {latestComments.map((c, i) => (
                        <li key={c.id} className="flex items-start gap-1.5 text-gray-light">
                          {c.pin_x != null
                            ? <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-pulse-orange" aria-hidden />
                            : <span className="font-mono text-pulse-orange">/</span>}
                          <span><b className="text-pulse-orange">{c.pin_x != null ? `${i + 1}. ` : ''}</b>{c.body}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {data.dlvs.length === 0 && (
          <p className="text-xs text-gray-medium">لا مخرجات بعد — أنشئ الأول وارفع تصميمه.</p>
        )}
      </div>
    </Card>
  );
}

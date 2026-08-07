'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Modal, Spinner, useToast } from '@agma/ui';
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

type Entity = 'task' | 'document' | 'expense' | 'client' | 'project';

const MAX_BYTES = 20 * 1024 * 1024;

/** Storage keys must be ASCII-safe; the original name lives in metadata. */
const safeKey = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(-80);

const fmtSize = (b: number | null) => {
  if (!b) return '';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export function useAttachments(entity: Entity, entityId: string, enabled = true) {
  return useQuery({
    queryKey: ['attachments', entity, entityId],
    enabled,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('attachments')
        .select('*, profiles(full_name)')
        .eq('entity', entity).eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Inline attachments list + upload (private bucket, signed-URL downloads).
 * The one file surface used by tasks, documents, expenses, and clients.
 */
export default function AttachmentsBlock({ entity, entityId, hint }: {
  entity: Entity;
  entityId: string;
  hint?: string;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const key = ['attachments', entity, entityId];
  const { data: files, isLoading, refetch } = useAttachments(entity, entityId);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error('الحد الأقصى ٢٠ ميغابايت');
      return;
    }
    setUploading(true);
    try {
      const supabase = getSupabase();
      const path = `${entity}/${entityId}/${Date.now()}-${safeKey(file.name)}`;
      const { error: upErr } = await supabase.storage.from('attachments')
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw new Error(upErr.message);
      const { error: metaErr } = await supabase.from('attachments').insert({
        entity, entity_id: entityId, path,
        filename: file.name, mime: file.type || null, size_bytes: file.size,
      });
      if (metaErr) throw new Error(metaErr.message);
      toast.success('رُفع الملف');
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const remove = useAppMutation(
    async ({ id, path }: { id: string; path: string }) => {
      const supabase = getSupabase();
      const { error: sErr } = await supabase.storage.from('attachments').remove([path]);
      if (sErr) throw new Error(sErr.message);
      const { error } = await supabase.from('attachments').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'حُذف الملف (موثّق في التدقيق)' }
  );

  async function open(path: string) {
    const { data, error } = await getSupabase().storage.from('attachments')
      .createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error('تعذر فتح الملف');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="space-y-1.5">
      <input ref={fileRef} type="file" hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="xs" loading={uploading}
          onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" aria-hidden /> رفع ملف
        </Button>
        {hint && <span className="text-xs text-gray-medium">{hint}</span>}
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        (files ?? []).map((f) => (
          <div key={f.id} className="group flex items-center gap-2 text-sm text-gray-light">
            <FileText className="h-3.5 w-3.5 shrink-0 text-pulse-orange" aria-hidden />
            <button type="button" onClick={() => open(f.path)}
              className="truncate underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
              {f.filename}
            </button>
            <span className="text-xs text-gray-medium" dir="ltr">{fmtSize(f.size_bytes)}</span>
            <span className="text-xs text-gray-medium">
              {(f as { profiles?: { full_name: string | null } | null }).profiles?.full_name ?? ''}
            </span>
            <Button variant="ghost" size="xs" aria-label={`حذف ${f.filename}`}
              className="ms-auto opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
              onClick={() => remove.mutate({ id: f.id, path: f.path })}>
              <Trash2 className="h-3 w-3" aria-hidden />
            </Button>
          </div>
        ))
      )}
      {!isLoading && (files ?? []).length === 0 && (
        <p className="text-xs text-gray-medium">لا ملفات بعد</p>
      )}
    </div>
  );
}

/** Paperclip trigger + count that opens the block in a modal (for rows). */
export function AttachmentsButton({ entity, entityId, title, hint }: {
  entity: Entity;
  entityId: string;
  title: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: files } = useAttachments(entity, entityId);
  const count = files?.length ?? 0;
  return (
    <>
      <Button variant="ghost" size="xs" aria-label={`مرفقات ${title}`}
        onClick={() => setOpen(true)}>
        <Paperclip className="h-3.5 w-3.5" aria-hidden />
        {count > 0 && <Badge variant="outline">{count}</Badge>}
      </Button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title={`مرفقات — ${title}`}>
          <AttachmentsBlock entity={entity} entityId={entityId} hint={hint} />
        </Modal>
      )}
    </>
  );
}

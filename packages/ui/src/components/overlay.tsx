'use client';

import * as React from 'react';
import { cn } from '../cn';
import { Button } from './Button';
import { Spinner } from './primitives';

/* ------------------------------------------------------------------ Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'max-h-[85vh] w-full overflow-y-auto rounded-sm border border-gray-dark bg-pure-ink p-5 shadow-2xl outline-none',
          wide ? 'max-w-3xl' : 'max-w-md'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-sm px-2 py-1 text-gray-medium hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- ConfirmDialog */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      <p className="mb-5 text-sm leading-relaxed text-gray-light">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="px-4 py-1.5 text-sm" onClick={onClose} disabled={busy}>
          إلغاء
        </Button>
        <Button
          variant={danger ? 'primary' : 'outline'}
          className="px-4 py-1.5 text-sm"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? <Spinner className="border-snow border-t-transparent" /> : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Toast */
type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = React.createContext<{
  push: (kind: ToastKind, message: string) => void;
} | null>(null);

let toastSeq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((kind: ToastKind, message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, kind === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 start-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 rounded-sm border px-4 py-2.5 text-sm shadow-xl backdrop-blur',
              t.kind === 'error' && 'border-pulse-orange/60 bg-pulse-orange/15 text-snow',
              t.kind === 'success' && 'border-gray-dark bg-gray-dark/90 text-snow',
              t.kind === 'info' && 'border-gray-dark bg-pure-ink/90 text-gray-light'
            )}
          >
            <span aria-hidden>
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '⚠' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires <ToastProvider>');
  return {
    success: (m: string) => ctx.push('success', m),
    error: (m: string) => ctx.push('error', m),
    info: (m: string) => ctx.push('info', m),
  };
}

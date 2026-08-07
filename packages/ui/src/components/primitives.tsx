'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '../cn';

/* ---------------------------------------------------------------- Spinner */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="جاري التحميل"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-medium border-t-pulse-orange',
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ Badge */
const badgeStyles = {
  neutral: 'bg-gray-dark text-gray-light',
  accent: 'bg-pulse-orange/20 text-pulse-orange',
  outline: 'border border-gray-medium/40 text-gray-light',
} as const;

export function Badge({
  variant = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeStyles }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-sm bg-gray-dark/60', className)}
    />
  );
}

/** Convenience: a stack of skeleton rows for list loading states. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-label="جاري التحميل" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- EmptyState */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-gray-dark px-6 py-12 text-center">
      {icon && <div className="text-3xl opacity-60">{icon}</div>}
      <p className="font-bold text-gray-light">{title}</p>
      {hint && <p className="max-w-sm text-sm text-gray-medium">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- Hint */

/**
 * أيقونة توضيح صغيرة: تشرح المعنى المقصود، مصدر الرقم، أو مكان التعديل.
 * Hover opens it, click toggles (touch), Escape/blur/scroll closes.
 * The bubble renders in a document-level portal with fixed positioning so
 * NO table, overflow container, or header can ever clip or cover it.
 */
export function Hint({ text, wide }: { text: string; wide?: boolean }) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const show = () => setRect(btnRef.current?.getBoundingClientRect() ?? null);
  const hide = () => setRect(null);

  React.useEffect(() => {
    if (!rect) return;
    const close = () => hide();
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [rect]);

  const width = wide ? 300 : 232;
  let style: React.CSSProperties | undefined;
  if (rect && typeof window !== 'undefined') {
    const placeBelow = rect.top < 150;
    style = {
      position: 'fixed',
      width,
      left: Math.min(
        Math.max(8, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - 8
      ),
      zIndex: 9999,
      ...(placeBelow
        ? { top: rect.bottom + 6 }
        : { top: rect.top - 6, transform: 'translateY(-100%)' }),
    };
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`توضيح: ${text.slice(0, 40)}`}
        aria-expanded={!!rect}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (rect) hide();
          else show();
        }}
        onBlur={hide}
        onKeyDown={(e) => e.key === 'Escape' && hide()}
        className="inline-flex rounded-full align-middle text-gray-medium transition-colors hover:text-pulse-orange focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      {rect &&
        ReactDOM.createPortal(
          <span role="tooltip" dir="rtl" style={style}
            className="rounded-sm border border-gray-dark bg-pure-ink p-2.5 text-start text-xs font-normal leading-relaxed text-gray-light shadow-xl">
            {text}
          </span>,
          document.body
        )}
    </>
  );
}

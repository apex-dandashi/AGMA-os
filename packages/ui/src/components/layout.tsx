'use client';

import * as React from 'react';
import { cn } from '../cn';

/* ------------------------------------------------------------------- Tabs */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="tablist"
      className="flex gap-1 overflow-x-auto border-b border-gray-dark [scrollbar-width:none]">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none',
            active === t.key
              ? 'border-pulse-orange font-bold text-pulse-orange'
              : 'border-transparent text-gray-light hover:text-snow'
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ms-1.5 text-xs text-gray-medium">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Table */
export function Table({
  head,
  children,
  className,
}: {
  head: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-sm border border-gray-dark', className)}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-dark/40 text-start">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-start text-xs font-bold text-gray-light">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-dark/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn('transition-colors hover:bg-gray-dark/20', props.className)}
    />
  );
}

export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn('px-3 py-2.5', props.className)} />;
}

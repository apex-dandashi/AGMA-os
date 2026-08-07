'use client';

import * as React from 'react';
import { cn } from '../cn';

/**
 * Form primitives. Shared field chrome: label above, error/hint below,
 * error state ties input border + message via aria-describedby.
 * All controls: visible focus ring, disabled styling, RTL-safe.
 */

const controlBase =
  'w-full rounded-sm border bg-transparent px-3 py-2 text-sm text-snow ' +
  'placeholder:text-gray-medium transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-orange/60 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const borderFor = (error?: boolean) =>
  error
    ? 'border-pulse-orange focus:border-pulse-orange'
    : 'border-gray-dark focus:border-pulse-orange';

interface FieldChrome {
  label?: string;
  error?: string;
  hint?: string;
}

let fieldSeq = 0;

export function FormField({
  label,
  error,
  hint,
  children,
  htmlFor,
  className,
}: FieldChrome & { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-light">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-pulse-orange">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-medium">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldChrome
>(({ label, error, hint, className, id, ...props }, ref) => {
  const autoId = React.useMemo(() => id ?? `fld-${++fieldSeq}`, [id]);
  const control = (
    <input
      ref={ref}
      id={autoId}
      aria-invalid={!!error}
      className={cn(controlBase, borderFor(!!error), className)}
      {...props}
    />
  );
  if (!label && !error && !hint) return control;
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={autoId}>
      {control}
    </FormField>
  );
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome
>(({ label, error, hint, className, id, ...props }, ref) => {
  const autoId = React.useMemo(() => id ?? `fld-${++fieldSeq}`, [id]);
  const control = (
    <textarea
      ref={ref}
      id={autoId}
      aria-invalid={!!error}
      className={cn(controlBase, borderFor(!!error), 'leading-relaxed', className)}
      {...props}
    />
  );
  if (!label && !error && !hint) return control;
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={autoId}>
      {control}
    </FormField>
  );
});
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldChrome
>(({ label, error, hint, className, id, children, ...props }, ref) => {
  const autoId = React.useMemo(() => id ?? `fld-${++fieldSeq}`, [id]);
  const control = (
    <select
      ref={ref}
      id={autoId}
      aria-invalid={!!error}
      className={cn(controlBase, borderFor(!!error), 'bg-pure-ink', className)}
      {...props}
    >
      {children}
    </select>
  );
  if (!label && !error && !hint) return control;
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={autoId}>
      {control}
    </FormField>
  );
});
Select.displayName = 'Select';

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-gray-light', props.disabled && 'cursor-not-allowed opacity-50', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[#F44D2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse-orange/60"
        {...props}
      />
      {label}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-gray-light', disabled && 'cursor-not-allowed opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none',
          checked ? 'bg-pulse-orange' : 'bg-gray-dark'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-snow transition-all',
            checked ? 'start-[1.125rem]' : 'start-0.5'
          )}
        />
      </button>
      {label}
    </label>
  );
}

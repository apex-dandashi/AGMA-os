'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';
import { Spinner } from './primitives';

/**
 * Button variants mirror the marketing site's .btn-* classes so every app
 * shares one look. RTL-safe; visible focus ring; loading state disables and
 * swaps content for a spinner while preserving width.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold text-center leading-normal tracking-normal transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-orange/60 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-pulse-orange text-snow rounded-sm hover:opacity-90 active:scale-95 shadow-lg shadow-pulse-orange/20',
        outline:
          'bg-transparent border border-pulse-orange text-pulse-orange rounded-full hover:bg-pulse-orange hover:text-white',
        secondary:
          'bg-gray-dark text-snow border border-gray-medium/30 rounded-sm hover:bg-gray-dark/80',
        ghost:
          'bg-transparent text-gray-light rounded-sm hover:bg-gray-dark/40 hover:text-snow',
      },
      size: {
        md: 'px-6 py-3',
        sm: 'px-4 py-1.5 text-sm',
        xs: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5 border-current border-t-transparent" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export { buttonVariants };

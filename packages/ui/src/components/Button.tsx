'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';

/**
 * Button variants mirror the marketing site's .btn-primary / .btn-outline /
 * .btn-secondary classes (apps/marketing/app/globals.css) so every app shares
 * one look. RTL-safe: no directional utilities.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center px-6 py-3 font-bold text-center leading-normal tracking-normal transition-all duration-300',
  {
    variants: {
      variant: {
        primary:
          'bg-pulse-orange text-snow rounded-sm hover:opacity-90 active:scale-95 shadow-lg shadow-pulse-orange/20',
        outline:
          'bg-transparent border border-pulse-orange text-pulse-orange rounded-full hover:bg-pulse-orange hover:text-white',
        secondary:
          'bg-gray-dark text-snow border border-gray-medium/30 rounded-sm hover:bg-gray-dark/80',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { buttonVariants };

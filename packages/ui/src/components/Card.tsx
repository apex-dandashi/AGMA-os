import * as React from 'react';
import { cn } from '../cn';

/**
 * Mirrors the marketing site's .geometric-card class
 * (apps/marketing/app/globals.css).
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-gray-dark/20 border border-gray-dark p-6 transition-all duration-300 hover:border-pulse-orange/50',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

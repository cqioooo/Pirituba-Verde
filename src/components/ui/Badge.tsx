import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-700 border-success-500/30',
  warning: 'bg-warning-50 text-warning-700 border-warning-500/30',
  danger: 'bg-danger-50 text-danger-700 border-danger-500/30',
  info: 'bg-info-50 text-info-700 border-info-500/30',
  neutral: 'bg-surface-100 text-surface-700 border-surface-300',
};

export function Badge({ variant = 'neutral', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium leading-tight',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

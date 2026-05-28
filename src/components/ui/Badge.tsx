import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-500 border-success-500/20',
  warning: 'bg-warning-50 text-warning-500 border-warning-500/20',
  danger: 'bg-danger-50 text-danger-500 border-danger-500/20',
  info: 'bg-info-50 text-info-500 border-info-500/20',
  neutral: 'bg-surface-100 text-surface-600 border-surface-300',
};

export function Badge({ variant = 'neutral', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

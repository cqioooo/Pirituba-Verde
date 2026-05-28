import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

const config: Record<AlertVariant, { bg: string; border: string; text: string; icon: ReactNode }> = {
  info: {
    bg: 'bg-info-50',
    border: 'border-info-500/20',
    text: 'text-info-500',
    icon: <Info className="w-5 h-5" />,
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-500/20',
    text: 'text-success-500',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-500/20',
    text: 'text-warning-500',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-danger-50',
    border: 'border-danger-500/20',
    text: 'text-danger-500',
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  const { bg, border, text, icon } = config[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border p-4',
        bg,
        border,
        className
      )}
      {...props}
    >
      <span className={cn('shrink-0 mt-0.5', text)} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        {title && (
          <p className={cn('text-sm font-semibold mb-1', text)}>{title}</p>
        )}
        <div className="text-sm text-surface-700">{children}</div>
      </div>
    </div>
  );
}

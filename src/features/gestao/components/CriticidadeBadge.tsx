import { cn } from '@/lib/utils';
import { CRITICIDADE_LABELS, CRITICIDADE_COLORS } from '@/types';
import type { CriticidadeClassificacao } from '@/types';

interface CriticidadeBadgeProps {
  criticidade: CriticidadeClassificacao;
  className?: string;
}

export function CriticidadeBadge({ criticidade, className }: CriticidadeBadgeProps) {
  const variant = CRITICIDADE_COLORS[criticidade];
  const label = CRITICIDADE_LABELS[criticidade];

  const variants = {
    neutral: 'bg-surface-100 text-surface-700',
    info: 'bg-info-100 text-info-700',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-700 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        'animate-spin rounded-full border-2 border-surface-200 border-t-primary-600',
        sizeStyles[size],
        className
      )}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

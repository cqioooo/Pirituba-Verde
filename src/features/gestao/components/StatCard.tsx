import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: Icon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  colorClassName?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, colorClassName = 'text-surface-900' }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 p-6">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={cn('h-4 w-4 text-surface-400', colorClassName.split(' ')[0])} weight="bold" />}
        <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">{title}</p>
      </div>
      
      <p className="font-heading text-3xl font-bold tracking-tight text-surface-900">{value}</p>
      
      {(description || trend) && (
        <div className="mt-1 flex items-center text-xs">
          {trend && (
            <span
              className={cn(
                'font-semibold mr-1.5',
                trend.isPositive ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          )}
          <span className="text-surface-500 font-medium">
            {trend?.label || description}
          </span>
        </div>
      )}
    </div>
  );
}

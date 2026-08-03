import { MapPin, Warning, CheckCircle, ClockCounterClockwise, Octagon, Trophy } from '@phosphor-icons/react';
import { StatCard } from '../StatCard';

export function AnalyticsKPIs({ data, isLoading }: any) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-surface-200 border-y border-surface-200">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-50 h-28 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 divide-x divide-surface-200 border-y border-surface-200 bg-white">
      <StatCard
        title="Ativos"
        value={data.activePoints}
        icon={MapPin}
      />
      <StatCard
        title="Novos"
        value={data.newPoints}
        icon={Warning}
        colorClassName="text-warning-600"
      />
      <StatCard
        title="Confirmação"
        value={`${data.confirmationRate}%`}
        icon={CheckCircle}
      />
      <StatCard
        title="Reincidência"
        value={`${data.recurrenceRate}%`}
        icon={ClockCounterClockwise}
      />
      <StatCard
        title="Críticos"
        value={data.criticalPoints}
        icon={Octagon}
        colorClassName="text-danger-600"
      />
      <div className="flex flex-col gap-1 p-6 bg-surface-50/50">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-surface-400" weight="bold" />
          <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">Top Categoria</p>
        </div>
        
        <p className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-surface-900 leading-tight truncate" title={data.topCategory?.label || 'Nenhuma'}>
          {data.topCategory?.label || 'Nenhuma'}
        </p>
        
        {data.topCategory && (
          <p className="text-xs text-surface-500 mt-1 font-medium">{data.topCategory.percentage}% do volume</p>
        )}
      </div>
    </div>
  );
}

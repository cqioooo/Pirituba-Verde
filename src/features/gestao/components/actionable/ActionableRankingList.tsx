import { Crosshair, CaretRight } from '@phosphor-icons/react';
import type { ActionableItem } from '@/types/operational';
import { cn } from '@/lib/utils';

interface ActionableRankingListProps {
  items: ActionableItem[];
  onItemClick?: (item: ActionableItem) => void;
}

const levelConfig = {
  prioritario: { border: 'border-l-danger-500', badge: 'bg-danger-100 text-danger-700', label: 'Prioritário' },
  atencao: { border: 'border-l-warning-500', badge: 'bg-warning-100 text-warning-700', label: 'Atenção' },
  informativo: { border: 'border-l-info-500', badge: 'bg-info-100 text-info-700', label: 'Informativo' },
};

const kindIcon = {
  point: '📍',
  group: '📊',
};

export function ActionableRankingList({ items, onItemClick }: ActionableRankingListProps) {
  if (!items.length) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 border-b border-surface-200 pb-2">
          <Crosshair className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-surface-900 text-sm uppercase tracking-wider">Ações Prioritárias</h3>
        </div>
        <p className="text-sm text-surface-400 py-6 text-center">Nenhum item prioritário identificado no período.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-end justify-between mb-4 border-b border-surface-200 pb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-primary-500" weight="bold" />
          <div>
            <h3 className="font-semibold text-surface-900 text-sm uppercase tracking-wider">Ações Prioritárias</h3>
          </div>
        </div>
        <span className="text-xs font-bold text-surface-500">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const config = levelConfig[item.priorityLevel];
          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className={cn(
                'w-full text-left flex items-start gap-3.5 py-3 border-b border-surface-100 transition-colors',
                'hover:bg-surface-50 group'
              )}
            >
              {/* Kind icon */}
              <span className="text-lg flex-shrink-0 mt-0.5">{kindIcon[item.kind]}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-surface-900 leading-tight">{item.title}</p>
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap', config.badge)}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-surface-500 mb-1.5">{item.subtitle}</p>
                <p className="text-xs text-surface-400 italic leading-relaxed">{item.reason}</p>
              </div>

              {/* Metric */}
              {item.metric && (
                <div className="flex-shrink-0 text-right min-w-[60px]">
                  <p className="text-xl font-bold text-surface-800 leading-none">{item.metric.value}</p>
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider mt-1">{item.metric.label}</p>
                </div>
              )}

              <CaretRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

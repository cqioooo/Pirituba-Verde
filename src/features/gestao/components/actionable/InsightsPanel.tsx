import { ArrowRight, ArrowsClockwise, Trash, WarningCircle, Clock, ClipboardText, MapPin, ChartLineUp, CheckCircle, Lightbulb } from '@phosphor-icons/react';
import type { InsightItem, InsightPriority } from '@/types/operational';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  insights: InsightItem[];
  onInsightClick?: (insight: InsightItem) => void;
}

const priorityDot: Record<InsightPriority, string> = {
  high: 'bg-danger-400',
  medium: 'bg-warning-400',
  low: 'bg-info-400',
};

const categoryIcons: Record<string, typeof Lightbulb> = {
  reincidencia: ArrowsClockwise,
  categoria_residuo: Trash,
  criticidade: WarningCircle,
  horario: Clock,
  status_operacional: ClipboardText,
  bairro: MapPin,
  novos_pontos: ChartLineUp,
  confirmacao: CheckCircle,
};

export function InsightsPanel({ insights, onInsightClick }: InsightsPanelProps) {
  if (!insights.length) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-sm text-surface-400 py-6 text-center">Nenhum insight gerado no período.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-0">
        {insights.map(insight => (
          <button
            key={insight.id}
            onClick={() => insight.target && onInsightClick?.(insight)}
            disabled={!insight.target}
            className={cn(
              'w-full text-left flex items-start gap-3 py-3 border-b border-surface-100 transition-colors',
              insight.target
                ? 'hover:bg-surface-50 cursor-pointer group'
                : 'cursor-default'
            )}
          >
            {(() => {
              const Icon = categoryIcons[insight.category] || Lightbulb;
              return (
                <span className="flex-shrink-0 mt-0.5 text-surface-500 group-hover:text-primary-600 transition-colors">
                  <Icon className="w-5 h-5" weight="duotone" />
                </span>
              );
            })()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDot[insight.priority])} />
                <p className="text-sm text-surface-700 leading-relaxed">{insight.text}</p>
              </div>
            </div>
            {insight.target && (
              <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

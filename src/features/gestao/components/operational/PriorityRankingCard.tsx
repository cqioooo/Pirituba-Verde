import { Crown, ClockCounterClockwise, CaretRight } from '@phosphor-icons/react';
import type { PriorityRankingItem } from '@/types/operational';
import { cn } from '@/lib/utils';

interface PriorityRankingCardProps {
  items: PriorityRankingItem[];
  onItemClick?: (item: PriorityRankingItem) => void;
}

const criticidadeColors: Record<string, string> = {
  'Baixa': 'bg-success-100 text-success-700',
  'Média': 'bg-warning-100 text-warning-700',
  'Alta': 'bg-orange-100 text-orange-700',
  'Crítica': 'bg-danger-100 text-danger-700',
};

const statusLabels: Record<string, string> = {
  'novo': 'Novo',
  'em_confirmacao': 'Em confirmação',
  'confirmado': 'Confirmado',
  'em_analise': 'Em análise',
  'encaminhado': 'Encaminhado',
  'resolvido': 'Resolvido',
};

function PriorityRankingRow({ item, rank, onClick }: { item: PriorityRankingItem; rank: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b border-surface-100 hover:bg-surface-50 transition-colors text-left group"
    >
      {/* Rank */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
        rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-500'
      )}>
        {rank <= 3 ? <Crown className="w-3.5 h-3.5" /> : `#${rank}`}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-surface-900">{item.label}</span>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full', criticidadeColors[item.criticidadeLabel])}>
            {item.criticidadeLabel}
          </span>
          {item.recorrente && (
            <span className="text-[10px] font-semibold text-primary-600 flex items-center gap-0.5">
              <ClockCounterClockwise className="w-3 h-3" /> Recorrente
            </span>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate">{item.endereco} — {item.bairro}</p>
        <p className="text-xs text-surface-400 mt-1 italic">{item.reason}</p>
      </div>

      {/* Score + Status */}
      <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
        <div className="text-lg font-bold text-surface-800">{item.priorityScore}</div>
        <span className="text-[10px] text-surface-400 uppercase tracking-wider">{statusLabels[item.status] || item.status}</span>
      </div>

      <CaretRight className="w-4 h-4 text-surface-300 group-hover:text-surface-500 transition-colors flex-shrink-0" />
    </button>
  );
}

export function PriorityRankingCard({ items, onItemClick }: PriorityRankingCardProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-end justify-between mb-4 border-b border-surface-200 pb-2">
        <div>
          <h3 className="font-semibold text-surface-900 text-sm uppercase tracking-wider">Prioridades do Período</h3>
        </div>
        <span className="text-xs font-bold text-surface-500">
          Top {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-surface-400">
          Nenhum ponto prioritário no período atual.
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((item, index) => (
            <PriorityRankingRow
              key={item.id}
              item={item}
              rank={index + 1}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

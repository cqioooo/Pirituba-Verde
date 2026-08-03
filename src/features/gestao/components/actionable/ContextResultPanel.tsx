import { X, ClockCounterClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import type { ContextResultResponse, ActionableTarget } from '@/types/operational';
import { cn } from '@/lib/utils';

interface ContextResultPanelProps {
  isOpen: boolean;
  target: ActionableTarget | null;
  data: ContextResultResponse | null;
  onClose: () => void;
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
  'invalido': 'Inválido',
  'cancelado': 'Cancelado',
  'arquivado': 'Arquivado',
};

export function ContextResultPanel({ isOpen, target, data, onClose }: ContextResultPanelProps) {
  if (!isOpen || !target) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-surface-200 bg-surface-50">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-surface-900 leading-tight">{data?.title || target.title}</h2>
              <p className="text-xs text-surface-500 mt-1">{data?.subtitle}</p>
            </div>
            <Button variant="ghost" className="flex-shrink-0 p-1.5 -mt-1 -mr-1" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          {data && data.total > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                {data.total} {data.total === 1 ? 'ponto' : 'pontos'}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-surface-400 text-sm">Nenhum ponto encontrado para este agrupamento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-surface-200 hover:border-surface-300 hover:shadow-sm transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-surface-900">{item.label}</span>
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full', criticidadeColors[item.criticidadeLabel])}>
                          {item.criticidadeLabel} ({item.criticidade})
                        </span>
                        {item.recorrente && (
                          <span className="text-[10px] font-semibold text-primary-600 flex items-center gap-0.5">
                            <ClockCounterClockwise className="w-3 h-3" /> Recorrente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-600 truncate">{item.endereco}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                        <span>📍 {item.bairro}</span>
                        <span>🔄 {statusLabels[item.status] || item.status}</span>
                        {item.categoria && <span>🏷️ {item.categoria}</span>}
                      </div>
                      {item.lastOccurrenceAt && (
                        <p className="text-[11px] text-surface-400 mt-1.5">
                          Última ocorrência: {new Date(item.lastOccurrenceAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <ArrowSquareOut className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

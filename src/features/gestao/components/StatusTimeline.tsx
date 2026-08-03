import { formatDate } from '@/lib/utils';
import { POINT_STATUS_LABELS } from '@/types';
import type { HistoricoStatusPonto } from '@/types';
import { CheckCircle, Clock, XCircle, WarningCircle } from '@phosphor-icons/react';

interface StatusTimelineProps {
  historico: HistoricoStatusPonto[];
}

export function StatusTimeline({ historico }: StatusTimelineProps) {
  if (!historico.length) {
    return <p className="text-sm text-surface-500">Nenhum histórico registrado.</p>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'novo':
      case 'em_analise':
      case 'em_confirmacao':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'confirmado':
      case 'resolvido':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'invalido':
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-danger-500" />;
      case 'encaminhado':
        return <WarningCircle className="h-4 w-4 text-info-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-surface-300" />;
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {historico.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== historico.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-surface-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-surface-50">
                    {getStatusIcon(item.status_novo)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-surface-500">
                      Alterado para{' '}
                      <span className="font-medium text-surface-900">
                        {POINT_STATUS_LABELS[item.status_novo] || item.status_novo}
                      </span>
                    </p>
                    {item.motivo && (
                      <p className="mt-1 text-sm text-surface-600">
                        "{item.motivo}"
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-surface-500">
                    <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

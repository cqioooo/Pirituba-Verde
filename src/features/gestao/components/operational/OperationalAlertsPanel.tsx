import { Warning, Info, Octagon } from '@phosphor-icons/react';
import type { OperationalAlert, OperationalAlertLevel } from '@/types/operational';
import { cn } from '@/lib/utils';

interface OperationalAlertsPanelProps {
  alerts: OperationalAlert[];
}

const levelConfig: Record<OperationalAlertLevel, { icon: typeof Info; color: string; border: string }> = {
  info: {
    icon: Info,
    color: 'text-info-600',
    border: 'border-l-info-500',
  },
  warning: {
    icon: Warning,
    color: 'text-warning-600',
    border: 'border-l-warning-500',
  },
  priority: {
    icon: Octagon,
    color: 'text-danger-600',
    border: 'border-l-danger-500',
  }
};

function OperationalAlertItem({ alert }: { alert: OperationalAlert }) {
  const config = levelConfig[alert.level];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-3 p-3 bg-white border-y border-r border-l-4 border-surface-200', config.border, 'hover:bg-surface-50 transition-colors')}>
      <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
        <Icon className="w-4 h-4" weight="bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-surface-900 leading-tight mb-0.5">{alert.title}</p>
        <p className="text-xs text-surface-500 leading-relaxed">{alert.description}</p>
      </div>
    </div>
  );
}

export function OperationalAlertsPanel({ alerts }: OperationalAlertsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-surface-200 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-surface-900 text-sm">Alertas Operacionais</h3>
          <p className="text-xs text-surface-500 mt-0.5">O que mudou e merece atenção</p>
        </div>
        {alerts.length > 0 && (
          <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2 py-1 rounded-full">
            {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-surface-400">
          Nenhum alerta importante no período atual.
        </div>
      ) : (
        <div className="space-y-[-1px]">
          {alerts.map(alert => (
            <OperationalAlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

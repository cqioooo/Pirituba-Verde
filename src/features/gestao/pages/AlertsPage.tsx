import { useState, useMemo } from 'react';
import { WarningCircle } from '@phosphor-icons/react';

import type { AnalyticsFilters } from '@/types/analytics';
import { AnalyticsFiltersBar } from '../components/analytics/AnalyticsFiltersBar';
import { OperationalAlertsPanel } from '../components/operational/OperationalAlertsPanel';

import { getOperationalAlerts } from '@/services/operational.service';

export function AlertsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    periodo: '30d',
    status: [],
    bairro: [],
    categoria: [],
    recorrente: 'todos',
    criticidade: []
  });

  // Fetch alerts based on period filter
  const alerts = useMemo(() => getOperationalAlerts(filters.periodo), [filters.periodo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
            <WarningCircle className="w-8 h-8 text-danger-600" weight="duotone" />
            Alertas
          </h1>
          <p className="text-surface-600 text-base mt-2">
            Central de atenção: o que mudou e precisa de ação imediata na operação.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <AnalyticsFiltersBar filters={filters} setFilters={setFilters} />

      {/* Painel de Alertas */}
      <div className="w-full">
        <OperationalAlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}

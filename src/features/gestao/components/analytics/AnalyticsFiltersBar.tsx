import { Funnel, X } from '@phosphor-icons/react';
import { Button, Select } from '@/components/ui';
import type { AnalyticsFilters } from '@/types/analytics';

interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilters;
  setFilters: (f: AnalyticsFilters) => void;
}

export function AnalyticsFiltersBar({ filters, setFilters }: AnalyticsFiltersBarProps) {
  
  const handlePeriodChange = (val: string) => {
    setFilters({ ...filters, periodo: val as any });
  };

  const handleRecurrenteChange = (val: string) => {
    setFilters({ ...filters, recorrente: val as any });
  };

  const clearFilters = () => {
    setFilters({
      periodo: '30d',
      status: [],
      bairro: [],
      categoria: [],
      recorrente: 'todos',
      criticidade: []
    });
  };

  const hasActiveFilters = filters.periodo !== '30d' || filters.recorrente !== 'todos';

  return (
    <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
        <Select
          label="Período"
          value={filters.periodo}
          onChange={(e) => handlePeriodChange(e.target.value)}
          options={[
            { label: 'Hoje', value: 'hoje' },
            { label: 'Últimos 7 dias', value: '7d' },
            { label: 'Últimos 30 dias', value: '30d' },
            { label: 'Últimos 90 dias', value: '90d' },
          ]}
        />
        <Select
          label="Recorrente"
          value={filters.recorrente}
          onChange={(e) => handleRecurrenteChange(e.target.value)}
          options={[
            { label: 'Todos', value: 'todos' },
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
          ]}
        />
        {/* Outros filtros como Bairro e Categoria podem ser adicionados aqui futuramente com multiselect */}
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button variant="outline" className="w-full sm:w-auto gap-2">
          <Funnel className="w-4 h-4" />
          Filtrar
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" className="px-2" onClick={clearFilters} title="Limpar filtros">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

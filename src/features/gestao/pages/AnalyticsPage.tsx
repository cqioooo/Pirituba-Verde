import { useState, useMemo } from 'react';
import { ChartLineUp } from '@phosphor-icons/react';

import type { AnalyticsFilters } from '@/types/analytics';
import type { DrilldownState } from '@/types/operational';

import { AnalyticsFiltersBar } from '../components/analytics/AnalyticsFiltersBar';
import {
  StatusDistributionChart,
  CategoryDistributionChart,
  RecurrenceByNeighborhoodChart,
  CriticalityHighlightsChart,
  CriticalityDistributionChart,
  WeekdayAnalysisChart,
  TimeRangeAnalysisChart,
  MonthlyAnalysisChart
} from '../components/analytics/AnalyticsCharts';

import { AnalyticsDrilldownPanel } from '../components/operational/AnalyticsDrilldownPanel';

import { 
  useStatusDistribution,
  useCategoryDistribution,
  useRecurrenceByNeighborhood,
  useCriticalityHighlights,
  useCriticalityDistribution,
  useWeekdayAnalysis,
  useTimeRangeAnalysis,
  useMonthlyAnalysis
} from '@/services/analytics.queries';

import { getChartDrilldownData } from '@/services/operational.service';

const DRILLDOWN_CLOSED: DrilldownState = {
  isOpen: false,
  sourceChart: '',
  filterKey: '',
  filterValue: '',
  title: ''
};

export function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    periodo: '30d',
    status: [],
    bairro: [],
    categoria: [],
    recorrente: 'todos',
    criticidade: []
  });

  const [drilldown, setDrilldown] = useState<DrilldownState>(DRILLDOWN_CLOSED);

  // Analytics hooks
  const { data: statusDist, isLoading: loadingStatus } = useStatusDistribution(filters);
  const { data: catDist, isLoading: loadingCat } = useCategoryDistribution(filters);
  const { data: recByNeigh, isLoading: loadingRec } = useRecurrenceByNeighborhood(filters);
  const { data: critHighlights, isLoading: loadingCritHigh } = useCriticalityHighlights(filters);
  const { data: critDist, isLoading: loadingCritDist } = useCriticalityDistribution(filters);
  const { data: weekday, isLoading: loadingWeekday } = useWeekdayAnalysis(filters);
  const { data: timeRange, isLoading: loadingTimeRange } = useTimeRangeAnalysis(filters);
  const { data: monthly, isLoading: loadingMonthly } = useMonthlyAnalysis(filters);

  // Drilldown data (charts)
  const drilldownData = useMemo(() => {
    if (!drilldown.isOpen) return null;
    return getChartDrilldownData(drilldown.sourceChart, drilldown.filterValue);
  }, [drilldown]);

  // ── Handlers ──
  const openDrilldown = (sourceChart: string, filterKey: string, filterValue: string, title: string) => {
    setDrilldown({ isOpen: true, sourceChart, filterKey, filterValue, title });
  };
  const closeDrilldown = () => setDrilldown(DRILLDOWN_CLOSED);

  const handleStatusClick = (payload: any) => {
    if (payload?.label) openDrilldown('status', 'status', payload.label, `Pontos: ${payload.label}`);
  };
  const handleCategoryClick = (payload: any) => {
    if (payload?.label) openDrilldown('categoria', 'categoria', payload.label, `Categoria: ${payload.label}`);
  };
  const handleRecurrenceClick = (payload: any) => {
    if (payload?.label) openDrilldown('recorrencia', 'bairro', payload.label, `Recorrência: ${payload.label}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
            <ChartLineUp className="w-8 h-8 text-primary-600" weight="duotone" />
            Relatórios & Analytics
          </h1>
          <p className="text-surface-600 text-base mt-2">
            Análises profundas, tendências e histórico territorial do Pirituba Verde.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <AnalyticsFiltersBar filters={filters} setFilters={setFilters} />

      {/* Gráficos Profundos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <StatusDistributionChart data={statusDist} isLoading={loadingStatus} onBarClick={handleStatusClick} />
        <CategoryDistributionChart data={catDist} isLoading={loadingCat} onBarClick={handleCategoryClick} />
        
        <CriticalityHighlightsChart data={critHighlights} isLoading={loadingCritHigh} />
        <CriticalityDistributionChart data={critDist} isLoading={loadingCritDist} />
        
        <RecurrenceByNeighborhoodChart data={recByNeigh} isLoading={loadingRec} onBarClick={handleRecurrenceClick} />
        <TimeRangeAnalysisChart data={timeRange} isLoading={loadingTimeRange} />
        
        <WeekdayAnalysisChart data={weekday} isLoading={loadingWeekday} />
        <MonthlyAnalysisChart data={monthly} isLoading={loadingMonthly} />
      </div>

      {/* Drawers */}
      <AnalyticsDrilldownPanel
        state={drilldown}
        data={drilldownData}
        onClose={closeDrilldown}
      />
    </div>
  );
}

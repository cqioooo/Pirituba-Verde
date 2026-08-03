import { useState, useMemo, useCallback } from 'react';

import type { AnalyticsFilters } from '@/types/analytics';
import type { ActionableTarget, ActionableItem as ActionableItemType, InsightItem } from '@/types/operational';

import { AnalyticsFiltersBar } from '../components/analytics/AnalyticsFiltersBar';
import { AnalyticsKPIs } from '../components/analytics/AnalyticsKPIs';
import { NewPointsTimeSeriesChart } from '../components/analytics/AnalyticsCharts';

import { ScenarioSummaryCard } from '../components/operational/ScenarioSummaryCard';
import { PriorityRankingCard } from '../components/operational/PriorityRankingCard';

import { InsightsPanel } from '../components/actionable/InsightsPanel';
import { ActionableRankingList } from '../components/actionable/ActionableRankingList';
import { ContextResultPanel } from '../components/actionable/ContextResultPanel';

import { 
  useAnalyticsKpis,
  useNewPointsTimeSeries,
} from '@/services/analytics.queries';

import {
  getScenarioSummary,
  getPriorityRanking,
} from '@/services/operational.service';

import {
  getActionableRanking,
  getActionableInsights,
  getContextResults,
} from '@/services/actionable.service';

export function OverviewPage() {
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    periodo: '30d',
    status: [],
    bairro: [],
    categoria: [],
    recorrente: 'todos',
    criticidade: []
  });

  // Context result panel (actionable layer)
  const [contextTarget, setContextTarget] = useState<ActionableTarget | null>(null);

  // Analytics hooks
  const { data: kpiData, isLoading: loadingKpis } = useAnalyticsKpis(filters);
  const { data: timeSeries, isLoading: loadingTs } = useNewPointsTimeSeries(filters);

  // Operational intelligence
  const scenario = useMemo(() => getScenarioSummary(filters.periodo), [filters.periodo]);
  const ranking = useMemo(() => getPriorityRanking(filters.periodo), [filters.periodo]);

  // Actionable layer
  const actionableItems = useMemo(() => getActionableRanking(filters.periodo), [filters.periodo]);
  const insights = useMemo(() => getActionableInsights(filters.periodo), [filters.periodo]);

  // Context result data (actionable)
  const contextData = useMemo(() => {
    if (!contextTarget) return null;
    return getContextResults(contextTarget);
  }, [contextTarget]);

  // ── Handlers ──
  const openContext = useCallback((target: ActionableTarget) => {
    setContextTarget(target);
  }, []);
  const closeContext = useCallback(() => setContextTarget(null), []);

  const handleActionableClick = useCallback((item: ActionableItemType) => {
    openContext(item.target);
  }, [openContext]);

  const handleInsightClick = useCallback((insight: InsightItem) => {
    if (insight.target) openContext(insight.target);
  }, [openContext]);

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Header & Filters Section */}
      <section className="px-8 pt-8 pb-6 border-b border-surface-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-surface-900 tracking-tight flex items-center gap-3">
              Visão Operacional
            </h1>
            <p className="text-surface-500 text-sm mt-1">Centro de controle de atividades e triagem rápida.</p>
          </div>
        </div>
        <AnalyticsFiltersBar filters={filters} setFilters={setFilters} />
      </section>

      {/* 2. KPIs Section (Full Width Strip) */}
      <section className="bg-surface-50 border-b border-surface-200">
        <AnalyticsKPIs data={kpiData} isLoading={loadingKpis} />
      </section>

      {/* 3. Main Analytics & Insights Canvas */}
      <section className="px-8 py-8 border-b border-surface-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-surface-900 text-sm uppercase tracking-wider mb-6 border-b border-surface-200 pb-2">Evolução Diária</h3>
            <NewPointsTimeSeriesChart data={timeSeries} isLoading={loadingTs} />
          </div>
          {/* Insights (Flat List) */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-surface-900 text-sm uppercase tracking-wider mb-6 border-b border-surface-200 pb-2">Inteligência Tática</h3>
            <InsightsPanel insights={insights} onInsightClick={handleInsightClick} />
          </div>
        </div>
      </section>

      {/* 4. Priorities & Actions */}
      <section className="px-8 py-8 flex-1 bg-surface-50/30">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-1 flex flex-col gap-12">
            <ScenarioSummaryCard data={scenario} />
            <ActionableRankingList items={actionableItems} onItemClick={handleActionableClick} />
          </div>
          <div className="xl:col-span-2">
            <PriorityRankingCard items={ranking} onItemClick={(item) => {
              openContext({ type: 'point', pointId: item.id, title: `Detalhe: ${item.label}` });
            }} />
          </div>
        </div>
      </section>

      {/* Drawers */}
      <ContextResultPanel
        isOpen={!!contextTarget}
        target={contextTarget}
        data={contextData}
        onClose={closeContext}
      />
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import type { AnalyticsFilters } from '@/types/analytics';
import * as analyticsApi from './analytics.service';

function useAnalyticsQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  fallbackData: T,
) {
  return useQuery({
    queryKey,
    queryFn: () => (isSupabaseConfigured ? queryFn() : Promise.resolve(fallbackData)),
  });
}

export function useAnalyticsKpis(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-kpis', filters],
    () => analyticsApi.getAnalyticsKpis(filters),
    {
      activePoints: 145,
      newPoints: 32,
      confirmationRate: 68,
      recurrenceRate: 25,
      criticalPoints: 12,
      topCategory: { label: 'Entulho', count: 85, percentage: 58 },
    },
  );
}

export function useNewPointsTimeSeries(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-timeseries', filters],
    () => analyticsApi.getNewPointsTimeSeries(filters),
    [
      { label: '2026-06-01', value: 12 },
      { label: '2026-06-02', value: 9 },
      { label: '2026-06-03', value: 15 },
    ],
  );
}

export function useStatusDistribution(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-status', filters],
    () => analyticsApi.getStatusDistribution(filters),
    [
      { label: 'Novo', value: 40 },
      { label: 'Em Análise', value: 20 },
      { label: 'Resolvido', value: 80 },
    ],
  );
}

export function useCategoryDistribution(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-categories', filters],
    () => analyticsApi.getWasteCategoryDistribution(filters),
    [
      { label: 'Entulho', value: 80 },
      { label: 'Móveis', value: 45 },
      { label: 'Lixo Doméstico', value: 30 },
    ],
  );
}

export function useRecurrenceByNeighborhood(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-recurrence', filters],
    () => analyticsApi.getRecurrenceByNeighborhood(filters),
    [
      { label: 'Jd. Felicidade', value: 25 },
      { label: 'Vila Zatt', value: 18 },
    ],
  );
}

export function useCriticalityHighlights(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-criticality-high', filters],
    () => analyticsApi.getCriticalityHighlights(filters),
    [{ id: '1', label: 'Rua A', value: 95, bairro: 'Centro', status: 'novo' }],
  );
}

export function useCriticalityDistribution(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-criticality-dist', filters],
    () => analyticsApi.getCriticalityDistribution(filters),
    [
      { label: 'Crítica', value: 10 },
      { label: 'Alta', value: 30 },
      { label: 'Média', value: 40 },
      { label: 'Baixa', value: 20 },
    ],
  );
}

export function useWeekdayAnalysis(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-weekday', filters],
    () => analyticsApi.getWeekdayAnalysis(filters),
    [
      { label: 'Segunda', value: 50 },
      { label: 'Terça', value: 40 },
    ],
  );
}

export function useTimeRangeAnalysis(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-timerange', filters],
    () => analyticsApi.getTimeRangeAnalysis(filters),
    [
      { label: 'Manhã', value: 80 },
      { label: 'Tarde', value: 60 },
    ],
  );
}

export function useMonthlyAnalysis(filters: AnalyticsFilters) {
  return useAnalyticsQuery(
    ['analytics-monthly', filters],
    () => analyticsApi.getMonthlyAnalysis(filters),
    [
      { label: '2026-05', value: 120 },
      { label: '2026-06', value: 145 },
    ],
  );
}

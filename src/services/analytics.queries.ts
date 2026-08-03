import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import type { AnalyticsFilters } from '@/types/analytics';
import * as analyticsApi from './analytics.service';

function useQueryFallback<T>(queryKey: unknown[], fallbackData: T) {
  return useQuery({
    queryKey,
    queryFn: () => Promise.resolve(fallbackData),
    enabled: !isSupabaseConfigured,
  });
}

export function useAnalyticsKpis(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-kpis', filters], {
    activePoints: 145, newPoints: 32, confirmationRate: 68, recurrenceRate: 25, criticalPoints: 12, topCategory: { label: 'Entulho', count: 85, percentage: 58 }
  });
  return useQuery({
    queryKey: ['analytics-kpis', filters],
    queryFn: () => analyticsApi.getAnalyticsKpis(filters),
  });
}

export function useNewPointsTimeSeries(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-timeseries', filters], [
    { label: '2026-06-01', value: 12 }, { label: '2026-06-02', value: 9 }, { label: '2026-06-03', value: 15 }
  ]);
  return useQuery({
    queryKey: ['analytics-timeseries', filters],
    queryFn: () => analyticsApi.getNewPointsTimeSeries(filters),
  });
}

export function useStatusDistribution(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-status', filters], [
    { label: 'Novo', value: 40 }, { label: 'Em Análise', value: 20 }, { label: 'Resolvido', value: 80 }
  ]);
  return useQuery({
    queryKey: ['analytics-status', filters],
    queryFn: () => analyticsApi.getStatusDistribution(filters),
  });
}

export function useCategoryDistribution(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-categories', filters], [
    { label: 'Entulho', value: 80 }, { label: 'Móveis', value: 45 }, { label: 'Lixo Doméstico', value: 30 }
  ]);
  return useQuery({
    queryKey: ['analytics-categories', filters],
    queryFn: () => analyticsApi.getWasteCategoryDistribution(filters),
  });
}

export function useRecurrenceByNeighborhood(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-recurrence', filters], [
    { label: 'Jd. Felicidade', value: 25 }, { label: 'Vila Zatt', value: 18 }
  ]);
  return useQuery({
    queryKey: ['analytics-recurrence', filters],
    queryFn: () => analyticsApi.getRecurrenceByNeighborhood(filters),
  });
}

export function useCriticalityHighlights(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-criticality-high', filters], [
    { id: '1', label: 'Rua A', value: 95, bairro: 'Centro', status: 'novo' }
  ]);
  return useQuery({
    queryKey: ['analytics-criticality-high', filters],
    queryFn: () => analyticsApi.getCriticalityHighlights(filters),
  });
}

export function useCriticalityDistribution(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-criticality-dist', filters], [
    { label: 'Crítica', value: 10 }, { label: 'Alta', value: 30 }, { label: 'Média', value: 40 }, { label: 'Baixa', value: 20 }
  ]);
  return useQuery({
    queryKey: ['analytics-criticality-dist', filters],
    queryFn: () => analyticsApi.getCriticalityDistribution(filters),
  });
}

export function useWeekdayAnalysis(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-weekday', filters], [
    { label: 'Segunda', value: 50 }, { label: 'Terça', value: 40 }
  ]);
  return useQuery({
    queryKey: ['analytics-weekday', filters],
    queryFn: () => analyticsApi.getWeekdayAnalysis(filters),
  });
}

export function useTimeRangeAnalysis(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-timerange', filters], [
    { label: 'Manhã', value: 80 }, { label: 'Tarde', value: 60 }
  ]);
  return useQuery({
    queryKey: ['analytics-timerange', filters],
    queryFn: () => analyticsApi.getTimeRangeAnalysis(filters),
  });
}

export function useMonthlyAnalysis(filters: AnalyticsFilters) {
  if (!isSupabaseConfigured) return useQueryFallback(['analytics-monthly', filters], [
    { label: '2026-05', value: 120 }, { label: '2026-06', value: 145 }
  ]);
  return useQuery({
    queryKey: ['analytics-monthly', filters],
    queryFn: () => analyticsApi.getMonthlyAnalysis(filters),
  });
}

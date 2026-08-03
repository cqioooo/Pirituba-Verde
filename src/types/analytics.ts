import type { StatusPonto, CriticidadeClassificacao } from './database';

export interface AnalyticsFilters {
  periodo: 'hoje' | '7d' | '30d' | '90d' | 'custom';
  dataInicial?: string;
  dataFinal?: string;
  status: StatusPonto[];
  bairro: string[];
  categoria: string[];
  recorrente: 'sim' | 'nao' | 'todos';
  criticidade: CriticidadeClassificacao[];
}

export interface KpiResponse {
  activePoints: number;
  newPoints: number;
  confirmationRate: number;
  recurrenceRate: number;
  criticalPoints: number;
  topCategory: {
    label: string;
    count: number;
    percentage: number;
  } | null;
}

export interface TimeSeriesData {
  label: string; // Ex: '2026-06-01' ou 'Junho'
  value: number;
}

export interface DistributionData {
  label: string;
  value: number;
}

export interface RankingData {
  id: string;
  label: string;
  value: number;
  bairro?: string;
  status?: string;
}

export interface TimeRangeData {
  label: string;
  value: number;
}

export interface MainDiscardTimeByPoint {
  ponto_id: string;
  endereco: string;
  bairro: string;
  horario_principal: string;
  total_registros: number;
  criticidade: number | null;
}

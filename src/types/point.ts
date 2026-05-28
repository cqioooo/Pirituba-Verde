/**
 * Labels, cores e utilitários de apresentação para pontos de descarte.
 * 
 * Os tipos de domínio (StatusPonto, etc.) vivem em database.ts.
 * Aqui vivem apenas os dados de apresentação para a UI.
 */

import type { StatusPonto } from './database';

// ── Categorias de resíduo ──

export const WASTE_CATEGORY_LABELS: Record<string, string> = {
  entulho: 'Entulho',
  volumoso: 'Volumoso',
  organico: 'Orgânico',
  reciclavel: 'Reciclável',
  perigoso: 'Perigoso',
  saude: 'Resíduo de Saúde',
  domiciliar: 'Domiciliar',
  misto: 'Misto',
};

export const WASTE_CATEGORY_COLORS: Record<string, string> = {
  entulho: '#D97706',
  volumoso: '#EA580C',
  organico: '#65A30D',
  reciclavel: '#0D9488',
  perigoso: '#DC2626',
  saude: '#E11D48',
  domiciliar: '#0284C7',
  misto: '#64748B',
};

// ── Status de ponto ──

export const POINT_STATUS_LABELS: Record<StatusPonto, string> = {
  novo: 'Novo',
  em_confirmacao: 'Aguardando',
  confirmado: 'Confirmado',
  em_analise: 'Em análise',
  encaminhado: 'Encaminhado',
  resolvido: 'Resolvido',
  invalido: 'Inválido',
  cancelado: 'Cancelado',
  arquivado: 'Arquivado',
};

export const POINT_STATUS_VARIANTS: Record<StatusPonto, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  novo: 'neutral',
  em_confirmacao: 'warning',
  confirmado: 'success',
  em_analise: 'info',
  encaminhado: 'info',
  resolvido: 'success',
  invalido: 'danger',
  cancelado: 'neutral',
  arquivado: 'neutral',
};

// ── Status de ocorrência ──

export const OCORRENCIA_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_revisao: 'Em Revisão',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  arquivada: 'Arquivada',
};

// ── Frequência percebida ──

export const FREQUENCY_LABELS: Record<string, string> = {
  primeira_vez: 'Primeira vez',
  ocasional: 'Ocasional',
  semanal: 'Semanal',
  quase_diaria: 'Quase diária',
  diaria: 'Diária',
};

// ── Volume estimado ──

export const VOLUME_LABELS: Record<string, string> = {
  pequeno: 'Pequeno — cabe em um saco',
  medio: 'Médio — ocupa parte da calçada',
  grande: 'Grande — ocupa boa parte da via',
  muito_grande: 'Muito grande — ocupa toda a área',
};

// ── Horário percebido ──

export const TIME_LABELS: Record<string, string> = {
  manha: 'Manhã (6h–12h)',
  tarde: 'Tarde (12h–18h)',
  noite: 'Noite (18h–0h)',
  madrugada: 'Madrugada (0h–6h)',
  nao_sei: 'Não sei informar',
};

// ── Coordenadas centrais de Pirituba ──

export const PIRITUBA_CENTER: [number, number] = [-23.485, -46.719];
export const DEFAULT_ZOOM = 14;
export const DETAIL_ZOOM = 17;

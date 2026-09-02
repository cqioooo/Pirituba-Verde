/**
 * Serviço de inteligência operacional.
 * 
 * Todas as funções são assíncronas e buscam dados reais da view v_pontos_gestor
 * no Supabase. Quando o Supabase não está configurado, retorna dados derivados
 * de lógica simplificada.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { PontoGestor } from '@/types';
import { classificarCriticidade } from '@/types';
import type {
  ScenarioSummary,
  OperationalAlert,
  PriorityRankingItem,
  DrilldownResponse,
  DrilldownItem,
  CriticidadeLabel,
} from '@/types/operational';

// ── Utilitários ──

function getPeriodDate(periodo: string): Date {
  const now = new Date();
  if (periodo === 'hoje') { now.setHours(0, 0, 0, 0); return now; }
  if (periodo === '7d') { now.setDate(now.getDate() - 7); return now; }
  if (periodo === '90d') { now.setDate(now.getDate() - 90); return now; }
  // Padrão: 30d
  now.setDate(now.getDate() - 30);
  return now;
}

const ACTIVE_STATUSES = ['novo', 'em_confirmacao', 'confirmado', 'em_analise', 'encaminhado'];

function critLabel(valor: number | null | undefined): CriticidadeLabel {
  const c = classificarCriticidade(valor);
  if (c === 'critica') return 'Crítica';
  if (c === 'alta') return 'Alta';
  if (c === 'media') return 'Média';
  return 'Baixa';
}

async function fetchPontosForPeriod(periodo: string): Promise<PontoGestor[]> {
  if (!isSupabaseConfigured) return [];
  const since = getPeriodDate(periodo);

  const { data, error } = await supabase
    .from('v_pontos_gestor')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('criticidade', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as PontoGestor[];
}

async function fetchAllActivePoints(): Promise<PontoGestor[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('v_pontos_gestor')
    .select('*')
    .in('status', ACTIVE_STATUSES)
    .order('criticidade', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as PontoGestor[];
}

// ═══════════════════════════════════════════════
// Resumo do Cenário
// ═══════════════════════════════════════════════

const periodLabels: Record<string, string> = {
  'hoje': 'Resumo de hoje',
  '7d': 'Resumo dos últimos 7 dias',
  '30d': 'Resumo dos últimos 30 dias',
  '90d': 'Resumo do trimestre',
};

export async function getScenarioSummary(periodo: string): Promise<ScenarioSummary> {
  const points = await fetchPontosForPeriod(periodo);
  const title = periodLabels[periodo] || periodLabels['30d'];

  if (points.length === 0) {
    return {
      title,
      headline: 'Nenhum ponto registrado neste período.',
      supportingText: 'Ajuste o período para visualizar dados mais antigos.',
    };
  }

  const activePoints = points.filter(p => ACTIVE_STATUSES.includes(p.status));
  const criticalPoints = activePoints.filter(p => (p.criticidade ?? 0) >= 75);
  const recurrentPoints = activePoints.filter(p => p.recorrente);

  // Bairro com mais pontos
  const bairroCount: Record<string, number> = {};
  activePoints.forEach(p => {
    if (p.bairro) bairroCount[p.bairro] = (bairroCount[p.bairro] || 0) + 1;
  });
  const topBairro = Object.entries(bairroCount).sort((a, b) => b[1] - a[1])[0];

  // Categoria líder
  const catCount: Record<string, number> = {};
  activePoints.forEach(p => {
    if (p.categoria_principal) catCount[p.categoria_principal] = (catCount[p.categoria_principal] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  const headline = criticalPoints.length > 0
    ? `No período, ${points.length} pontos foram registrados, dos quais ${criticalPoints.length} possuem criticidade crítica e ${recurrentPoints.length} são recorrentes.`
    : `No período, ${points.length} pontos foram registrados. ${recurrentPoints.length} são recorrentes.`;

  const parts: string[] = [];
  if (topBairro) parts.push(`A maior concentração está em ${topBairro[0]} (${topBairro[1]} pontos).`);
  if (topCat) {
    const pct = Math.round((topCat[1] / activePoints.length) * 100);
    parts.push(`${topCat[0]} lidera as categorias com ${pct}% dos registros.`);
  }

  return {
    title,
    headline,
    supportingText: parts.join(' ') || undefined,
  };
}

// ═══════════════════════════════════════════════
// Alertas Operacionais
// ═══════════════════════════════════════════════

export async function getOperationalAlerts(periodo: string): Promise<OperationalAlert[]> {
  const points = await fetchPontosForPeriod(periodo);
  const alerts: OperationalAlert[] = [];
  let alertId = 0;

  const activePoints = points.filter(p => ACTIVE_STATUSES.includes(p.status));
  const criticalPoints = activePoints.filter(p => (p.criticidade ?? 0) >= 75);
  const recurrentPoints = activePoints.filter(p => p.recorrente);

  // Alerta: pontos críticos ativos
  if (criticalPoints.length > 0) {
    alerts.push({
      id: `alert-${++alertId}`,
      level: 'priority',
      title: `${criticalPoints.length} ponto(s) com criticidade crítica`,
      description: `Existem ${criticalPoints.length} pontos ativos com criticidade acima de 75 que exigem acompanhamento prioritário.`,
      relatedDimension: 'criticidade',
      relatedValue: 'crítica',
    });
  }

  // Alerta: pontos sem atualização há muito tempo
  const now = new Date();
  const stalePoints = activePoints.filter(p => {
    if (!p.data_ultima_ocorrencia) return false;
    const lastUpdate = new Date(p.data_ultima_ocorrencia);
    const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7;
  });
  if (stalePoints.length > 0) {
    alerts.push({
      id: `alert-${++alertId}`,
      level: 'warning',
      title: `${stalePoints.length} ponto(s) sem atualização há mais de 7 dias`,
      description: `Esses pontos ativos não receberam novas ocorrências ou mudança de status recentemente.`,
      relatedDimension: 'atualizacao',
    });
  }

  // Alerta: reincidência
  if (recurrentPoints.length > 0) {
    const recRate = activePoints.length > 0 ? Math.round((recurrentPoints.length / activePoints.length) * 100) : 0;
    alerts.push({
      id: `alert-${++alertId}`,
      level: recRate > 30 ? 'warning' : 'info',
      title: `Reincidência em ${recRate}% dos pontos ativos`,
      description: `${recurrentPoints.length} dos ${activePoints.length} pontos ativos do período são recorrentes.`,
      relatedDimension: 'recorrente',
      relatedValue: 'true',
    });
  }

  // Alerta: concentração por bairro
  const bairroCount: Record<string, number> = {};
  activePoints.forEach(p => {
    if (p.bairro) bairroCount[p.bairro] = (bairroCount[p.bairro] || 0) + 1;
  });
  const topBairro = Object.entries(bairroCount).sort((a, b) => b[1] - a[1])[0];
  if (topBairro && activePoints.length > 0) {
    const pct = Math.round((topBairro[1] / activePoints.length) * 100);
    if (pct >= 25) {
      alerts.push({
        id: `alert-${++alertId}`,
        level: pct >= 40 ? 'priority' : 'info',
        title: `${topBairro[0]} concentra ${pct}% dos pontos ativos`,
        description: `O bairro ${topBairro[0]} lidera com ${topBairro[1]} pontos ativos no período.`,
        relatedDimension: 'bairro',
        relatedValue: topBairro[0],
      });
    }
  }

  // Alerta: categoria dominante
  const catCount: Record<string, number> = {};
  activePoints.forEach(p => {
    if (p.categoria_principal) catCount[p.categoria_principal] = (catCount[p.categoria_principal] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  if (topCat && activePoints.length > 0) {
    const pct = Math.round((topCat[1] / activePoints.length) * 100);
    if (pct >= 30) {
      alerts.push({
        id: `alert-${++alertId}`,
        level: 'info',
        title: `${topCat[0]} lidera com ${pct}% dos registros`,
        description: `A categoria ${topCat[0]} continua sendo o tipo de descarte mais comum entre os pontos ativos.`,
        relatedDimension: 'categoria',
        relatedValue: topCat[0],
      });
    }
  }

  // Se não gerou nenhum alerta, informar
  if (alerts.length === 0) {
    alerts.push({
      id: `alert-${++alertId}`,
      level: 'info',
      title: 'Nenhum alerta relevante no período',
      description: 'Não foram identificadas situações que exijam atenção imediata.',
    });
  }

  return alerts;
}

// ═══════════════════════════════════════════════
// Ranking de Prioridade
// ═══════════════════════════════════════════════

function computePriorityScore(p: PontoGestor): number {
  const crit = p.criticidade ?? 0;
  const recBonus = p.recorrente ? 10 : 0;
  const confirmBonus = Math.min(p.confirmacoes * 1.5, 15);
  
  // Penalizar pontos sem atualização recente (mais urgentes)
  let staleBonus = 0;
  if (p.data_ultima_ocorrencia) {
    const days = Math.floor((Date.now() - new Date(p.data_ultima_ocorrencia).getTime()) / (1000 * 60 * 60 * 24));
    staleBonus = Math.min(days * 0.5, 10);
  }

  return Math.min(Math.round(crit + recBonus + confirmBonus + staleBonus), 100);
}

function generateReason(p: PontoGestor): string {
  const parts: string[] = [];
  if ((p.criticidade ?? 0) >= 75) parts.push('criticidade crítica');
  else if ((p.criticidade ?? 0) >= 50) parts.push('criticidade alta');
  if (p.recorrente) parts.push('ponto recorrente');
  if (p.confirmacoes >= 5) parts.push(`${p.confirmacoes} confirmações`);
  
  if (p.data_ultima_ocorrencia) {
    const days = Math.floor((Date.now() - new Date(p.data_ultima_ocorrencia).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 14) parts.push(`ativo há ${days} dias`);
  }

  return parts.length > 0
    ? parts.join(', ').replace(/^./, c => c.toUpperCase()) + '.'
    : 'Ponto ativo no período.';
}

export async function getPriorityRanking(_periodo: string): Promise<PriorityRankingItem[]> {
  const allActive = await fetchAllActivePoints();
  
  if (allActive.length === 0) return [];

  return allActive
    .map(p => ({
      id: p.id,
      label: p.id.split('-')[0].toUpperCase(),
      endereco: p.endereco || 'Endereço não informado',
      bairro: p.bairro || 'Desconhecido',
      status: p.status,
      criticidade: p.criticidade ?? 0,
      criticidadeLabel: critLabel(p.criticidade),
      recorrente: p.recorrente,
      confirmacoes: p.confirmacoes,
      priorityScore: computePriorityScore(p),
      reason: generateReason(p),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

// ═══════════════════════════════════════════════
// Drill-down
// ═══════════════════════════════════════════════

function pontoToDrilldownItem(p: PontoGestor): DrilldownItem {
  return {
    id: p.id,
    endereco: p.endereco || 'Endereço não informado',
    bairro: p.bairro || 'Desconhecido',
    status: p.status,
    criticidade: p.criticidade ?? 0,
    criticidadeLabel: critLabel(p.criticidade),
    recorrente: p.recorrente,
    lastOccurrenceAt: p.data_ultima_ocorrencia || p.created_at,
  };
}

export async function getChartDrilldownData(sourceChart: string, filterValue: string): Promise<DrilldownResponse> {
  const allActive = await fetchAllActivePoints();

  let filtered: PontoGestor[] = [];
  let title = `Pontos: ${filterValue}`;
  let subtitle = 'Lista dos pontos que compõem este agrupamento.';

  if (sourceChart === 'status') {
    // Map display label back to db status
    const statusMap: Record<string, string> = {
      'Novo': 'novo', 'Em Confirmação': 'em_confirmacao', 'Em confirmação': 'em_confirmacao',
      'Confirmado': 'confirmado', 'Em Análise': 'em_analise', 'Em análise': 'em_analise',
      'Encaminhado': 'encaminhado', 'Resolvido': 'resolvido', 'Inválido': 'invalido',
    };
    const dbStatus = statusMap[filterValue] || filterValue.toLowerCase().replace(/ /g, '_');
    filtered = allActive.filter(p => p.status === dbStatus);
    title = `Pontos com status ${filterValue}`;
    subtitle = `Pontos registrados com status "${filterValue}".`;
  } else if (sourceChart === 'categoria') {
    filtered = allActive.filter(p => p.categoria_principal === filterValue);
    title = `Pontos da categoria ${filterValue}`;
    subtitle = `Pontos onde o resíduo predominante é ${filterValue.toLowerCase()}.`;
  } else if (sourceChart === 'recorrencia') {
    filtered = allActive.filter(p => p.bairro === filterValue && p.recorrente);
    title = `Pontos recorrentes em ${filterValue}`;
    subtitle = `Pontos com histórico de reincidência neste bairro.`;
  } else {
    filtered = allActive;
  }

  return {
    title,
    subtitle,
    total: filtered.length,
    items: filtered
      .sort((a, b) => (b.criticidade ?? 0) - (a.criticidade ?? 0))
      .map(pontoToDrilldownItem),
  };
}

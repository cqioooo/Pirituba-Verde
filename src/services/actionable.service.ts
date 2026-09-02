/**
 * Serviço de dados acionáveis do dashboard.
 * 
 * Todas as funções são assíncronas e buscam dados reais da view v_pontos_gestor
 * no Supabase. Quando o Supabase não está configurado, retorna dados vazios.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { classificarCriticidade } from '@/types';
import type { PontoGestor } from '@/types';
import type {
  ActionableItem,
  InsightItem,
  ContextResultItem,
  ContextResultResponse,
  ActionableTarget,
  CriticidadeLabel,
} from '@/types/operational';

// ── Utilitários ──

const ACTIVE_STATUSES = ['novo', 'em_confirmacao', 'confirmado', 'em_analise', 'encaminhado'];

function critLabel(valor: number | null | undefined): CriticidadeLabel {
  const c = classificarCriticidade(valor);
  if (c === 'critica') return 'Crítica';
  if (c === 'alta') return 'Alta';
  if (c === 'media') return 'Média';
  return 'Baixa';
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

function pontoToContextItem(p: PontoGestor): ContextResultItem {
  return {
    id: p.id,
    label: p.id.split('-')[0].toUpperCase(),
    endereco: p.endereco || 'Endereço não informado',
    bairro: p.bairro || 'Desconhecido',
    status: p.status,
    criticidade: p.criticidade ?? 0,
    criticidadeLabel: critLabel(p.criticidade),
    recorrente: p.recorrente,
    categoria: p.categoria_principal || undefined,
    lastOccurrenceAt: p.data_ultima_ocorrencia || p.created_at,
  };
}

// ═══════════════════════════════════════════════
// Ranking Acionável
// ═══════════════════════════════════════════════

export async function getActionableRanking(_periodo: string): Promise<ActionableItem[]> {
  const points = await fetchAllActivePoints();
  if (points.length === 0) return [];

  const items: ActionableItem[] = [];
  let actionId = 0;

  // 1. Pontos críticos individuais (criticidade >= 75) — top 3
  const criticalPoints = points
    .filter(p => (p.criticidade ?? 0) >= 75)
    .slice(0, 3);

  for (const p of criticalPoints) {
    items.push({
      id: `action-${++actionId}`,
      kind: 'point',
      title: `Ponto ${p.id.split('-')[0]} exige atenção imediata`,
      subtitle: `Criticidade ${critLabel(p.criticidade).toLowerCase()}, ${p.recorrente ? 'recorrente' : 'pontual'}.`,
      label: 'Prioridade alta',
      reason: buildPointReason(p),
      metric: { value: p.criticidade ?? 0, label: 'Criticidade' },
      priorityLevel: 'prioritario',
      target: { type: 'point', pointId: p.id, title: `Detalhe do ponto ${p.id.split('-')[0]}` },
    });
  }

  // 2. Bairro com maior concentração
  const bairroCount: Record<string, number> = {};
  points.forEach(p => {
    if (p.bairro) bairroCount[p.bairro] = (bairroCount[p.bairro] || 0) + 1;
  });
  const topBairro = Object.entries(bairroCount).sort((a, b) => b[1] - a[1])[0];
  if (topBairro) {
    items.push({
      id: `action-${++actionId}`,
      kind: 'group',
      title: `${topBairro[0]} concentra pontos no período`,
      subtitle: 'O bairro registrou maior concentração de pontos ativos.',
      label: 'Atenção territorial',
      reason: `O bairro ${topBairro[0]} possui ${topBairro[1]} pontos ativos.`,
      metric: { value: topBairro[1], label: 'Pontos no bairro' },
      priorityLevel: 'prioritario',
      target: { type: 'group', filterKey: 'bairro', filterValue: topBairro[0], title: `Pontos em ${topBairro[0]}` },
    });
  }

  // 3. Categoria dominante
  const catCount: Record<string, number> = {};
  points.forEach(p => {
    if (p.categoria_principal) catCount[p.categoria_principal] = (catCount[p.categoria_principal] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  if (topCat && points.length > 0) {
    const pct = Math.round((topCat[1] / points.length) * 100);
    items.push({
      id: `action-${++actionId}`,
      kind: 'group',
      title: `${topCat[0]} lidera os registros ativos`,
      subtitle: 'A categoria continua dominante entre os pontos do período.',
      label: 'Padrão categórico',
      reason: `${topCat[0]} representa ${pct}% dos pontos ativos.`,
      metric: { value: `${pct}%`, label: 'dos registros' },
      priorityLevel: 'atencao',
      target: { type: 'group', filterKey: 'categoria', filterValue: topCat[0], title: `Pontos de ${topCat[0]}` },
    });
  }

  // 4. Pontos em confirmação (fila operacional)
  const emConfirmacao = points.filter(p => p.status === 'em_confirmacao');
  if (emConfirmacao.length > 0) {
    items.push({
      id: `action-${++actionId}`,
      kind: 'group',
      title: 'Pontos em confirmação aguardam validação',
      subtitle: `${emConfirmacao.length} pontos aguardam validação da comunidade.`,
      label: 'Fila operacional',
      reason: 'Os pontos em confirmação ainda representam uma parte relevante da fila operacional.',
      metric: { value: emConfirmacao.length, label: 'Pontos' },
      priorityLevel: 'atencao',
      target: { type: 'group', filterKey: 'status', filterValue: 'em_confirmacao', title: 'Pontos em confirmação' },
    });
  }

  // 5. Pontos recorrentes
  const recurrents = points.filter(p => p.recorrente);
  if (recurrents.length > 0) {
    items.push({
      id: `action-${++actionId}`,
      kind: 'group',
      title: 'Pontos recorrentes concentrados',
      subtitle: `${recurrents.length} pontos com histórico de reincidência.`,
      label: 'Padrão recorrente',
      reason: 'Pontos recorrentes indicam falha na resolução definitiva do problema.',
      metric: { value: recurrents.length, label: 'Recorrentes' },
      priorityLevel: 'informativo',
      target: { type: 'group', filterKey: 'recorrente', filterValue: true, title: 'Pontos recorrentes' },
    });
  }

  // 6. Ponto ativo há mais tempo
  const oldestPoint = points
    .filter(p => p.data_primeira_ocorrencia)
    .sort((a, b) => new Date(a.data_primeira_ocorrencia!).getTime() - new Date(b.data_primeira_ocorrencia!).getTime())[0];
  if (oldestPoint) {
    const days = Math.floor((Date.now() - new Date(oldestPoint.data_primeira_ocorrencia!).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 14) {
      items.push({
        id: `action-${++actionId}`,
        kind: 'point',
        title: `${oldestPoint.id.split('-')[0]} acumula ${days} dias ativo`,
        subtitle: `${oldestPoint.categoria_principal || 'Descarte'} em ${oldestPoint.bairro || 'bairro desconhecido'}.`,
        label: 'Tempo crítico',
        reason: `Ponto ativo há mais tempo no período, com criticidade ${critLabel(oldestPoint.criticidade).toLowerCase()}.`,
        metric: { value: days, label: 'Dias ativo' },
        priorityLevel: 'atencao',
        target: { type: 'point', pointId: oldestPoint.id, title: `Detalhe do ponto ${oldestPoint.id.split('-')[0]}` },
      });
    }
  }

  return items;
}

function buildPointReason(p: PontoGestor): string {
  const parts: string[] = [];
  if (p.recorrente) parts.push('ponto recorrente');
  if (p.confirmacoes > 0) parts.push(`${p.confirmacoes} confirmações`);
  if (p.categoria_principal) parts.push(`categoria ${p.categoria_principal.toLowerCase()}`);
  if (p.bairro) parts.push(`em ${p.bairro}`);
  return parts.length > 0
    ? `Criticidade ${p.criticidade ?? 0}: ${parts.join(', ')}.`
    : `Criticidade ${p.criticidade ?? 0}.`;
}

// ═══════════════════════════════════════════════
// Insights Curtos
// ═══════════════════════════════════════════════

export async function getActionableInsights(_periodo: string): Promise<InsightItem[]> {
  const points = await fetchAllActivePoints();
  if (points.length === 0) return [];

  const insights: InsightItem[] = [];
  let insightId = 0;

  const recurrents = points.filter(p => p.recorrente);
  const criticals = points.filter(p => (p.criticidade ?? 0) >= 75);

  // 1. Reincidência
  if (recurrents.length > 0) {
    const recRate = Math.round((recurrents.length / points.length) * 100);
    insights.push({
      id: `insight-${++insightId}`,
      category: 'reincidencia',
      priority: recRate > 25 ? 'high' : 'medium',
      text: `${recRate}% dos pontos ativos são recorrentes (${recurrents.length} de ${points.length}).`,
      target: { type: 'group', filterKey: 'recorrente', filterValue: true, title: 'Pontos recorrentes' },
    });
  }

  // 2. Categoria dominante
  const catCount: Record<string, number> = {};
  points.forEach(p => {
    if (p.categoria_principal) catCount[p.categoria_principal] = (catCount[p.categoria_principal] || 0) + 1;
  });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({
      id: `insight-${++insightId}`,
      category: 'categoria_residuo',
      priority: 'high',
      text: `${topCat[0]} é o tipo de descarte mais comum entre os pontos ativos (${topCat[1]} pontos).`,
      target: { type: 'group', filterKey: 'categoria', filterValue: topCat[0], title: `Pontos de ${topCat[0]}` },
    });
  }

  // 3. Concentração de criticidade por bairro
  if (criticals.length > 0) {
    const critBairros: Record<string, number> = {};
    criticals.forEach(p => {
      if (p.bairro) critBairros[p.bairro] = (critBairros[p.bairro] || 0) + 1;
    });
    const topCritBairro = Object.entries(critBairros).sort((a, b) => b[1] - a[1])[0];
    if (topCritBairro) {
      insights.push({
        id: `insight-${++insightId}`,
        category: 'criticidade',
        priority: 'medium',
        text: `A maior parte dos pontos críticos está concentrada em ${topCritBairro[0]} (${topCritBairro[1]} pontos).`,
        target: { type: 'group', filterKey: 'bairro', filterValue: topCritBairro[0], title: `Pontos críticos em ${topCritBairro[0]}` },
      });
    }
  }

  // 4. Horário dominante
  const horarioCount: Record<string, number> = {};
  points.forEach(p => {
    if (p.horario_percebido) horarioCount[p.horario_percebido] = (horarioCount[p.horario_percebido] || 0) + 1;
  });
  const topHorario = Object.entries(horarioCount).sort((a, b) => b[1] - a[1])[0];
  if (topHorario && points.length > 0) {
    const pct = Math.round((topHorario[1] / points.length) * 100);
    insights.push({
      id: `insight-${++insightId}`,
      category: 'horario',
      priority: 'medium',
      text: `Os registros indicam maior atividade no período "${topHorario[0]}" (${pct}% dos pontos).`,
    });
  }

  // 5. Pontos em confirmação
  const emConfirmacao = points.filter(p => p.status === 'em_confirmacao');
  if (emConfirmacao.length > 0) {
    insights.push({
      id: `insight-${++insightId}`,
      category: 'status_operacional',
      priority: 'low',
      text: `${emConfirmacao.length} pontos aguardam confirmação da comunidade.`,
      target: { type: 'group', filterKey: 'status', filterValue: 'em_confirmacao', title: 'Pontos em confirmação' },
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════
// Resultado Contextual (por target)
// ═══════════════════════════════════════════════

export async function getContextResults(target: ActionableTarget): Promise<ContextResultResponse> {
  if (target.type === 'point') {
    // Buscar ponto específico
    if (!isSupabaseConfigured) {
      return { title: target.title, subtitle: 'Supabase não configurado.', total: 0, items: [] };
    }
    const { data, error } = await supabase
      .from('v_pontos_gestor')
      .select('*')
      .eq('id', target.pointId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { title: target.title, subtitle: 'Ponto não encontrado.', total: 0, items: [] };
    }
    const p = data as PontoGestor;
    return {
      title: target.title,
      subtitle: `${p.endereco || 'Endereço não informado'} — ${p.bairro || 'Desconhecido'}`,
      total: 1,
      items: [pontoToContextItem(p)],
    };
  }

  // Grupo
  const allActive = await fetchAllActivePoints();
  let filtered: PontoGestor[] = [];
  const key = target.filterKey;
  const val = target.filterValue;

  if (key === 'bairro') filtered = allActive.filter(p => p.bairro === val);
  else if (key === 'categoria') filtered = allActive.filter(p => p.categoria_principal === String(val));
  else if (key === 'status') filtered = allActive.filter(p => p.status === val);
  else if (key === 'recorrente') filtered = allActive.filter(p => p.recorrente === true);
  else if (key === 'criticidade') filtered = allActive.filter(p => (p.criticidade ?? 0) >= 75);
  else filtered = allActive;

  return {
    title: target.title,
    subtitle: `Lista dos pontos que compõem este agrupamento.`,
    total: filtered.length,
    items: filtered.sort((a, b) => (b.criticidade ?? 0) - (a.criticidade ?? 0)).map(pontoToContextItem),
  };
}

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { AnalyticsFilters, KpiResponse, TimeSeriesData, DistributionData, RankingData } from '@/types/analytics';

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado.');
  }
}

// Utilitário para construir as queries com os filtros comuns
function applyCommonFilters(query: any, filters: AnalyticsFilters, dateColumn: string = 'created_at', prefix: string = '') {
  const p = prefix ? `${prefix}.` : '';

  // Filtro de data
  if (filters.periodo !== 'custom') {
    const dataInicial = new Date();
    if (filters.periodo === 'hoje') dataInicial.setHours(0,0,0,0);
    else if (filters.periodo === '7d') dataInicial.setDate(dataInicial.getDate() - 7);
    else if (filters.periodo === '30d') dataInicial.setDate(dataInicial.getDate() - 30);
    else if (filters.periodo === '90d') dataInicial.setDate(dataInicial.getDate() - 90);
    
    query = query.gte(`${p}${dateColumn}`, dataInicial.toISOString());
  } else if (filters.dataInicial && filters.dataFinal) {
    query = query.gte(`${p}${dateColumn}`, filters.dataInicial).lte(`${p}${dateColumn}`, filters.dataFinal);
  }

  if (filters.status.length > 0) query = query.in(`${p}status`, filters.status);
  if (filters.bairro.length > 0) query = query.in(`${p}bairro`, filters.bairro);
  if (filters.categoria.length > 0) query = query.in(`${p}categoria_principal`, filters.categoria);
  
  if (filters.recorrente === 'sim') query = query.eq(`${p}recorrente`, true);
  if (filters.recorrente === 'nao') query = query.eq(`${p}recorrente`, false);

  if (filters.criticidade.length > 0) {
    // Como a criticidade real é um número de 0-100, simplificamos filtrando no frontend quando usar RPC
    // ou usamos as faixas (se houver uma coluna mapeada).
  }

  return query;
}

export async function getAnalyticsKpis(filters: AnalyticsFilters): Promise<KpiResponse> {
  assertConfigured();

  // Vamos usar a v_pontos_gestor que já tem quase tudo
  let query = supabase.from('v_pontos_gestor').select('*');
  query = applyCommonFilters(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  const pts = data || [];
  
  const activeStatuses = ['novo', 'em_confirmacao', 'confirmado', 'em_analise', 'encaminhado'];
  const activePoints = pts.filter(p => activeStatuses.includes(p.status)).length;
  
  const newPoints = pts.length; // Como filtramos por created_at no applyCommonFilters, são todos do período

  const confirmedPoints = pts.filter(p => p.confirmacoes > 0).length;
  const confirmationRate = pts.length > 0 ? Math.round((confirmedPoints / pts.length) * 100) : 0;

  const recurrentPoints = pts.filter(p => p.recorrente).length;
  const recurrenceRate = pts.length > 0 ? Math.round((recurrentPoints / pts.length) * 100) : 0;

  const criticalPoints = pts.filter(p => (p.criticidade || 0) >= 76).length;

  // Categoria Líder
  const catCount: Record<string, number> = {};
  pts.forEach(p => {
    if (p.categoria_principal) {
      catCount[p.categoria_principal] = (catCount[p.categoria_principal] || 0) + 1;
    }
  });

  let topCategory = null;
  let maxCat = 0;
  let maxCatName = '';
  Object.entries(catCount).forEach(([cat, count]) => {
    if (count > maxCat) {
      maxCat = count;
      maxCatName = cat;
    }
  });

  if (maxCatName) {
    topCategory = {
      label: maxCatName,
      count: maxCat,
      percentage: Math.round((maxCat / pts.length) * 100)
    };
  }

  return {
    activePoints,
    newPoints,
    confirmationRate,
    recurrenceRate,
    criticalPoints,
    topCategory
  };
}

export async function getNewPointsTimeSeries(filters: AnalyticsFilters): Promise<TimeSeriesData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('created_at');
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  const dateMap: Record<string, number> = {};
  data?.forEach(p => {
    const dateStr = p.created_at.split('T')[0];
    dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
  });

  // Sort and format
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ label: date, value }));
}

export async function getStatusDistribution(filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('status');
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  const count: Record<string, number> = {};
  data?.forEach(p => {
    count[p.status] = (count[p.status] || 0) + 1;
  });

  const order = ['novo', 'em_confirmacao', 'confirmado', 'em_analise', 'encaminhado', 'resolvido', 'invalido', 'cancelado', 'arquivado'];
  
  return order.map(status => ({
    label: status.replace('_', ' '),
    value: count[status] || 0
  })).filter(item => item.value > 0);
}

export async function getWasteCategoryDistribution(filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('categoria_principal');
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  const count: Record<string, number> = {};
  data?.forEach(p => {
    const cat = p.categoria_principal || 'Não Informada';
    count[cat] = (count[cat] || 0) + 1;
  });

  return Object.entries(count)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getRecurrenceByNeighborhood(filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('bairro').eq('recorrente', true);
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  const count: Record<string, number> = {};
  data?.forEach(p => {
    const bairro = p.bairro || 'Desconhecido';
    count[bairro] = (count[bairro] || 0) + 1;
  });

  return Object.entries(count)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export async function getCriticalityHighlights(filters: AnalyticsFilters): Promise<RankingData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('id, endereco, bairro, criticidade, status');
  query = applyCommonFilters(query, filters);
  query = query.order('criticidade', { ascending: false }).limit(10);
  
  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    label: p.endereco || p.id.split('-')[0],
    value: p.criticidade || 0,
    bairro: p.bairro || '',
    status: p.status
  }));
}

export async function getCriticalityDistribution(filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('criticidade');
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  let baixa = 0, media = 0, alta = 0, critica = 0;
  data?.forEach(p => {
    const c = p.criticidade || 0;
    if (c <= 25) baixa++;
    else if (c <= 50) media++;
    else if (c <= 75) alta++;
    else critica++;
  });

  return [
    { label: 'Crítica', value: critica },
    { label: 'Alta', value: alta },
    { label: 'Média', value: media },
    { label: 'Baixa', value: baixa }
  ];
}

export async function getWeekdayAnalysis(_filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('ocorrencias').select('created_at');
  
  // Para ocorrências não temos as mesmas colunas de pontos, então simplificamos os filtros ou assumimos campos equivalentes.
  const { data, error } = await query;
  if (error) throw error;

  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const count = [0,0,0,0,0,0,0];

  data?.forEach(o => {
    const date = new Date(o.created_at);
    count[date.getDay()]++;
  });

  return dias.map((dia, idx) => ({ label: dia, value: count[idx] }));
}

export async function getTimeRangeAnalysis(_filters: AnalyticsFilters): Promise<DistributionData[]> {
  assertConfigured();
  let query = supabase.from('ocorrencias').select('created_at');
  
  const { data, error } = await query;
  if (error) throw error;

  let madrugada = 0, manha = 0, tarde = 0, noite = 0;
  
  data?.forEach(o => {
    const hour = new Date(o.created_at).getHours();
    if (hour < 6) madrugada++;
    else if (hour < 12) manha++;
    else if (hour < 18) tarde++;
    else noite++;
  });

  return [
    { label: 'Madrugada (00h-06h)', value: madrugada },
    { label: 'Manhã (06h-12h)', value: manha },
    { label: 'Tarde (12h-18h)', value: tarde },
    { label: 'Noite (18h-00h)', value: noite },
  ];
}

export async function getMonthlyAnalysis(filters: AnalyticsFilters): Promise<TimeSeriesData[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('created_at');
  query = applyCommonFilters(query, filters);
  
  const { data, error } = await query;
  if (error) throw error;

  const map: Record<string, number> = {};
  data?.forEach(p => {
    const month = p.created_at.substring(0, 7); // YYYY-MM
    map[month] = (map[month] || 0) + 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

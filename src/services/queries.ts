import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPontosPublicos,
  fetchPontosAutenticados,
  fetchPontoAutenticadoById,
  fetchHistoricoPonto,
  buscarPontosProximos,
  verificarRateLimit,
  fetchConfiguracoes,
  inserirOcorrencia,
  inserirConfirmacao,
  verificarConfirmacaoExistente,
  inserirModeracao,
  uploadFoto,
  fetchOcorrenciasUsuario,
  fetchDetalheDenuncia,
  fetchNotificacoes,
  fetchPerfilUsuario,
  fetchDashboardResumo,
  fetchPontosGestor,
  fetchPontoGestorById,
  fetchOcorrenciasByPonto,
  fetchConfirmacoesByPonto,
  fetchModeracoesPendentes,
  updatePontoStatus,
  approveModeracao,
  rejectModeracao,
  fetchIndicadoresDiarios,
} from './supabase.service';
import {
  getScenarioSummary,
  getOperationalAlerts,
  getPriorityRanking,
  getChartDrilldownData,
} from './operational.service';
import {
  getActionableRanking,
  getActionableInsights,
  getContextResults,
} from './actionable.service';
import type { OcorrenciaInsert, ConfirmacaoInsert, StatusPonto, PontoGestor, DetalheDenuncia } from '@/types';
import type { ActionableTarget } from '@/types/operational';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

const STALE_TIME_DEFAULT = 1000 * 60 * 5; // 5 minutos
const STALE_TIME_LONG = 1000 * 60 * 60; // 1 hora

// ── Fallback Hooks (quando Supabase offline) ──

function useQueryFallback<T>(queryKey: unknown[], fallbackData: T, enabled = true) {
  return useQuery({
    queryKey,
    queryFn: () => Promise.resolve(fallbackData),
    enabled: enabled && !isSupabaseConfigured,
  });
}

// ── Pontos ──

export function usePontosPublicos() {
  if (!isSupabaseConfigured) return useQueryFallback(['pontos-publicos'], []);
  return useQuery({
    queryKey: ['pontos-publicos'],
    queryFn: fetchPontosPublicos,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontosAutenticados() {
  if (!isSupabaseConfigured) return useQueryFallback(['pontos-autenticados'], []);
  return useQuery({
    queryKey: ['pontos-autenticados'],
    queryFn: fetchPontosAutenticados,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontoAutenticado(id?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['ponto-autenticado', id], null, !!id);
  return useQuery({
    queryKey: ['ponto-autenticado', id],
    queryFn: () => fetchPontoAutenticadoById(id!),
    enabled: !!id,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Histórico ──

export function useHistoricoPonto(pontoId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['historico', pontoId], [], !!pontoId);
  return useQuery({
    queryKey: ['historico', pontoId],
    queryFn: () => fetchHistoricoPonto(pontoId!),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Proximidade ──

export function usePontosProximos(lat?: number, lng?: number, raioMetros?: number) {
  const enabled = !!lat && !!lng && !!raioMetros;
  if (!isSupabaseConfigured) return useQueryFallback(['pontos-proximos', lat, lng, raioMetros], [], enabled);
  return useQuery({
    queryKey: ['pontos-proximos', lat, lng, raioMetros],
    queryFn: () => buscarPontosProximos(lat!, lng!, raioMetros!),
    enabled,
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ── Configurações do Sistema ──

const defaultConfigs = {
  raio_geofence_metros: 15,
  raio_agrupamento_metros: 50,
  raio_faixa_cinzenta_metros: 100,
  confirmacoes_para_validar: 5,
  limite_denuncias_por_dia: 3,
  dias_visibilidade_resolvido: 2,
  ruido_geolocalizacao_metros: 200,
};

export function useConfiguracoes() {
  if (!isSupabaseConfigured) return useQueryFallback(['configuracoes'], defaultConfigs);
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: fetchConfiguracoes,
    staleTime: STALE_TIME_LONG,
  });
}

// ── Rate Limit ──

export function useRateLimit(userId?: string) {
  if (!isSupabaseConfigured) {
    return useQueryFallback(['rate-limit', userId], {
      permitido: true,
      quantidade: 0,
      limite: 3,
      restante: 3,
    }, !!userId);
  }
  return useQuery({
    queryKey: ['rate-limit', userId],
    queryFn: () => verificarRateLimit(userId!),
    enabled: !!userId,
    staleTime: 1000 * 10, // 10 segundos
  });
}

// ── Minhas Ocorrências ──

export function useOcorrenciasUsuario(userId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['ocorrencias', userId], [], !!userId);
  return useQuery({
    queryKey: ['ocorrencias', userId],
    queryFn: () => fetchOcorrenciasUsuario(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Detalhe de Denúncia (Cidadão) ──

export function useDetalheDenuncia(id?: string, userId?: string) {
  const enabled = Boolean(id && userId);
  if (!isSupabaseConfigured) {
    return useQueryFallback<DetalheDenuncia | null>(
      ['detalhe-denuncia', id, userId],
      null,
      enabled
    );
  }
  return useQuery({
    queryKey: ['detalhe-denuncia', id, userId],
    queryFn: () => fetchDetalheDenuncia(id!, userId!),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    retry: false,
  });
}

// ── Perfil do Usuário ──

export function usePerfilUsuario(userId?: string) {
  if (!isSupabaseConfigured) {
    return useQueryFallback(['perfil', userId], { 
      id: userId || 'mock', 
      perfil: 'gestor', 
      nome: 'Gestor (Mock)' 
    } as any, !!userId);
  }
  return useQuery({
    queryKey: ['perfil', userId],
    queryFn: () => fetchPerfilUsuario(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Confirmações ──

export function useVerificarConfirmacao(pontoId?: string, userId?: string) {
  const enabled = !!pontoId && !!userId;
  if (!isSupabaseConfigured) return useQueryFallback(['confirmacao-existente', pontoId, userId], false, enabled);
  return useQuery({
    queryKey: ['confirmacao-existente', pontoId, userId],
    queryFn: () => verificarConfirmacaoExistente(pontoId!, userId!),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Mutações ──

export function useEnviarOcorrencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ocorrencia,
      files,
      faixaCinzentaMotivo,
    }: {
      ocorrencia: OcorrenciaInsert;
      files?: File[];
      faixaCinzentaMotivo?: string;
    }) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return { success: true };
      }

      // 1. Upload das fotos
      const fotosUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const url = await uploadFoto(ocorrencia.registrado_por, file);
          fotosUrls.push(url);
        }
      }

      // 2. Inserir ocorrência
      const payload: OcorrenciaInsert = {
        ...ocorrencia,
        fotos: fotosUrls.length > 0 ? fotosUrls : undefined,
      };
      
      const novaOcorrencia = await inserirOcorrencia(payload);

      // 3. Se for faixa cinzenta, inserir moderação
      if (faixaCinzentaMotivo) {
        await inserirModeracao(novaOcorrencia.id, faixaCinzentaMotivo);
      }

      return novaOcorrencia;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['ocorrencias', variables.ocorrencia.registrado_por] });
      queryClient.invalidateQueries({ queryKey: ['rate-limit', variables.ocorrencia.registrado_por] });
    },
  });
}

export function useConfirmarPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmacao: ConfirmacaoInsert) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return;
      }
      await inserirConfirmacao(confirmacao);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['ponto-autenticado', variables.ponto_id] });
      queryClient.invalidateQueries({ queryKey: ['confirmacao-existente', variables.ponto_id, variables.usuario_id] });
      queryClient.invalidateQueries({ queryKey: ['historico', variables.ponto_id] });
    },
  });
}

// ── Notificações ──

export function useNotificacoes(userId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['notificacoes', userId], [], !!userId);
  return useQuery({
    queryKey: ['notificacoes', userId],
    queryFn: () => fetchNotificacoes(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ═══════════════════════════════════════════════
// HOOKS DA GESTÃO
// ═══════════════════════════════════════════════

export function useDashboardResumo() {
  if (!isSupabaseConfigured) return useQueryFallback(['dashboard-resumo'], {
    total_pontos_ativos: 0,
    novos_pontos: 0,
    pontos_resolvidos: 0,
    pontos_recorrentes: 0,
    pontos_criticos: 0,
  });
  return useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: fetchDashboardResumo,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useIndicadoresDiarios() {
  if (!isSupabaseConfigured) {
    // Gerar mock data para os últimos 14 dias
    const mockData = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        id: `mock-${i}`,
        data: d.toISOString().split('T')[0],
        novos_pontos: Math.floor(Math.random() * 10) + 1,
        pontos_resolvidos: Math.floor(Math.random() * 8),
        total_pontos_ativos: 40 + Math.floor(Math.random() * 20),
        pontos_recorrentes: Math.floor(Math.random() * 5),
        pontos_criticos: Math.floor(Math.random() * 3),
        created_at: new Date().toISOString()
      };
    });
    return useQueryFallback(['indicadores-diarios'], mockData);
  }
  return useQuery({
    queryKey: ['indicadores-diarios'],
    queryFn: fetchIndicadoresDiarios,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontosGestor(filters?: any) {
  if (!isSupabaseConfigured) {
    const mockPontosGestor = [
      {
        id: 'mock-1',
        endereco: 'Rua Agostinho de Azevedo, 150',
        bairro: 'Jd. Felicidade',
        subprefeitura: 'Pirituba/Jaraguá',
        categoria_principal: 'Entulho',
        tipo_residuo: 'Restos de construção',
        volume_estimado: 'Grande (Caminhão)',
        frequencia_percebida: 'Semanal',
        horario_percebido: 'Madrugada',
        status: 'novo',
        recorrente: true,
        validado: false,
        confirmacoes: 3,
        criticidade: 85,
        quantidade_ocorrencias: 4,
        data_primeira_ocorrencia: '2026-06-01T10:00:00Z',
        data_ultima_ocorrencia: '2026-06-15T08:30:00Z',
        distancia_ecoponto_metros: 1200,
        latitude: -23.4735,
        longitude: -46.7320,
        created_at: '2026-06-01T10:00:00Z',
        updated_at: '2026-06-15T08:30:00Z',
        total_denuncias: 4,
        total_confirmacoes: 3,
        ultima_foto_url: null,
      },
      {
        id: 'mock-2',
        endereco: 'Avenida Mutinga, 2000',
        bairro: 'Vila Zatt',
        subprefeitura: 'Pirituba/Jaraguá',
        categoria_principal: 'Móveis',
        tipo_residuo: 'Sofá e Armários',
        volume_estimado: 'Médio (Caçamba)',
        frequencia_percebida: 'Mensal',
        horario_percebido: 'Tarde',
        status: 'em_confirmacao',
        recorrente: false,
        validado: false,
        confirmacoes: 1,
        criticidade: 45,
        quantidade_ocorrencias: 1,
        data_primeira_ocorrencia: '2026-06-10T14:00:00Z',
        data_ultima_ocorrencia: '2026-06-10T14:00:00Z',
        distancia_ecoponto_metros: 800,
        latitude: -23.4880,
        longitude: -46.7450,
        created_at: '2026-06-10T14:00:00Z',
        updated_at: '2026-06-10T14:00:00Z',
        total_denuncias: 1,
        total_confirmacoes: 1,
        ultima_foto_url: null,
      },
      {
        id: 'mock-3',
        endereco: 'Rua Doutor Joy Arruda, 50',
        bairro: 'Pirituba',
        subprefeitura: 'Pirituba/Jaraguá',
        categoria_principal: 'Lixo Doméstico',
        tipo_residuo: 'Sacos pretos de lixo',
        volume_estimado: 'Pequeno (Sacos)',
        frequencia_percebida: 'Diário',
        horario_percebido: 'Noite',
        status: 'confirmado',
        recorrente: true,
        validado: true,
        confirmacoes: 12,
        criticidade: 65,
        quantidade_ocorrencias: 8,
        data_primeira_ocorrencia: '2026-05-15T20:00:00Z',
        data_ultima_ocorrencia: '2026-06-14T21:00:00Z',
        distancia_ecoponto_metros: 2500,
        latitude: -23.4950,
        longitude: -46.7200,
        created_at: '2026-05-15T20:00:00Z',
        updated_at: '2026-06-14T21:00:00Z',
        total_denuncias: 8,
        total_confirmacoes: 12,
        ultima_foto_url: null,
      },
      {
        id: 'mock-4',
        endereco: 'Rua Professor José Jorge, 100',
        bairro: 'Pirituba',
        subprefeitura: 'Pirituba/Jaraguá',
        categoria_principal: 'Eletrônicos',
        tipo_residuo: 'TV e Monitores',
        volume_estimado: 'Pequeno',
        frequencia_percebida: 'Raro',
        horario_percebido: 'Manhã',
        status: 'resolvido',
        recorrente: false,
        validado: true,
        confirmacoes: 5,
        criticidade: 25,
        quantidade_ocorrencias: 2,
        data_primeira_ocorrencia: '2026-05-20T09:00:00Z',
        data_ultima_ocorrencia: '2026-05-25T11:00:00Z',
        distancia_ecoponto_metros: 1500,
        latitude: -23.4800,
        longitude: -46.7150,
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-28T10:00:00Z',
        total_denuncias: 2,
        total_confirmacoes: 5,
        ultima_foto_url: null,
      }
    ] as unknown as PontoGestor[];

    let result = mockPontosGestor;
    if (filters?.status && filters.status.length > 0) {
      result = result.filter(p => filters.status.includes(p.status));
    }
    if (filters?.categorias && filters.categorias.length > 0) {
      result = result.filter(p => filters.categorias.includes(p.categoria_principal));
    }

    return useQueryFallback(['pontos-gestor', filters], result);
  }
  return useQuery({
    queryKey: ['pontos-gestor', filters],
    queryFn: () => fetchPontosGestor(filters),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontoGestor(id?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['ponto-gestor', id], null, !!id);
  return useQuery({
    queryKey: ['ponto-gestor', id],
    queryFn: () => fetchPontoGestorById(id!),
    enabled: !!id,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useOcorrenciasByPonto(pontoId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['ocorrencias-ponto', pontoId], [], !!pontoId);
  return useQuery({
    queryKey: ['ocorrencias-ponto', pontoId],
    queryFn: () => fetchOcorrenciasByPonto(pontoId!),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useConfirmacoesByPonto(pontoId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['confirmacoes-ponto', pontoId], [], !!pontoId);
  return useQuery({
    queryKey: ['confirmacoes-ponto', pontoId],
    queryFn: () => fetchConfirmacoesByPonto(pontoId!),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useModeracoesPendentes() {
  if (!isSupabaseConfigured) return useQueryFallback(['moderacoes-pendentes'], []);
  return useQuery({
    queryKey: ['moderacoes-pendentes'],
    queryFn: fetchModeracoesPendentes,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useUpdatePontoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, motivo, alteradoPor }: { id: string, status: StatusPonto, motivo?: string, alteradoPor?: string }) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return;
      }
      await updatePontoStatus(id, status, motivo, alteradoPor);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pontos-gestor'] });
      queryClient.invalidateQueries({ queryKey: ['ponto-gestor', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['historico', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] });
    },
  });
}

export function useApproveModeracao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observacao, moderadoPor }: { id: string, observacao?: string, moderadoPor?: string }) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return;
      }
      await approveModeracao(id, observacao, moderadoPor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-gestor'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] });
    },
  });
}

export function useRejectModeracao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observacao, moderadoPor }: { id: string, observacao?: string, moderadoPor?: string }) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return;
      }
      await rejectModeracao(id, observacao, moderadoPor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-gestor'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] });
    },
  });
}

// ═══════════════════════════════════════════════
// HOOKS DA INTELIGÊNCIA OPERACIONAL & ACIONÁVEL
// ═══════════════════════════════════════════════

export function useScenarioSummary(periodo: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['scenario-summary', periodo], {
    title: 'Resumo do período',
    headline: 'Dados mock — Supabase não configurado.',
  });
  return useQuery({
    queryKey: ['scenario-summary', periodo],
    queryFn: () => getScenarioSummary(periodo),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useOperationalAlerts(periodo: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['operational-alerts', periodo], []);
  return useQuery({
    queryKey: ['operational-alerts', periodo],
    queryFn: () => getOperationalAlerts(periodo),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePriorityRanking(periodo: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['priority-ranking', periodo], []);
  return useQuery({
    queryKey: ['priority-ranking', periodo],
    queryFn: () => getPriorityRanking(periodo),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useChartDrilldownData(sourceChart: string, filterValue: string, enabled: boolean) {
  if (!isSupabaseConfigured) return useQueryFallback(['chart-drilldown', sourceChart, filterValue], {
    title: '', subtitle: '', total: 0, items: [],
  });
  return useQuery({
    queryKey: ['chart-drilldown', sourceChart, filterValue],
    queryFn: () => getChartDrilldownData(sourceChart, filterValue),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useActionableRanking(periodo: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['actionable-ranking', periodo], []);
  return useQuery({
    queryKey: ['actionable-ranking', periodo],
    queryFn: () => getActionableRanking(periodo),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useActionableInsights(periodo: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['actionable-insights', periodo], []);
  return useQuery({
    queryKey: ['actionable-insights', periodo],
    queryFn: () => getActionableInsights(periodo),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useContextResults(target: ActionableTarget | null) {
  if (!isSupabaseConfigured) return useQueryFallback(['context-results', target], {
    title: '', subtitle: '', total: 0, items: [],
  });
  return useQuery({
    queryKey: ['context-results', target],
    queryFn: () => getContextResults(target!),
    enabled: !!target,
    staleTime: STALE_TIME_DEFAULT,
  });
}



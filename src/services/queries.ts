import { useRef, useState } from 'react';
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
  definirEnderecoInicialPonto,
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
  executarAcaoModeracao,
  uploadFotoResolucao,
  registrarEvidenciaOrfa,
  fetchIndicadoresDiarios,
  fetchOcorrenciaDetalheGestao,
  fetchOcorrenciaDetalheGestaoPorPonto,
  fetchEvidenciasAssinadas,
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
import { prepararFotoResolucao } from '@/lib/imagemResolucao';
import { ErroAcaoModeracao, mapearErroModeracao } from '@/lib/moderacao';
import type {
  OcorrenciaInsert,
  ConfirmacaoInsert,
  StatusPonto,
  PontoGestor,
  PontosGestorFiltros,
  DetalheDenuncia,
  OcorrenciaDetalheGestao,
  Perfil,
  ConfiguracoesParseadas,
  IndicadorDiario,
  ExecutarAcaoModeracaoInput,
  ResultadoAcaoModeracao,
  EtapaAcaoModeracao,
} from '@/types';
import type { ActionableTarget } from '@/types/operational';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

const STALE_TIME_DEFAULT = 1000 * 60 * 5; // 5 minutos
const STALE_TIME_LONG = 1000 * 60 * 60; // 1 hora

/**
 * Chaves de cache do TanStack Query para o fluxo de moderação (KAN-79 / KAN-81).
 *
 * Criadas / padronizadas nesta feature:
 * - `['moderacoes-pendentes']`: fila de moderação e contador na barra lateral (`GestaoSidebar`).
 * - `['ocorrencia-detalhe-gestao', id]`: detalhe completo da ocorrência (inclui `prazo_resolucao`, `prorrogado_em`, `historico_ponto` e `moderacoes`).
 * - `['ocorrencia-detalhe-gestao-por-ponto', pontoId]`: detalhe da ocorrência mais recente aberta pela rota de ponto.
 * - `['ocorrencia-evidencias-assinadas', ocorrenciaId, paths]`: URLs assinadas de curta duração (prefixo `['ocorrencia-evidencias-assinadas', ocorrenciaId]` invalidado após `resolver`).
 *
 * Chaves existentes invalidadas em conjunto após mutação de moderação:
 * - `['historico', pontoId]`, `['ocorrencias-ponto', pontoId]`, `['detalhe-denuncia', ocorrenciaId]`
 * - `['dashboard-resumo']`, `['indicadores-diarios']`, `['analytics-kpis']`, `['analytics-status']`, `['analytics-timeseries']`, `['operational-alerts']`, `['scenario-summary']`, `['priority-ranking']`, `['actionable-ranking']`, `['actionable-insights']`
 * - `['pontos-gestor']`, `['ponto-gestor', pontoId]`, `['pontos-autenticados']`, `['pontos-publicos']`
 */
export const MODERACAO_QUERY_KEYS = {
  filaModeracao: ['moderacoes-pendentes'] as const,
  detalheOcorrencia: (id?: string) => ['ocorrencia-detalhe-gestao', id] as const,
  detalheOcorrenciaPorPonto: (pontoId?: string) =>
    ['ocorrencia-detalhe-gestao-por-ponto', pontoId] as const,
  evidenciasAssinadas: (ocorrenciaId: string, paths: string[]) =>
    ['ocorrencia-evidencias-assinadas', ocorrenciaId, paths] as const,
  evidenciasAssinadasPrefixo: (ocorrenciaId: string) =>
    ['ocorrencia-evidencias-assinadas', ocorrenciaId] as const,
  historicoPonto: (pontoId?: string) => ['historico', pontoId] as const,
  ocorrenciasPonto: (pontoId?: string) => ['ocorrencias-ponto', pontoId] as const,
  resumoDashboard: ['dashboard-resumo'] as const,
  indicadoresDiarios: ['indicadores-diarios'] as const,
  pontosGestor: ['pontos-gestor'] as const,
  pontoGestor: (pontoId?: string) => ['ponto-gestor', pontoId] as const,
  pontosAutenticados: ['pontos-autenticados'] as const,
  pontosPublicos: ['pontos-publicos'] as const,
  analyticsKpis: ['analytics-kpis'] as const,
  analyticsStatus: ['analytics-status'] as const,
  analyticsTimeseries: ['analytics-timeseries'] as const,
  operationalAlerts: ['operational-alerts'] as const,
  scenarioSummary: ['scenario-summary'] as const,
  priorityRanking: ['priority-ranking'] as const,
  actionableRanking: ['actionable-ranking'] as const,
  actionableInsights: ['actionable-insights'] as const,
} as const;

// ── Pontos ──

export function usePontosPublicos() {
  return useQuery({
    queryKey: ['pontos-publicos'],
    queryFn: () => (isSupabaseConfigured ? fetchPontosPublicos() : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontosAutenticados() {
  return useQuery({
    queryKey: ['pontos-autenticados'],
    queryFn: () => (isSupabaseConfigured ? fetchPontosAutenticados() : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontoAutenticado(id?: string) {
  return useQuery({
    queryKey: ['ponto-autenticado', id],
    queryFn: () => (isSupabaseConfigured ? fetchPontoAutenticadoById(id!) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Histórico ──

export function useHistoricoPonto(pontoId?: string) {
  return useQuery({
    queryKey: ['historico', pontoId],
    queryFn: () => (isSupabaseConfigured ? fetchHistoricoPonto(pontoId!) : Promise.resolve([])),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Proximidade ──

export function usePontosProximos(lat?: number, lng?: number, raioMetros?: number) {
  const enabled = !!lat && !!lng && !!raioMetros;
  return useQuery({
    queryKey: ['pontos-proximos', lat, lng, raioMetros],
    queryFn: () =>
      isSupabaseConfigured
        ? buscarPontosProximos(lat!, lng!, raioMetros!)
        : Promise.resolve([]),
    enabled,
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ── Configurações do Sistema ──

const defaultConfigs: ConfiguracoesParseadas = {
  raio_geofence_metros: 15,
  raio_agrupamento_metros: 50,
  raio_faixa_cinzenta_metros: 100,
  confirmacoes_para_validar: 4,
  limite_denuncias_por_dia: 3,
  dias_visibilidade_resolvido: 2,
  ruido_geolocalizacao_metros: 200,
  alerta_prazo_dias: [],
  prazo_ciclo_dias: null,
};

export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => (isSupabaseConfigured ? fetchConfiguracoes() : Promise.resolve(defaultConfigs)),
    staleTime: STALE_TIME_LONG,
  });
}

// ── Rate Limit ──

export function useRateLimit(userId?: string) {
  return useQuery({
    queryKey: ['rate-limit', userId],
    queryFn: () =>
      isSupabaseConfigured
        ? verificarRateLimit(userId!)
        : Promise.resolve({
            permitido: true,
            quantidade: 0,
            limite: 3,
            restante: 3,
          }),
    enabled: !!userId,
    staleTime: 1000 * 10, // 10 segundos
  });
}

// ── Minhas Ocorrências ──

export function useOcorrenciasUsuario(userId?: string) {
  return useQuery({
    queryKey: ['ocorrencias', userId],
    queryFn: () => (isSupabaseConfigured ? fetchOcorrenciasUsuario(userId!) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Detalhe de Denúncia (Cidadão) ──

export function useDetalheDenuncia(id?: string, userId?: string) {
  const enabled = Boolean(id && userId);
  return useQuery<DetalheDenuncia | null>({
    queryKey: ['detalhe-denuncia', id, userId],
    queryFn: () =>
      isSupabaseConfigured ? fetchDetalheDenuncia(id!, userId!) : Promise.resolve(null),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    retry: false,
  });
}

// ── Perfil do Usuário ──

export function usePerfilUsuario(userId?: string) {
  return useQuery<Perfil | null>({
    queryKey: ['perfil', userId],
    queryFn: () =>
      isSupabaseConfigured
        ? fetchPerfilUsuario(userId!)
        : Promise.resolve({
            id: userId || 'mock',
            perfil: 'gestor',
            nome: 'Gestor (Mock)',
            telefone: null,
            avatar_url: null,
            ativo: true,
            reputacao: 0,
            total_denuncias: 0,
            created_at: new Date().toISOString(),
            cpf_hash: null,
            data_nascimento: null,
            rua: null,
            bairro_residencia: null,
          }),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ── Confirmações ──

export function useVerificarConfirmacao(pontoId?: string, userId?: string) {
  const enabled = !!pontoId && !!userId;
  return useQuery({
    queryKey: ['confirmacao-existente', pontoId, userId],
    queryFn: () =>
      isSupabaseConfigured
        ? verificarConfirmacaoExistente(pontoId!, userId!)
        : Promise.resolve(false),
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
      enderecoInicial,
      bairroInicial,
    }: {
      ocorrencia: OcorrenciaInsert;
      files?: File[];
      faixaCinzentaMotivo?: string;
      enderecoInicial?: string;
      bairroInicial?: string;
    }) => {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 1000));
        return { success: true };
      }

      // 1. Validar e remover metadados EXIF/GPS antes do upload
      const fotosUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const { arquivo } = await prepararFotoResolucao(file);
          const url = await uploadFoto(ocorrencia.registrado_por, arquivo);
          fotosUrls.push(url);
        }
      }

      // 2. Inserir ocorrência (registra caminhos órfãos sem DELETE caso falhe pós-upload)
      const payload: OcorrenciaInsert = {
        ...ocorrencia,
        fotos: fotosUrls.length > 0 ? fotosUrls : undefined,
      };

      let novaOcorrencia: Awaited<ReturnType<typeof inserirOcorrencia>>;
      try {
        novaOcorrencia = await inserirOcorrencia(payload);
      } catch (insertError) {
        for (const pathOrfao of fotosUrls) {
          registrarEvidenciaOrfa({
            ocorrenciaId: ocorrencia.ponto_id ?? 'pendente-criacao',
            bucket: 'fotos-ocorrencias',
            path: pathOrfao,
            motivo:
              insertError instanceof Error
                ? insertError.message
                : 'Falha ao persistir ocorrência após upload da foto',
          });
        }
        throw insertError;
      }

      // 2b. Preencher endereço inicial no ponto recém-vinculado (best-effort)
      if (!ocorrencia.ponto_id && novaOcorrencia.ponto_id && (enderecoInicial || bairroInicial)) {
        try {
          await definirEnderecoInicialPonto(
            novaOcorrencia.ponto_id,
            enderecoInicial,
            bairroInicial
          );
        } catch (enderecoError) {
          console.warn('Não foi possível gravar o endereço automático no ponto:', enderecoError);
        }
      }

      // 3. Registrar sinal opcional na tabela de moderação (não bloqueia a criação nem a fila)
      if (faixaCinzentaMotivo) {
        try {
          await inserirModeracao(novaOcorrencia.id, faixaCinzentaMotivo);
        } catch (modError) {
          console.warn('Não foi possível registrar sinal auxiliar de faixa cinzenta:', modError);
        }
      }

      return novaOcorrencia;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['pontos-autenticados'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['ocorrencias', variables.ocorrencia.registrado_por] });
      queryClient.invalidateQueries({ queryKey: ['rate-limit', variables.ocorrencia.registrado_por] });
      queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.filaModeracao });
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
  return useQuery({
    queryKey: ['notificacoes', userId],
    queryFn: () => (isSupabaseConfigured ? fetchNotificacoes(userId!) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

// ═══════════════════════════════════════════════
// HOOKS DA GESTÃO
// ═══════════════════════════════════════════════

export function useDashboardResumo() {
  return useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: () =>
      isSupabaseConfigured
        ? fetchDashboardResumo()
        : Promise.resolve({
            total_pontos_ativos: 0,
            novos_pontos: 0,
            pontos_resolvidos: 0,
            pontos_recorrentes: 0,
            pontos_criticos: 0,
          }),
    staleTime: STALE_TIME_DEFAULT,
  });
}

function buildMockIndicadoresDiarios(): IndicadorDiario[] {
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      id: `mock-${i}`,
      data: d.toISOString().split('T')[0],
      novos_pontos: (i % 7) + 2,
      pontos_resolvidos: (i % 5) + 1,
      total_pontos_ativos: 40 + (i % 10),
      pontos_recorrentes: (i % 4) + 1,
      pontos_criticos: i % 3,
      created_at: new Date().toISOString(),
    };
  });
}

export function useIndicadoresDiarios() {
  return useQuery({
    queryKey: ['indicadores-diarios'],
    queryFn: () =>
      isSupabaseConfigured
        ? fetchIndicadoresDiarios()
        : Promise.resolve(buildMockIndicadoresDiarios()),
    staleTime: STALE_TIME_DEFAULT,
  });
}

const MOCK_PONTOS_GESTOR = [
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
  },
] as unknown as PontoGestor[];

function filterMockPontosGestor(filters?: PontosGestorFiltros): PontoGestor[] {
  let result = MOCK_PONTOS_GESTOR;
  if (filters?.status && filters.status.length > 0) {
    result = result.filter(p => filters.status?.includes(p.status));
  }
  if (filters?.categorias && filters.categorias.length > 0) {
    result = result.filter(
      p => p.categoria_principal && filters.categorias?.includes(p.categoria_principal)
    );
  }
  return result;
}

export function usePontosGestor(filters?: PontosGestorFiltros) {
  return useQuery({
    queryKey: ['pontos-gestor', filters],
    queryFn: () =>
      isSupabaseConfigured
        ? fetchPontosGestor(filters)
        : Promise.resolve(filterMockPontosGestor(filters)),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePontoGestor(id?: string) {
  return useQuery({
    queryKey: ['ponto-gestor', id],
    queryFn: () => (isSupabaseConfigured ? fetchPontoGestorById(id!) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useOcorrenciasByPonto(pontoId?: string) {
  return useQuery({
    queryKey: ['ocorrencias-ponto', pontoId],
    queryFn: () => (isSupabaseConfigured ? fetchOcorrenciasByPonto(pontoId!) : Promise.resolve([])),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export const ocorrenciaDetalheGestaoQueryKey = MODERACAO_QUERY_KEYS.detalheOcorrencia;

export function useOcorrenciaDetalheGestao(id?: string) {
  const enabled = Boolean(id);
  return useQuery<OcorrenciaDetalheGestao | null>({
    queryKey: ocorrenciaDetalheGestaoQueryKey(id),
    queryFn: () =>
      isSupabaseConfigured ? fetchOcorrenciaDetalheGestao(id!) : Promise.resolve(null),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export const ocorrenciaDetalheGestaoPorPontoQueryKey =
  MODERACAO_QUERY_KEYS.detalheOcorrenciaPorPonto;

export function useOcorrenciaDetalheGestaoPorPonto(pontoId?: string) {
  const enabled = Boolean(pontoId);
  return useQuery<OcorrenciaDetalheGestao | null>({
    queryKey: ocorrenciaDetalheGestaoPorPontoQueryKey(pontoId),
    queryFn: () =>
      isSupabaseConfigured
        ? fetchOcorrenciaDetalheGestaoPorPonto(pontoId!)
        : Promise.resolve(null),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export const evidenciasAssinadasQueryKey = MODERACAO_QUERY_KEYS.evidenciasAssinadas;

export function useEvidenciasAssinadas(ocorrenciaId: string, paths: string[]) {
  return useQuery({
    queryKey: evidenciasAssinadasQueryKey(ocorrenciaId, paths),
    queryFn: () => fetchEvidenciasAssinadas(paths, ocorrenciaId),
    enabled: Boolean(ocorrenciaId && paths.length),
    staleTime: 8 * 60 * 1000,
    retry: 1,
  });
}

export function useConfirmacoesByPonto(pontoId?: string) {
  return useQuery({
    queryKey: ['confirmacoes-ponto', pontoId],
    queryFn: () => (isSupabaseConfigured ? fetchConfirmacoesByPonto(pontoId!) : Promise.resolve([])),
    enabled: !!pontoId,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useModeracoesPendentes() {
  return useQuery({
    queryKey: MODERACAO_QUERY_KEYS.filaModeracao,
    queryFn: () => (isSupabaseConfigured ? fetchModeracoesPendentes() : Promise.resolve([])),
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

/**
 * Hook de mutação para executar ações de moderação via RPC `executar_acao_moderacao` (KAN-81).
 *
 * - Não realiza atualização otimista: atualiza os caches apenas em `onSuccess`.
 * - Impede duplo envio com trava síncrona `envioEmAndamentoRef`.
 * - Em `resolver`, envia primeiro a foto para o bucket privado `fotos-resolucao` e só
 *   chama a RPC se o upload tiver sucesso; caso a RPC falhe após o upload, registra
 *   o caminho órfão para limpeza posterior.
 */
export function useExecutarAcaoModeracao() {
  const queryClient = useQueryClient();
  const envioEmAndamentoRef = useRef(false);
  const [etapa, setEtapa] = useState<EtapaAcaoModeracao | null>(null);
  const [envioAtivo, setEnvioAtivo] = useState(false);

  const mutation = useMutation<
    ResultadoAcaoModeracao,
    ErroAcaoModeracao,
    ExecutarAcaoModeracaoInput
  >({
    mutationFn: async input => {
      if (envioEmAndamentoRef.current) {
        throw new ErroAcaoModeracao(
          'desconhecido',
          'Uma ação de moderação já está em andamento. Aguarde a conclusão.'
        );
      }

      envioEmAndamentoRef.current = true;
      setEnvioAtivo(true);

      let evidenciaPath: string | null = null;
      let uploadConcluido = false;

      try {
        if (input.acao === 'resolver' && input.fotoResolucao) {
          setEtapa('enviando_foto');
          evidenciaPath = await uploadFotoResolucao(input.ocorrenciaId, input.fotoResolucao);
          uploadConcluido = true;
        }

        setEtapa('registrando_acao');
        return await executarAcaoModeracao({
          ocorrenciaId: input.ocorrenciaId,
          acao: input.acao,
          justificativa: input.justificativa,
          evidenciaPath,
        });
      } catch (err) {
        const erroMapeado = mapearErroModeracao(err, evidenciaPath ?? undefined);
        if (uploadConcluido && evidenciaPath) {
          registrarEvidenciaOrfa({
            path: evidenciaPath,
            ocorrenciaId: input.ocorrenciaId,
            motivo: erroMapeado.mensagemOriginal ?? erroMapeado.message,
          });
        }
        throw erroMapeado;
      } finally {
        envioEmAndamentoRef.current = false;
        setEnvioAtivo(false);
        setEtapa(null);
      }
    },
    onSuccess: async (_, variables) => {
      const invalidacoes: Promise<void>[] = [
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.filaModeracao }),
        queryClient.invalidateQueries({
          queryKey: MODERACAO_QUERY_KEYS.detalheOcorrencia(variables.ocorrenciaId),
        }),
        queryClient.invalidateQueries({
          queryKey: variables.pontoId
            ? MODERACAO_QUERY_KEYS.detalheOcorrenciaPorPonto(variables.pontoId)
            : ['ocorrencia-detalhe-gestao-por-ponto'],
        }),
        queryClient.invalidateQueries({
          queryKey: MODERACAO_QUERY_KEYS.evidenciasAssinadasPrefixo(variables.ocorrenciaId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['detalhe-denuncia', variables.ocorrenciaId],
        }),
        queryClient.invalidateQueries({
          queryKey: variables.pontoId
            ? MODERACAO_QUERY_KEYS.historicoPonto(variables.pontoId)
            : ['historico'],
        }),
        queryClient.invalidateQueries({
          queryKey: variables.pontoId
            ? MODERACAO_QUERY_KEYS.ocorrenciasPonto(variables.pontoId)
            : ['ocorrencias-ponto'],
        }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.resumoDashboard }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.indicadoresDiarios }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.pontosGestor }),
        queryClient.invalidateQueries({
          queryKey: variables.pontoId
            ? MODERACAO_QUERY_KEYS.pontoGestor(variables.pontoId)
            : ['ponto-gestor'],
        }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.pontosAutenticados }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.pontosPublicos }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.analyticsKpis }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.analyticsStatus }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.analyticsTimeseries }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.operationalAlerts }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.scenarioSummary }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.priorityRanking }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.actionableRanking }),
        queryClient.invalidateQueries({ queryKey: MODERACAO_QUERY_KEYS.actionableInsights }),
      ];

      if (variables.pontoId) {
        invalidacoes.push(
          queryClient.invalidateQueries({
            queryKey: MODERACAO_QUERY_KEYS.evidenciasAssinadasPrefixo(
              `ponto-${variables.pontoId}`
            ),
          })
        );
      }

      await Promise.all(invalidacoes);
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || envioAtivo,
    etapa,
  };
}

// ═══════════════════════════════════════════════
// HOOKS DA INTELIGÊNCIA OPERACIONAL & ACIONÁVEL
// ═══════════════════════════════════════════════

export function useScenarioSummary(periodo: string) {
  return useQuery({
    queryKey: ['scenario-summary', periodo],
    queryFn: () =>
      isSupabaseConfigured
        ? getScenarioSummary(periodo)
        : Promise.resolve({
            title: 'Resumo do período',
            headline: 'Dados mock — Supabase não configurado.',
          }),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useOperationalAlerts(periodo: string) {
  return useQuery({
    queryKey: ['operational-alerts', periodo],
    queryFn: () => (isSupabaseConfigured ? getOperationalAlerts(periodo) : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function usePriorityRanking(periodo: string) {
  return useQuery({
    queryKey: ['priority-ranking', periodo],
    queryFn: () => (isSupabaseConfigured ? getPriorityRanking() : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useChartDrilldownData(sourceChart: string, filterValue: string, enabled: boolean) {
  return useQuery({
    queryKey: ['chart-drilldown', sourceChart, filterValue],
    queryFn: () =>
      isSupabaseConfigured
        ? getChartDrilldownData(sourceChart, filterValue)
        : Promise.resolve({ title: '', subtitle: '', total: 0, items: [] }),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useActionableRanking(periodo: string) {
  return useQuery({
    queryKey: ['actionable-ranking', periodo],
    queryFn: () => (isSupabaseConfigured ? getActionableRanking() : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useActionableInsights(periodo: string) {
  return useQuery({
    queryKey: ['actionable-insights', periodo],
    queryFn: () => (isSupabaseConfigured ? getActionableInsights() : Promise.resolve([])),
    staleTime: STALE_TIME_DEFAULT,
  });
}

export function useContextResults(target: ActionableTarget | null) {
  return useQuery({
    queryKey: ['context-results', target],
    queryFn: () =>
      isSupabaseConfigured
        ? getContextResults(target!)
        : Promise.resolve({ title: '', subtitle: '', total: 0, items: [] }),
    enabled: !!target,
    staleTime: STALE_TIME_DEFAULT,
  });
}

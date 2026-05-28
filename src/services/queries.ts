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
  fetchNotificacoes,
  fetchPerfilUsuario,
} from './supabase.service';
import type { OcorrenciaInsert, ConfirmacaoInsert } from '@/types';
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

// ── Perfil do Usuário ──

export function usePerfilUsuario(userId?: string) {
  if (!isSupabaseConfigured) return useQueryFallback(['perfil', userId], null, !!userId);
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

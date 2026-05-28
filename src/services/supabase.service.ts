/**
 * Camada centralizada de acesso ao Supabase.
 * 
 * Toda chamada ao Supabase passa por aqui. Componentes e hooks
 * NÃO importam supabase diretamente — usam os queries de queries.ts.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type {
  PontoPublico,
  PontoAutenticado,
  OcorrenciaInsert,
  ConfirmacaoInsert,
  Ocorrencia,
  PontoProximo,
  RateLimitResult,
  ConfiguracaoSistema,
  ConfiguracoesParseadas,
  HistoricoStatusPonto,
  Notificacao,
  Perfil,
} from '@/types';

// ── Helpers ──

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
  }
}

// ── Pontos ──

export async function fetchPontosPublicos(): Promise<PontoPublico[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('v_pontos_publicos')
    .select('*')
    .order('criticidade', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as PontoPublico[];
}

export async function fetchPontosAutenticados(): Promise<PontoAutenticado[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('v_pontos_autenticados')
    .select('*')
    .order('criticidade', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as PontoAutenticado[];
}

export async function fetchPontoAutenticadoById(id: string): Promise<PontoAutenticado | null> {
  assertConfigured();
  const { data, error } = await supabase
    .from('v_pontos_autenticados')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PontoAutenticado | null;
}

// ── Histórico ──

export async function fetchHistoricoPonto(pontoId: string): Promise<HistoricoStatusPonto[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('historico_status_ponto')
    .select('*')
    .eq('ponto_id', pontoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HistoricoStatusPonto[];
}

// ── Proximidade (RPC) ──

export async function buscarPontosProximos(
  lat: number,
  lng: number,
  raioMetros: number
): Promise<PontoProximo[]> {
  assertConfigured();
  const { data, error } = await supabase.rpc('buscar_pontos_proximos', {
    p_lat: lat,
    p_lng: lng,
    p_raio_metros: raioMetros,
  });
  if (error) throw error;
  return (data ?? []) as PontoProximo[];
}

// ── Perfil ──

export async function fetchPerfilUsuario(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
  return data;
}

// ── Rate Limit (RPC) ──

export async function verificarRateLimit(usuarioId: string): Promise<RateLimitResult> {
  assertConfigured();
  const { data, error } = await supabase.rpc('verificar_rate_limit', {
    p_usuario_id: usuarioId,
  });
  if (error) throw error;

  const result = data as RateLimitResult;
  // Workaround para o bug do RPC do banco (quando quantidade retornada é null para novos usuários)
  if (result && (result.quantidade === null || result.quantidade === undefined)) {
    const limite = result.limite ?? 3;
    return {
      limite,
      quantidade: 0,
      restante: limite,
      permitido: true,
    };
  }

  return result;
}

// ── Configurações do sistema ──

export async function fetchConfiguracoes(): Promise<ConfiguracoesParseadas> {
  assertConfigured();
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('chave, valor');
  if (error) throw error;

  const configs = (data ?? []) as ConfiguracaoSistema[];
  const map = Object.fromEntries(configs.map(c => [c.chave, c.valor]));

  return {
    raio_geofence_metros: Number(map.raio_geofence_metros ?? 15),
    raio_agrupamento_metros: Number(map.raio_agrupamento_metros ?? 50),
    raio_faixa_cinzenta_metros: Number(map.raio_faixa_cinzenta_metros ?? 100),
    confirmacoes_para_validar: Number(map.confirmacoes_para_validar ?? 5),
    limite_denuncias_por_dia: Number(map.limite_denuncias_por_dia ?? 3),
    dias_visibilidade_resolvido: Number(map.dias_visibilidade_resolvido ?? 2),
    ruido_geolocalizacao_metros: Number(map.ruido_geolocalizacao_metros ?? 200),
  };
}

// ── Ocorrências (denúncias) ──

export async function inserirOcorrencia(payload: OcorrenciaInsert): Promise<Ocorrencia> {
  assertConfigured();
  const { data, error } = await supabase
    .from('ocorrencias')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Ocorrencia;
}

export async function fetchOcorrenciasUsuario(userId: string): Promise<Ocorrencia[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('ocorrencias')
    .select('*')
    .eq('registrado_por', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ocorrencia[];
}

// ── Confirmações ──

export async function inserirConfirmacao(payload: ConfirmacaoInsert): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('confirmacoes')
    .insert(payload);
  if (error) throw error;
}

export async function verificarConfirmacaoExistente(
  pontoId: string,
  userId: string
): Promise<boolean> {
  assertConfigured();
  const { data, error } = await supabase
    .from('confirmacoes')
    .select('id')
    .eq('ponto_id', pontoId)
    .eq('usuario_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ── Moderação ──

export async function inserirModeracao(ocorrenciaId: string, motivo: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('moderacao_ocorrencias')
    .insert({
      ocorrencia_id: ocorrenciaId,
      motivo,
      status: 'pendente',
    });
  if (error) throw error;
}

// ── Upload de fotos ──

export async function uploadFoto(userId: string, file: File): Promise<string> {
  assertConfigured();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from('fotos-ocorrencias')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('fotos-ocorrencias')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ── Notificações ──

export async function fetchNotificacoes(userId: string): Promise<Notificacao[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notificacao[];
}

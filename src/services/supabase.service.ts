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
  HistoricoStatusPontoCidadao,
  DetalheDenuncia,
  Notificacao,
  Perfil,
  PontoGestor,
  DashboardResumo,
  ModeracaoOcorrencia,
  StatusPonto,
  Confirmacao,
  IndicadorDiario,
  OcorrenciaDetalheGestao,
  EvidenciaAssinada,
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
    .select(`
      *,
      pontos_descarte!left(
        endereco,
        bairro,
        status
      )
    `)
    .eq('registrado_por', userId)
    .order('data_registro', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Ocorrencia[];
}

/**
 * Busca o detalhe completo de uma única denúncia do cidadão.
 *
 * Segurança: filtro duplo obrigatório — id da ocorrência E registrado_por.
 * Isso garante que um UUID inserido manualmente na URL nunca retorne
 * dados de outro usuário.
 */
export async function fetchDetalheDenuncia(
  ocorrenciaId: string,
  usuarioId: string
): Promise<DetalheDenuncia> {
  assertConfigured();

  const { data: ocorrencia, error: ocorrenciaError } = await supabase
    .from('ocorrencias')
    .select(`
      id,
      ponto_id,
      data_registro,
      descricao,
      fotos,
      foto_url,
      tipo_residuo,
      volume_estimado,
      frequencia_percebida,
      horario_percebido,
      status,
      tipo,
      pontos_descarte!left(
        id,
        endereco,
        bairro,
        subprefeitura,
        status,
        confirmacoes,
        criticidade
      )
    `)
    .eq('id', ocorrenciaId)
    .eq('registrado_por', usuarioId)
    .eq('tipo', 'denuncia')
    .single();

  if (ocorrenciaError) throw ocorrenciaError;

  // Buscar histórico do ponto, sem expor alterado_por ao cidadão
  let historico: HistoricoStatusPontoCidadao[] = [];
  if (ocorrencia?.ponto_id) {
    const { data: hist, error: histError } = await supabase
      .from('historico_status_ponto')
      .select('id, status_anterior, status_novo, motivo, created_at')
      .eq('ponto_id', ocorrencia.ponto_id)
      .order('created_at', { ascending: false });

    if (histError) throw histError;
    historico = (hist ?? []) as HistoricoStatusPontoCidadao[];
  }

  return {
    ...(ocorrencia as unknown as Omit<DetalheDenuncia, 'historico'>),
    historico,
  };
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
  return path;
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

// ═══════════════════════════════════════════════
// FUNÇÕES DA GESTÃO
// ═══════════════════════════════════════════════

export async function fetchDashboardResumo(): Promise<DashboardResumo> {
  assertConfigured();
  const { data, error } = await supabase
    .from('v_dashboard_resumo')
    .select('*')
    .single();
  if (error) throw error;
  return data as DashboardResumo;
}

export async function fetchIndicadoresDiarios(): Promise<IndicadorDiario[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('indicadores_diarios')
    .select('*')
    .order('data', { ascending: true }) // Recharts prefere ordenação temporal crescente
    .limit(30); // Últimos 30 dias

  if (error) throw error;
  return (data ?? []) as IndicadorDiario[];
}

export async function fetchPontosGestor(filters?: any): Promise<PontoGestor[]> {
  assertConfigured();
  let query = supabase.from('v_pontos_gestor').select('*');

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  if (filters?.categorias && filters.categorias.length > 0) {
    query = query.in('categoria_principal', filters.categorias);
  }
  // Pode adicionar mais filtros depois (ex: bairro, criticidade)
  
  query = query.order('criticidade', { ascending: false, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PontoGestor[];
}

export async function fetchPontoGestorById(id: string): Promise<PontoGestor | null> {
  assertConfigured();
  const { data, error } = await supabase
    .from('v_pontos_gestor')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PontoGestor | null;
}

export async function fetchOcorrenciasByPonto(pontoId: string): Promise<Ocorrencia[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('ocorrencias')
    .select('*, pontos_descarte(endereco)')
    .eq('ponto_id', pontoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ocorrencia[];
}

const EVIDENCE_BUCKET = 'fotos-ocorrencias';
export const EVIDENCE_SIGNED_URL_TTL_SECONDS = 10 * 60;

function normalizeEvidencePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let path = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname;
      const markers = [
        `/storage/v1/object/public/${EVIDENCE_BUCKET}/`,
        `/storage/v1/object/sign/${EVIDENCE_BUCKET}/`,
        `/storage/v1/object/authenticated/${EVIDENCE_BUCKET}/`,
      ];
      const marker = markers.find(candidate => pathname.includes(candidate));
      if (!marker) return null;
      path = decodeURIComponent(pathname.slice(pathname.indexOf(marker) + marker.length));
    } catch {
      return null;
    }
  }

  if (path.startsWith(`${EVIDENCE_BUCKET}/`)) {
    path = path.slice(EVIDENCE_BUCKET.length + 1);
  }

  path = path.replace(/^\/+/, '');
  if (!path || path.split('/').some(segment => segment === '..')) return null;
  return path;
}

/**
 * Consulta orquestrada do detalhe de ocorrência para a gestão.
 * A autorização efetiva continua sendo responsabilidade das policies RLS.
 */
export async function fetchOcorrenciaDetalheGestao(
  ocorrenciaId: string
): Promise<OcorrenciaDetalheGestao | null> {
  assertConfigured();

  const { data, error } = await supabase
    .from('ocorrencias')
    .select(`
      id,
      ponto_id,
      data_registro,
      created_at,
      descricao,
      tipo_residuo,
      volume_estimado,
      frequencia_percebida,
      horario_percebido,
      latitude,
      longitude,
      status,
      tipo,
      fotos,
      foto_url,
      pontos_descarte!left(
        id,
        endereco,
        bairro,
        subprefeitura,
        categoria_principal,
        status,
        quantidade_ocorrencias,
        recorrente
      )
    `)
    .eq('id', ocorrenciaId)
    .maybeSingle();

  if (error) {
    console.error('[F4.2] Falha ao buscar a ocorrência da gestão:', JSON.stringify({
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    }));
    throw error;
  }
  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    ponto_id: string | null;
    data_registro: string;
    created_at: string;
    descricao: string | null;
    tipo_residuo: string | string[] | null;
    volume_estimado: string | null;
    frequencia_percebida: string | null;
    horario_percebido: string | null;
    latitude: number;
    longitude: number;
    status: Ocorrencia['status'];
    tipo: Ocorrencia['tipo'];
    fotos: string[] | null;
    foto_url: string | null;
    pontos_descarte: (OcorrenciaDetalheGestao['ponto'] & {
      categoria_principal: string | null;
    }) | null;
  };

  let historicoPonto: OcorrenciaDetalheGestao['historico_ponto'] = [];
  let confirmacoesDistintasPonto = 0;

  if (raw.ponto_id) {
    const [historicoResult, confirmacoesResult] = await Promise.all([
      supabase
        .from('historico_status_ponto')
        .select('id, ponto_id, status_anterior, status_novo, motivo, created_at')
        .eq('ponto_id', raw.ponto_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('confirmacoes')
        .select('usuario_id')
        .eq('ponto_id', raw.ponto_id),
    ]);

    if (historicoResult.error) throw historicoResult.error;
    if (confirmacoesResult.error) throw confirmacoesResult.error;

    historicoPonto = (historicoResult.data ?? []) as OcorrenciaDetalheGestao['historico_ponto'];
    confirmacoesDistintasPonto = new Set(
      (confirmacoesResult.data ?? []).map(item => item.usuario_id)
    ).size;
  }

  const possiblePaths = [...(raw.fotos ?? []), ...(raw.foto_url ? [raw.foto_url] : [])];
  const storagePaths = [...new Set(
    possiblePaths
      .map(normalizeEvidencePath)
      .filter((value): value is string => Boolean(value))
  )];

  return {
    ocorrencia: {
      id: raw.id,
      ponto_id: raw.ponto_id,
      data_registro: raw.data_registro,
      created_at: raw.created_at,
      descricao: raw.descricao,
      categoria_principal: raw.pontos_descarte?.categoria_principal ?? null,
      tipo_residuo: raw.tipo_residuo,
      volume_estimado: raw.volume_estimado,
      frequencia_percebida: raw.frequencia_percebida,
      horario_percebido: raw.horario_percebido,
      latitude: raw.latitude,
      longitude: raw.longitude,
      status: raw.status,
      tipo: raw.tipo,
    },
    ponto: raw.pontos_descarte,
    evidencias_paths: storagePaths,
    historico_ponto: historicoPonto,
    confirmacoes_distintas_ponto: confirmacoesDistintasPonto,
    ciclos_anteriores: null,
  };
}

/**
 * Resolve a entrada da tela pelo ponto de descarte.
 *
 * A listagem de gestão navega com o id do ponto, enquanto a F4.2 detalha uma
 * ocorrência. Selecionamos explicitamente a ocorrência mais recente do ponto
 * e reutilizamos a consulta completa, mantendo uma única montagem do payload.
 */
export async function fetchOcorrenciaDetalheGestaoPorPonto(
  pontoId: string
): Promise<OcorrenciaDetalheGestao | null> {
  assertConfigured();

  const { data, error } = await supabase
    .from('ocorrencias')
    .select('id')
    .eq('ponto_id', pontoId)
    .order('data_registro', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[F4.2] Falha ao localizar a ocorrência mais recente do ponto:', error);
    throw error;
  }
  if (!data) return null;

  return fetchOcorrenciaDetalheGestao(data.id);
}

/** Gera acessos temporários sem devolver URL pública permanente à interface. */
export async function fetchEvidenciasAssinadas(
  paths: string[]
): Promise<EvidenciaAssinada[]> {
  assertConfigured();

  return Promise.all(paths.map(async path => {
    const normalizedPath = normalizeEvidencePath(path);
    if (!normalizedPath) {
      return { path, signed_url: null, disponivel: false };
    }

    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(normalizedPath, EVIDENCE_SIGNED_URL_TTL_SECONDS);

    return {
      path: normalizedPath,
      signed_url: error ? null : data.signedUrl,
      disponivel: !error && Boolean(data.signedUrl),
    };
  }));
}

export async function fetchConfirmacoesByPonto(pontoId: string): Promise<Confirmacao[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('confirmacoes')
    .select('*')
    .eq('ponto_id', pontoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Confirmacao[];
}

export async function fetchModeracoesPendentes(): Promise<(ModeracaoOcorrencia & { ocorrencia: Ocorrencia })[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('moderacao_ocorrencias')
    .select('*, ocorrencia:ocorrencias(*)')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as (ModeracaoOcorrencia & { ocorrencia: Ocorrencia })[];
}

export async function updatePontoStatus(
  id: string,
  novoStatus: StatusPonto,
  motivo?: string,
  alteradoPor?: string
): Promise<void> {
  assertConfigured();
  
  // 1. Atualizar o status do ponto
  const { error: updateError } = await supabase
    .from('pontos_descarte')
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (updateError) throw updateError;

  // 2. Inserir histórico
  if (alteradoPor) {
    const { error: histError } = await supabase
      .from('historico_status_ponto')
      .insert({
        ponto_id: id,
        status_novo: novoStatus,
        status_anterior: null, // Ideal seria buscar antes, mas vamos simplificar
        alterado_por: alteradoPor,
        motivo: motivo || null,
      });
      
    if (histError) console.error('Erro ao inserir histórico:', histError);
  }
}

export async function approveModeracao(id: string, observacao?: string, moderadoPor?: string): Promise<void> {
  assertConfigured();
  // Busca a moderação para achar a ocorrência
  const { data: mod } = await supabase.from('moderacao_ocorrencias').select('*').eq('id', id).single();
  if (!mod) throw new Error('Moderação não encontrada');

  const { error: updateModError } = await supabase
    .from('moderacao_ocorrencias')
    .update({
      status: 'aprovada',
      observacao: observacao || null,
      moderado_por: moderadoPor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updateModError) throw updateModError;

  // Aprova a ocorrência também
  await supabase.from('ocorrencias').update({ status: 'aprovada' }).eq('id', mod.ocorrencia_id);

  // Busca o ponto_id da ocorrência e atualiza para em_confirmacao (simplificado)
  const { data: oc } = await supabase.from('ocorrencias').select('ponto_id').eq('id', mod.ocorrencia_id).single();
  if (oc?.ponto_id) {
    await updatePontoStatus(oc.ponto_id, 'em_confirmacao', 'Moderação aprovada', moderadoPor);
  }
}

export async function rejectModeracao(id: string, observacao?: string, moderadoPor?: string): Promise<void> {
  assertConfigured();
  const { data: mod } = await supabase.from('moderacao_ocorrencias').select('*').eq('id', id).single();
  if (!mod) throw new Error('Moderação não encontrada');

  const { error: updateModError } = await supabase
    .from('moderacao_ocorrencias')
    .update({
      status: 'rejeitada',
      observacao: observacao || null,
      moderado_por: moderadoPor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updateModError) throw updateModError;

  await supabase.from('ocorrencias').update({ status: 'rejeitada' }).eq('id', mod.ocorrencia_id);

  const { data: oc } = await supabase.from('ocorrencias').select('ponto_id').eq('id', mod.ocorrencia_id).single();
  if (oc?.ponto_id) {
    await updatePontoStatus(oc.ponto_id, 'invalido', 'Moderação rejeitada', moderadoPor);
  }
}

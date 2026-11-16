/**
 * Camada centralizada de acesso ao Supabase.
 * 
 * Toda chamada ao Supabase passa por aqui. Componentes e hooks
 * NÃO importam supabase diretamente — usam os queries de queries.ts.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  ErroAcaoModeracao,
  calcularDistanciaMetros,
  mapearErroModeracao,
  ordenarFilaModeracao,
} from '@/lib/moderacao';
import {
  FOTOS_RESOLUCAO_BUCKET,
  construirCaminhoFotoResolucao,
  prepararFotoResolucao,
} from '@/lib/imagemResolucao';
import { parsearConfiguracaoAlertaPrazo } from '@/lib/prazoAlerta';
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
  PontosGestorFiltros,
  DashboardResumo,
  ItemFilaModeracao,
  StatusPonto,
  Confirmacao,
  IndicadorDiario,
  OcorrenciaDetalheGestao,
  EvidenciaAssinada,
  ExecutarAcaoModeracaoParams,
  ResultadoAcaoModeracao,
  AcaoModeracao,
  StatusOcorrencia,
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

  if (!error) {
    return (data ?? []) as PontoProximo[];
  }

  if (!erroRpcAusente(error)) {
    throw error;
  }

  // Fallback seguro quando a RPC não está publicada no ambiente
  const pontos = await fetchPontosAutenticados();
  return pontos
    .map((ponto) => ({
      id: ponto.id,
      distancia_metros: calcularDistanciaMetros(lat, lng, ponto.latitude, ponto.longitude),
      status: ponto.status,
      categoria_principal: ponto.categoria_principal,
      confirmacoes: ponto.confirmacoes,
      criticidade: ponto.criticidade,
      recorrente: ponto.recorrente,
      endereco: ponto.endereco,
      bairro: ponto.bairro,
      ultima_foto_url: ponto.ultima_foto_url ?? null,
    }))
    .filter(
      (ponto) =>
        ponto.distancia_metros <= raioMetros &&
        ponto.status !== 'arquivado' &&
        ponto.status !== 'invalido' &&
        ponto.status !== 'cancelado'
    )
    .sort((a, b) => a.distancia_metros - b.distancia_metros);
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
  const alertaPrazo = parsearConfiguracaoAlertaPrazo(
    map.alerta_prazo_dias ?? map.dias_alerta_prazo,
    map.prazo_ciclo_dias ?? map.ciclo_resolucao_dias
  );

  return {
    raio_geofence_metros: Number(map.raio_geofence_metros ?? 15),
    raio_agrupamento_metros: Number(map.raio_agrupamento_metros ?? 50),
    raio_faixa_cinzenta_metros: Number(map.raio_faixa_cinzenta_metros ?? 100),
    confirmacoes_para_validar: Number(map.confirmacoes_para_validar ?? 4),
    limite_denuncias_por_dia: Number(map.limite_denuncias_por_dia ?? 3),
    dias_visibilidade_resolvido: Number(map.dias_visibilidade_resolvido ?? 2),
    ruido_geolocalizacao_metros: Number(map.ruido_geolocalizacao_metros ?? 200),
    alerta_prazo_dias: alertaPrazo.diasAlerta,
    prazo_ciclo_dias: alertaPrazo.cicloDias,
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

export async function definirEnderecoInicialPonto(
  pontoId: string,
  endereco?: string,
  bairro?: string
): Promise<void> {
  const enderecoLimpo = endereco?.trim() || null;
  const bairroLimpo = bairro?.trim() || null;
  if (!pontoId || (!enderecoLimpo && !bairroLimpo)) return;

  assertConfigured();
  const { error } = await supabase.rpc('definir_endereco_ponto_inicial', {
    p_ponto_id: pontoId,
    p_endereco: enderecoLimpo,
    p_bairro: bairroLimpo,
  });

  if (error) {
    throw error;
  }
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

export async function fetchPontosGestor(filters?: PontosGestorFiltros): Promise<PontoGestor[]> {
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
const EVIDENCE_BUCKETS = [EVIDENCE_BUCKET, FOTOS_RESOLUCAO_BUCKET] as const;
export const EVIDENCE_SIGNED_URL_TTL_SECONDS = 10 * 60;
const ORPHAN_EVIDENCES_STORAGE_KEY = 'pirituba_verde_evidencias_orfas';

export interface EvidenciaOrfaRegistro {
  bucket: string;
  path: string;
  ocorrenciaId: string;
  motivo: string;
  registradoEm: string;
}

interface ParsedEvidenceRef {
  bucketHint: string | null;
  path: string;
}

function parseEvidenceReference(value: string): ParsedEvidenceRef | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let path = trimmed;
  let bucketHint: string | null = null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname;
      for (const bucket of EVIDENCE_BUCKETS) {
        const markers = [
          `/storage/v1/object/public/${bucket}/`,
          `/storage/v1/object/sign/${bucket}/`,
          `/storage/v1/object/authenticated/${bucket}/`,
        ];
        const marker = markers.find(candidate => pathname.includes(candidate));
        if (marker) {
          bucketHint = bucket;
          path = decodeURIComponent(pathname.slice(pathname.indexOf(marker) + marker.length));
          break;
        }
      }
      if (!bucketHint) return null;
    } catch {
      return null;
    }
  }

  for (const bucket of EVIDENCE_BUCKETS) {
    if (path.startsWith(`${bucket}/`)) {
      bucketHint = bucketHint ?? bucket;
      path = path.slice(bucket.length + 1);
      break;
    }
  }

  path = path.replace(/^\/+/, '');
  if (!path || path.split('/').some(segment => segment === '..')) return null;
  return { bucketHint, path };
}

function normalizeEvidencePath(value: string): string | null {
  return parseEvidenceReference(value)?.path ?? null;
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
      prazo_resolucao,
      prorrogado_em,
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
    prazo_resolucao: string | null;
    prorrogado_em: string | null;
    pontos_descarte: (OcorrenciaDetalheGestao['ponto'] & {
      categoria_principal: string | null;
    }) | null;
  };

  let historicoPonto: OcorrenciaDetalheGestao['historico_ponto'] = [];
  let confirmacoesDistintasPonto = 0;

  const moderacoesPromise = supabase
    .from('moderacao_ocorrencias')
    .select('id, motivo, status, observacao, created_at, updated_at')
    .eq('ocorrencia_id', raw.id)
    .order('created_at', { ascending: true });

  const [pontoExtras, moderacoesResult] = await Promise.all([
    raw.ponto_id
      ? Promise.all([
          supabase
            .from('historico_status_ponto')
            .select('id, ponto_id, status_anterior, status_novo, motivo, created_at')
            .eq('ponto_id', raw.ponto_id)
            .order('created_at', { ascending: true }),
          supabase
            .from('confirmacoes')
            .select('usuario_id')
            .eq('ponto_id', raw.ponto_id),
        ])
      : Promise.resolve(null),
    moderacoesPromise,
  ]);

  if (pontoExtras) {
    const [historicoResult, confirmacoesResult] = pontoExtras;
    if (historicoResult.error) throw historicoResult.error;
    if (confirmacoesResult.error) throw confirmacoesResult.error;

    historicoPonto = (historicoResult.data ?? []) as OcorrenciaDetalheGestao['historico_ponto'];
    confirmacoesDistintasPonto = new Set(
      (confirmacoesResult.data ?? []).map(item => item.usuario_id)
    ).size;
  }

  const moderacoes = moderacoesResult.error
    ? []
    : ((moderacoesResult.data ?? []) as NonNullable<OcorrenciaDetalheGestao['moderacoes']>);

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
      prazo_resolucao: raw.prazo_resolucao ?? null,
      prorrogado_em: raw.prorrogado_em ?? null,
    },
    ponto: raw.pontos_descarte,
    evidencias_paths: storagePaths,
    historico_ponto: historicoPonto,
    moderacoes,
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
  paths: string[],
  ocorrenciaId?: string
): Promise<EvidenciaAssinada[]> {
  assertConfigured();

  return Promise.all(paths.map(async rawPath => {
    const parsed = parseEvidenceReference(rawPath);
    if (!parsed) {
      return { path: rawPath, signed_url: null, disponivel: false };
    }

    const candidateBuckets: string[] = parsed.bucketHint
      ? [parsed.bucketHint]
      : ocorrenciaId && parsed.path.startsWith(`${ocorrenciaId}/`)
        ? [FOTOS_RESOLUCAO_BUCKET, EVIDENCE_BUCKET]
        : [EVIDENCE_BUCKET, FOTOS_RESOLUCAO_BUCKET];

    for (const bucket of candidateBuckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(parsed.path, EVIDENCE_SIGNED_URL_TTL_SECONDS);

      if (!error && data?.signedUrl) {
        return {
          path: parsed.path,
          signed_url: data.signedUrl,
          disponivel: true,
        };
      }
    }

    return {
      path: parsed.path,
      signed_url: null,
      disponivel: false,
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

interface FilaModeracaoRpcRow {
  id: string;
  data_registro: string;
  created_at: string | null;
  status: StatusOcorrencia;
  descricao: string | null;
  tipo_residuo: string | string[] | null;
  volume_estimado: string | null;
  frequencia_percebida: string | null;
  horario_percebido: string | null;
  foto_url: string | null;
  fotos: string[] | null;
  prazo_resolucao: string | null;
  prorrogado_em: string | null;
  categoria_principal: string | null;
  ponto_id: string | null;
  endereco: string | null;
  bairro: string | null;
  subprefeitura: string | null;
  ponto_status: StatusPonto | null;
  confirmacoes: number | null;
  sinal_duplicata: boolean | null;
  sinal_faixa_cinzenta: boolean | null;
  sinal_reincidencia: boolean | null;
  sinal_limite_diario: boolean | null;
}

interface RawOcorrenciaFilaRow {
  id: string;
  ponto_id: string | null;
  data_registro: string;
  created_at: string;
  status: StatusOcorrencia;
  descricao: string | null;
  tipo_residuo: string | string[] | null;
  volume_estimado: string | null;
  frequencia_percebida: string | null;
  horario_percebido: string | null;
  foto_url: string | null;
  fotos: string[] | null;
  prazo_resolucao: string | null;
  prorrogado_em: string | null;
  latitude: number | null;
  longitude: number | null;
  pontos_descarte: {
    id: string;
    endereco: string | null;
    bairro: string | null;
    subprefeitura: string | null;
    status: StatusPonto;
    categoria_principal: string | null;
    confirmacoes: number | null;
    recorrente: boolean | null;
    quantidade_ocorrencias: number | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  moderacao_ocorrencias: Array<{ motivo: string }> | null;
}

function erroRpcAusente(error: { code?: string | null; message?: string | null }): boolean {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  return (
    code === '42883' ||
    code === '42703' ||
    code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    msg.includes('does not exist')
  );
}

/**
 * Busca TODAS as ocorrências com `status = 'pendente'` para a Fila de Moderação (KAN-76 / F4.1).
 * Nunca filtra por sinais de inconsistência nem expõe PII do cidadão (`registrado_por`, etc.).
 */
export async function fetchModeracoesPendentes(): Promise<ItemFilaModeracao[]> {
  assertConfigured();

  const { data: rpcData, error: rpcError } = await supabase.rpc('listar_fila_moderacao');
  if (!rpcError) {
    const rows = (rpcData ?? []) as FilaModeracaoRpcRow[];
    return ordenarFilaModeracao(
      rows.map(row => ({
        id: row.id,
        data_registro: row.data_registro,
        created_at: row.created_at ?? row.data_registro,
        status: row.status,
        descricao: row.descricao,
        tipo_residuo: row.tipo_residuo,
        volume_estimado: row.volume_estimado,
        frequencia_percebida: row.frequencia_percebida,
        horario_percebido: row.horario_percebido,
        foto_url: row.foto_url,
        fotos: row.fotos,
        prazo_resolucao: row.prazo_resolucao ?? null,
        prorrogado_em: row.prorrogado_em ?? null,
        categoria_principal: row.categoria_principal,
        ponto_id: row.ponto_id,
        endereco: row.endereco,
        bairro: row.bairro,
        subprefeitura: row.subprefeitura,
        ponto_status: row.ponto_status,
        confirmacoes: row.confirmacoes,
        sinal_duplicata: Boolean(row.sinal_duplicata),
        sinal_faixa_cinzenta: Boolean(row.sinal_faixa_cinzenta),
        sinal_reincidencia: Boolean(row.sinal_reincidencia),
        sinal_limite_diario: Boolean(row.sinal_limite_diario),
      }))
    );
  }

  if (!erroRpcAusente(rpcError)) {
    throw rpcError;
  }

  // Fallback direto em `public.ocorrencias` (`WHERE status = 'pendente'`) caso a migration da RPC ainda não esteja aplicada.
  const { data, error } = await supabase
    .from('ocorrencias')
    .select(`
      id,
      ponto_id,
      data_registro,
      created_at,
      status,
      descricao,
      tipo_residuo,
      volume_estimado,
      frequencia_percebida,
      horario_percebido,
      foto_url,
      fotos,
      prazo_resolucao,
      prorrogado_em,
      latitude,
      longitude,
      pontos_descarte!left(
        id,
        endereco,
        bairro,
        subprefeitura,
        status,
        categoria_principal,
        confirmacoes,
        recorrente,
        quantidade_ocorrencias,
        latitude,
        longitude
      ),
      moderacao_ocorrencias!left(motivo)
    `)
    .eq('status', 'pendente')
    .order('data_registro', { ascending: true });
  if (error) throw error;

  const { data: pontosAtivos } = await supabase
    .from('pontos_descarte')
    .select('id, latitude, longitude, status');

  const pontosComparacao = (pontosAtivos ?? []) as Array<{
    id: string;
    latitude: number | null;
    longitude: number | null;
    status: StatusPonto;
  }>;

  const rows = (data ?? []) as unknown as RawOcorrenciaFilaRow[];

  const itens: ItemFilaModeracao[] = rows.map(row => {
    const ponto = row.pontos_descarte;
    const motivos = new Set((row.moderacao_ocorrencias ?? []).map(m => m.motivo));

    let distanciaMinima: number | null = null;
    if (row.latitude !== null && row.longitude !== null) {
      for (const p2 of pontosComparacao) {
        if (
          p2.id === row.ponto_id ||
          p2.latitude === null ||
          p2.longitude === null ||
          p2.status === 'arquivado' ||
          p2.status === 'invalido' ||
          p2.status === 'cancelado'
        ) {
          continue;
        }
        const dist = calcularDistanciaMetros(
          row.latitude,
          row.longitude,
          p2.latitude,
          p2.longitude
        );
        if (distanciaMinima === null || dist < distanciaMinima) {
          distanciaMinima = dist;
        }
      }
      for (const outro of rows) {
        if (outro.id === row.id || outro.latitude === null || outro.longitude === null) {
          continue;
        }
        const dist = calcularDistanciaMetros(
          row.latitude,
          row.longitude,
          outro.latitude,
          outro.longitude
        );
        if (distanciaMinima === null || dist < distanciaMinima) {
          distanciaMinima = dist;
        }
      }
    }

    const sinalDuplicata =
      motivos.has('duplicata') || (distanciaMinima !== null && distanciaMinima <= 50);
    const sinalFaixaCinzenta =
      !sinalDuplicata &&
      (motivos.has('faixa_cinzenta') ||
        (distanciaMinima !== null && distanciaMinima > 50 && distanciaMinima <= 100));
    const sinalReincidencia = Boolean(
      row.ponto_id && (ponto?.recorrente || (ponto?.quantidade_ocorrencias ?? 0) > 1)
    );

    return {
      id: row.id,
      data_registro: row.data_registro || row.created_at,
      created_at: row.created_at,
      status: row.status,
      descricao: row.descricao,
      tipo_residuo: row.tipo_residuo,
      volume_estimado: row.volume_estimado,
      frequencia_percebida: row.frequencia_percebida,
      horario_percebido: row.horario_percebido,
      foto_url: row.foto_url,
      fotos: row.fotos,
      prazo_resolucao: row.prazo_resolucao ?? null,
      prorrogado_em: row.prorrogado_em ?? null,
      categoria_principal: ponto?.categoria_principal ?? null,
      ponto_id: ponto?.id ?? row.ponto_id,
      endereco: ponto?.endereco ?? null,
      bairro: ponto?.bairro ?? null,
      subprefeitura: ponto?.subprefeitura ?? null,
      ponto_status: ponto?.status ?? null,
      confirmacoes: ponto?.confirmacoes ?? null,
      sinal_duplicata: sinalDuplicata,
      sinal_faixa_cinzenta: sinalFaixaCinzenta,
      sinal_reincidencia: sinalReincidencia,
      sinal_limite_diario: false,
    };
  });

  return ordenarFilaModeracao(itens);
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

/**
 * Registra localmente caminhos órfãos no bucket privado quando a RPC falha após o
 * upload da foto de resolução (exclusão via cliente é proibida por política).
 */
export function registrarEvidenciaOrfa(registro: {
  path: string;
  ocorrenciaId: string;
  motivo: string;
  bucket?: string;
}): EvidenciaOrfaRegistro {
  const entrada: EvidenciaOrfaRegistro = {
    bucket: registro.bucket ?? FOTOS_RESOLUCAO_BUCKET,
    path: registro.path,
    ocorrenciaId: registro.ocorrenciaId,
    motivo: registro.motivo,
    registradoEm: new Date().toISOString(),
  };

  console.warn('[KAN-84][ORPHAN_EVIDENCE]', JSON.stringify(entrada));

  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      const atual = listarEvidenciasOrfas();
      const proximo = [...atual.slice(-99), entrada];
      globalThis.localStorage.setItem(ORPHAN_EVIDENCES_STORAGE_KEY, JSON.stringify(proximo));
    }
  } catch {
    // Falha silenciosa se localStorage estiver indisponível
  }

  return entrada;
}

export function listarEvidenciasOrfas(): EvidenciaOrfaRegistro[] {
  try {
    if (typeof globalThis.localStorage === 'undefined') return [];
    const raw = globalThis.localStorage.getItem(ORPHAN_EVIDENCES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EvidenciaOrfaRegistro[]) : [];
  } catch {
    return [];
  }
}

/**
 * Comprime, remove metadados EXIF de localização e envia a foto de resolução
 * para o bucket privado `fotos-resolucao` usando `{ocorrencia_id}/{timestamp}-{uuid}.{ext}`.
 */
export async function uploadFotoResolucao(ocorrenciaId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new ErroAcaoModeracao(
      'nao_configurado',
      'Supabase não configurado. Não foi possível enviar a foto de resolução.'
    );
  }

  const { arquivo, mimeType } = await prepararFotoResolucao(file);
  const path = construirCaminhoFotoResolucao(ocorrenciaId, mimeType);

  const { error } = await supabase.storage
    .from(FOTOS_RESOLUCAO_BUCKET)
    .upload(path, arquivo, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (error) {
    throw new ErroAcaoModeracao(
      'upload_falhou',
      'Falha ao enviar a foto de resolução para o armazenamento seguro. Nenhuma alteração foi aplicada.',
      { mensagemOriginal: error.message, cause: error }
    );
  }

  return path;
}

function parseResultadoRpc(data: unknown, acaoFallback: AcaoModeracao): ResultadoAcaoModeracao {
  if (!data || typeof data !== 'object') {
    throw new ErroAcaoModeracao('desconhecido', 'Resposta inesperada do servidor ao moderar a ocorrência.');
  }
  const raw = data as Record<string, unknown>;
  if (raw.sucesso === false) {
    const msg = typeof raw.mensagem === 'string'
      ? raw.mensagem
      : typeof raw.erro === 'string'
        ? raw.erro
        : 'Não foi possível executar a ação de moderação.';
    throw mapearErroModeracao(msg);
  }

  return {
    sucesso: Boolean(raw.sucesso ?? true),
    acao: (typeof raw.acao === 'string' ? raw.acao : acaoFallback) as AcaoModeracao,
    status_ocorrencia: (typeof raw.status_ocorrencia === 'string'
      ? raw.status_ocorrencia
      : 'pendente') as StatusOcorrencia,
    status_ponto: (typeof raw.status_ponto === 'string'
      ? raw.status_ponto
      : null) as StatusPonto | null,
    prazo_resolucao:
      typeof raw.prazo_resolucao === 'string' ? raw.prazo_resolucao : null,
  };
}

/**
 * Executa uma ação de moderação via RPC `public.executar_acao_moderacao` (KAN-81).
 * Permissões, matriz de transições e auditoria permanecem centralizadas no banco.
 */
export async function executarAcaoModeracao(
  params: ExecutarAcaoModeracaoParams
): Promise<ResultadoAcaoModeracao> {
  if (!isSupabaseConfigured) {
    throw new ErroAcaoModeracao(
      'nao_configurado',
      'Supabase não configurado. Configure as variáveis de ambiente para executar ações de moderação.'
    );
  }

  const { data, error } = await supabase.rpc('executar_acao_moderacao', {
    p_ocorrencia_id: params.ocorrenciaId,
    p_acao: params.acao,
    p_justificativa: params.justificativa.trim(),
    p_evidencia_path: params.evidenciaPath ?? null,
  });

  if (error) {
    throw mapearErroModeracao(error, params.evidenciaPath ?? undefined);
  }

  return parseResultadoRpc(data, params.acao);
}

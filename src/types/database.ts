/**
 * Tipos do banco de dados — alinhados 1:1 com o schema real do Supabase.
 * 
 * REGRA: Nunca inventar nomes. Usar exatamente o que existe no banco.
 * Os nomes de campos são snake_case conforme o PostgreSQL.
 */

// ═══════════════════════════════════════════════
// Enums do domínio (valores reais do banco)
// ═══════════════════════════════════════════════

export type StatusPonto =
  | 'novo'
  | 'em_confirmacao'
  | 'confirmado'
  | 'em_analise'
  | 'encaminhado'
  | 'resolvido'
  | 'invalido'
  | 'cancelado'
  | 'arquivado';

export type StatusOcorrencia =
  | 'pendente'
  | 'em_revisao'
  | 'aprovada'
  | 'rejeitada'
  | 'arquivada';

export type TipoOcorrencia = 'denuncia' | 'confirmacao';

export type PerfilTipo = 'cidadao' | 'analista' | 'gestor' | 'admin';

export type ModeracaoMotivo =
  | 'faixa_cinzenta'
  | 'foto_invalida'
  | 'spam'
  | 'localizacao_suspeita'
  | 'duplicata'
  | 'outro';

export type ModeracaoStatus = 'pendente' | 'aprovada' | 'rejeitada';

export type NotificacaoTipo =
  | 'status_ponto'
  | 'novo_ponto_critico'
  | 'confirmacao'
  | 'moderacao'
  | 'sistema';

export type CamadaTipo =
  | 'subprefeitura'
  | 'bairro'
  | 'zeis'
  | 'area_risco'
  | 'distrito';

export type CriticidadeClassificacao = 'baixa' | 'media' | 'alta' | 'critica';

// ═══════════════════════════════════════════════
// Interfaces das Views (o que o frontend consome)
// ═══════════════════════════════════════════════

/** v_pontos_publicos — mapa público, sem endereço ou coordenada real */
export interface PontoPublico {
  id: string;
  bairro: string | null;
  subprefeitura: string | null;
  categoria_principal: string | null;
  tipo_residuo: string | null;
  status: StatusPonto;
  recorrente: boolean;
  confirmacoes: number;
  criticidade: number | null;
  data_primeira_ocorrencia: string | null;
  data_ultima_ocorrencia: string | null;
  lat_aproximada: number;
  lng_aproximada: number;
  created_at: string;
}

/** v_pontos_autenticados — mapa autenticado, com coordenadas reais */
export interface PontoAutenticado {
  id: string;
  endereco: string | null;
  bairro: string | null;
  subprefeitura: string | null;
  categoria_principal: string | null;
  tipo_residuo: string | null;
  volume_estimado: string | null;
  frequencia_percebida: string | null;
  horario_percebido: string | null;
  status: StatusPonto;
  recorrente: boolean;
  validado: boolean;
  confirmacoes: number;
  criticidade: number | null;
  quantidade_ocorrencias: number;
  data_primeira_ocorrencia: string | null;
  data_ultima_ocorrencia: string | null;
  distancia_ecoponto_metros: number | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

/** v_pontos_gestor — tipado, sem UI nesta etapa */
export interface PontoGestor extends PontoAutenticado {
  total_denuncias: number;
  total_confirmacoes: number;
  ultima_foto_url: string | null;
}

/** v_dashboard_resumo — tipado, sem UI nesta etapa */
export interface DashboardResumo {
  total_pontos_ativos: number;
  novos_pontos: number;
  pontos_resolvidos: number;
  pontos_recorrentes: number;
  pontos_criticos: number;
}

// ═══════════════════════════════════════════════
// Interfaces de Tabelas (para inserts e reads)
// ═══════════════════════════════════════════════

export interface Perfil {
  id: string;
  nome: string | null;
  perfil: PerfilTipo;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean;
  reputacao: number;
  total_denuncias: number;
  created_at: string;
  cpf_hash: string | null;
  data_nascimento: string | null;
  rua: string | null;
  bairro_residencia: string | null;
}

export interface PerfilPublico {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  reputacao: number;
  total_denuncias: number;
  created_at: string;
}

export interface Ocorrencia {
  id: string;
  ponto_id: string | null;
  data_registro: string;
  descricao: string | null;
  foto_url: string | null;
  registrado_por: string;
  fonte: string | null;
  created_at: string;
  tipo_residuo: string | string[] | null;
  volume_estimado: string | null;
  frequencia_percebida: string | null;
  horario_percebido: string | null;
  latitude: number;
  longitude: number;
  geom: unknown;
  status: StatusOcorrencia;
  tipo: TipoOcorrencia;
  fotos: string[] | null;
  updated_at: string;
  categoria_principal: string | null;
  observacoes_revisao?: string | null;
  pontos_descarte?: { endereco: string | null; bairro: string | null; status: StatusPonto } | null;
}

/** Payload para inserir nova ocorrência */
export interface OcorrenciaInsert {
  ponto_id?: string | null;
  descricao?: string;
  registrado_por: string;
  fonte?: string;
  categoria_principal?: string;
  tipo_residuo?: string | string[];
  volume_estimado?: string;
  frequencia_percebida?: string;
  horario_percebido?: string;
  latitude: number;
  longitude: number;
  status: StatusOcorrencia;
  tipo: TipoOcorrencia;
  fotos?: string[];
}

export interface Confirmacao {
  id: string;
  ponto_id: string;
  usuario_id: string;
  latitude: number;
  longitude: number;
  geom: unknown;
  created_at: string;
}

/** Payload para inserir confirmação */
export interface ConfirmacaoInsert {
  ponto_id: string;
  usuario_id: string;
  latitude: number;
  longitude: number;
}

export interface Ecoponto {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  subprefeitura: string | null;
  tipo: string | null;
  horario_funcionamento: string | null;
  latitude: number;
  longitude: number;
  geom: unknown;
  ativo: boolean;
  propriedades: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CamadaTerritorial {
  id: string;
  nome: string;
  tipo: CamadaTipo;
  geom: unknown;
  propriedades: Record<string, unknown> | null;
  ativo: boolean;
  created_at: string;
}

export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  referencia_id: string | null;
  referencia_tipo: string | null;
  created_at: string;
}

export interface HistoricoStatusPonto {
  id: string;
  ponto_id: string;
  status_anterior: StatusPonto | null;
  status_novo: StatusPonto;
  alterado_por: string | null;
  motivo: string | null;
  created_at: string;
}

/**
 * Histórico de status do ponto para visualização do cidadão.
 * Propositalmente omite `alterado_por` — o cidadão não deve saber quem
 * alterou o status do ponto.
 */
export interface HistoricoStatusPontoCidadao {
  id: string;
  status_anterior: string | null;
  status_novo: string;
  motivo: string | null;
  created_at: string;
}

/** Dados completos de uma denúncia do cidadão, incluindo ponto e histórico. */
export interface DetalheDenuncia {
  id: string;
  ponto_id: string | null;
  data_registro: string;
  descricao: string | null;
  fotos: string[] | null;
  foto_url: string | null;
  tipo_residuo: string | string[] | null;
  volume_estimado: string | null;
  frequencia_percebida: string | null;
  horario_percebido: string | null;
  status: StatusOcorrencia;
  tipo: TipoOcorrencia;
  pontos_descarte: {
    id: string;
    endereco: string | null;
    bairro: string | null;
    subprefeitura: string | null;
    status: StatusPonto;
    confirmacoes: number;
    criticidade: number | null;
  } | null;
  historico: HistoricoStatusPontoCidadao[];
}

export interface ModeracaoOcorrencia {
  id: string;
  ocorrencia_id: string;
  motivo: ModeracaoMotivo;
  status: ModeracaoStatus;
  moderado_por: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface RateLimitDenuncia {
  id: string;
  usuario_id: string;
  data: string;
  quantidade: number;
}

export interface IndicadorDiario {
  id: string;
  data: string;
  novos_pontos: number;
  pontos_resolvidos: number;
  total_pontos_ativos: number;
  pontos_recorrentes: number;
  pontos_criticos: number;
  created_at: string;
}

// ═══════════════════════════════════════════════
// Retornos de funções RPC
// ═══════════════════════════════════════════════

/** Retorno de buscar_pontos_proximos(lat, lng, raio_metros) */
export interface PontoProximo {
  id: string;
  distancia_metros: number;
  status: StatusPonto;
  categoria_principal: string | null;
  confirmacoes: number;
  criticidade: number | null;
  recorrente: boolean;
}

/** Retorno de verificar_rate_limit(usuario_id) */
export interface RateLimitResult {
  permitido: boolean;
  quantidade: number;
  limite: number;
  restante: number;
}

// ═══════════════════════════════════════════════
// Configurações do sistema
// ═══════════════════════════════════════════════

export interface ConfiguracaoSistema {
  chave: string;
  valor: string;
  descricao: string | null;
  updated_at: string;
}

/** Configurações parseadas para uso no frontend */
export interface ConfiguracoesParseadas {
  raio_geofence_metros: number;
  raio_agrupamento_metros: number;
  raio_faixa_cinzenta_metros: number;
  confirmacoes_para_validar: number;
  limite_denuncias_por_dia: number;
  dias_visibilidade_resolvido: number;
  ruido_geolocalizacao_metros: number;
}

// ═══════════════════════════════════════════════
// Estado do filtro de mapa
// ═══════════════════════════════════════════════

export interface MapFilterState {
  categorias: string[];
  status: StatusPonto[];
}

// ═══════════════════════════════════════════════
// Draft de denúncia (frontend)
// ═══════════════════════════════════════════════

export interface ReportDraft {
  // Localização
  latitude: number;
  longitude: number;

  // Proximidade
  proximityResult: ProximityCheckResult | null;
  confirmingPointId: string | null;

  // Formulário
  categoria_principal: string;
  tipo_residuo: string;
  volume_estimado: string;
  frequencia_percebida: string;
  horario_percebido: string;
  descricao: string;

  // Fotos
  photos: File[];
  uploadedUrls: string[];
}

export interface ProximityCheckResult {
  scenario: 'confirmar' | 'faixa_cinzenta' | 'novo_ponto';
  nearbyPoints: PontoProximo[];
}

export const EMPTY_REPORT_DRAFT: ReportDraft = {
  latitude: 0,
  longitude: 0,
  proximityResult: null,
  confirmingPointId: null,
  categoria_principal: '',
  tipo_residuo: '',
  volume_estimado: '',
  frequencia_percebida: '',
  horario_percebido: '',
  descricao: '',
  photos: [],
  uploadedUrls: [],
};

// ═══════════════════════════════════════════════
// UI States (Gestão)
// ═══════════════════════════════════════════════

export interface PointDetailState {
  isChangingStatus: boolean;
  statusModalOpen: boolean;
  targetStatus: StatusPonto | null;
  statusReason: string;
}

export function classificarCriticidade(valor: number | null | undefined): CriticidadeClassificacao {
  if (!valor) return 'baixa';
  if (valor >= 75) return 'critica';
  if (valor >= 50) return 'alta';
  if (valor >= 25) return 'media';
  return 'baixa';
}


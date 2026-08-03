// Auth types
export type {
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthContextType,
} from './auth';

// User types
export type { User, UserMetadata } from './user';

// Database types (real Supabase schema)
export type {
  StatusPonto,
  StatusOcorrencia,
  TipoOcorrencia,
  PerfilTipo,
  ModeracaoMotivo,
  ModeracaoStatus,
  NotificacaoTipo,
  CamadaTipo,
  PontoPublico,
  PontoAutenticado,
  PontoGestor,
  DashboardResumo,
  Perfil,
  Ocorrencia,
  OcorrenciaInsert,
  Confirmacao,
  ConfirmacaoInsert,
  Ecoponto,
  CamadaTerritorial,
  Notificacao,
  HistoricoStatusPonto,
  ModeracaoOcorrencia,
  RateLimitDenuncia,
  IndicadorDiario,
  PontoProximo,
  RateLimitResult,
  ConfiguracaoSistema,
  ConfiguracoesParseadas,
  MapFilterState,
  ReportDraft,
  ProximityCheckResult,
  PerfilPublico,
  CriticidadeClassificacao,
  PointDetailState,
} from './database';
export { EMPTY_REPORT_DRAFT, classificarCriticidade } from './database';

// Presentation labels and colors
export {
  WASTE_CATEGORY_LABELS,
  WASTE_CATEGORY_COLORS,
  POINT_STATUS_LABELS,
  POINT_STATUS_VARIANTS,
  OCORRENCIA_STATUS_LABELS,
  FREQUENCY_LABELS,
  VOLUME_LABELS,
  TIME_LABELS,
  PIRITUBA_CENTER,
  DEFAULT_ZOOM,
  DETAIL_ZOOM,
  CRITICIDADE_LABELS,
  CRITICIDADE_COLORS,
  STATUS_TRANSITIONS,
} from './point';

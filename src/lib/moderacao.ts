import type {
  AcaoModeracao,
  CodigoErroModeracao,
  ItemFilaModeracao,
  ResultadoAcaoModeracao,
  StatusOcorrencia,
  StatusPonto,
} from '@/types';
import { OCORRENCIA_STATUS_LABELS, POINT_STATUS_LABELS } from '@/types';

export const MIN_JUSTIFICATIVA_CHARS = 10;

export interface AcaoModeracaoMetadata {
  acao: AcaoModeracao;
  label: string;
  titulo: string;
  descricao: string;
  confirmarLabel: string;
  buttonVariant: 'primary' | 'secondary' | 'danger' | 'outline';
  exigeFoto: boolean;
  avisoPreservacao: boolean;
  avisoProrrogacao: boolean;
}

export const ACAO_MODERACAO_META: Record<AcaoModeracao, AcaoModeracaoMetadata> = {
  aprovar: {
    acao: 'aprovar',
    label: 'Aprovar',
    titulo: 'Aprovar ocorrência',
    descricao:
      'Aprova a ocorrência pendente e confirma o ponto vinculado como novo para acompanhamento territorial.',
    confirmarLabel: 'Confirmar aprovação',
    buttonVariant: 'primary',
    exigeFoto: false,
    avisoPreservacao: false,
    avisoProrrogacao: false,
  },
  manter_em_analise: {
    acao: 'manter_em_analise',
    label: 'Manter em análise',
    titulo: 'Manter ocorrência em análise',
    descricao:
      'Coloca a ocorrência em revisão técnica para acompanhamento pela gestão. O status do ponto vinculado não é alterado.',
    confirmarLabel: 'Confirmar análise',
    buttonVariant: 'secondary',
    exigeFoto: false,
    avisoPreservacao: false,
    avisoProrrogacao: false,
  },
  invalidar: {
    acao: 'invalidar',
    label: 'Invalidar',
    titulo: 'Invalidar ocorrência',
    descricao:
      'Rejeita a ocorrência utilizando as evidências já enviadas pelo morador e arquiva o ponto vinculado ainda não confirmado.',
    confirmarLabel: 'Confirmar invalidação',
    buttonVariant: 'danger',
    exigeFoto: false,
    avisoPreservacao: true,
    avisoProrrogacao: false,
  },
  prorrogar: {
    acao: 'prorrogar',
    label: 'Prorrogar prazo',
    titulo: 'Prorrogar prazo de resolução',
    descricao:
      'Estende o prazo de resolução mantendo a ocorrência no estado atual para continuidade do atendimento.',
    confirmarLabel: 'Confirmar prorrogação',
    buttonVariant: 'outline',
    exigeFoto: false,
    avisoPreservacao: false,
    avisoProrrogacao: true,
  },
  resolver: {
    acao: 'resolver',
    label: 'Resolver',
    titulo: 'Resolver ocorrência',
    descricao:
      'Aprova a ocorrência com comprovação fotográfica da gestão e marca o ponto vinculado como resolvido.',
    confirmarLabel: 'Confirmar resolução',
    buttonVariant: 'primary',
    exigeFoto: true,
    avisoPreservacao: false,
    avisoProrrogacao: false,
  },
  arquivar: {
    acao: 'arquivar',
    label: 'Arquivar',
    titulo: 'Arquivar ocorrência',
    descricao:
      'Encerra a ocorrência aprovada e arquiva o ponto vinculado, preservando todo o histórico e as evidências.',
    confirmarLabel: 'Confirmar arquivamento',
    buttonVariant: 'secondary',
    exigeFoto: false,
    avisoPreservacao: true,
    avisoProrrogacao: false,
  },
};

const ESTADOS_FINAIS_OCORRENCIA: ReadonlySet<StatusOcorrencia> = new Set([
  'rejeitada',
  'arquivada',
]);

export function estadoOcorrenciaEhFinal(status: StatusOcorrencia): boolean {
  return ESTADOS_FINAIS_OCORRENCIA.has(status);
}

const ESTADOS_PONTO_PRE_CONFIRMACAO: ReadonlySet<StatusPonto> = new Set([
  'novo',
  'em_confirmacao',
  'em_analise',
]);

export function pontoPermiteInvalidacao(statusPonto: StatusPonto | null): boolean {
  return statusPonto !== null && ESTADOS_PONTO_PRE_CONFIRMACAO.has(statusPonto);
}

export function obterAcoesDisponiveis(params: {
  statusOcorrencia: StatusOcorrencia;
  statusPonto: StatusPonto | null;
  prorrogadoEm: string | null;
}): AcaoModeracao[] {
  const { statusOcorrencia, statusPonto, prorrogadoEm } = params;

  if (estadoOcorrenciaEhFinal(statusOcorrencia)) {
    return [];
  }

  switch (statusOcorrencia) {
    case 'pendente': {
      const acoes: AcaoModeracao[] = ['aprovar', 'manter_em_analise'];
      if (pontoPermiteInvalidacao(statusPonto)) {
        acoes.push('invalidar');
      }
      if (!prorrogadoEm) {
        acoes.push('prorrogar');
      }
      return acoes;
    }
    case 'em_revisao': {
      const acoes: AcaoModeracao[] = ['resolver'];
      if (!prorrogadoEm) {
        acoes.push('prorrogar');
      }
      return acoes;
    }
    case 'aprovada':
      return ['arquivar'];
    default:
      return [];
  }
}

export function validarJustificativa(texto: string): string | null {
  const limpa = texto.trim();
  if (!limpa) {
    return 'Preencha a justificativa antes de continuar.';
  }
  if (limpa.length < MIN_JUSTIFICATIVA_CHARS) {
    return `A justificativa deve ter pelo menos ${MIN_JUSTIFICATIVA_CHARS} caracteres.`;
  }
  return null;
}

/** Erro tipado emitido pela camada de serviço e pelo hook de moderação (KAN-81). */
export class ErroAcaoModeracao extends Error {
  readonly codigo: CodigoErroModeracao;
  readonly mensagemOriginal?: string;
  readonly dbCode?: string;
  readonly evidenciaOrfaPath?: string;

  constructor(
    codigo: CodigoErroModeracao,
    message: string,
    options?: {
      mensagemOriginal?: string;
      dbCode?: string;
      evidenciaOrfaPath?: string;
      cause?: unknown;
    }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ErroAcaoModeracao';
    this.codigo = codigo;
    this.mensagemOriginal = options?.mensagemOriginal;
    this.dbCode = options?.dbCode;
    this.evidenciaOrfaPath = options?.evidenciaOrfaPath;
  }
}

function normalizarTextoErro(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extrairDetalhesErro(erro: unknown): {
  rawMessage: string;
  dbCode?: string;
} {
  if (typeof erro === 'string') {
    return { rawMessage: erro };
  }
  if (erro && typeof erro === 'object') {
    const obj = erro as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const partes = [obj.message, obj.details, obj.hint].filter(
      (parte): parte is string => typeof parte === 'string' && parte.trim().length > 0
    );
    return {
      rawMessage: partes.join(' | '),
      dbCode: typeof obj.code === 'string' ? obj.code : undefined,
    };
  }
  return { rawMessage: '' };
}

/**
 * Converte erros da RPC `public.executar_acao_moderacao` (e erros de validação/upload)
 * em mensagens claras em português para a interface.
 */
export function mapearErroModeracao(
  erro: unknown,
  evidenciaOrfaPath?: string
): ErroAcaoModeracao {
  if (erro instanceof ErroAcaoModeracao) {
    if (evidenciaOrfaPath && !erro.evidenciaOrfaPath) {
      return new ErroAcaoModeracao(erro.codigo, erro.message, {
        mensagemOriginal: erro.mensagemOriginal,
        dbCode: erro.dbCode,
        evidenciaOrfaPath,
        cause: erro,
      });
    }
    return erro;
  }

  const { rawMessage, dbCode } = extrairDetalhesErro(erro);
  const norm = normalizarTextoErro(rawMessage);

  if (
    dbCode === '42501' ||
    norm.includes('apenas gestao') ||
    norm.includes('permission denied') ||
    norm.includes('permissao insuficiente') ||
    norm.includes('nao autorizado')
  ) {
    return new ErroAcaoModeracao(
      'sem_permissao',
      'Permissão insuficiente: apenas perfis de gestão podem executar ações de moderação.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  if (
    norm.includes('prorrogacao ja foi utilizada') ||
    norm.includes('ja foi prorrogada') ||
    norm.includes('prorrogacao unica')
  ) {
    return new ErroAcaoModeracao(
      'prorrogacao_utilizada',
      'Esta ocorrência já foi prorrogada e não permite nova prorrogação.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  if (
    norm.includes('invalidacao so e permitida') ||
    norm.includes('nao esta mais em analise') ||
    norm.includes('nao esta em analise') ||
    norm.includes('nao esta em_analise') ||
    norm.includes('antes da confirmacao') ||
    (norm.includes('ponto') &&
      (norm.includes('em_analise') || norm.includes('em analise') || norm.includes('confirmado')))
  ) {
    return new ErroAcaoModeracao(
      'invalidacao_fora_analise',
      'A invalidação é permitida apenas para ocorrências vinculadas a pontos ainda não confirmados.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  if (
    norm.includes('foto e obrigatoria') ||
    norm.includes('evidencia') && norm.includes('obrigatori') ||
    norm.includes('p_evidencia_path')
  ) {
    return new ErroAcaoModeracao(
      'foto_obrigatoria',
      'Anexe a foto de resolução antes de concluir esta ação.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  if (norm.includes('justificativa') && (norm.includes('obrigatoria') || norm.includes('vazia'))) {
    return new ErroAcaoModeracao(
      'justificativa_obrigatoria',
      'Preencha a justificativa antes de confirmar a ação.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  if (
    norm.includes('transicao invalida') ||
    norm.includes('estado atual') ||
    norm.includes('nao permitida')
  ) {
    return new ErroAcaoModeracao(
      'transicao_invalida',
      'Ação não disponível para o estado atual da ocorrência. Atualize os dados e tente novamente.',
      { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
    );
  }

  return new ErroAcaoModeracao(
    'desconhecido',
    'Não foi possível executar a ação de moderação. Tente novamente em instantes.',
    { mensagemOriginal: rawMessage, dbCode, evidenciaOrfaPath, cause: erro }
  );
}

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_POR_MINUTO = 60 * 1000;
const MS_POR_HORA = 60 * MS_POR_MINUTO;
const MS_POR_DIA = 24 * MS_POR_HORA;

export interface ParsedDataSegura {
  date: Date;
  semHorario: boolean;
}

/**
 * Faz o parse de datas ISO ou puras (`YYYY-MM-DD`) com segurança, preservando o dia
 * civil de datas sem horário contra deslocamento por fuso e rejeitando datas inválidas.
 */
export function parsearDataSegura(valor: string | null | undefined): ParsedDataSegura | null {
  if (!valor) return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;

  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return { date, semHorario: true };
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return { date, semHorario: false };
}

export function formatarDataCurta(iso: string | null | undefined): string | null {
  const parsed = parsearDataSegura(iso);
  if (!parsed) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(parsed.semHorario ? { timeZone: 'UTC' } : {}),
  }).format(parsed.date);
}

export function formatarDataHoraCurta(iso: string | null | undefined): string | null {
  const parsed = parsearDataSegura(iso);
  if (!parsed) return null;
  if (parsed.semHorario) {
    return formatarDataCurta(iso);
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed.date);
}

/**
 * Calcula tempo decorrido de forma segura para triagem. Retorna `null` para datas
 * inválidas ou futuras, sem inventar valor quando o dado não é confiável.
 */
export function formatarTempoDecorrido(
  iso: string | null | undefined,
  agora: Date = new Date()
): string | null {
  const parsed = parsearDataSegura(iso);
  if (!parsed) return null;

  if (parsed.semHorario) {
    const hojeUtcMeioDia = Date.UTC(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
      12,
      0,
      0
    );
    const diffDias = Math.round((hojeUtcMeioDia - parsed.date.getTime()) / MS_POR_DIA);
    if (diffDias < 0) return null;
    if (diffDias === 0) return 'hoje';
    if (diffDias === 1) return 'ontem';
    return `há ${diffDias} dias`;
  }

  const diffMs = agora.getTime() - parsed.date.getTime();
  if (diffMs < -MS_POR_MINUTO) return null;
  if (diffMs < MS_POR_MINUTO) return 'agora há pouco';
  if (diffMs < MS_POR_HORA) {
    const minutos = Math.floor(diffMs / MS_POR_MINUTO);
    return `há ${minutos} min`;
  }
  if (diffMs < MS_POR_DIA) {
    const horas = Math.floor(diffMs / MS_POR_HORA);
    return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
  }
  const dias = Math.floor(diffMs / MS_POR_DIA);
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}

export function formatarMensagemSucessoAcao(resultado: ResultadoAcaoModeracao): string {
  const statusOc = OCORRENCIA_STATUS_LABELS[resultado.status_ocorrencia] ?? resultado.status_ocorrencia;
  const statusPonto = resultado.status_ponto
    ? POINT_STATUS_LABELS[resultado.status_ponto] ?? resultado.status_ponto
    : null;

  switch (resultado.acao) {
    case 'aprovar':
      return `Ocorrência ${statusOc.toLowerCase()}${statusPonto ? ` e ponto marcado como ${statusPonto}` : ''}.`;
    case 'manter_em_analise':
      return `Ocorrência movida para ${statusOc}. O histórico foi registrado.`;
    case 'invalidar':
      return `Ocorrência marcada como ${statusOc}${statusPonto ? ` e ponto alterado para ${statusPonto}` : ''}.`;
    case 'prorrogar': {
      const novoPrazo = formatarDataCurta(resultado.prazo_resolucao);
      return novoPrazo
        ? `Prazo prorrogado em 30 dias. Novo vencimento: ${novoPrazo}.`
        : 'Prazo prorrogado em 30 dias com sucesso.';
    }
    case 'resolver':
      return `Ocorrência concluída (${statusOc})${statusPonto ? ` e ponto marcado como ${statusPonto}` : ''} com foto de resolução.`;
    case 'arquivar':
      return `Ocorrência ${statusOc.toLowerCase()}${statusPonto ? ` e ponto alterado para ${statusPonto}` : ''}.`;
    default:
      return 'Ação de moderação registrada com sucesso.';
  }
}

/**
 * Ordenação padrão da Fila de Moderação (KAN-76):
 * sinais de reincidência, possível duplicata e faixa cinzenta vêm primeiro,
 * preservando itens sem sinal e ordenando cronologicamente por `data_registro` ASC.
 */
export function ordenarFilaModeracao<T extends Pick<
  ItemFilaModeracao,
  'sinal_reincidencia' | 'sinal_duplicata' | 'sinal_faixa_cinzenta' | 'data_registro'
>>(itens: readonly T[]): T[] {
  return [...itens].sort((a, b) => {
    const reincidenciaDiff = Number(b.sinal_reincidencia) - Number(a.sinal_reincidencia);
    if (reincidenciaDiff !== 0) return reincidenciaDiff;

    const duplicataDiff = Number(b.sinal_duplicata) - Number(a.sinal_duplicata);
    if (duplicataDiff !== 0) return duplicataDiff;

    const faixaDiff = Number(b.sinal_faixa_cinzenta) - Number(a.sinal_faixa_cinzenta);
    if (faixaDiff !== 0) return faixaDiff;

    return Date.parse(a.data_registro) - Date.parse(b.data_registro);
  });
}

export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radianos = Math.PI / 180;
  const rTerra = 6_371_000;
  const dLat = (lat2 - lat1) * radianos;
  const dLon = (lon2 - lon1) * radianos;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * radianos) *
      Math.cos(lat2 * radianos) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * rTerra * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

import { formatarDataCurta } from './moderacao';
import type {
  AlertaPrazo,
  ConfiguracaoAlertaPrazo,
  StatusOcorrencia,
} from '@/types';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const CICLO_PADRAO_DIAS = 30;

/**
 * Faz o parse da lista de dias de alerta configurada em `configuracoes_sistema`
 * (ex: `"20,27"` ou `"[20, 27]"`). Não fixa valores padrão de dias no código.
 */
export function parsearDiasAlertaConfig(raw?: string | null): number[] {
  if (!raw) return [];
  const limpo = raw.trim();
  if (!limpo) return [];

  let candidatos: unknown[];
  if (limpo.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(limpo);
      candidatos = Array.isArray(parsed) ? parsed : [];
    } catch {
      candidatos = limpo.split(/[,;\s]+/);
    }
  } else {
    candidatos = limpo.split(/[,;\s]+/);
  }

  const unicos = new Set<number>();
  for (const item of candidatos) {
    const num = Number(item);
    if (Number.isInteger(num) && num > 0) {
      unicos.add(num);
    }
  }

  return [...unicos].sort((a, b) => a - b);
}

export function parsearConfiguracaoAlertaPrazo(
  alertaPrazoRaw?: string | null,
  cicloDiasRaw?: string | null
): ConfiguracaoAlertaPrazo {
  const diasAlerta = parsearDiasAlertaConfig(alertaPrazoRaw);
  if (diasAlerta.length === 0) {
    return { diasAlerta: [], cicloDias: null };
  }

  const parsedCiclo = cicloDiasRaw ? Number(cicloDiasRaw.trim()) : NaN;
  const cicloDias =
    Number.isInteger(parsedCiclo) && parsedCiclo > 0
      ? parsedCiclo
      : CICLO_PADRAO_DIAS;

  return { diasAlerta, cicloDias };
}

function parsearPrazoResolucao(prazoResolucao: string): number | null {
  const trimmed = prazoResolucao.trim();
  if (!trimmed) return null;

  // Datas sem horário (YYYY-MM-DD) consideram o final do dia UTC para evitar vencimento antecipado
  const isoNormalizado = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T23:59:59.999Z`
    : trimmed;

  const ms = Date.parse(isoNormalizado);
  return Number.isNaN(ms) ? null : ms;
}

const STATUS_ATIVOS_PRAZO: ReadonlySet<StatusOcorrencia> = new Set([
  'pendente',
  'em_revisao',
]);

/**
 * Calcula o alerta de prazo com base exclusivamente em `prazo_resolucao` e nos
 * dias configurados em `configuracoes_sistema`.
 */
export function calcularAlertaPrazo(params: {
  prazoResolucao: string | null | undefined;
  statusOcorrencia: StatusOcorrencia;
  config: ConfiguracaoAlertaPrazo;
  agora?: Date;
}): AlertaPrazo | null {
  const { prazoResolucao, statusOcorrencia, config, agora = new Date() } = params;

  if (!STATUS_ATIVOS_PRAZO.has(statusOcorrencia)) {
    return null;
  }
  if (!prazoResolucao || config.diasAlerta.length === 0 || !config.cicloDias) {
    return null;
  }

  const prazoMs = parsearPrazoResolucao(prazoResolucao);
  if (prazoMs === null) {
    return null;
  }

  const agoraMs = agora.getTime();
  const inicioCicloMs = prazoMs - config.cicloDias * MS_POR_DIA;
  const diaCiclo = Math.max(0, Math.floor((agoraMs - inicioCicloMs) / MS_POR_DIA));

  if (agoraMs > prazoMs) {
    const diasAtraso = Math.max(1, Math.ceil((agoraMs - prazoMs) / MS_POR_DIA));
    return {
      nivel: 'vencido',
      diaCiclo,
      diaAlerta: config.diasAlerta[config.diasAlerta.length - 1] ?? null,
      diasRestantes: -diasAtraso,
      prazo: prazoResolucao,
    };
  }

  const diasRestantes = Math.max(0, Math.ceil((prazoMs - agoraMs) / MS_POR_DIA));

  let diaAlertaAtingido: number | null = null;
  for (const diaConfigurado of config.diasAlerta) {
    if (diaCiclo >= diaConfigurado) {
      diaAlertaAtingido = diaConfigurado;
    }
  }

  if (diaAlertaAtingido === null) {
    return null;
  }

  const ultimoLimiar = config.diasAlerta[config.diasAlerta.length - 1];
  const ehLimiarCritico =
    config.diasAlerta.length > 1 && diaAlertaAtingido === ultimoLimiar;

  return {
    nivel: ehLimiarCritico ? 'critico' : 'atencao',
    diaCiclo,
    diaAlerta: diaAlertaAtingido,
    diasRestantes,
    prazo: prazoResolucao,
  };
}

export function formatarMensagemAlertaPrazo(alerta: AlertaPrazo): {
  titulo: string;
  descricao: string;
} {
  const dataPrazo = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(alerta.prazo.trim())
      ? `${alerta.prazo.trim()}T23:59:59.999Z`
      : alerta.prazo
  );
  const prazoFormatado = Number.isNaN(dataPrazo.getTime())
    ? alerta.prazo
    : formatarDataCurta(
        /^\d{4}-\d{2}-\d{2}$/.test(alerta.prazo.trim()) ? alerta.prazo.trim() : dataPrazo.toISOString()
      ) ?? alerta.prazo;

  if (alerta.nivel === 'vencido') {
    const atraso = Math.abs(alerta.diasRestantes);
    return {
      titulo: `Prazo de resolução vencido (${atraso} ${atraso === 1 ? 'dia' : 'dias'} em atraso)`,
      descricao: `O vencimento ocorreu em ${prazoFormatado} (dia ${alerta.diaCiclo} do ciclo). Regularize ou conclua a ocorrência.`,
    };
  }

  const diasTexto =
    alerta.diasRestantes === 0
      ? 'Vence hoje'
      : `Restam ${alerta.diasRestantes} ${alerta.diasRestantes === 1 ? 'dia' : 'dias'}`;

  if (alerta.nivel === 'critico') {
    return {
      titulo: `Alerta crítico: ${alerta.diaAlerta ?? alerta.diaCiclo}º dia do ciclo`,
      descricao: `${diasTexto} até o vencimento em ${prazoFormatado}.`,
    };
  }

  return {
    titulo: `Alerta de prazo: ${alerta.diaAlerta ?? alerta.diaCiclo}º dia do ciclo`,
    descricao: `${diasTexto} até o vencimento em ${prazoFormatado}.`,
  };
}

export interface ResumoPrazo {
  status: 'ausente' | 'vigente' | 'hoje' | 'vencido' | 'encerrado';
  dataFormatada: string | null;
  diasRestantes: number | null;
  textoPrincipal: string;
  alerta: AlertaPrazo | null;
}

/**
 * Resumo legível de `prazo_resolucao` usando a mesma regra de parsing e dias do ciclo
 * aplicada por `calcularAlertaPrazo`.
 */
export function calcularResumoPrazo(params: {
  prazoResolucao: string | null | undefined;
  statusOcorrencia: StatusOcorrencia;
  config: ConfiguracaoAlertaPrazo;
  agora?: Date;
}): ResumoPrazo {
  const { prazoResolucao, statusOcorrencia, config, agora = new Date() } = params;

  if (!prazoResolucao) {
    return {
      status: 'ausente',
      dataFormatada: null,
      diasRestantes: null,
      textoPrincipal: 'Prazo não informado',
      alerta: null,
    };
  }

  const prazoMs = parsearPrazoResolucao(prazoResolucao);
  const dataFormatada = formatarDataCurta(prazoResolucao);
  if (prazoMs === null || !dataFormatada) {
    return {
      status: 'ausente',
      dataFormatada: null,
      diasRestantes: null,
      textoPrincipal: 'Prazo não informado',
      alerta: null,
    };
  }

  if (!STATUS_ATIVOS_PRAZO.has(statusOcorrencia)) {
    return {
      status: 'encerrado',
      dataFormatada,
      diasRestantes: null,
      textoPrincipal: dataFormatada,
      alerta: null,
    };
  }

  const alerta = calcularAlertaPrazo({
    prazoResolucao,
    statusOcorrencia,
    config,
    agora,
  });

  const agoraMs = agora.getTime();
  if (agoraMs > prazoMs) {
    const diasAtraso = Math.max(1, Math.ceil((agoraMs - prazoMs) / MS_POR_DIA));
    return {
      status: 'vencido',
      dataFormatada,
      diasRestantes: -diasAtraso,
      textoPrincipal: `Prazo vencido há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`,
      alerta,
    };
  }

  const diasRestantes = Math.max(0, Math.ceil((prazoMs - agoraMs) / MS_POR_DIA));
  if (diasRestantes === 0) {
    return {
      status: 'hoje',
      dataFormatada,
      diasRestantes: 0,
      textoPrincipal: 'Vence hoje',
      alerta,
    };
  }

  return {
    status: 'vigente',
    dataFormatada,
    diasRestantes,
    textoPrincipal: `Vence em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`,
    alerta,
  };
}

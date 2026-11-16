/**
 * KAN-79 / F4.3 — Ações de moderação da gestão.
 *
 * Contrato do frontend com a RPC `public.executar_acao_moderacao`
 * (migration 026_fix_kan82_moderacao_rpc). Regras de negócio, permissões,
 * transições e auditoria vivem exclusivamente no banco.
 */

import type { StatusOcorrencia, StatusPonto } from './database';

/** Ações de moderação suportadas pela matriz vigente (`public.transicoes_moderacao`). */
export type AcaoModeracao =
  | 'aprovar'
  | 'manter_em_analise'
  | 'invalidar'
  | 'resolver'
  | 'arquivar'
  | 'prorrogar';

/** Parâmetros aceitos por `executarAcaoModeracao` (camada de serviço). */
export interface ExecutarAcaoModeracaoParams {
  ocorrenciaId: string;
  acao: AcaoModeracao;
  justificativa: string;
  /** Caminho no bucket privado de resolução. Obrigatório apenas para `resolver`. */
  evidenciaPath?: string | null;
}

/** Retorno jsonb da RPC. `prazo_resolucao` só é enviado em `prorrogar`. */
export interface ResultadoAcaoModeracao {
  sucesso: boolean;
  acao: AcaoModeracao;
  status_ocorrencia: StatusOcorrencia;
  status_ponto: StatusPonto | null;
  prazo_resolucao?: string | null;
}

/** Códigos de erro estáveis usados pela interface (independentes do texto do banco). */
export type CodigoErroModeracao =
  | 'sem_permissao'
  | 'transicao_invalida'
  | 'justificativa_obrigatoria'
  | 'foto_obrigatoria'
  | 'prorrogacao_utilizada'
  | 'invalidacao_fora_analise'
  | 'arquivo_invalido'
  | 'upload_falhou'
  | 'nao_configurado'
  | 'desconhecido';

/** Etapas do fluxo de envio, para feedback de progresso no modal. */
export type EtapaAcaoModeracao = 'preparando_foto' | 'enviando_foto' | 'registrando_acao';

/** Entrada do hook `useExecutarAcaoModeracao`. */
export interface ExecutarAcaoModeracaoInput {
  ocorrenciaId: string;
  /** Usado apenas para invalidar caches específicos do ponto. */
  pontoId?: string | null;
  acao: AcaoModeracao;
  justificativa: string;
  /** Foto original selecionada pela gestão (somente `resolver`). */
  fotoResolucao?: File | null;
}

/**
 * Dados mínimos de uma ocorrência para decidir quais ações exibir e montar o
 * resumo do modal. Propositalmente não contém nenhum dado pessoal do cidadão.
 */
export interface ContextoOcorrenciaModeracao {
  ocorrenciaId: string;
  pontoId: string | null;
  statusOcorrencia: StatusOcorrencia;
  statusPonto: StatusPonto | null;
  categoria: string | null;
  endereco: string | null;
  bairro: string | null;
  dataRegistro: string;
  prazoResolucao: string | null;
  prorrogadoEm: string | null;
}

/**
 * Item da Fila de Moderação (KAN-76 / F4.1).
 *
 * Representa uma ocorrência com `status = 'pendente'` vinda diretamente de
 * `public.ocorrencias LEFT JOIN public.pontos_descarte` (sem filtro por sinal
 * e sem `registrado_por` ou qualquer dado pessoal).
 */
export interface ItemFilaModeracao {
  id: string;
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
  categoria_principal: string | null;
  ponto_id: string | null;
  endereco: string | null;
  bairro: string | null;
  subprefeitura: string | null;
  ponto_status: StatusPonto | null;
  confirmacoes: number | null;
  sinal_duplicata: boolean;
  sinal_faixa_cinzenta: boolean;
  sinal_reincidencia: boolean;
  sinal_limite_diario: boolean;
}

// ── Alertas de prazo ──

/** Lido de `configuracoes_sistema` (`alerta_prazo_dias`, `prazo_ciclo_dias`). */
export interface ConfiguracaoAlertaPrazo {
  /** Dias do ciclo que disparam alerta, em ordem crescente. Vazio = alertas desligados. */
  diasAlerta: number[];
  /** Duração do ciclo de resolução em dias. `null` = alertas desligados. */
  cicloDias: number | null;
}

export type NivelAlertaPrazo = 'atencao' | 'critico' | 'vencido';

export interface AlertaPrazo {
  nivel: NivelAlertaPrazo;
  /** Dias completos decorridos desde o início do ciclo (prazo − duração). */
  diaCiclo: number;
  /** Dia de alerta configurado que foi atingido (null quando vencido sem alerta). */
  diaAlerta: number | null;
  /** Dias inteiros restantes até o prazo (negativo quando vencido). */
  diasRestantes: number;
  prazo: string;
}

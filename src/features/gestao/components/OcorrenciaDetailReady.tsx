import { useState } from 'react';
import { OcorrenciaDetailView } from './OcorrenciaDetailView';
import { OcorrenciaDetailMap } from './OcorrenciaDetailMap';
import { OcorrenciaEvidenceGallery } from './OcorrenciaEvidenceGallery';
import { PrazoAlertaBadge } from './PrazoAlertaBadge';
import { AcaoModeracaoDialog } from './AcaoModeracaoDialog';
import { Alert, Badge, Button } from '@/components/ui';
import {
  ACAO_MODERACAO_META,
  estadoOcorrenciaEhFinal,
  formatarDataCurta,
  formatarDataHoraCurta,
  formatarMensagemSucessoAcao,
  obterAcoesDisponiveis,
  pontoPermiteInvalidacao,
} from '@/lib/moderacao';
import { OCORRENCIA_STATUS_LABELS, POINT_STATUS_LABELS } from '@/types';
import type {
  AcaoModeracao,
  ContextoOcorrenciaModeracao,
  ModeracaoStatus,
  OcorrenciaDetalheGestao,
  ResultadoAcaoModeracao,
} from '@/types';

function formatDateTime(value: string) {
  return formatarDataHoraCurta(value) ?? 'Data indisponível';
}

const MODERACAO_STATUS_LABELS: Record<ModeracaoStatus, string> = {
  pendente: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Invalidada',
};

const MODERACAO_STATUS_VARIANTS: Record<ModeracaoStatus, 'warning' | 'success' | 'danger'> = {
  pendente: 'warning',
  aprovada: 'success',
  rejeitada: 'danger',
};

const MODERACAO_MOTIVO_LABELS: Record<string, string> = {
  faixa_cinzenta: 'Faixa cinzenta',
  foto_invalida: 'Foto inválida',
  spam: 'Suspeita de spam',
  localizacao_suspeita: 'Localização suspeita',
  duplicata: 'Possível duplicata',
  outro: 'Outro motivo',
};

interface OcorrenciaDetailReadyProps {
  detalhe: OcorrenciaDetalheGestao;
  pontoId?: string;
}

export function OcorrenciaDetailReady({ detalhe, pontoId }: OcorrenciaDetailReadyProps) {
  const [acaoSelecionada, setAcaoSelecionada] = useState<AcaoModeracao | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);

  const confirmacoes = detalhe.confirmacoes_distintas_ponto;
  const statusOcorrencia = detalhe.ocorrencia.status;
  const statusPonto = detalhe.ponto?.status ?? null;
  const prorrogadoEm = detalhe.ocorrencia.prorrogado_em ?? null;
  const ehFinal = estadoOcorrenciaEhFinal(statusOcorrencia);
  const acoesDisponiveis = obterAcoesDisponiveis({
    statusOcorrencia,
    statusPonto,
    prorrogadoEm,
  });

  const contextoModal: ContextoOcorrenciaModeracao = {
    ocorrenciaId: detalhe.ocorrencia.id,
    pontoId: detalhe.ponto?.id ?? detalhe.ocorrencia.ponto_id ?? null,
    statusOcorrencia,
    statusPonto,
    categoria: detalhe.ocorrencia.categoria_principal,
    endereco: detalhe.ponto?.endereco ?? null,
    bairro: detalhe.ponto?.bairro ?? null,
    dataRegistro: detalhe.ocorrencia.data_registro,
    prazoResolucao: detalhe.ocorrencia.prazo_resolucao,
    prorrogadoEm,
  };

  const moderacoes = detalhe.moderacoes ?? [];
  const temHistorico = detalhe.historico_ponto.length > 0 || moderacoes.length > 0;
  const prorrogadoLabel = formatarDataCurta(prorrogadoEm);

  const handleSuccess = (resultado: ResultadoAcaoModeracao) => {
    setFeedbackSucesso(formatarMensagemSucessoAcao(resultado));
  };

  return (
    <>
      <OcorrenciaDetailView
        ocorrenciaId={detalhe.ocorrencia.id}
        pontoId={pontoId}
        state={{ status: 'ready', data: detalhe }}
        alertaPrazo={
          <PrazoAlertaBadge
            prazoResolucao={detalhe.ocorrencia.prazo_resolucao}
            statusOcorrencia={statusOcorrencia}
            variant="banner"
          />
        }
        registrosRelacionados={
          <div className="space-y-2 rounded-lg bg-surface-50 p-4 text-sm text-surface-600">
            <p>
              <strong className="text-surface-900">{detalhe.ponto?.quantidade_ocorrencias ?? 0}</strong>{' '}
              ocorrências registradas neste ponto.
            </p>
            {pontoId && <p>Esta tela exibe a ocorrência mais recente associada ao ponto.</p>}
            <p>A quantidade de ciclos anteriores ainda não existe no modelo atual do banco.</p>
          </div>
        }
        confirmacoes={
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-surface-900">
              {confirmacoes}{' '}
              <span className="text-sm font-normal text-surface-600">
                {confirmacoes === 1 ? 'pessoa distinta confirmou este ponto' : 'pessoas distintas confirmaram este ponto'}
              </span>
            </p>
            <progress
              className="h-3 w-full accent-primary-700"
              value={Math.min(confirmacoes, 4)}
              max={4}
              aria-label="Progresso de confirmações distintas do ponto até quatro"
            />
            <p className="text-sm text-surface-600">
              {confirmacoes >= 4 ? 'O ponto atingiu 4 confirmações.' : `Faltam ${4 - confirmacoes} para chegar a 4.`}{' '}
              O banco atual não identifica o ciclo de cada confirmação; esta contagem considera todo o histórico do ponto.
            </p>
          </div>
        }
        evidencias={
          <OcorrenciaEvidenceGallery
            ocorrenciaId={detalhe.ocorrencia.id}
            paths={detalhe.evidencias_paths}
          />
        }
        mapa={
          <OcorrenciaDetailMap
            latitude={detalhe.ocorrencia.latitude}
            longitude={detalhe.ocorrencia.longitude}
          />
        }
        historico={
          temHistorico ? (
            <div className="space-y-6">
              {moderacoes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-surface-800">
                    Decisões de moderação da ocorrência
                  </h3>
                  <ol className="space-y-4 border-l-2 border-info-200 pl-5">
                    {moderacoes.map((mod) => (
                      <li key={mod.id} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-7 top-1 h-3 w-3 rounded-full bg-info-500"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-surface-500">
                            {formatDateTime(mod.updated_at || mod.created_at)}
                          </span>
                          <Badge variant={MODERACAO_STATUS_VARIANTS[mod.status]}>
                            {MODERACAO_STATUS_LABELS[mod.status]}
                          </Badge>
                          <span className="text-xs text-surface-500">
                            {MODERACAO_MOTIVO_LABELS[mod.motivo] ?? mod.motivo}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-surface-700">
                          {mod.observacao || 'Sem justificativa registrada.'}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {detalhe.historico_ponto.length > 0 && (
                <div className="space-y-3">
                  {moderacoes.length > 0 && (
                    <h3 className="text-sm font-semibold text-surface-800">
                      Transições do ponto vinculado
                    </h3>
                  )}
                  <ol className="space-y-5 border-l-2 border-primary-100 pl-5">
                    {detalhe.historico_ponto.map((evento) => (
                      <li key={evento.id} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-7 top-1 h-3 w-3 rounded-full bg-primary-700"
                        />
                        <p className="text-xs text-surface-500">{formatDateTime(evento.created_at)}</p>
                        <h4 className="mt-1 font-semibold text-surface-900">
                          {evento.status_anterior ? `${POINT_STATUS_LABELS[evento.status_anterior]} → ` : ''}
                          {POINT_STATUS_LABELS[evento.status_novo]}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-surface-600">
                          {evento.motivo || 'Sem justificativa registrada.'}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-600">
              Nenhuma transição de status ou decisão de moderação foi encontrada até o momento.
            </p>
          )
        }
        moderacao={
          <div className="space-y-4">
            {feedbackSucesso && (
              <Alert variant="success" title="Ação de moderação concluída">
                <p>{feedbackSucesso}</p>
              </Alert>
            )}

            {ehFinal ? (
              <p className="text-sm leading-relaxed text-surface-600">
                Esta ocorrência está em estado final ({OCORRENCIA_STATUS_LABELS[statusOcorrencia]}) e
                não aceita novas ações de moderação.
              </p>
            ) : acoesDisponiveis.length === 0 ? (
              <p className="text-sm leading-relaxed text-surface-600">
                Nenhuma ação de moderação está disponível para o estado atual desta ocorrência.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-surface-600">
                  Selecione uma ação compatível com o estado atual ({OCORRENCIA_STATUS_LABELS[statusOcorrencia]}).
                  Todas as decisões exigem justificativa e são registradas de forma auditável no servidor.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {acoesDisponiveis.map((acao) => {
                    const meta = ACAO_MODERACAO_META[acao];
                    return (
                      <Button
                        key={acao}
                        type="button"
                        variant={meta.buttonVariant}
                        onClick={() => {
                          setFeedbackSucesso(null);
                          setAcaoSelecionada(acao);
                        }}
                        className="min-h-11 w-full whitespace-normal sm:w-auto"
                      >
                        {meta.label}
                      </Button>
                    );
                  })}
                </div>

                {prorrogadoLabel && (
                  <p className="text-xs text-surface-500">
                    Prorrogação única já utilizada em {prorrogadoLabel}.
                  </p>
                )}

                {statusOcorrencia === 'pendente' && statusPonto && !pontoPermiteInvalidacao(statusPonto) && (
                  <p className="text-xs text-surface-500">
                    A opção de invalidar não é exibida porque o ponto vinculado está em{' '}
                    {POINT_STATUS_LABELS[statusPonto].toLowerCase()} (invalidação permitida apenas
                    antes da confirmação).
                  </p>
                )}
              </>
            )}
          </div>
        }
      />

      <AcaoModeracaoDialog
        isOpen={acaoSelecionada !== null}
        acao={acaoSelecionada}
        contexto={contextoModal}
        evidenciasExistentes={detalhe.evidencias_paths}
        onClose={() => setAcaoSelecionada(null)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

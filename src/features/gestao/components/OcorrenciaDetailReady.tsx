import { OcorrenciaDetailView } from './OcorrenciaDetailView';
import { OcorrenciaDetailMap } from './OcorrenciaDetailMap';
import { OcorrenciaEvidenceGallery } from './OcorrenciaEvidenceGallery';
import { POINT_STATUS_LABELS } from '@/types';
import type { OcorrenciaDetalheGestao } from '@/types';

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
}

interface OcorrenciaDetailReadyProps {
  detalhe: OcorrenciaDetalheGestao;
  pontoId?: string;
}

export function OcorrenciaDetailReady({ detalhe, pontoId }: OcorrenciaDetailReadyProps) {
  const confirmacoes = detalhe.confirmacoes_distintas_ponto;

  return (
    <OcorrenciaDetailView
      ocorrenciaId={detalhe.ocorrencia.id}
      pontoId={pontoId}
      state={{ status: 'ready', data: detalhe }}
      registrosRelacionados={
        <div className="space-y-2 rounded-lg bg-surface-50 p-4 text-sm text-surface-600">
          <p><strong className="text-surface-900">{detalhe.ponto?.quantidade_ocorrencias ?? 0}</strong> ocorrências registradas neste ponto.</p>
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
        detalhe.historico_ponto.length > 0 ? (
          <ol className="space-y-5 border-l-2 border-primary-100 pl-5">
            {detalhe.historico_ponto.map(evento => (
              <li key={evento.id} className="relative">
                <span aria-hidden="true" className="absolute -left-7 top-1 h-3 w-3 rounded-full bg-primary-700" />
                <p className="text-xs text-surface-500">{formatDateTime(evento.created_at)}</p>
                <h3 className="mt-1 font-semibold text-surface-900">
                  {evento.status_anterior ? `${POINT_STATUS_LABELS[evento.status_anterior]} → ` : ''}
                  {POINT_STATUS_LABELS[evento.status_novo]}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-surface-600">{evento.motivo || 'Sem justificativa registrada.'}</p>
                <p className="mt-1 text-xs text-surface-500">Identificação do autor não incluída no payload.</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-surface-600">Nenhuma transição de status foi encontrada para o ponto vinculado.</p>
        )
      }
    />
  );
}

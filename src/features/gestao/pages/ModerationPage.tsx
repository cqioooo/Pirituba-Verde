import { useMemo, useState } from 'react';
import { CheckCircle, Funnel } from '@phosphor-icons/react';
import { Alert, Badge, Button, Select } from '@/components/ui';
import {
  formatarMensagemSucessoAcao,
  ordenarFilaModeracao,
} from '@/lib/moderacao';
import { cn } from '@/lib/utils';
import { useModeracoesPendentes } from '@/services/queries';
import type { ItemFilaModeracao, ResultadoAcaoModeracao } from '@/types';
import { ModerationCard } from '../components/ModerationCard';

type OrdenacaoFila = 'prioridade' | 'antigas' | 'prazo';

const ORDENACAO_LABELS: Record<OrdenacaoFila, string> = {
  prioridade: 'Sinais de atenção e mais antigas primeiro',
  antigas: 'Mais antigas primeiro',
  prazo: 'Prazo mais próximo primeiro',
};

function possuiAlgumSinal(item: ItemFilaModeracao): boolean {
  return Boolean(
    item.sinal_reincidencia ||
      item.sinal_duplicata ||
      item.sinal_faixa_cinzenta ||
      item.sinal_limite_diario
  );
}

function parseTimestamp(valor: string | null | undefined): number {
  if (!valor) return Number.POSITIVE_INFINITY;
  const trimmed = valor.trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T23:59:59.999Z`
    : trimmed;
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

function ordenarItens(
  itens: readonly ItemFilaModeracao[],
  ordenacao: OrdenacaoFila
): ItemFilaModeracao[] {
  if (ordenacao === 'prioridade') {
    return ordenarFilaModeracao(itens);
  }
  if (ordenacao === 'antigas') {
    return [...itens].sort(
      (a, b) => parseTimestamp(a.data_registro) - parseTimestamp(b.data_registro)
    );
  }
  return [...itens].sort((a, b) => {
    const prazoDiff =
      parseTimestamp(a.prazo_resolucao) - parseTimestamp(b.prazo_resolucao);
    if (prazoDiff !== 0) return prazoDiff;
    return parseTimestamp(a.data_registro) - parseTimestamp(b.data_registro);
  });
}

function ModerationQueueSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Carregando ocorrências pendentes da fila de moderação.</span>
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          aria-hidden="true"
          className="motion-safe:animate-pulse rounded-2xl border border-surface-200 bg-white p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-36 w-full rounded-xl bg-surface-100 sm:w-44" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-40 rounded bg-surface-200" />
              <div className="h-4 w-72 max-w-full rounded bg-surface-100" />
              <div className="flex gap-2">
                <div className="h-6 w-36 rounded bg-surface-100" />
                <div className="h-6 w-28 rounded bg-surface-100" />
              </div>
              <div className="h-10 w-44 rounded-xl bg-surface-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModerationPage() {
  const { data: moderacoes = [], isLoading, isError, refetch } = useModeracoesPendentes();
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [somenteComSinais, setSomenteComSinais] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoFila>('prioridade');

  const totalComSinais = useMemo(
    () => moderacoes.filter(possuiAlgumSinal).length,
    [moderacoes]
  );

  const itensVisiveis = useMemo(() => {
    const filtrados = somenteComSinais
      ? moderacoes.filter(possuiAlgumSinal)
      : moderacoes;
    return ordenarItens(filtrados, ordenacao);
  }, [moderacoes, ordenacao, somenteComSinais]);

  const handleActionSuccess = (resultado: ResultadoAcaoModeracao) => {
    setFeedbackSucesso(formatarMensagemSucessoAcao(resultado));
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
      <header className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
              Fila de moderação
            </h1>
            {!isLoading && !isError && (
              <Badge variant="neutral" data-testid="fila-total-contador">
                {moderacoes.length}{' '}
                {moderacoes.length === 1 ? 'ocorrência pendente' : 'ocorrências pendentes'}
              </Badge>
            )}
          </div>
          <p className="text-base text-surface-600">
            Analise as novas ocorrências e registre a decisão da gestão.
          </p>
        </div>

        {!isLoading && !isError && moderacoes.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3.5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-xs">
              <Select
                id="ordenacao-fila-moderacao"
                label="Ordenação ativa"
                value={ordenacao}
                onChange={(event) => setOrdenacao(event.target.value as OrdenacaoFila)}
                className="min-h-11"
                options={[
                  { value: 'prioridade', label: ORDENACAO_LABELS.prioridade },
                  { value: 'antigas', label: ORDENACAO_LABELS.antigas },
                  { value: 'prazo', label: ORDENACAO_LABELS.prazo },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5 lg:items-end">
              <button
                type="button"
                aria-pressed={somenteComSinais}
                onClick={() => setSomenteComSinais((ativo) => !ativo)}
                className={cn(
                  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:w-auto',
                  somenteComSinais
                    ? 'border-warning-500/40 bg-warning-50 text-warning-700'
                    : 'border-surface-200 bg-white text-surface-800 hover:bg-surface-100'
                )}
              >
                <Funnel className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Somente com sinais de atenção ({totalComSinais})</span>
              </button>
              <span className="text-xs text-surface-600">
                Filtro opcional · {somenteComSinais ? 'ativado manualmente' : 'desativado por padrão'}
              </span>
            </div>
          </div>
        )}
      </header>

      <div aria-live="polite" className="space-y-3">
        {feedbackSucesso && (
          <Alert variant="success" title="Ação registrada na fila">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>{feedbackSucesso}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFeedbackSucesso(null)}
                className="min-h-11 self-start sm:self-auto"
              >
                Dispensar
              </Button>
            </div>
          </Alert>
        )}

        {somenteComSinais && !isLoading && !isError && moderacoes.length > 0 && (
          <Alert variant="info" title="Filtro manual ativo: somente com sinais de atenção">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Exibindo {itensVisiveis.length} de {moderacoes.length} ocorrências pendentes.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSomenteComSinais(false)}
                className="min-h-11 self-start sm:self-auto"
              >
                Mostrar todas as pendentes
              </Button>
            </div>
          </Alert>
        )}
      </div>

      {isLoading ? (
        <ModerationQueueSkeleton />
      ) : isError ? (
        <Alert variant="error" title="Não foi possível carregar a fila de moderação">
          <p className="mb-3">Verifique sua conexão e tente atualizar novamente.</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            className="min-h-11"
          >
            Tentar novamente
          </Button>
        </Alert>
      ) : moderacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-200 bg-white p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-700">
            <CheckCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-surface-900">Fila Vazia!</h2>
          <p className="max-w-md text-sm text-surface-600">
            Nenhuma ocorrência pendente aguardando moderação no momento.
          </p>
        </div>
      ) : itensVisiveis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-200 bg-white p-10 text-center">
          <h2 className="mb-1 text-lg font-semibold text-surface-900">
            Nenhuma ocorrência pendente com sinais de atenção
          </h2>
          <p className="mb-4 max-w-md text-sm text-surface-600">
            Existem {moderacoes.length} ocorrências pendentes na fila sem sinais de inconsistência.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSomenteComSinais(false)}
            className="min-h-11"
          >
            Mostrar todas as pendentes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {itensVisiveis.map((item) => (
            <ModerationCard
              key={item.id}
              item={item}
              onActionSuccess={handleActionSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

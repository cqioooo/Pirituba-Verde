import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image, MapPin, Clock, Users, FileText } from '@phosphor-icons/react';
import { Alert, Badge, Button, Card } from '@/components/ui';
import {
  FREQUENCY_LABELS, VOLUME_LABELS, TIME_LABELS,
  OCORRENCIA_STATUS_LABELS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS,
  WASTE_CATEGORY_LABELS,
} from '@/types';
import type { Ocorrencia, PontoGestor } from '@/types';

/** Contrato de apresentação, não schema do banco. Sem dados pessoais ou URLs de fotos. */
export interface OcorrenciaDetailData {
  ocorrencia: Pick<Ocorrencia,
    'id' | 'categoria_principal' | 'status' | 'data_registro' | 'descricao' |
    'tipo_residuo' | 'frequencia_percebida' | 'volume_estimado' | 'horario_percebido'>;
  ponto: Pick<PontoGestor, 'id' | 'status' | 'endereco' | 'bairro'> | null;
}

export type OcorrenciaDetailState =
  | { status: 'pending' }
  | { status: 'loading' }
  | { status: 'error'; onRetry?: () => void }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'ready'; data: OcorrenciaDetailData };

interface OcorrenciaDetailViewProps {
  ocorrenciaId: string;
  /** Contexto de entrada por ponto: o ID do ponto não identifica uma ocorrência. */
  pontoId?: string;
  state: OcorrenciaDetailState;
  /** Integrações futuras. O chamador controla loading/erro/vazio de cada bloco. */
  evidencias?: ReactNode;
  mapa?: ReactNode;
  historico?: ReactNode;
  confirmacoes?: ReactNode;
  registrosRelacionados?: ReactNode;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="min-w-0">
      <Card padding="none" className="rounded-xl p-4 sm:p-6 shadow-none">
        <h2 className="mb-4 text-lg font-semibold text-surface-900">{title}</h2>
        {children}
      </Card>
    </section>
  );
}

function Pending({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4 text-sm text-surface-600">
      <span aria-hidden="true" className="mt-0.5 shrink-0">{icon}</span>
      <p className="min-w-0 leading-relaxed">{children}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-sm text-surface-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-base text-surface-900">{value}</dd></div>;
}

function labelFor(value: string | null | undefined, labels: Record<string, string>, pending: boolean) {
  return pending ? 'Aguardando dados' : value ? labels[value] ?? value : 'Não informado';
}

function dateLabel(value: string | undefined) {
  if (!value) return 'Aguardando dados';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function OcorrenciaDetailView({
  ocorrenciaId, pontoId, state, evidencias, mapa, historico, confirmacoes, registrosRelacionados,
}: OcorrenciaDetailViewProps) {
  const viaPonto = pontoId !== undefined;
  const data = state.status === 'ready' ? state.data : undefined;
  const ocorrencia = data?.ocorrencia;
  const pending = state.status === 'pending';
  const blocked = state.status === 'error' || state.status === 'not-found' || state.status === 'forbidden';
  const residuos = Array.isArray(ocorrencia?.tipo_residuo)
    ? ocorrencia.tipo_residuo.map(value => WASTE_CATEGORY_LABELS[value] ?? value).join(', ')
    : ocorrencia?.tipo_residuo ? WASTE_CATEGORY_LABELS[ocorrencia.tipo_residuo] ?? ocorrencia.tipo_residuo : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-8 [overflow-wrap:anywhere]">
      <Link to={viaPonto ? '/gestao/pontos' : '/gestao/moderacao'} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        <ArrowLeft size={18} aria-hidden="true" /> {viaPonto ? 'Voltar para pontos de descarte' : 'Voltar para moderação'}
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Gestão territorial / {viaPonto ? 'Pontos de descarte' : 'Ocorrências'}</p>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">{viaPonto ? 'Detalhes do ponto de descarte' : 'Detalhe da ocorrência'}</h1>
        <p className="text-sm leading-relaxed text-surface-600">Consulte o registro, as evidências e o histórico para apoiar a análise.</p>
        <p className="text-xs text-surface-500">{viaPonto ? 'Referência do ponto' : 'Referência da ocorrência'}: <span className="font-mono">{(viaPonto ? pontoId : ocorrenciaId) || 'Não informada'}</span></p>
      </header>

      {pending && <Alert variant="info" title="Consulta ainda indisponível">Esta tela está preparada para receber os dados. As informações do registro ainda não foram carregadas.</Alert>}

      {state.status === 'loading' && (
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Carregando detalhes da ocorrência.</span>
          <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
            {[0, 1, 2, 3].map(index => <div key={index} className="space-y-4 rounded-xl border border-surface-200 p-6"><div className="h-6 w-2/3 rounded bg-surface-200" /><div className="h-24 rounded bg-surface-100" /></div>)}
          </div>
        </div>
      )}

      {blocked && (
        <Alert variant={state.status === 'error' ? 'error' : 'warning'} title={state.status === 'error' ? 'Não foi possível carregar a ocorrência' : state.status === 'forbidden' ? 'Acesso negado' : 'Ocorrência não encontrada'}>
          <p>{state.status === 'error' ? 'Tente novamente em instantes. Se o problema continuar, volte para a fila de moderação.' : state.status === 'forbidden' ? 'Seu perfil não tem permissão para consultar este registro.' : 'O registro solicitado não foi encontrado. Volte para a fila para consultar outra ocorrência.'}</p>
          {state.status === 'error' && state.onRetry && <Button onClick={state.onRetry} variant="secondary" className="mt-3 min-h-11">Tentar novamente</Button>}
        </Alert>
      )}

      {(pending || data) && <>
        <Section title={labelFor(ocorrencia?.categoria_principal, WASTE_CATEGORY_LABELS, pending)}>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div><p className="mb-2 text-sm text-surface-500">Status da ocorrência</p><Badge variant="neutral">{labelFor(ocorrencia?.status, OCORRENCIA_STATUS_LABELS, pending)}</Badge></div>
            <div><p className="mb-2 text-sm text-surface-500">Status do ponto</p><Badge variant={data?.ponto ? POINT_STATUS_VARIANTS[data.ponto.status] : 'neutral'}>{pending ? 'Aguardando dados' : data?.ponto ? POINT_STATUS_LABELS[data.ponto.status] : 'Sem ponto vinculado'}</Badge></div>
            <div><p className="mb-2 text-sm text-surface-500">Data do registro</p><p className="text-sm text-surface-900">{dateLabel(ocorrencia?.data_registro)}</p></div>
          </div>
        </Section>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Informações da ocorrência">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Categoria" value={labelFor(ocorrencia?.categoria_principal, WASTE_CATEGORY_LABELS, pending)} />
              <Field label="Tipo de resíduo" value={pending ? 'Aguardando dados' : residuos || 'Não informado'} />
              <Field label="Frequência percebida" value={labelFor(ocorrencia?.frequencia_percebida, FREQUENCY_LABELS, pending)} />
              <Field label="Volume estimado" value={labelFor(ocorrencia?.volume_estimado, VOLUME_LABELS, pending)} />
              <Field label="Horário percebido" value={labelFor(ocorrencia?.horario_percebido, TIME_LABELS, pending)} />
              <div className="sm:col-span-2"><Field label="Descrição" value={pending ? 'Aguardando dados' : ocorrencia?.descricao || 'Nenhuma descrição informada.'} /></div>
            </dl>
          </Section>
          <Section title="Ponto de descarte relacionado">
            <div className="space-y-4">
              {data?.ponto ? <dl className="space-y-4"><Field label="Endereço informado" value={data.ponto.endereco || 'Endereço não informado'} /><Field label="Bairro" value={data.ponto.bairro || 'Bairro não informado'} /></dl> : <p className="text-sm text-surface-600">{pending ? 'O vínculo com o ponto será apresentado após carregar o registro.' : 'Esta ocorrência não possui ponto de descarte vinculado.'}</p>}
              {registrosRelacionados ?? <Pending icon={<FileText size={20} />}>O histórico de registros e a quantidade de ciclos anteriores ainda não estão disponíveis. Nenhuma reincidência foi calculada.</Pending>}
            </div>
          </Section>
        </div>

        <Section title="Confirmações externas">
          {confirmacoes ?? <Pending icon={<Users size={20} />}>A quantidade de pessoas distintas neste ciclo ainda não está disponível. O limiar previsto é de 4 confirmações externas; o progresso será exibido quando essa contagem puder ser verificada.</Pending>}
        </Section>
        <Section title="Evidências fotográficas">
          {evidencias ?? <Pending icon={<Image size={20} />}>As evidências ainda não estão disponíveis para consulta. As fotos serão exibidas por acesso autorizado e temporário.</Pending>}
        </Section>
        <Section title="Histórico de acompanhamento">
          {historico ?? <Pending icon={<Clock size={20} />}>Os eventos de acompanhamento ainda não foram carregados. Quando disponíveis, serão apresentados com data, transição e justificativa autorizada.</Pending>}
        </Section>
        <Section title="Localização da ocorrência">
          {mapa ?? <Pending icon={<MapPin size={20} />}>O mapa ainda não está disponível. A localização será apresentada a partir das coordenadas do registro, sem estimar um local.</Pending>}
        </Section>
        <Section title="Ações de moderação">
          <p id="moderacao-indisponivel" className="mb-4 text-sm leading-relaxed text-surface-600">As decisões de moderação ainda não estão disponíveis nesta tela. A elegibilidade de cada ação será definida pelo estado operacional validado. Os controles abaixo são apenas uma apresentação das ações previstas.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" aria-describedby="moderacao-indisponivel">
            {['Manter em análise', 'Encaminhar', 'Invalidar', 'Resolver', 'Arquivar'].map(action => <Button key={action} disabled variant="secondary" className="min-h-11 whitespace-normal">{action}</Button>)}
          </div>
        </Section>
      </>}
    </div>
  );
}

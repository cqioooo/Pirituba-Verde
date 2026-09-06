import { useParams } from 'react-router-dom';
import { OcorrenciaDetailView } from '../components/OcorrenciaDetailView';
import { Alert } from '@/components/ui';
import { Image } from '@phosphor-icons/react';
import { pointDetailExamples } from './pointDetailExamples';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { useOcorrenciaDetalheGestaoPorPonto } from '@/services/queries';
import { OcorrenciaDetailReady } from '../components/OcorrenciaDetailReady';

/** Entrada pelo ponto: exibe a ocorrência mais recente associada ao registro. */
export function PointDetailFrontendPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOcorrenciaDetalheGestaoPorPonto(id);
  const example = import.meta.env.DEV && !isSupabaseConfigured && id && Object.hasOwn(pointDetailExamples, id)
    ? pointDetailExamples[id] : undefined;

  if (example) {
    return (
      <div className="min-w-0 space-y-6">
        <Alert variant="info" title="Demonstração — dados fictícios">
          Exemplo visual, sem conexão com o banco. Uma ocorrência ilustrativa está selecionada para este ponto; os números e eventos não comprovam situações reais nesses endereços.
        </Alert>
        <OcorrenciaDetailView
          pontoId={id}
          ocorrenciaId={example.data.ocorrencia.id}
          state={{ status: 'ready', data: example.data }}
          registrosRelacionados={<div className="rounded-lg bg-surface-50 p-4 text-sm text-surface-600"><p className="font-semibold text-surface-900">{example.denuncias} denúncias no ponto · exemplo</p><p className="mt-2">Exibindo um relato ilustrativo. Total de denúncias não representa quantidade de ciclos ou reincidências.</p></div>}
          confirmacoes={<div className="space-y-3"><p className="text-2xl font-semibold text-surface-900">{example.confirmacoes} <span className="text-sm font-normal text-surface-600">confirmações externas simuladas</span></p><progress className="h-3 w-full accent-primary-700" value={Math.min(example.confirmacoes, 4)} max={4} aria-label="Progresso ilustrativo até quatro confirmações" /><p className="text-sm text-surface-600">{example.confirmacoes >= 4 ? 'Limiar ilustrativo de 4 atingido.' : `Faltam ${4 - example.confirmacoes} para o limiar ilustrativo de 4.`} A contagem distinta por ciclo ainda será validada na integração.</p></div>}
          historico={<ol className="space-y-5 border-l-2 border-primary-100 pl-5">{example.eventos.map(evento => <li key={evento.data} className="relative"><span aria-hidden="true" className="absolute -left-7 top-1 h-3 w-3 rounded-full bg-primary-700" /><p className="text-xs text-surface-500">{evento.data}</p><h3 className="mt-1 font-semibold text-surface-900">{evento.titulo}</h3><p className="mt-1 text-sm leading-relaxed text-surface-600">{evento.descricao}</p></li>)}</ol>}
          evidencias={<div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{['Vista geral do descarte', 'Detalhe dos materiais'].map(label => <figure key={label} className="overflow-hidden rounded-xl border border-surface-200"><div className="flex h-36 items-center justify-center bg-surface-100 text-surface-400"><Image size={48} aria-hidden="true" /></div><figcaption className="p-3 text-sm text-surface-600">{label}<span className="mt-1 block text-xs">Espaço ilustrativo · sem fotografia real</span></figcaption></figure>)}</div><p className="mt-3 text-xs text-surface-500">Prévia do espaço das evidências. Galeria e acesso privado continuam reservados à T4.2.B.</p></div>}
        />
      </div>
    );
  }

  if (!id) {
    return <OcorrenciaDetailView pontoId="" ocorrenciaId="" state={{ status: 'not-found' }} />;
  }

  if (query.isLoading) {
    return <OcorrenciaDetailView pontoId={id} ocorrenciaId="" state={{ status: 'loading' }} />;
  }

  if (query.isError) {
    return (
      <OcorrenciaDetailView
        pontoId={id}
        ocorrenciaId=""
        state={{ status: 'error', onRetry: () => void query.refetch() }}
      />
    );
  }

  if (query.data) {
    return <OcorrenciaDetailReady detalhe={query.data} pontoId={id} />;
  }

  return (
    <OcorrenciaDetailView
      pontoId={id}
      ocorrenciaId=""
      state={{ status: 'not-found' }}
    />
  );
}

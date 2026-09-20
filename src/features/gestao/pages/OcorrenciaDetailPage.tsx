import { useParams } from 'react-router-dom';
import { OcorrenciaDetailView } from '../components/OcorrenciaDetailView';
import { OcorrenciaDetailReady } from '../components/OcorrenciaDetailReady';
import { useOcorrenciaDetalheGestao } from '@/services/queries';

export function OcorrenciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOcorrenciaDetalheGestao(id);

  if (!id) {
    return <OcorrenciaDetailView ocorrenciaId="" state={{ status: 'not-found' }} />;
  }

  if (query.isLoading) {
    return <OcorrenciaDetailView ocorrenciaId={id} state={{ status: 'loading' }} />;
  }

  if (query.isError) {
    return (
      <OcorrenciaDetailView
        ocorrenciaId={id}
        state={{ status: 'error', onRetry: () => void query.refetch() }}
      />
    );
  }

  if (!query.data) {
    return <OcorrenciaDetailView ocorrenciaId={id} state={{ status: 'not-found' }} />;
  }

  return <OcorrenciaDetailReady detalhe={query.data} />;
}

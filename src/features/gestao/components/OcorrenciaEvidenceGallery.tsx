import { WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useEvidenciasAssinadas } from '@/services/queries';
import { PhotoGallery } from './PhotoGallery';

interface OcorrenciaEvidenceGalleryProps {
  ocorrenciaId: string;
  paths: string[];
}

function GallerySkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando evidências fotográficas.</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(index => (
          <div key={index} className="aspect-square animate-pulse rounded-xl bg-surface-100" />
        ))}
      </div>
    </div>
  );
}

export function OcorrenciaEvidenceGallery({ ocorrenciaId, paths }: OcorrenciaEvidenceGalleryProps) {
  const query = useEvidenciasAssinadas(ocorrenciaId, paths);

  if (paths.length === 0) {
    return <p className="text-sm text-surface-600">Nenhuma evidência fotográfica foi vinculada a esta ocorrência.</p>;
  }

  if (query.isLoading) return <GallerySkeleton />;

  if (query.isError) {
    return (
      <div role="alert" className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
        <p>Não foi possível autorizar o acesso às evidências.</p>
        <Button variant="secondary" className="mt-3 min-h-11" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const availablePhotos = (query.data ?? [])
    .filter(item => item.disponivel && item.signed_url)
    .map(item => item.signed_url as string);
  const unavailableCount = paths.length - availablePhotos.length;

  if (availablePhotos.length === 0) {
    return (
      <div role="alert" className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-surface-700">
        <div className="flex items-start gap-2">
          <WarningCircle size={20} className="mt-0.5 shrink-0 text-warning-700" aria-hidden="true" />
          <p>As evidências existem, mas nenhuma pôde ser aberta com a sua sessão atual.</p>
        </div>
        <Button variant="secondary" className="mt-3 min-h-11" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PhotoGallery photos={availablePhotos} />
      <p className="text-xs leading-relaxed text-surface-500">
        Acesso temporário e restrito à gestão. Os links expiram automaticamente.
      </p>
      {unavailableCount > 0 && (
        <div role="status" className="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-sm text-surface-700">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-warning-700" aria-hidden="true" />
          <p>{unavailableCount} evidência(s) não puderam ser carregadas.</p>
        </div>
      )}
    </div>
  );
}

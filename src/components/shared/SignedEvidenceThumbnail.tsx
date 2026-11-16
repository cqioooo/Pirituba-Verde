import { useState } from 'react';
import {
  ArrowCounterClockwise,
  Image,
  ImageBroken,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';
import { Button, Modal } from '@/components/ui';
import { useEvidenciasAssinadas } from '@/services/queries';
import { cn } from '@/lib/utils';

interface SignedEvidenceThumbnailProps {
  contextId: string;
  path: string | null | undefined;
  /** Lista completa de caminhos quando houver múltiplas fotos na ocorrência. */
  allPaths?: string[];
  alt: string;
  className?: string;
  fallbackClassName?: string;
  /** Permite clicar para ampliar a foto inteira em modal acessível (sem cortes). */
  enableZoom?: boolean;
  /** Exibe legenda explícita no placeholder de ausência/erro. */
  showStatusLabel?: boolean;
  /** Texto auxiliar exibido ao ampliar a evidência. */
  zoomSubtitle?: string;
}

export function SignedEvidenceThumbnail({
  contextId,
  path,
  allPaths,
  alt,
  className,
  fallbackClassName,
  enableZoom = false,
  showStatusLabel = false,
  zoomSubtitle,
}: SignedEvidenceThumbnailProps) {
  const pathsToResolve = allPaths && allPaths.length > 0 ? allPaths : path ? [path] : [];
  const query = useEvidenciasAssinadas(contextId, pathsToResolve);
  const availableItems = (query.data ?? []).filter(
    (item): item is typeof item & { signed_url: string } =>
      Boolean(item.disponivel && item.signed_url)
  );
  const firstSignedUrl = availableItems[0]?.signed_url ?? null;

  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!path) {
    return (
      <div
        role="img"
        aria-label="Sem foto disponível"
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 bg-surface-100 px-3 py-4 text-center text-surface-600',
          fallbackClassName
        )}
      >
        <Image className="h-6 w-6 text-surface-500" weight="duotone" aria-hidden="true" />
        {showStatusLabel && (
          <span className="text-xs font-medium text-surface-600">Sem foto disponível</span>
        )}
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div
        role="status"
        aria-label="Carregando evidência"
        className={cn('motion-safe:animate-pulse bg-surface-100', fallbackClassName)}
      >
        <span className="sr-only">Carregando evidência</span>
      </div>
    );
  }

  const imageFailed = firstSignedUrl ? failedUrls.has(firstSignedUrl) : false;

  if (query.isError || !firstSignedUrl || imageFailed) {
    return (
      <div
        role="status"
        className={cn(
          'flex flex-col items-center justify-center gap-2 border border-dashed border-warning-500/40 bg-warning-50/70 px-3 py-3 text-center text-warning-700',
          fallbackClassName
        )}
      >
        <ImageBroken className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium leading-snug">
          {showStatusLabel ? 'Não foi possível carregar a foto' : 'Evidência indisponível'}
        </span>
        {showStatusLabel && (
          <button
            type="button"
            onClick={() => {
              setFailedUrls(new Set());
              void query.refetch();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-warning-500/40 bg-white px-3 py-1.5 text-xs font-medium text-warning-700 hover:bg-warning-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" aria-hidden="true" />
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (!enableZoom) {
    return (
      <img
        src={firstSignedUrl}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() =>
          setFailedUrls((prev) => {
            const next = new Set(prev);
            next.add(firstSignedUrl);
            return next;
          })
        }
      />
    );
  }

  const usablePhotos = availableItems.filter((item) => !failedUrls.has(item.signed_url));
  const boundedIndex = Math.min(activeIndex, Math.max(usablePhotos.length - 1, 0));
  const currentZoomPhoto = usablePhotos[boundedIndex] ?? availableItems[0];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveIndex(0);
          setZoomOpen(true);
        }}
        aria-label={`Ampliar ${alt.toLowerCase()}${usablePhotos.length > 1 ? ` (${usablePhotos.length} fotos)` : ''}`}
        className="group relative block h-full w-full min-h-11 overflow-hidden bg-surface-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <img
          src={firstSignedUrl}
          alt={alt}
          className={cn(
            'transition-transform duration-200 motion-reduce:transition-none group-hover:scale-[1.02]',
            className
          )}
          loading="lazy"
          onError={() =>
            setFailedUrls((prev) => {
              const next = new Set(prev);
              next.add(firstSignedUrl);
              return next;
            })
          }
        />
        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-surface-900/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-xs"
        >
          <MagnifyingGlassPlus className="h-3.5 w-3.5" />
          Ampliar{usablePhotos.length > 1 ? ` (${usablePhotos.length})` : ''}
        </span>
      </button>

      <Modal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        title="Evidência fotográfica"
        maxWidth="4xl"
      >
        <div className="space-y-3">
          {zoomSubtitle && <p className="text-sm text-surface-600">{zoomSubtitle}</p>}
          <div className="flex justify-center overflow-hidden rounded-lg bg-surface-900 p-2">
            {currentZoomPhoto && (
              <img
                src={currentZoomPhoto.signed_url}
                alt={`${alt} (${boundedIndex + 1} de ${Math.max(usablePhotos.length, 1)})`}
                className="max-h-[70vh] w-auto object-contain"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-surface-600">
              Visualização integral sem cortes. Acesso temporário restrito à gestão.
            </p>
            {usablePhotos.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={boundedIndex === 0}
                  onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
                  className="min-h-11"
                >
                  Anterior
                </Button>
                <span className="text-sm font-medium text-surface-700">
                  {boundedIndex + 1} de {usablePhotos.length}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={boundedIndex >= usablePhotos.length - 1}
                  onClick={() =>
                    setActiveIndex((idx) => Math.min(usablePhotos.length - 1, idx + 1))
                  }
                  className="min-h-11"
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

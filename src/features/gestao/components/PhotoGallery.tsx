import { useState } from 'react';
import { Modal } from '@/components/ui';
import { ImageBroken } from '@phosphor-icons/react';

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());

  const markAsFailed = (url: string) => {
    setFailedPhotos(current => new Set(current).add(url));
    setSelectedPhoto(current => current === url ? null : current);
  };

  if (!photos || photos.length === 0) {
    return <p className="text-sm text-surface-500">Nenhuma foto disponível.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((url, idx) => failedPhotos.has(url) ? (
          <div key={url} role="status" className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-300 bg-surface-50 p-3 text-center text-xs text-surface-500">
            <ImageBroken size={28} aria-hidden="true" />
            Evidência {idx + 1} indisponível
          </div>
        ) : (
          <button
            key={url}
            type="button"
            aria-label={`Ampliar evidência fotográfica ${idx + 1}`}
            className="group relative aspect-square min-h-11 overflow-hidden rounded-lg bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => setSelectedPhoto(url)}
          >
            <img
              src={url}
              alt={`Evidência fotográfica ${idx + 1}`}
              onError={() => markAsFailed(url)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Visualização da Foto"
        maxWidth="4xl"
      >
        {selectedPhoto && (
          <div className="flex justify-center bg-black rounded-lg overflow-hidden">
            <img
              src={selectedPhoto}
              alt="Evidência fotográfica ampliada"
              onError={() => markAsFailed(selectedPhoto)}
              className="max-h-[70vh] object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

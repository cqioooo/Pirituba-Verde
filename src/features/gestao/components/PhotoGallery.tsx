import { useState } from 'react';
import { Modal } from '@/components/ui';

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!photos || photos.length === 0) {
    return <p className="text-sm text-surface-500">Nenhuma foto disponível.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((url, idx) => (
          <button
            key={idx}
            className="group relative aspect-square overflow-hidden rounded-lg bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => setSelectedPhoto(url)}
          >
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
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
              alt="Foto ampliada"
              className="max-h-[70vh] object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

import { Image } from '@phosphor-icons/react';
import { useEvidenciasAssinadas } from '@/services/queries';
import { cn } from '@/lib/utils';

interface SignedEvidenceThumbnailProps {
  contextId: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function SignedEvidenceThumbnail({
  contextId,
  path,
  alt,
  className,
  fallbackClassName,
}: SignedEvidenceThumbnailProps) {
  const query = useEvidenciasAssinadas(contextId, path ? [path] : []);
  const signedUrl = query.data?.find(item => item.disponivel)?.signed_url;

  if (path && query.isLoading) {
    return <div role="status" aria-label="Carregando evidência" className={cn('animate-pulse bg-surface-100', fallbackClassName)} />;
  }

  if (!path || !signedUrl) {
    return (
      <div role="img" aria-label="Evidência indisponível" className={cn('flex items-center justify-center bg-surface-100 text-surface-400', fallbackClassName)}>
        <Image className="h-7 w-7" weight="duotone" aria-hidden="true" />
      </div>
    );
  }

  return <img src={signedUrl} alt={alt} className={className} loading="lazy" />;
}

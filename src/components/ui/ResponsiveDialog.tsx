import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ResponsiveDialogProps['maxWidth']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

/**
 * Contêiner acessível responsivo: renderiza como `Dialog` centralizado em telas
 * desktop (`>= 640px`) e como `Sheet` inferior em dispositivos móveis (`< 640px`).
 */
export function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  closeDisabled = false,
  initialFocusRef,
  maxWidth = 'lg',
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const elementoAnterior =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alvo = initialFocusRef?.current;
    if (alvo) {
      alvo.focus();
    } else {
      const primeiroFocavel = containerRef.current?.querySelector<HTMLElement>(
        'textarea:not([disabled]), input:not([disabled]), select:not([disabled]), button:not([disabled])'
      );
      primeiroFocavel?.focus();
    }

    return () => {
      document.body.style.overflow = overflowAnterior;
      if (elementoAnterior && document.contains(elementoAnterior)) {
        elementoAnterior.focus();
      }
    };
  }, [isOpen, initialFocusRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDisabled, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        isDesktop ? 'items-center p-6' : 'items-end p-0'
      )}
    >
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        data-variant={isDesktop ? 'dialog' : 'sheet'}
        className={cn(
          'relative flex w-full flex-col bg-white shadow-2xl',
          isDesktop
            ? cn('max-h-[90vh] rounded-xl', MAX_WIDTH_CLASSES[maxWidth])
            : 'max-h-[92dvh] rounded-t-2xl'
        )}
      >
        {!isDesktop && (
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-surface-300" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 border-b border-surface-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-snug text-surface-900">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="mt-1 text-sm leading-relaxed text-surface-600">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Fechar janela"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse gap-2.5 border-t border-surface-100 bg-surface-50 px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-xl sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

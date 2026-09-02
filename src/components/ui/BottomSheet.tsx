import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from '@phosphor-icons/react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Initial snap: 'collapsed' ~30%, 'half' ~50%, 'full' ~90% */
  initialSnap?: 'collapsed' | 'half' | 'full';
}

const SNAP_POINTS = {
  collapsed: 35,
  half: 55,
  full: 90,
};

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  initialSnap = 'half',
}: BottomSheetProps) {
  const [height, setHeight] = useState(SNAP_POINTS[initialSnap]);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset height when opening
  useEffect(() => {
    if (open) {
      setHeight(SNAP_POINTS[initialSnap]);
    }
  }, [open, initialSnap]);

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(90, Math.max(10, startHeightRef.current + deltaPercent));
    setHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);

    // Snap to nearest point or close
    if (height < 15) {
      onClose();
      return;
    }

    const snapValues = Object.values(SNAP_POINTS);
    const nearest = snapValues.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    setHeight(nearest);
  }, [height, onClose]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers (for desktop testing)
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[5900] bg-black/20 transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Painel de detalhes'}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[6000] bg-white rounded-t-2xl shadow-modal',
          !isDragging && 'transition-[height] duration-300 ease-out'
        )}
        style={{ height: `${height}vh` }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
        >
          <div className="w-10 h-1 rounded-full bg-surface-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-6" style={{ maxHeight: `calc(${height}vh - 64px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}

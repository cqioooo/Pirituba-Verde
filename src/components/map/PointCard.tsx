import type { PontoAutenticado } from '@/types';
import { WASTE_CATEGORY_LABELS, WASTE_CATEGORY_COLORS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { MapPin, Users, ArrowsClockwise } from '@phosphor-icons/react';

interface PointCardProps {
  point: PontoAutenticado;
  selected?: boolean;
  compact?: boolean;
  onClick?: (point: PontoAutenticado) => void;
}

export function PointCard({ point, selected = false, compact = false, onClick }: PointCardProps) {
  const isReincident = point.recorrente;
  const isHighSeverity = (point.criticidade || 0) >= 7.5;
  const categoria = point.categoria_principal || 'misto';
  const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
  const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';

  return (
    <button
      onClick={() => onClick?.(point)}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all',
        selected
          ? 'border-primary-300 bg-primary-50/50 shadow-sm'
          : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1'
      )}
      aria-label={`Ponto em ${point.endereco}`}
    >
      {/* Header: category + status */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-surface-800 truncate">
            {label}
          </span>
        </div>
        <Badge variant={POINT_STATUS_VARIANTS[point.status]} className="text-[10px] shrink-0">
          {POINT_STATUS_LABELS[point.status]}
        </Badge>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 mb-1.5">
        <MapPin className="w-3 h-3 text-surface-400 shrink-0 mt-0.5" />
        <p className="text-xs text-surface-600 leading-snug">{point.endereco}</p>
      </div>

      {!compact && (
        <>
          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[10px] text-surface-400 mt-2">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {point.confirmacoes}
            </span>
            {point.frequencia_percebida && (
              <span className="capitalize">{point.frequencia_percebida.replace('_', ' ')}</span>
            )}
            {isReincident && (
              <span className="flex items-center gap-0.5 text-danger-500 font-medium">
                <ArrowsClockwise className="w-4 h-4" />
                Recorrente
              </span>
            )}
            {isHighSeverity && (
              <span className="text-danger-500 font-medium">
                Criticidade {(point.criticidade || 0).toFixed(1)}
              </span>
            )}
          </div>
        </>
      )}
    </button>
  );
}

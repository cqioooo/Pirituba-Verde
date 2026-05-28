import { WASTE_CATEGORY_LABELS, WASTE_CATEGORY_COLORS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import type { StatusPonto, MapFilterState } from '@/types';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

const categories = Object.entries(WASTE_CATEGORY_LABELS);
const statuses = Object.entries(POINT_STATUS_LABELS) as [StatusPonto, string][];

interface MapFiltersProps {
  filters: MapFilterState;
  onToggleCategory: (category: string) => void;
  onToggleStatus?: (status: StatusPonto) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  /** Se true, mostra filtros de status (mapa autenticado) */
  showStatusFilter?: boolean;
  className?: string;
}

export function MapFilters({
  filters,
  onToggleCategory,
  onToggleStatus,
  onReset,
  hasActiveFilters,
  showStatusFilter = false,
  className,
}: MapFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('bg-white/95 backdrop-blur-sm rounded-xl shadow-elevated', className)}>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors w-full rounded-xl',
          hasActiveFilters
            ? 'text-primary-700 bg-primary-50'
            : 'text-surface-600 hover:text-surface-900'
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filtros</span>
        {hasActiveFilters && (
          <span className="ml-auto text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded-full">
            {filters.categorias.length + filters.status.length}
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-surface-100">
          {/* Categories */}
          <div className="pt-2">
            <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">
              Tipo de resíduo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(([key, label]) => {
                const active = filters.categorias.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => onToggleCategory(key)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                      active
                        ? 'border-transparent text-white'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300 bg-white'
                    )}
                    style={active ? { backgroundColor: WASTE_CATEGORY_COLORS[key] } : {}}
                  >
                    {!active && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: WASTE_CATEGORY_COLORS[key] }}
                      />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          {showStatusFilter && onToggleStatus && (
            <div>
              <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map(([key, label]) => {
                  const active = filters.status.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => onToggleStatus(key)}
                      className="transition-opacity"
                      style={{ opacity: active ? 1 : 0.5 }}
                    >
                      <Badge variant={active ? POINT_STATUS_VARIANTS[key] : 'neutral'} className="text-[10px] cursor-pointer">
                        {label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

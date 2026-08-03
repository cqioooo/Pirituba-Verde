import { WASTE_CATEGORY_LABELS, WASTE_CATEGORY_COLORS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import type { StatusPonto } from '@/types';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  className?: string;
  showStatus?: boolean;
}

const categories = Object.entries(WASTE_CATEGORY_LABELS);
const statuses = Object.entries(POINT_STATUS_LABELS) as [StatusPonto, string][];

export function MapLegend({ className, showStatus = false }: MapLegendProps) {
  return (
    <div className={cn('bg-white/95 backdrop-blur-sm rounded-xl shadow-elevated p-3 space-y-3', className)}>
      <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Legenda</p>

      {/* Categorias */}
      <div>
        <p className="text-[10px] text-surface-400 mb-1.5">Tipo de resíduo</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {categories.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: WASTE_CATEGORY_COLORS[key] }}
              />
              <span className="text-[11px] text-surface-700 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      {showStatus && (
        <div>
          <p className="text-[10px] text-surface-400 mb-1.5">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map(([key, label]) => (
              <Badge key={key} variant={POINT_STATUS_VARIANTS[key]} className="text-[10px]">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

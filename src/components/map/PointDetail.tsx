import type { PontoAutenticado } from '@/types';
import { WASTE_CATEGORY_LABELS, WASTE_CATEGORY_COLORS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import { Badge, Button } from '@/components/ui';
import { MapPin, Calendar, Users, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHistoricoPonto } from '@/services/queries';
import { ConfirmButton } from './ConfirmButton';

interface PointDetailProps {
  point: PontoAutenticado;
  onClose?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function eventIcon(type: string) {
  switch (type) {
    case 'novo': return <Calendar className="w-3 h-3" />;
    case 'confirmado': return <Users className="w-3 h-3" />;
    case 'em_analise': return <RefreshCw className="w-3 h-3" />;
    case 'recorrente': return <AlertTriangle className="w-3 h-3" />;
    default: return <RefreshCw className="w-3 h-3" />;
  }
}

export function PointDetail({ point }: PointDetailProps) {
  const { data: events = [] } = useHistoricoPonto(point.id);
  
  const categoria = point.categoria_principal || 'misto';
  const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
  const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';

  const isResolvido = point.status === 'resolvido' || point.status === 'arquivado' || point.status === 'invalido' || point.status === 'cancelado';

  return (
    <div className="space-y-4 py-2">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
          <Badge variant={POINT_STATUS_VARIANTS[point.status]}>
            {POINT_STATUS_LABELS[point.status]}
          </Badge>
        </div>

        <div className="flex items-start gap-1.5 mb-2">
          <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-surface-800">{point.endereco}</p>
        </div>
        
        {point.distancia_ecoponto_metros && (
          <p className="text-xs text-primary-600 bg-primary-50 inline-block px-2 py-1 rounded">
            Ecoponto mais próximo a {point.distancia_ecoponto_metros}m
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-surface-800">{point.confirmacoes}</p>
          <p className="text-[10px] text-surface-500">Confirmações</p>
        </div>
        <div className="bg-surface-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-surface-800">{point.criticidade ? point.criticidade.toFixed(1) : '-'}</p>
          <p className="text-[10px] text-surface-500">Criticidade</p>
        </div>
        <div className="bg-surface-50 rounded-lg p-2.5 text-center">
          <p className="text-xs font-semibold text-surface-800 pt-1">
            {point.frequencia_percebida ? point.frequencia_percebida.replace('_', ' ') : 'N/A'}
          </p>
          <p className="text-[10px] text-surface-500 mt-1">Frequência</p>
        </div>
      </div>

      {/* Timeline */}
      {events.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Histórico
          </h3>
          <div className="space-y-0">
            {events.slice(0, 5).map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
                    {eventIcon(event.status_novo)}
                  </div>
                  {i < Math.min(events.length, 5) - 1 && (
                    <div className="w-px h-full bg-surface-200 min-h-[16px]" />
                  )}
                </div>

                <div className="pb-3 min-w-0">
                  <p className="text-xs font-medium text-surface-700">
                    Status alterado para {POINT_STATUS_LABELS[event.status_novo]}
                  </p>
                  {event.motivo && (
                    <p className="text-[11px] text-surface-500 mt-0.5">{event.motivo}</p>
                  )}
                  <p className="text-[10px] text-surface-400 mt-0.5">{formatDate(event.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="pt-2 border-t border-surface-100 space-y-3">
        {!isResolvido && (
          <ConfirmButton pontoId={point.id} />
        )}
        
        <Link to={`/app/nova-denuncia?pointId=${point.id}`} className="block">
          <Button variant={isResolvido ? "primary" : "outline"} fullWidth size="sm" icon={<ChevronRight className="w-4 h-4" />}>
            Nova denúncia neste local
          </Button>
        </Link>
        <p className="text-[10px] text-surface-400 text-center">
          Atualizado em {formatDate(point.updated_at)}
        </p>
      </div>
    </div>
  );
}

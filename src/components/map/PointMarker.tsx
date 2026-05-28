import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { PontoPublico, PontoAutenticado } from '@/types';
import { WASTE_CATEGORY_COLORS, WASTE_CATEGORY_LABELS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import { Badge } from '@/components/ui';

// ── Custom marker icon factory ──

function createMarkerIcon(color: string, selected: boolean = false): L.DivIcon {
  const size = selected ? 16 : 12;
  const borderSize = selected ? 3 : 2;
  return L.divIcon({
    className: 'pv-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${borderSize}px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${selected ? 'transform: scale(1.3);' : ''}
    "></div>`,
    iconSize: [size + borderSize * 2, size + borderSize * 2],
    iconAnchor: [(size + borderSize * 2) / 2, (size + borderSize * 2) / 2],
    popupAnchor: [0, -(size / 2 + borderSize)],
  });
}

// ── Public Point Marker ──

interface PublicPointMarkerProps {
  point: PontoPublico;
}

export function PublicPointMarker({ point }: PublicPointMarkerProps) {
  const categoria = point.categoria_principal || 'misto';
  const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
  const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';
  
  const icon = useMemo(() => createMarkerIcon(color), [color]);

  return (
    <Marker position={[point.lat_aproximada, point.lng_aproximada]} icon={icon}>
      <Popup className="pv-popup" maxWidth={260} minWidth={200}>
        <div className="space-y-2 py-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
            <Badge variant={POINT_STATUS_VARIANTS[point.status]} className="text-[10px]">
              {POINT_STATUS_LABELS[point.status]}
            </Badge>
          </div>
          <p className="text-xs text-surface-600">
            {point.bairro}{point.subprefeitura ? ` — ${point.subprefeitura}` : ''}
          </p>
          <p className="text-[10px] text-surface-400">
            {point.confirmacoes} confirmações da comunidade
          </p>
          <div className="pt-1 border-t border-surface-100">
            <p className="text-[10px] text-surface-500 italic">
              Localização aproximada. Faça login para ver detalhes completos.
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ── Auth Point Marker ──

interface AuthPointMarkerProps {
  point: PontoAutenticado;
  selected?: boolean;
  onClick?: (point: PontoAutenticado) => void;
}

export function AuthPointMarker({ point, selected = false, onClick }: AuthPointMarkerProps) {
  const categoria = point.categoria_principal || 'misto';
  const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
  const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';

  const icon = useMemo(() => createMarkerIcon(color, selected), [color, selected]);

  return (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(point),
      }}
    >
      {!onClick && (
        <Popup className="pv-popup" maxWidth={280} minWidth={220}>
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {label}
              </span>
              <Badge variant={POINT_STATUS_VARIANTS[point.status]} className="text-[10px]">
                {POINT_STATUS_LABELS[point.status]}
              </Badge>
            </div>
            <p className="text-sm font-medium text-surface-800">{point.endereco}</p>
            <p className="text-xs text-surface-600 line-clamp-2">
              Visto: {point.frequencia_percebida || 'Não informado'} | Vol: {point.volume_estimado || 'Não informado'}
            </p>
            <p className="text-[10px] text-surface-400">
              {point.confirmacoes} confirmações · Criticidade: {point.criticidade ? point.criticidade.toFixed(1) : '0'}
            </p>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

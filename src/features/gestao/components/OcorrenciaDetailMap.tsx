import { useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, WarningCircle } from '@phosphor-icons/react';
import { DETAIL_ZOOM } from '@/types';

interface OcorrenciaDetailMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const occurrenceIcon = L.divIcon({
  className: 'pv-marker',
  html: `<div style="
    width: 22px;
    height: 22px;
    background: #244214;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

export function OcorrenciaDetailMap({ latitude, longitude }: OcorrenciaDetailMapProps) {
  const [tileError, setTileError] = useState(false);
  const position = useMemo<[number, number] | null>(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? [lat, lng]
      : null;
  }, [latitude, longitude]);

  if (!position) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4 text-sm text-surface-600">
        <MapPin size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>Esta ocorrência não possui coordenadas válidas disponíveis. Nenhuma localização foi estimada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label="Mapa com a localização exata da ocorrência"
        className="relative h-64 min-h-64 overflow-hidden rounded-xl border border-surface-200 bg-surface-100 sm:h-80"
      >
        <MapContainer
          center={position}
          zoom={DETAIL_ZOOM}
          className="h-full w-full z-0"
          zoomControl
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
            }}
          />
          <Marker position={position} icon={occurrenceIcon} />
        </MapContainer>

        {tileError && (
          <div role="alert" className="absolute inset-x-3 bottom-3 z-[500] flex items-start gap-2 rounded-lg border border-warning-200 bg-white/95 p-3 text-sm text-surface-700 shadow-sm">
            <WarningCircle size={18} className="mt-0.5 shrink-0 text-warning-700" aria-hidden="true" />
            <p>O fundo do mapa não carregou completamente. O marcador continua indicando a coordenada registrada.</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-sm text-surface-600">
        <MapPin size={18} className="mt-0.5 shrink-0 text-primary-700" aria-hidden="true" />
        <p>
          Coordenada registrada: <span className="font-mono text-surface-900">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>.
          {' '}Localização operacional restrita a perfis autorizados.
        </p>
      </div>
    </div>
  );
}

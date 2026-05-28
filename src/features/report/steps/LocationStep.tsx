import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Spinner } from '@/components/ui';
import { PIRITUBA_CENTER, DETAIL_ZOOM } from '@/types';
import { MapPin, Navigation } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'pv-marker',
  html: `<div style="
    width: 24px; height: 24px;
    background: #2D6A4F;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

interface LocationStepProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

/** Inner component that handles map click events */
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Inner component to fly map to a position */
function FlyToPosition({ position }: { position: [number, number] }) {
  const map = useMapEvents({ click() {} });
  const hasFlewRef = useRef(false);

  useEffect(() => {
    if (!hasFlewRef.current && position[0] !== 0 && position[1] !== 0) {
      map.flyTo(position, DETAIL_ZOOM, { duration: 0.6 });
      hasFlewRef.current = true;
    }
  }, [map, position]);

  return null;
}

export function LocationStep({ latitude, longitude, onLocationChange }: LocationStepProps) {
  const geo = useGeolocation();

  const hasSelectedLocation = latitude !== 0 && longitude !== 0;
  const mapCenter: [number, number] = hasSelectedLocation
    ? [latitude, longitude]
    : geo.hasLocation
    ? geo.effectiveCoords
    : PIRITUBA_CENTER;

  const handleUseMyLocation = () => {
    if (geo.hasLocation) {
      onLocationChange(geo.effectiveCoords[0], geo.effectiveCoords[1]);
    } else {
      geo.requestLocation();
    }
  };

  // Auto-set when geo arrives for the first time
  useEffect(() => {
    if (geo.hasLocation && !hasSelectedLocation) {
      onLocationChange(geo.effectiveCoords[0], geo.effectiveCoords[1]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.hasLocation]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-surface-900">Onde está o problema?</h2>
        <p className="text-sm text-surface-500 mt-1">
          Confirme ou ajuste a localização do descarte irregular. Toque no mapa para reposicionar o ponto.
        </p>
      </div>

      {/* Location button */}
      <button
        onClick={handleUseMyLocation}
        disabled={geo.loading}
        className="flex items-center gap-2 w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-sm font-medium text-primary-700 transition-colors disabled:opacity-50"
      >
        {geo.loading ? (
          <Spinner size="sm" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {geo.loading ? 'Obtendo localização...' : 'Usar minha localização atual'}
      </button>

      {geo.error && (
        <p className="text-xs text-danger-500">{geo.error}</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-surface-200 h-56 sm:h-72">
        <MapContainer
          center={mapCenter}
          zoom={hasSelectedLocation ? DETAIL_ZOOM : 14}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationChange={onLocationChange} />
          {hasSelectedLocation && (
            <>
              <Marker position={[latitude, longitude]} icon={pinIcon} />
              <FlyToPosition position={[latitude, longitude]} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Selected coordinates */}
      {hasSelectedLocation && (
        <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-primary-500" />
          <span>
            Coordenadas: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}

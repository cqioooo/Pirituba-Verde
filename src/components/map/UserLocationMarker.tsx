import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'pv-user-marker',
  html: `<div class="pv-user-dot"><div class="pv-user-dot-inner"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface UserLocationMarkerProps {
  position: [number, number];
  accuracy?: number | null;
}

export function UserLocationMarker({ position, accuracy }: UserLocationMarkerProps) {
  return (
    <>
      {accuracy && accuracy > 0 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }}
        />
      )}
      <Marker position={position} icon={userIcon} />
    </>
  );
}

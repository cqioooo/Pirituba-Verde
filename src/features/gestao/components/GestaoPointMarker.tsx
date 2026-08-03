import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { POINT_STATUS_VARIANTS } from '@/types';
import type { PontoGestor } from '@/types';

interface GestaoPointMarkerProps {
  ponto: PontoGestor;
  onClick: () => void;
}

export function GestaoPointMarker({ ponto, onClick }: GestaoPointMarkerProps) {
  // Cores baseadas no status
  const variant = POINT_STATUS_VARIANTS[ponto.status];
  
  const colors = {
    neutral: '#9CA3AF',
    info: '#3B82F6',
    warning: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
  };
  
  const color = colors[variant];
  
  // Tamanho baseado na criticidade (se for critica, é maior)
  const isCritical = ponto.criticidade && ponto.criticidade >= 75;
  const size = isCritical ? 24 : 16;
  const pulseClass = isCritical ? 'animate-pulse' : '';

  const customIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex items-center justify-center w-full h-full">
        <div 
          class="shadow-md ${pulseClass}" 
          style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 2px; transform: rotate(45deg);"
        ></div>
      </div>
    `,
    iconSize: [size * 1.5, size * 1.5],
    iconAnchor: [(size * 1.5) / 2, (size * 1.5) / 2],
  });

  return (
    <Marker
      position={[ponto.latitude, ponto.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}

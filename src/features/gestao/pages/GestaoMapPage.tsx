import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Spinner } from '@/components/ui';
import { usePontosGestor } from '@/services/queries';
import { PIRITUBA_CENTER, DEFAULT_ZOOM, DETAIL_ZOOM } from '@/types';
import type { PontoGestor } from '@/types';
import { GestaoPointMarker } from '../components/GestaoPointMarker';
import { MapSidePanel } from '../components/MapSidePanel';
import { PointFilters } from '../components/PointFilters';
import { Funnel } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui';

function FlyTo({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, zoom, { duration: 0.8 });
  }, [map, position, zoom]);
  return null;
}

export function GestaoMapPage() {
  const [filters, setFilters] = useState({ status: '', categoria: '', criticidade: '', busca: '' });
  
  // Na vida real, os filtros seriam passados pro hook. Para manter simples e não ficar
  // recarregando do banco a cada digitação, vamos filtrar no frontend
  const { data: points = [], isLoading } = usePontosGestor();
  
  const [selectedPoint, setSelectedPoint] = useState<PontoGestor | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number } | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredPoints = useMemo(() => {
    return points.filter(p => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.categoria && p.categoria_principal !== filters.categoria) return false;
      
      if (filters.criticidade) {
        const critVal = p.criticidade || 0;
        if (filters.criticidade === 'baixa' && critVal >= 25) return false;
        if (filters.criticidade === 'media' && (critVal < 25 || critVal >= 50)) return false;
        if (filters.criticidade === 'alta' && (critVal < 50 || critVal >= 75)) return false;
        if (filters.criticidade === 'critica' && critVal < 75) return false;
      }

      if (filters.busca) {
        const q = filters.busca.toLowerCase();
        const idMatch = p.id.split('-')[0].includes(q);
        const bairroMatch = p.bairro?.toLowerCase().includes(q) || false;
        const addressMatch = p.endereco?.toLowerCase().includes(q) || false;
        if (!idMatch && !bairroMatch && !addressMatch) return false;
      }

      return true;
    });
  }, [points, filters]);

  const handleSelectPoint = (point: PontoGestor) => {
    setSelectedPoint(point);
    setFlyTarget({ pos: [point.latitude, point.longitude], zoom: DETAIL_ZOOM });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={PIRITUBA_CENTER}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {filteredPoints.map(point => (
            <GestaoPointMarker
              key={point.id}
              ponto={point}
              onClick={() => handleSelectPoint(point)}
            />
          ))}

          {flyTarget && <FlyTo position={flyTarget.pos} zoom={flyTarget.zoom} />}
        </MapContainer>

        {/* Overlay Filters (Desktop) */}
        <div className="absolute top-4 left-4 z-[1000] max-w-sm hidden md:block">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-surface-200">
            <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2 text-sm">
              <Funnel className="w-4 h-4" /> Filtros do Mapa
            </h3>
            <PointFilters onFilterChange={(f) => setFilters(f as any)} />
            <p className="text-xs text-surface-500 mt-3 font-medium">
              Mostrando {filteredPoints.length} pontos
            </p>
          </div>
        </div>

        {/* Mobile Filters Button */}
        <div className="absolute top-4 left-4 z-[1000] md:hidden">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="bg-white px-3 py-2 rounded-lg shadow-lg border border-surface-200 flex items-center gap-2 text-sm font-medium text-surface-700"
          >
            <Funnel className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Point Count Badge */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-surface-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            {filteredPoints.length} resultados
          </div>
        </div>
      </div>

      {/* Side Panel for Selected Point */}
      <MapSidePanel 
        ponto={selectedPoint} 
        onClose={() => setSelectedPoint(null)} 
      />

      {/* Mobile Filters Sheet */}
      <BottomSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filtros do Mapa"
      >
        <div className="p-4 pt-2">
          <PointFilters onFilterChange={(f) => setFilters(f as any)} />
        </div>
      </BottomSheet>
    </div>
  );
}

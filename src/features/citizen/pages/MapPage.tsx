import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Button, Spinner } from '@/components/ui';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AuthPointMarker } from '@/components/map/PointMarker';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { MapLegend } from '@/components/map/MapLegend';
import { MapFilters } from '@/components/map/MapFilters';
import { PointCard } from '@/components/map/PointCard';
import { PointDetail } from '@/components/map/PointDetail';
import { useMapFilters } from '@/hooks/useMapFilters';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePontosAutenticados } from '@/services/queries';
import { PIRITUBA_CENTER, DEFAULT_ZOOM, DETAIL_ZOOM } from '@/types';
import type { PontoAutenticado } from '@/types';
import { Plus, List, X, Crosshair } from '@phosphor-icons/react';

/** Helper component to fly to a position on the map */
function FlyTo({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, zoom, { duration: 0.8 });
  }, [map, position, zoom]);
  return null;
}

export function MapPage() {
  const { data: points = [], isLoading } = usePontosAutenticados();
  const [selectedPoint, setSelectedPoint] = useState<PontoAutenticado | null>(null);
  const [showList, setShowList] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number } | null>(null);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { filters, toggleCategory, toggleStatus, resetFilters, hasActiveFilters, applyFilters } = useMapFilters();
  const geo = useGeolocation();

  const listRef = useRef<HTMLDivElement>(null);

  const filteredPoints = applyFilters(points);

  const handleSelectPoint = useCallback((point: PontoAutenticado) => {
    setSelectedPoint(point);
    setFlyTarget({ pos: [point.latitude, point.longitude], zoom: DETAIL_ZOOM });

    // On mobile, show bottom sheet
    if (!isDesktop) {
      setShowList(false);
    }
  }, [isDesktop]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  const handleLocateUser = useCallback(() => {
    if (geo.hasLocation) {
      setFlyTarget({ pos: geo.effectiveCoords, zoom: DETAIL_ZOOM });
    } else {
      geo.requestLocation();
    }
  }, [geo]);

  // When geo finishes loading, fly to user
  useEffect(() => {
    if (geo.hasLocation && geo.loading === false) {
      setFlyTarget({ pos: geo.effectiveCoords, zoom: DETAIL_ZOOM });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.hasLocation]);

  // Scroll selected point into view in list
  useEffect(() => {
    if (selectedPoint && listRef.current && isDesktop) {
      const el = listRef.current.querySelector(`[data-point-id="${selectedPoint.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPoint, isDesktop]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-surface-500">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative">
      {/* Map */}
      <div className="flex-1 relative min-h-[350px]">
        <MapContainer
          center={PIRITUBA_CENTER}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {filteredPoints.map(point => (
            <AuthPointMarker
              key={point.id}
              point={point}
              selected={selectedPoint?.id === point.id}
              onClick={handleSelectPoint}
            />
          ))}

          {geo.hasLocation && (
            <UserLocationMarker
              position={geo.effectiveCoords}
              accuracy={geo.accuracy}
            />
          )}

          {flyTarget && <FlyTo position={flyTarget.pos} zoom={flyTarget.zoom} />}
        </MapContainer>

        {/* Map overlays */}
        <div className="absolute top-3 left-3 z-[1000] max-w-[220px]">
          <MapFilters
            filters={filters}
            onToggleCategory={toggleCategory}
            onToggleStatus={toggleStatus}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            showStatusFilter
          />
        </div>

        {/* Legend - desktop only */}
        <div className="absolute bottom-3 left-3 z-[1000] max-w-[260px] hidden md:block">
          <MapLegend showStatus />
        </div>

        {/* Point count */}
        <div className="absolute top-3 right-3 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm text-surface-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border border-surface-200">
            {filteredPoints.length} pontos
          </div>
        </div>

        {/* Locate user */}
        <button
          onClick={handleLocateUser}
          className="absolute bottom-20 md:bottom-3 right-3 z-[1000] w-9 h-9 bg-white rounded-lg shadow-elevated border border-surface-200 flex items-center justify-center text-surface-600 hover:text-primary-600 hover:border-primary-200 transition-colors"
          title="Minha localização"
          aria-label="Centralizar no minha localização"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* List toggle - mobile */}
        <button
          onClick={() => setShowList(!showList)}
          className="md:hidden absolute bottom-20 left-3 z-[5000] flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg shadow-elevated border border-surface-200 text-xs font-medium text-surface-700"
        >
          <List className="w-3.5 h-3.5" />
          Lista
        </button>

        {/* FAB - Nova denúncia */}
        <Link
          to="/app/nova-denuncia"
          className="absolute bottom-20 md:bottom-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-14 z-[1000]"
        >
          <Button
            size="sm"
            icon={<Plus className="w-5 h-5" />}
            className="shadow-elevated shadow-gray-900/20 rounded-md px-4 py-3 bg-primary-700 hover:bg-primary-800 transition-colors duration-200 text-white"
          >
            Nova denúncia
          </Button>
        </Link>
      </div>

      {/* Desktop: Side panel */}
      {isDesktop && (
        <aside className="w-80 xl:w-96 border-l border-surface-200 bg-white flex flex-col overflow-hidden shrink-0">
          {selectedPoint ? (
            /* Detail view */
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-surface-900">Detalhes do ponto</h2>
                <button
                  onClick={handleCloseDetail}
                  className="p-1 rounded text-surface-400 hover:text-surface-600 transition-colors"
                  aria-label="Fechar detalhes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pb-4">
                <PointDetail point={selectedPoint} />
              </div>
            </div>
          ) : (
            /* List view */
            <>
              <div className="px-4 pt-4 pb-3 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-surface-900">
                  Pontos mapeados
                </h2>
                <p className="text-[11px] text-surface-500 mt-0.5">
                  {filteredPoints.length} pontos na região · Selecione para ver detalhes
                </p>
              </div>
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredPoints.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-surface-500">Nenhum ponto encontrado com os filtros selecionados.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  filteredPoints.map(point => (
                    <div key={point.id} data-point-id={point.id}>
                      <PointCard
                         point={point}
                        selected={false}
                        onClick={handleSelectPoint}
                      />
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      )}

      {/* Mobile: Bottom sheet for list */}
      {!isDesktop && showList && !selectedPoint && (
        <BottomSheet
          open={showList}
          onClose={() => setShowList(false)}
          title={`${filteredPoints.length} pontos mapeados`}
        >
          <div className="space-y-2 pt-2">
            {filteredPoints.map(point => (
              <PointCard
                key={point.id}
                point={point}
                compact
                onClick={(p) => {
                  handleSelectPoint(p);
                  setShowList(false);
                }}
              />
            ))}
          </div>
        </BottomSheet>
      )}

      {/* Mobile: Bottom sheet for detail */}
      {!isDesktop && selectedPoint && (
        <BottomSheet
          open={!!selectedPoint}
          onClose={handleCloseDetail}
          title="Detalhes do ponto"
          initialSnap="half"
        >
          <PointDetail point={selectedPoint} />
        </BottomSheet>
      )}
    </div>
  );
}

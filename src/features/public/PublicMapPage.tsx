
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Button, Spinner } from '@/components/ui';
import { PublicPointMarker } from '@/components/map/PointMarker';
import { MapLegend } from '@/components/map/MapLegend';
import { MapFilters } from '@/components/map/MapFilters';
import { useMapFilters } from '@/hooks/useMapFilters';
import { usePontosPublicos } from '@/services/queries';
import { PIRITUBA_CENTER, DEFAULT_ZOOM } from '@/types';
import { Lock, ArrowRight, Info } from '@phosphor-icons/react';

export function PublicMapPage() {
  const { data: points = [], isLoading } = usePontosPublicos();
  const { filters, toggleCategory, resetFilters, hasActiveFilters, applyFilters } = useMapFilters();

  const filteredPoints = applyFilters(points);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Mapa público</h1>
        <p className="text-sm text-surface-500 mt-1">
          Visão resumida dos pontos de descarte irregular identificados na região de Pirituba.
        </p>
      </div>

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-surface-200 shadow-card">
        {isLoading ? (
          <div className="aspect-[16/10] bg-surface-100 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Spinner size="lg" />
              <p className="text-sm text-surface-500">Carregando pontos mapeados...</p>
            </div>
          </div>
        ) : (
          <div className="aspect-[16/10] sm:aspect-[16/8]">
            <MapContainer
              center={PIRITUBA_CENTER}
              zoom={DEFAULT_ZOOM}
              className="w-full h-full"
              zoomControl={true}
              attributionControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {filteredPoints.map(point => (
                <PublicPointMarker key={point.id} point={point} />
              ))}
            </MapContainer>

            {/* Overlays */}
            <div className="absolute top-3 left-3 z-[1000] max-w-[220px]">
              <MapFilters
                filters={filters}
                onToggleCategory={toggleCategory}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            <div className="absolute bottom-3 left-3 z-[1000] max-w-[260px] hidden sm:block">
              <MapLegend />
            </div>

            {/* Public notice badge */}
            <div className="absolute top-3 right-3 z-[1000]">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-surface-600 text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-sm border border-surface-200">
                <Info className="w-3 h-3 text-surface-400" />
                Localização aproximada
              </div>
            </div>

            {/* Count badge */}
            <div className="absolute bottom-3 right-3 z-[1000]">
              <div className="bg-white/90 backdrop-blur-sm text-surface-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border border-surface-200">
                {filteredPoints.length} de {points.length} pontos
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth CTA banner */}
      <div className="mt-5 bg-primary-50 border border-primary-100 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-800">
                Visualização pública resumida
              </p>
              <p className="text-xs text-primary-600 mt-0.5 leading-relaxed">
                Este mapa exibe uma amostra dos pontos com localização aproximada.
                Para ver todos os pontos com detalhes completos, histórico e registrar denúncias,
                acesse sua conta.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/cadastro">
              <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Criar conta
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile legend */}
      <div className="sm:hidden mt-4">
        <MapLegend className="shadow-card" />
      </div>
    </div>
  );
}

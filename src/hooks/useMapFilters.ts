import { useState, useCallback, useMemo } from 'react';
import type { MapFilterState, StatusPonto } from '@/types';

const INITIAL_FILTERS: MapFilterState = {
  categorias: [],
  status: [],
};

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilterState>(INITIAL_FILTERS);

  const toggleCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categorias: prev.categorias.includes(category)
        ? prev.categorias.filter(c => c !== category)
        : [...prev.categorias, category],
    }));
  }, []);

  const toggleStatus = useCallback((status: StatusPonto) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () => filters.categorias.length > 0 || filters.status.length > 0,
    [filters]
  );

  /** Filtra um array de pontos conforme os filtros ativos */
  const applyFilters = useCallback(
    <T extends { categoria_principal: string | null; status: StatusPonto }>(points: T[]): T[] => {
      return points.filter(p => {
        const cat = p.categoria_principal || 'misto';
        if (filters.categorias.length > 0 && !filters.categorias.includes(cat)) {
          return false;
        }
        if (filters.status.length > 0 && !filters.status.includes(p.status)) {
          return false;
        }
        return true;
      });
    },
    [filters]
  );

  return {
    filters,
    toggleCategory,
    toggleStatus,
    resetFilters,
    hasActiveFilters,
    applyFilters,
  };
}

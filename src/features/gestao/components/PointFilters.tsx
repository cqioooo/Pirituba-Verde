import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { MagnifyingGlass, Funnel, X } from '@phosphor-icons/react';
import { POINT_STATUS_LABELS, WASTE_CATEGORY_LABELS, CRITICIDADE_LABELS } from '@/types';

interface FilterState {
  status: string;
  categoria: string;
  criticidade: string;
  busca: string;
}

interface PointFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

export function PointFilters({ onFilterChange, className }: PointFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    categoria: '',
    criticidade: '',
    busca: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { status: '', categoria: '', criticidade: '', busca: '' };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  const statusOptions = Object.entries(POINT_STATUS_LABELS).map(([val, label]) => ({ value: val, label }));
  const catOptions = Object.entries(WASTE_CATEGORY_LABELS).map(([val, label]) => ({ value: val, label }));
  const critOptions = Object.entries(CRITICIDADE_LABELS).map(([val, label]) => ({ value: val, label }));

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            label="Buscar"
            placeholder="Buscar por ID ou bairro..."
            value={filters.busca}
            onChange={(e) => handleFilterChange('busca', e.target.value)}
            icon={<MagnifyingGlass className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-end gap-2 pb-[1px]">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex"
          >
            <Funnel className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden px-2"
          >
            <Funnel className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" className="px-2" onClick={clearFilters} title="Limpar filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-surface-50 rounded-lg border border-surface-200">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[{ label: 'Todos os Status', value: '' }, ...statusOptions]}
          />
          <Select
            label="Categoria"
            value={filters.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            options={[{ label: 'Todas as Categorias', value: '' }, ...catOptions]}
          />
          <Select
            label="Criticidade"
            value={filters.criticidade}
            onChange={(e) => handleFilterChange('criticidade', e.target.value)}
            options={[{ label: 'Todas as Criticidades', value: '' }, ...critOptions]}
          />
        </div>
      )}
    </div>
  );
}

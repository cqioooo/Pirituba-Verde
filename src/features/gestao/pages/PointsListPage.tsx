import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePontosGestor } from '@/services/queries';
import { PointFilters } from '../components/PointFilters';
import { CriticidadeBadge } from '../components/CriticidadeBadge';
import { Spinner, Badge, Button } from '@/components/ui';
import { POINT_STATUS_LABELS, WASTE_CATEGORY_LABELS, classificarCriticidade } from '@/types';
import { formatDate } from '@/lib/utils';
import { CaretRight, ArrowsVertical } from '@phosphor-icons/react';

export function PointsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', categoria: '', criticidade: '', busca: '' });
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ 
    key: 'criticidade', 
    direction: 'desc' 
  });
  
  const { data: points = [], isLoading } = usePontosGestor();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredPoints = useMemo(() => {
    let result = points.filter(p => {
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

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Trata nulos para não quebrar a ordenação
        if (aValue === null) aValue = '';
        if (bValue === null) bValue = '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [points, filters, sortConfig]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-surface-900 tracking-tight">Pontos de Descarte</h1>
        <p className="text-surface-600 text-base mt-2">Lista completa do território para análise e gestão.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-surface-200">
        <PointFilters onFilterChange={(f) => setFilters(f as any)} />
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-surface-200 overflow-hidden flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : sortedAndFilteredPoints.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-surface-500">
            <p className="text-lg font-medium text-surface-900">Nenhum ponto encontrado</p>
            <p className="text-sm">Ajuste os filtros para ver mais resultados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-50 text-surface-600 border-b border-surface-200 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap w-24">ID</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-surface-100/50 transition-colors" onClick={() => handleSort('criticidade')}>
                    <div className="flex items-center gap-1.5">
                      Criticidade <ArrowsVertical className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-surface-100/50 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1.5">
                      Status <ArrowsVertical className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Local / Categoria</th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-surface-100/50 transition-colors" onClick={() => handleSort('total_denuncias')}>
                    <div className="flex items-center justify-center gap-1.5">
                      Den. <ArrowsVertical className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-surface-100/50 transition-colors" onClick={() => handleSort('data_ultima_ocorrencia')}>
                    <div className="flex items-center gap-1.5">
                      Última atualização <ArrowsVertical className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {sortedAndFilteredPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-surface-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-surface-500 whitespace-nowrap font-medium">
                      {point.id.split('-')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CriticidadeBadge criticidade={classificarCriticidade(point.criticidade)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={point.status === 'resolvido' ? 'success' : point.status === 'invalido' ? 'danger' : 'warning'}>
                        {POINT_STATUS_LABELS[point.status]}
                      </Badge>
                      {point.recorrente && (
                        <span className="block mt-1 text-[10px] text-danger-600 font-bold tracking-wide">RECORRENTE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <p className="font-semibold text-surface-900 truncate max-w-[280px]" title={point.endereco || ''}>
                        {point.endereco || 'Endereço não informado'}
                      </p>
                      <p className="text-surface-500 text-xs mt-1 font-medium">
                        {point.bairro || 'Bairro desconhecido'} • {point.categoria_principal ? WASTE_CATEGORY_LABELS[point.categoria_principal] : 'S/ Cat'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-surface-900">
                      {point.total_denuncias}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-surface-500 text-sm font-medium">
                      {point.data_ultima_ocorrencia ? formatDate(point.data_ultima_ocorrencia) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Button onClick={() => navigate(`/gestao/pontos/${point.id}`)} variant="outline" size="sm" className="gap-1.5 shadow-sm">
                        Detalhes
                        <CaretRight className="w-3.5 h-3.5" weight="bold" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

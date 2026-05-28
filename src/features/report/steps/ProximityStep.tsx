import { useEffect } from 'react';
import type { ProximityCheckResult } from '@/types';
import { useProximityCheck } from '@/hooks/useProximityCheck';
import { Spinner, Badge } from '@/components/ui';
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { WASTE_CATEGORY_COLORS, WASTE_CATEGORY_LABELS, POINT_STATUS_LABELS, POINT_STATUS_VARIANTS } from '@/types';
import { cn } from '@/lib/utils';

interface ProximityStepProps {
  latitude: number;
  longitude: number;
  onResult: (result: ProximityCheckResult) => void;
  onConfirmPoint: (pointId: string) => void;
  result: ProximityCheckResult | null;
  confirmingPointId: string | null;
}

export function ProximityStep({
  latitude,
  longitude,
  onResult,
  onConfirmPoint,
  result,
  confirmingPointId,
}: ProximityStepProps) {
  const proximityResult = useProximityCheck({
    latitude,
    longitude,
  });

  // Update parent when result changes
  useEffect(() => {
    if (proximityResult) {
      onResult(proximityResult);
    }
  }, [proximityResult, onResult]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-500">Verificando registros na região…</p>
      </div>
    );
  }

  const renderPointMatch = (match: typeof result.nearbyPoints[0]) => {
    const categoria = match.categoria_principal || 'misto';
    const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
    const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';
    const selected = confirmingPointId === match.id;

    return (
      <div key={match.id} className="relative">
        <button
          onClick={() => onConfirmPoint(match.id)}
          className={cn(
            'w-full text-left rounded-lg border p-3 transition-all',
            selected
              ? 'border-primary-300 bg-primary-50/50 shadow-sm'
              : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm'
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-semibold text-surface-800 truncate">
                {label}
              </span>
            </div>
            <Badge variant={POINT_STATUS_VARIANTS[match.status]} className="text-[10px] shrink-0">
              {POINT_STATUS_LABELS[match.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-surface-400 mt-2">
            <span>{match.confirmacoes} confirmações</span>
            {match.criticidade && <span>Criticidade {match.criticidade.toFixed(1)}</span>}
          </div>
        </button>
        <span className="absolute top-2 right-2 text-[10px] bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full">
          {Math.round(match.distancia_metros)}m
        </span>
      </div>
    );
  };

  // Cenário 1: ponto dentro do raio de confirmação
  if (result.scenario === 'confirmar') {
    const nearest = result.nearbyPoints[0];
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-primary-50 border border-primary-200 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary-800">
              Já existe um ponto registrado nesta região
            </p>
            <p className="text-xs text-primary-600 mt-1 leading-relaxed">
              Encontramos um registro a {Math.round(nearest.distancia_metros)}m do local indicado.
              Você pode confirmar esse ponto (isso fortalece o registro)
              ou continuar criando um novo.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {result.nearbyPoints.map(renderPointMatch)}
        </div>

        <div className="text-center">
          <button
            onClick={() => onConfirmPoint('')}
            className="text-xs text-surface-500 hover:text-surface-700 underline transition-colors"
          >
            Prefiro criar um novo registro
          </button>
        </div>
      </div>
    );
  }

  // Cenário 2: faixa cinzenta
  if (result.scenario === 'faixa_cinzenta') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-warning-50 border border-warning-500/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-surface-800">
              Existe um registro próximo
            </p>
            <p className="text-xs text-surface-600 mt-1 leading-relaxed">
              Encontramos {result.nearbyPoints.length === 1 ? 'um registro' : `${result.nearbyPoints.length} registros`} em
              uma área próxima ao local indicado. Seu novo registro será analisado
              junto ao existente para evitar duplicidades.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {result.nearbyPoints.slice(0, 3).map(renderPointMatch)}
        </div>

        <p className="text-xs text-surface-500 text-center">
          Você pode continuar normalmente. A equipe analisará se o registro será vinculado a um ponto existente.
        </p>
      </div>
    );
  }

  // Cenário 3: nenhum ponto próximo
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-surface-50 border border-surface-200 rounded-xl p-4">
        <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-surface-800">
            Nenhum registro encontrado nesta área
          </p>
          <p className="text-xs text-surface-600 mt-1 leading-relaxed">
            Não há pontos registrados próximos ao local indicado.
            Você pode criar um novo ponto de monitoramento para esta região.
          </p>
        </div>
      </div>

      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center mb-3">
          <MapPin className="w-8 h-8 text-primary-500" />
        </div>
        <p className="text-sm text-surface-600">
          Continue para preencher os detalhes da sua denúncia.
        </p>
      </div>
    </div>
  );
}

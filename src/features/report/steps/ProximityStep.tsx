import { useEffect, useMemo } from 'react';
import type { PontoAutenticado, PontoProximo, ProximityCheckResult } from '@/types';
import { useProximityCheck } from '@/hooks/useProximityCheck';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { ehTermoPrefeituraOuSubprefeitura } from '@/lib/geocoding';
import { usePontosAutenticados } from '@/services/queries';
import { SignedEvidenceThumbnail } from '@/components/shared/SignedEvidenceThumbnail';
import { Spinner, Badge } from '@/components/ui';
import { CheckCircle, WarningCircle, MapPin, Image as ImageIcon } from '@phosphor-icons/react';
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

interface NearbyPointMatchCardProps {
  match: PontoProximo;
  pontoInfo: PontoAutenticado | undefined;
  selected: boolean;
  onSelect: (pointId: string) => void;
}

function limparSemPrefeitura(valor: string | null | undefined): string | null {
  const limpo = valor?.trim();
  if (!limpo || ehTermoPrefeituraOuSubprefeitura(limpo)) return null;
  return limpo;
}

function NearbyPointMatchCard({
  match,
  pontoInfo,
  selected,
  onSelect,
}: NearbyPointMatchCardProps) {
  const categoria = match.categoria_principal || pontoInfo?.categoria_principal || 'misto';
  const color = WASTE_CATEGORY_COLORS[categoria] || WASTE_CATEGORY_COLORS.misto;
  const label = WASTE_CATEGORY_LABELS[categoria] || 'Misto';
  const distanciaArredondada = Math.round(match.distancia_metros);

  const enderecoSalvo =
    limparSemPrefeitura(match.endereco) || limparSemPrefeitura(pontoInfo?.endereco);
  const bairroSalvo =
    limparSemPrefeitura(match.bairro) || limparSemPrefeitura(pontoInfo?.bairro);

  const { resultado: geocodeFallback } = useReverseGeocode(
    !enderecoSalvo && pontoInfo ? pontoInfo.latitude : 0,
    !enderecoSalvo && pontoInfo ? pontoInfo.longitude : 0
  );

  const enderecoExibido =
    enderecoSalvo ||
    geocodeFallback?.endereco ||
    (bairroSalvo ? `Bairro ${bairroSalvo}` : null) ||
    (pontoInfo
      ? `Localização aproximada (${pontoInfo.latitude.toFixed(4)}, ${pontoInfo.longitude.toFixed(4)})`
      : `Ponto próximo (~${distanciaArredondada} m do local indicado)`);

  const bairroSecundario =
    enderecoSalvo && bairroSalvo && !enderecoSalvo.toLowerCase().includes(bairroSalvo.toLowerCase())
      ? bairroSalvo
      : null;

  const fotoPath = match.ultima_foto_url || pontoInfo?.ultima_foto_url || null;
  const totalConfirmacoes = match.confirmacoes;

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      aria-pressed={selected}
      className={cn(
        'w-full text-left overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        selected
          ? 'border-primary-400 bg-primary-50/40 ring-1 ring-primary-300 shadow-sm'
          : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm'
      )}
    >
      {/* Foto em destaque */}
      <div className="relative h-44 w-full bg-surface-100 border-b border-surface-100">
        {fotoPath ? (
          <SignedEvidenceThumbnail
            contextId={match.id}
            path={fotoPath}
            alt={`Foto do ponto registrado em ${enderecoExibido}`}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            showStatusLabel
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center text-surface-500">
            <ImageIcon className="h-8 w-8 text-surface-400" aria-hidden="true" />
            <span className="text-xs font-medium text-surface-600">
              Foto do registro indisponível
            </span>
          </div>
        )}

        <span className="absolute top-2.5 right-2.5 rounded-full bg-surface-900/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
          ~{distanciaArredondada} m
        </span>
      </div>

      {/* Endereço em destaque + tipo de resíduo discreto (sem criticidade nem prefeitura/subprefeitura) */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-900 leading-snug break-words">
                {enderecoExibido}
              </p>
              {bairroSecundario && (
                <p className="text-xs text-surface-500 mt-0.5 truncate">
                  {bairroSecundario}
                </p>
              )}
            </div>
          </div>

          <Badge variant={POINT_STATUS_VARIANTS[match.status]} className="text-[11px] shrink-0">
            {POINT_STATUS_LABELS[match.status]}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-100 text-xs text-surface-500">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0 opacity-80"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span>Resíduo: {label}</span>
          </span>

          <span className="text-surface-500">
            {totalConfirmacoes} {totalConfirmacoes === 1 ? 'confirmação' : 'confirmações'}
          </span>
        </div>

        {selected && (
          <div className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700 border border-primary-200">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Selecionado para confirmar este ponto (pula o formulário de nova denúncia)</span>
          </div>
        )}
      </div>
    </button>
  );
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
  const { data: pontosAutenticados = [] } = usePontosAutenticados();

  const pontosPorId = useMemo(() => {
    const mapa = new Map<string, PontoAutenticado>();
    for (const ponto of pontosAutenticados) {
      mapa.set(ponto.id, ponto);
    }
    return mapa;
  }, [pontosAutenticados]);

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

  const renderPointMatch = (match: PontoProximo) => (
    <NearbyPointMatchCard
      key={match.id}
      match={match}
      pontoInfo={pontosPorId.get(match.id)}
      selected={confirmingPointId === match.id}
      onSelect={onConfirmPoint}
    />
  );

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
          <WarningCircle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
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

import { useMemo } from 'react';
import type { ProximityCheckResult } from '@/types';
import { useConfiguracoes, usePontosProximos } from '@/services/queries';

interface UseProximityCheckOptions {
  latitude: number | null;
  longitude: number | null;
}

export function useProximityCheck({
  latitude,
  longitude,
}: UseProximityCheckOptions): ProximityCheckResult | null {
  const { data: configs } = useConfiguracoes();
  const raioMaximo = configs?.raio_faixa_cinzenta_metros || 100;

  const { data: pontos = [], isLoading } = usePontosProximos(latitude || 0, longitude || 0, raioMaximo);

  return useMemo(() => {
    if (latitude === null || longitude === null || isLoading) {
      return null;
    }

    const raio_agrupamento_metros = configs?.raio_agrupamento_metros ?? 50;
    const raio_faixa_cinzenta_metros = configs?.raio_faixa_cinzenta_metros ?? 100;

    // Cenário 1: ponto dentro do raio de confirmação (agrupamento)
    const withinConfirm = pontos.filter(p => p.distancia_metros <= raio_agrupamento_metros);
    if (withinConfirm.length > 0) {
      return {
        scenario: 'confirmar',
        nearbyPoints: withinConfirm,
      };
    }

    // Cenário 2: ponto na faixa cinzenta
    const withinGrayZone = pontos.filter(p => p.distancia_metros <= raio_faixa_cinzenta_metros);
    if (withinGrayZone.length > 0) {
      return {
        scenario: 'faixa_cinzenta',
        nearbyPoints: withinGrayZone,
      };
    }

    // Cenário 3: nenhum ponto próximo
    return {
      scenario: 'novo_ponto',
      nearbyPoints: [],
    };
  }, [latitude, longitude, pontos, configs, isLoading]);
}

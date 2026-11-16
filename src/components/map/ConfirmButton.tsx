import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calcularDistanciaMetros } from '@/lib/moderacao';
import {
  useConfiguracoes,
  useConfirmarPonto,
  useVerificarConfirmacao,
} from '@/services/queries';
import { Alert, Button } from '@/components/ui';
import { CheckCircle, ThumbsUp } from '@phosphor-icons/react';

interface ConfirmButtonProps {
  pontoId: string;
  pontoLatitude?: number;
  pontoLongitude?: number;
  autorId?: string | null;
  onSuccess?: () => void;
}

export function ConfirmButton({
  pontoId,
  pontoLatitude,
  pontoLongitude,
  autorId,
  onSuccess,
}: ConfirmButtonProps) {
  const { user } = useAuth();
  const geo = useGeolocation();
  const { data: configs } = useConfiguracoes();

  const [justConfirmed, setJustConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const pendingGeoRef = useRef(false);
  const submitLockRef = useRef(false);

  const { data: jaConfirmou, isLoading: isLoadingVerificacao } = useVerificarConfirmacao(
    pontoId,
    user?.id
  );
  const { mutateAsync: confirmar, isPending } = useConfirmarPonto();

  const enviarConfirmacaoComCoords = useCallback(
    async (lat: number, lng: number) => {
      if (!user || submitLockRef.current) return;

      if (autorId && user.id === autorId) {
        setConfirmError('O autor do registro não pode contabilizar confirmação externa.');
        return;
      }

      const raioPermitido = configs?.raio_geofence_metros ?? 15;
      if (
        typeof pontoLatitude === 'number' &&
        typeof pontoLongitude === 'number' &&
        Number.isFinite(pontoLatitude) &&
        Number.isFinite(pontoLongitude)
      ) {
        const distancia = calcularDistanciaMetros(lat, lng, pontoLatitude, pontoLongitude);
        if (distancia > raioPermitido) {
          setConfirmError(
            `Para confirmar, você precisa estar a até ${raioPermitido} m do ponto (distância atual: ${Math.round(distancia)} m).`
          );
          return;
        }
      }

      submitLockRef.current = true;
      setConfirmError(null);
      try {
        await confirmar({
          ponto_id: pontoId,
          usuario_id: user.id,
          latitude: lat,
          longitude: lng,
        });
        setJustConfirmed(true);
        onSuccess?.();
      } catch (error) {
        const msg = error instanceof Error ? error.message.toLowerCase() : '';
        if (msg.includes('autor')) {
          setConfirmError('O autor não pode confirmar o próprio registro.');
        } else if (msg.includes('duplicate') || msg.includes('já confirmou') || msg.includes('unique')) {
          setConfirmError('Você já registrou confirmação para este ponto neste ciclo.');
        } else if (msg.includes('raio') || msg.includes('distância') || msg.includes('proximidade')) {
          setConfirmError(`Você precisa estar dentro do raio de ${raioPermitido} m para confirmar.`);
        } else {
          setConfirmError('Não foi possível registrar a confirmação. Tente novamente.');
        }
      } finally {
        submitLockRef.current = false;
      }
    },
    [autorId, configs?.raio_geofence_metros, confirmar, onSuccess, pontoId, pontoLatitude, pontoLongitude, user]
  );

  useEffect(() => {
    if (!pendingGeoRef.current || geo.loading) return;

    if (geo.latitude !== null && geo.longitude !== null) {
      pendingGeoRef.current = false;
      const lat = geo.latitude;
      const lng = geo.longitude;
      Promise.resolve().then(() => {
        void enviarConfirmacaoComCoords(lat, lng);
      });
      return;
    }

    if (geo.error) {
      pendingGeoRef.current = false;
      const geoErr = geo.error;
      Promise.resolve().then(() => {
        setConfirmError(geoErr);
      });
    }
  }, [enviarConfirmacaoComCoords, geo.error, geo.latitude, geo.longitude, geo.loading]);

  if (!user || isLoadingVerificacao) {
    return null;
  }

  if (autorId && user.id === autorId) {
    return (
      <p className="text-xs text-surface-500 text-center">
        Você iniciou este registro; confirmações externas dependem de outros moradores no local.
      </p>
    );
  }

  if (jaConfirmou || justConfirmed) {
    return (
      <div className="flex items-center justify-center gap-2 p-2.5 bg-success-50 text-success-700 rounded-lg border border-success-200">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">Você já confirmou este ponto</span>
      </div>
    );
  }

  const handleConfirm = () => {
    setConfirmError(null);
    if (geo.latitude !== null && geo.longitude !== null) {
      void enviarConfirmacaoComCoords(geo.latitude, geo.longitude);
      return;
    }
    pendingGeoRef.current = true;
    geo.requestLocation();
  };

  return (
    <div className="space-y-2">
      {confirmError && <Alert variant="error">{confirmError}</Alert>}
      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="sm"
        icon={<ThumbsUp className="w-4 h-4" />}
        onClick={handleConfirm}
        loading={isPending || geo.loading}
        className="min-h-11"
      >
        {geo.loading
          ? 'Validando proximidade (15 m)...'
          : 'Ainda está aqui? Confirmar'}
      </Button>
    </div>
  );
}

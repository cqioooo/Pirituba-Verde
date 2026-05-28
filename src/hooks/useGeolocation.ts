import { useState, useCallback, useEffect, useRef } from 'react';

import { PIRITUBA_CENTER } from '@/types';

interface UseGeolocationOptions {
  /** Se true, ativa watch contínuo */
  watch?: boolean;
  /** Se true, solicita permissão automaticamente ao montar */
  autoRequest?: boolean;
  /** Timeout em ms para obter posição */
  timeout?: number;
}

interface UserLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const INITIAL_STATE: UserLocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  loading: false,
  error: null,
  permissionDenied: false,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { watch = false, autoRequest = false, timeout = 10000 } = options;
  const [state, setState] = useState<UserLocationState>(INITIAL_STATE);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      loading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error:
        error.code === error.PERMISSION_DENIED
          ? 'Permissão de localização negada. Ative a localização nas configurações do navegador.'
          : error.code === error.POSITION_UNAVAILABLE
          ? 'Não foi possível obter sua localização. Verifique se o GPS está ativado.'
          : 'Tempo esgotado para obter localização. Tente novamente.',
      permissionDenied: error.code === error.PERMISSION_DENIED,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada neste navegador.',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout,
      maximumAge: 60000, // 1 min cache
    };

    if (watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }
  }, [watch, timeout, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Auto-request se configurado
  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
    return () => {
      stopWatching();
    };
  }, [autoRequest, requestLocation, stopWatching]);

  /** Coordenadas com fallback para centro de Pirituba */
  const effectiveCoords: [number, number] = [
    state.latitude ?? PIRITUBA_CENTER[0],
    state.longitude ?? PIRITUBA_CENTER[1],
  ];

  return {
    ...state,
    requestLocation,
    stopWatching,
    effectiveCoords,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

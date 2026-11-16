import { useEffect, useState } from 'react';
import { reverseGeocodeCoords, type ReverseGeocodeResult } from '@/lib/geocoding';

interface UseReverseGeocodeState {
  resultado: ReverseGeocodeResult | null;
  loading: boolean;
}

export function useReverseGeocode(latitude: number, longitude: number): UseReverseGeocodeState {
  const hasValidCoords =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  const coordKey = hasValidCoords
    ? `${latitude.toFixed(5)},${longitude.toFixed(5)}`
    : null;

  const [resolved, setResolved] = useState<{
    key: string;
    resultado: ReverseGeocodeResult | null;
  } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!coordKey) return;

    const controller = new AbortController();
    let active = true;

    const timer = window.setTimeout(async () => {
      if (active) setLoadingKey(coordKey);
      try {
        const res = await reverseGeocodeCoords(latitude, longitude, controller.signal);
        if (active && !controller.signal.aborted) {
          setResolved({ key: coordKey, resultado: res });
        }
      } catch {
        if (active && !controller.signal.aborted) {
          setResolved({ key: coordKey, resultado: null });
        }
      } finally {
        if (active && !controller.signal.aborted) {
          setLoadingKey((prev) => (prev === coordKey ? null : prev));
        }
      }
    }, 350);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [coordKey, latitude, longitude]);

  return {
    resultado: coordKey && resolved?.key === coordKey ? resolved.resultado : null,
    loading: Boolean(coordKey && loadingKey === coordKey),
  };
}

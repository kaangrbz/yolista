import { useEffect, useRef, useState } from 'react';
import GeocodingService from '../services/GeocodingService';

interface UseReverseGeocodeParams {
  latitude?: number | null;
  longitude?: number | null;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseReverseGeocodeResult {
  address: string | null;
  shortAddress: string | null;
  loading: boolean;
}

export const useReverseGeocode = ({
  latitude,
  longitude,
  enabled = true,
  debounceMs = 350,
}: UseReverseGeocodeParams): UseReverseGeocodeResult => {
  const [address, setAddress] = useState<string | null>(null);
  const [shortAddress, setShortAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (
      !enabled ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number'
    ) {
      setAddress(null);
      setShortAddress(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;

      void GeocodingService.reverseGeocode(latitude, longitude).then((result) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setAddress(result?.formattedAddress ?? null);
        setShortAddress(result?.shortName ?? null);
        setLoading(false);
      });
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [latitude, longitude, enabled, debounceMs]);

  return { address, shortAddress, loading };
};

export default useReverseGeocode;

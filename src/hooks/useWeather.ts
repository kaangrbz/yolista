import { useEffect, useState } from 'react';
import {
  fetchWeatherByCoordinate,
  WeatherSnapshot,
} from '../services/WeatherService';

interface UseWeatherParams {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  /** Konum değiştikten kaç ms sonra yeniden istek yapılacak. */
  debounceMs?: number;
  enabled?: boolean;
}

interface UseWeatherResult {
  weather: WeatherSnapshot | null;
  loading: boolean;
}

/**
 * Verilen koordinat için Open-Meteo'dan hava durumunu indiren hook.
 * Koordinat değişirse `debounceMs` (varsayılan 1500ms) sonra yeni isteği atar.
 */
export const useWeather = ({
  latitude,
  longitude,
  debounceMs = 1500,
  enabled = true,
}: UseWeatherParams): UseWeatherResult => {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await fetchWeatherByCoordinate(
        latitude,
        longitude,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setWeather(result);
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [latitude, longitude, debounceMs, enabled]);

  return { weather, loading };
};

export default useWeather;

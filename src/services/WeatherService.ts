/**
 * Open-Meteo tabanlı hafif hava durumu servisi.
 * API anahtarı gerektirmez: https://open-meteo.com/
 */

export interface WeatherSnapshot {
  /** Sıcaklık (°C, tam sayı olarak yuvarlanmış). */
  temperatureC: number;
  /** WMO weather code. */
  weatherCode: number;
  /** UI'da kullanılabilir MaterialCommunityIcons ismi. */
  iconName: string;
  /** Kısa Türkçe etiket (örn. "Açık", "Yağmurlu"). */
  label: string;
}

interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
}

/**
 * WMO weather code → MaterialCommunityIcons + Türkçe etiket eşlemesi.
 * Referans: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
const weatherCodeToIconAndLabel = (code: number): { iconName: string; label: string } => {
  if (code === 0) {
    return { iconName: 'weather-sunny', label: 'Açık' };
  }

  if (code === 1 || code === 2) {
    return { iconName: 'weather-partly-cloudy', label: 'Az bulutlu' };
  }

  if (code === 3) {
    return { iconName: 'weather-cloudy', label: 'Bulutlu' };
  }

  if (code === 45 || code === 48) {
    return { iconName: 'weather-fog', label: 'Sisli' };
  }

  if (code >= 51 && code <= 57) {
    return { iconName: 'weather-rainy', label: 'Çiseliyor' };
  }

  if (code >= 61 && code <= 67) {
    return { iconName: 'weather-pouring', label: 'Yağmurlu' };
  }

  if (code >= 71 && code <= 77) {
    return { iconName: 'weather-snowy', label: 'Karlı' };
  }

  if (code >= 80 && code <= 82) {
    return { iconName: 'weather-rainy', label: 'Sağanak' };
  }

  if (code === 85 || code === 86) {
    return { iconName: 'weather-snowy-heavy', label: 'Kar sağanağı' };
  }

  if (code >= 95 && code <= 99) {
    return { iconName: 'weather-lightning', label: 'Fırtınalı' };
  }

  return { iconName: 'weather-partly-cloudy', label: '—' };
};

/**
 * Verilen enlem/boylama göre güncel hava durumunu döndürür.
 * Hata durumunda `null` döner; çağıran taraf sessizce gizleyebilir.
 */
export const fetchWeatherByCoordinate = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot | null> => {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude.toFixed(3)}` +
      `&longitude=${longitude.toFixed(3)}` +
      '&current=temperature_2m,weather_code' +
      '&timezone=Europe%2FIstanbul';

    const response = await fetch(url, { signal });

    if (!response.ok) {
      return null;
    }

    const data: OpenMeteoCurrentResponse = await response.json();
    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;

    if (typeof temp !== 'number' || typeof code !== 'number') {
      return null;
    }

    const { iconName, label } = weatherCodeToIconAndLabel(code);

    return {
      temperatureC: Math.round(temp),
      weatherCode: code,
      iconName,
      label,
    };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return null;
    }

    console.warn('WeatherService.fetchWeatherByCoordinate:', err);
    return null;
  }
};

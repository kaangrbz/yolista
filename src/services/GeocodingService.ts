/**
 * OpenStreetMap Nominatim API ile yer araması.
 *
 * Kullanım politikası (production öncesi):
 *  - Max 1 req/sn, User-Agent zorunlu.
 *  - Yüksek trafik için kendi Nominatim instance'ına veya
 *    Mapbox / MapTiler / LocationIQ gibi alternatife geçilmeli.
 *
 * Doc: https://nominatim.org/release-docs/develop/api/Search/
 */

export interface GeocodingResult {
  id: string;
  displayName: string;
  shortName: string;
  type: string;
  latitude: number;
  longitude: number;
  /** Nominatim'in döndürdüğü bbox: [minLat, maxLat, minLng, maxLng] */
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface ReverseGeocodingResult {
  formattedAddress: string;
  shortName: string;
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 8000;

const buildShortName = (displayName: string): string => {
  const parts = displayName.split(',').map((part) => part.trim());

  if (parts.length === 0) {
    return displayName;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]}, ${parts[parts.length - 1]}`;
};

export const GeocodingService = {
  async search(query: string, limit: number = 6): Promise<GeocodingResult[]> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      addressdetails: '0',
      limit: String(limit),
      'accept-language': 'tr',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'YolistaApp/0.1 (https://web.youlistaapp.com)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((row: any): GeocodingResult => {
        const bbox = Array.isArray(row.boundingbox) && row.boundingbox.length === 4
          ? {
              minLat: parseFloat(row.boundingbox[0]),
              maxLat: parseFloat(row.boundingbox[1]),
              minLng: parseFloat(row.boundingbox[2]),
              maxLng: parseFloat(row.boundingbox[3]),
            }
          : undefined;

        const displayName: string = row.display_name || '';

        return {
          id: String(row.place_id ?? `${row.lat}_${row.lon}`),
          displayName,
          shortName: buildShortName(displayName),
          type: row.type || row.class || 'place',
          latitude: parseFloat(row.lat),
          longitude: parseFloat(row.lon),
          boundingBox: bbox,
        };
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('Geocoding timeout');
      } else {
        console.error('GeocodingService.search:', err);
      }

      return [];
    } finally {
      clearTimeout(timer);
    }
  },

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodingResult | null> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      zoom: '18',
      addressdetails: '0',
      'accept-language': 'tr',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${REVERSE_ENDPOINT}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'YolistaApp/0.1 (https://web.youlistaapp.com)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse HTTP ${response.status}`);
      }

      const data = await response.json();
      const formattedAddress: string = data?.display_name || '';

      if (!formattedAddress) {
        return null;
      }

      return {
        formattedAddress,
        shortName: buildShortName(formattedAddress),
      };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('Reverse geocoding timeout');
      } else {
        console.error('GeocodingService.reverseGeocode:', err);
      }

      return null;
    } finally {
      clearTimeout(timer);
    }
  },
};

export default GeocodingService;

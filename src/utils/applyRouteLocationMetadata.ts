import { getCityCenter } from '../data/cityCenters';
import type { RouteLocationSource } from '../model/routes.model';

type RouteLocationRow = {
  latitude?: number | null;
  longitude?: number | null;
  city_id?: number | null;
  order_index?: number;
  location_source?: RouteLocationSource;
  cities?: { id?: number; name?: string } | null;
};

const hasStoredGps = (row: RouteLocationRow): boolean =>
  typeof row.latitude === 'number' && typeof row.longitude === 'number';

const resolveCityId = (
  row: RouteLocationRow,
  fallbackCityId?: number | null,
): number | null | undefined => {
  if (row.city_id != null) {
    return row.city_id;
  }

  if (fallbackCityId != null) {
    return fallbackCityId;
  }

  const citiesId = row.cities?.id;

  if (typeof citiesId === 'number') {
    return citiesId;
  }

  return null;
};

/** Eski (GPS'siz) kayıtlar için şehir merkezi koordinatı; GPS varsa dokunulmaz. */
export function applyRouteLocationMetadata<T extends RouteLocationRow>(
  row: T,
  options?: { fallbackCityId?: number | null },
): T & {
  location_source: RouteLocationSource;
  latitude?: number;
  longitude?: number;
} {
  if (hasStoredGps(row)) {
    return {
      ...row,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      location_source: 'gps',
    };
  }

  const cityId = resolveCityId(row, options?.fallbackCityId);
  const cityCenter = getCityCenter(cityId);

  if (cityCenter) {
    return {
      ...row,
      latitude: cityCenter.latitude,
      longitude: cityCenter.longitude,
      location_source: 'city_center',
    };
  }

  return {
    ...row,
    latitude: undefined,
    longitude: undefined,
    location_source: 'none',
  };
}

export function applyRouteLocationMetadataToStops<T extends RouteLocationRow>(
  stops: T[],
): Array<
  T & {
    location_source: RouteLocationSource;
    latitude?: number;
    longitude?: number;
  }
> {
  if (stops.length === 0) {
    return [];
  }

  const mainStop =
    stops.find((stop) => stop.order_index === 0) ?? stops[0];
  const fallbackCityId = mainStop?.city_id ?? mainStop?.cities?.id ?? null;

  return stops.map((stop) =>
    applyRouteLocationMetadata(stop, { fallbackCityId }),
  );
}

export function mergeRoutesById<T extends { id?: string }>(
  primary: T[],
  secondary: T[],
): T[] {
  const merged = new Map<string, T>();

  for (const row of primary) {
    if (row.id) {
      merged.set(row.id, row);
    }
  }

  for (const row of secondary) {
    if (row.id && !merged.has(row.id)) {
      merged.set(row.id, row);
    }
  }

  return [...merged.values()];
}

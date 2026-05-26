import { RouteLocationSource, RouteWithProfile } from '../model/routes.model';

export const getRouteLocationSource = (
  route: RouteWithProfile,
): RouteLocationSource => {
  if (route.location_source) {
    return route.location_source;
  }

  if (
    typeof route.latitude === 'number' &&
    typeof route.longitude === 'number'
  ) {
    return 'gps';
  }

  return 'none';
};

export const getRouteLocationLabel = (
  source: RouteLocationSource,
): string | null => {
  if (source === 'city_center') {
    return 'Tahmini konum';
  }

  if (source === 'none') {
    return 'Konum yok';
  }

  return null;
};

export const hasMapPin = (route: RouteWithProfile): boolean => {
  return getRouteLocationSource(route) !== 'none';
};

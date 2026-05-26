export interface LatLng {
  latitude: number;
  longitude: number;
}

export type LatLngLike = {
  latitude?: number | null;
  longitude?: number | null;
};

export const extractValidCoordinates = (points: LatLngLike[]): LatLng[] =>
  points.filter(
    (point): point is LatLng =>
      typeof point.latitude === 'number' &&
      typeof point.longitude === 'number',
  );

export const haversineDistanceKm = (a: LatLng, b: LatLng): number => {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

export const totalRouteDistanceKmFromPoints = (points: LatLngLike[]): number => {
  const coords = extractValidCoordinates(points);

  let total = 0;

  for (let index = 1; index < coords.length; index += 1) {
    total += haversineDistanceKm(coords[index - 1], coords[index]);
  }

  return total;
};

export const totalRouteDistanceKm = (
  stops: { coordinate?: LatLng }[],
): number =>
  totalRouteDistanceKmFromPoints(
    stops.map((stop) => stop.coordinate ?? {}),
  );

export const getRouteDistanceLabel = (points: LatLngLike[]): string | null => {
  if (extractValidCoordinates(points).length < 2) {
    return null;
  }

  return formatRouteDistanceKm(totalRouteDistanceKmFromPoints(points));
};

export const formatRouteDistanceKm = (km: number): string => {
  if (km < 0.05) {
    return '~0 km';
  }

  if (km < 10) {
    return `~${km.toFixed(1)} km`;
  }

  return `~${Math.round(km)} km`;
};

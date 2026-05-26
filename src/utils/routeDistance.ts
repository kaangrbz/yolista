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

/** Kuş uçuşu segment mesafesi; koordinat eksikse null. */
export const getSegmentDistanceKm = (
  from: LatLngLike,
  to: LatLngLike,
): number | null => {
  const coords = extractValidCoordinates([from, to]);

  if (coords.length < 2) {
    return null;
  }

  return haversineDistanceKm(coords[0], coords[1]);
};

/** MVP yürüyüş tahmini — ~5 km/saat. */
export const estimateWalkingMinutes = (distanceKm: number): number => {
  return Math.max(1, Math.round((distanceKm / 5) * 60));
};

export const formatWalkingDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `~${minutes} dk yürüyüş`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `~${hours} sa yürüyüş`;
  }

  return `~${hours} sa ${remainder} dk yürüyüş`;
};

export const getSegmentDistanceLabel = (
  from: LatLngLike,
  to: LatLngLike,
): string | null => {
  const km = getSegmentDistanceKm(from, to);

  if (km === null) {
    return null;
  }

  return formatRouteDistanceKm(km);
};

export const getSegmentWalkingLabel = (
  from: LatLngLike,
  to: LatLngLike,
): string | null => {
  const km = getSegmentDistanceKm(from, to);

  if (km === null) {
    return null;
  }

  return formatWalkingDuration(estimateWalkingMinutes(km));
};

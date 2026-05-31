import type { LatLng } from './routeDistance';
import { haversineDistanceKm } from './routeDistance';

export interface PolylineDirectionMarker {
  coordinate: LatLng;
  rotation: number;
}

/** İki nokta arası yön (derece, kuzey = 0, saat yönü). */
export const bearingBetween = (from: LatLng, to: LatLng): number => {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180) / Math.PI;
};

const interpolateAtDistance = (
  coordinates: LatLng[],
  targetKm: number,
): PolylineDirectionMarker | null => {
  let walkedKm = 0;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const from = coordinates[index];
    const to = coordinates[index + 1];
    const segmentKm = haversineDistanceKm(from, to);

    if (segmentKm <= 0) {
      continue;
    }

    if (walkedKm + segmentKm >= targetKm) {
      const ratio = (targetKm - walkedKm) / segmentKm;

      return {
        coordinate: {
          latitude: from.latitude + (to.latitude - from.latitude) * ratio,
          longitude: from.longitude + (to.longitude - from.longitude) * ratio,
        },
        rotation: bearingBetween(from, to),
      };
    }

    walkedKm += segmentKm;
  }

  const last = coordinates[coordinates.length - 1];
  const prev = coordinates[coordinates.length - 2];

  return {
    coordinate: last,
    rotation: bearingBetween(prev, last),
  };
};

/**
 * Polyline üzerinde yön göstergesi için eşit aralıklı noktalar.
 * Kısa rotalarda 1, uzunlarda en fazla `maxMarkers` ok.
 */
export const getPolylineDirectionMarkers = (
  coordinates: LatLng[],
  maxMarkers = 3,
): PolylineDirectionMarker[] => {
  if (coordinates.length < 2) {
    return [];
  }

  let totalKm = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    totalKm += haversineDistanceKm(coordinates[index - 1], coordinates[index]);
  }

  if (totalKm <= 0) {
    return [];
  }

  const markerCount =
    totalKm < 0.35 ? 1 : totalKm < 1.2 ? 2 : Math.min(maxMarkers, 3);

  const fractions =
    markerCount === 1
      ? [0.5]
      : markerCount === 2
        ? [0.38, 0.72]
        : [0.28, 0.52, 0.76];

  return fractions
    .map((fraction) => interpolateAtDistance(coordinates, totalKm * fraction))
    .filter((marker): marker is PolylineDirectionMarker => marker !== null);
};

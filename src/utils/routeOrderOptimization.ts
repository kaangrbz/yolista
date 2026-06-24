import type { RouteWithProfile } from '../model/routes.model';
import {
  extractValidCoordinates,
  haversineDistanceKm,
  type LatLng,
} from './routeDistance';

const hasCoordinates = (stop: RouteWithProfile): boolean =>
  typeof stop.latitude === 'number' && typeof stop.longitude === 'number';

const toLatLng = (stop: RouteWithProfile): LatLng => ({
  latitude: stop.latitude as number,
  longitude: stop.longitude as number,
});

/**
 * İlk durak sabit; kalanlar en yakın komşu (nearest-neighbor) ile sıralanır.
 * Geri dönüş / gereksiz zigzag azaltılır. Hikâye sırası korunmaz — sadece navigasyon için.
 */
export function optimizeStopsForShortestPath(
  stops: RouteWithProfile[],
): RouteWithProfile[] {
  const sorted = [...stops].sort(
    (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
  );

  const withCoords = sorted.filter(hasCoordinates);
  const withoutCoords = sorted.filter((stop) => !hasCoordinates(stop));

  if (withCoords.length < 3) {
    return sorted;
  }

  const visitOrder: RouteWithProfile[] = [withCoords[0]];
  const remaining = withCoords.slice(1);
  let current = withCoords[0];

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const distanceKm = haversineDistanceKm(toLatLng(current), toLatLng(candidate));

      if (distanceKm < nearestDistanceKm) {
        nearestDistanceKm = distanceKm;
        nearestIndex = index;
      }
    });

    const next = remaining.splice(nearestIndex, 1)[0];
    visitOrder.push(next);
    current = next;
  }

  return [...visitOrder, ...withoutCoords];
}

export function isStopOrderChanged(
  original: RouteWithProfile[],
  optimized: RouteWithProfile[],
): boolean {
  const originalIds = original
    .filter(hasCoordinates)
    .map((stop) => stop.id)
    .join('|');
  const optimizedIds = optimized
    .filter(hasCoordinates)
    .map((stop) => stop.id)
    .join('|');

  return originalIds !== optimizedIds;
}

export function estimateOrderSavingsPercent(
  original: RouteWithProfile[],
  optimized: RouteWithProfile[],
): number | null {
  const sumLegs = (ordered: RouteWithProfile[]): number => {
    const coords = ordered.filter(hasCoordinates).map(toLatLng);

    let total = 0;

    for (let index = 1; index < coords.length; index += 1) {
      total += haversineDistanceKm(coords[index - 1], coords[index]);
    }

    return total;
  };

  const originalKm = sumLegs(original);
  const optimizedKm = sumLegs(optimized);

  if (originalKm <= 0 || optimizedKm >= originalKm) {
    return null;
  }

  return Math.round(((originalKm - optimizedKm) / originalKm) * 100);
}

export function getNavigationStopCoordinates(
  stops: RouteWithProfile[],
  optimizeOrder: boolean,
): LatLng[] {
  const sorted = [...stops].sort(
    (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
  );

  const ordered =
    optimizeOrder && sorted.filter(hasCoordinates).length >= 3
      ? optimizeStopsForShortestPath(sorted)
      : sorted;

  return extractValidCoordinates(
    ordered.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );
}

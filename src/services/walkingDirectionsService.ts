import type { RouteWithProfile } from '../model/routes.model';
import type { DirectionStep, RouteSegment } from '../types/routeSegment.types';
import type { LatLng, LatLngLike } from '../utils/routeDistance';
import {
  estimateWalkingMinutes,
  extractValidCoordinates,
  totalRouteDistanceKmFromPoints,
} from '../utils/routeDistance';
import { resolveManeuverType } from '../utils/directionStepIcons';
import {
  getStandardStopSegmentLabel,
  getStopLetterLabel,
} from '../utils/getStopOrderLabel';
import { optimizeStopsForShortestPath } from '../utils/routeOrderOptimization';

export type WalkingDirectionsSource = 'osrm' | 'straight-line';

export interface WalkingDirectionsResult {
  coordinates: LatLng[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  source: WalkingDirectionsSource;
  directionSteps: DirectionStep[];
}

export interface BuildRouteSegmentsOptions {
  userLocation?: LatLng | null;
  startFromUser?: boolean;
  /** İlk durak sabit, kalanlar en kısa yürüyüş için yeniden sıralanır. */
  optimizeOrder?: boolean;
}

const OSRM_WALKING_BASE = 'https://router.project-osrm.org/route/v1/walking';
const MAX_OSRM_WAYPOINTS = 25;

const routeCache = new Map<string, WalkingDirectionsResult>();

const buildRouteCacheKey = (stops: LatLng[]): string =>
  stops.map((stop) => `${stop.latitude},${stop.longitude}`).join('|');

const straightLineResult = (stops: LatLng[]): WalkingDirectionsResult => ({
  coordinates: stops,
  distanceMeters: null,
  durationSeconds: null,
  source: 'straight-line',
  directionSteps: [],
});

const estimatedStraightLineResult = (stops: LatLng[]): WalkingDirectionsResult => {
  if (stops.length < 2) {
    return straightLineResult(stops);
  }

  const distanceKm = totalRouteDistanceKmFromPoints(stops);

  return {
    coordinates: stops,
    distanceMeters: Math.round(distanceKm * 1000),
    durationSeconds: estimateWalkingMinutes(distanceKm) * 60,
    source: 'straight-line',
    directionSteps: [],
  };
};

type OsrmLeg = {
  steps?: Array<{
    maneuver?: {
      type?: string;
      modifier?: string;
      instruction?: string;
    };
    name?: string;
  }>;
};

const parseOsrmDirectionSteps = (legs: OsrmLeg[] | undefined): DirectionStep[] => {
  if (!legs?.length) {
    return [];
  }

  const steps: DirectionStep[] = [];

  legs.forEach((leg) => {
    leg.steps?.forEach((step) => {
      const text =
        step.maneuver?.instruction?.trim() ||
        step.name?.trim() ||
        '';

      if (text) {
        steps.push({
          instruction: text,
          maneuverType: resolveManeuverType(step.maneuver),
        });
      }
    });
  });

  return steps.slice(0, 8);
};

/**
 * OSRM yürüyüş profili — MVP için platformlar arası gerçek yol geometrisi.
 * Prod: iOS MapKit MKDirections + Android Google Routes API (backend veya native).
 */
async function fetchWalkingDirectionsFromOsrm(
  stops: LatLng[],
  includeSteps = false,
): Promise<WalkingDirectionsResult | null> {
  if (stops.length < 2) {
    return straightLineResult(stops);
  }

  if (stops.length > MAX_OSRM_WAYPOINTS) {
    return null;
  }

  const coordinatePath = stops
    .map((stop) => `${stop.longitude},${stop.latitude}`)
    .join(';');

  const url =
    `${OSRM_WALKING_BASE}/${coordinatePath}` +
    `?overview=full&geometries=geojson&steps=${includeSteps ? 'true' : 'false'}`;

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    code?: string;
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: {
        coordinates?: [number, number][];
      };
      legs?: OsrmLeg[];
    }>;
  };

  const route = data.routes?.[0];
  const geometry = route?.geometry?.coordinates;

  if (data.code !== 'Ok' || !geometry || geometry.length < 2) {
    return null;
  }

  return {
    coordinates: geometry.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })),
    distanceMeters:
      typeof route.distance === 'number' ? route.distance : null,
    durationSeconds:
      typeof route.duration === 'number' ? route.duration : null,
    source: 'osrm',
    directionSteps: includeSteps
      ? parseOsrmDirectionSteps(route.legs)
      : [],
  };
}

export async function fetchWalkingDirections(
  stops: LatLngLike[],
  options?: { includeSteps?: boolean },
): Promise<WalkingDirectionsResult> {
  const coords = extractValidCoordinates(stops);

  if (coords.length === 0) {
    return straightLineResult([]);
  }

  if (coords.length === 1) {
    return straightLineResult(coords);
  }

  const cacheKey = buildRouteCacheKey(coords);
  const cached = routeCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const osrmResult = await fetchWalkingDirectionsFromOsrm(
      coords,
      options?.includeSteps ?? false,
    );

    if (osrmResult) {
      routeCache.set(cacheKey, osrmResult);
      return osrmResult;
    }
  } catch (error) {
    console.warn('Walking directions OSRM error:', error);
  }

  const fallback = estimatedStraightLineResult(coords);
  routeCache.set(cacheKey, fallback);
  return fallback;
}

const getVisitLabel = (stop: RouteWithProfile, visitIndex: number): string => {
  const letter = getStopLetterLabel(visitIndex);
  const title = stop.title?.trim();

  return title ? `${letter} · ${title}` : letter;
};

export async function buildRouteSegments(
  stops: RouteWithProfile[],
  options: BuildRouteSegmentsOptions = {},
): Promise<RouteSegment[]> {
  const sorted = [...stops].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );

  let coordStops = sorted.filter(
    (stop) =>
      typeof stop.latitude === 'number' && typeof stop.longitude === 'number',
  );

  if (coordStops.length === 0) {
    return [];
  }

  const navigationOptimized =
    Boolean(options.optimizeOrder) && coordStops.length >= 3;

  if (navigationOptimized) {
    coordStops = optimizeStopsForShortestPath(coordStops);
  }

  const legs: Array<{
    id: string;
    fromLabel: string;
    toLabel: string;
    from: LatLng;
    to: LatLng;
    variant: 'approach' | 'route';
    targetStopOrderIndex: number;
    targetStopId: string | null;
    visitIndex: number;
  }> = [];

  const firstStop = coordStops[0];
  const firstCoord: LatLng = {
    latitude: firstStop.latitude as number,
    longitude: firstStop.longitude as number,
  };

  if (options.startFromUser && options.userLocation) {
    legs.push({
      id: 'approach-0',
      fromLabel: 'Konumum',
      toLabel: navigationOptimized
        ? getVisitLabel(firstStop, 0)
        : getStandardStopSegmentLabel(firstStop),
      from: options.userLocation,
      to: firstCoord,
      variant: 'approach',
      targetStopOrderIndex: firstStop.order_index ?? 0,
      targetStopId: firstStop.id ? String(firstStop.id) : null,
      visitIndex: 0,
    });
  }

  for (let index = 0; index < coordStops.length - 1; index += 1) {
    const fromStop = coordStops[index];
    const toStop = coordStops[index + 1];
    const toVisitIndex = index + 1;

    legs.push({
      id: `leg-${index}`,
      fromLabel: navigationOptimized
        ? getVisitLabel(fromStop, index)
        : getStandardStopSegmentLabel(fromStop),
      toLabel: navigationOptimized
        ? getVisitLabel(toStop, toVisitIndex)
        : getStandardStopSegmentLabel(toStop),
      from: {
        latitude: fromStop.latitude as number,
        longitude: fromStop.longitude as number,
      },
      to: {
        latitude: toStop.latitude as number,
        longitude: toStop.longitude as number,
      },
      variant: 'route',
      targetStopOrderIndex: toStop.order_index ?? toVisitIndex,
      targetStopId: toStop.id ? String(toStop.id) : null,
      visitIndex: toVisitIndex,
    });
  }

  const results = await Promise.all(
    legs.map(async (leg) => {
      const directions = await fetchWalkingDirections([leg.from, leg.to], {
        includeSteps: true,
      });

      return {
        id: leg.id,
        fromLabel: leg.fromLabel,
        toLabel: leg.toLabel,
        from: leg.from,
        to: leg.to,
        coordinates: directions.coordinates,
        distanceMeters: directions.distanceMeters,
        durationSeconds: directions.durationSeconds,
        variant: leg.variant,
        targetStopOrderIndex: leg.targetStopOrderIndex,
        targetStopId: leg.targetStopId,
        visitIndex: leg.visitIndex,
        navigationOptimized,
        directionSteps: directions.directionSteps,
        isEstimated: directions.source !== 'osrm',
      } satisfies RouteSegment;
    }),
  );

  return results;
}

export const clearWalkingDirectionsCache = (): void => {
  routeCache.clear();
};

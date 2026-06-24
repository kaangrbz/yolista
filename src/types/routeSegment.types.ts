import type { LatLng } from '../utils/routeDistance';
import { extractValidCoordinates } from '../utils/routeDistance';
import type { RouteWithProfile } from '../model/routes.model';

export type RouteSegmentStatus = 'past' | 'active' | 'upcoming';

export type DirectionManeuverType =
  | 'straight'
  | 'left'
  | 'right'
  | 'slight-left'
  | 'slight-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'uturn'
  | 'arrive'
  | 'depart'
  | 'merge'
  | 'roundabout'
  | 'default';

export interface DirectionStep {
  instruction: string;
  maneuverType: DirectionManeuverType;
}

export type RouteSegmentVariant = 'approach' | 'route';

export interface RouteSegment {
  id: string;
  fromLabel: string;
  toLabel: string;
  from: LatLng;
  to: LatLng;
  coordinates: LatLng[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  variant: RouteSegmentVariant;
  /** Hedef durak order_index (approach için 0). */
  targetStopOrderIndex: number;
  /** Navigasyon hedef durak kimliği. */
  targetStopId: string | null;
  /** Optimize sıradaki ziyaret indeksi (0 = A). */
  visitIndex: number;
  /** Bacaklar optimize ziyaret sırasına göre mi hesaplandı. */
  navigationOptimized: boolean;
  directionSteps: DirectionStep[];
  /** OSRM dışı mesafe/süre (kuş uçuşu tahmini). */
  isEstimated: boolean;
}

export type RouteSheetTab = 'stops' | 'directions';

export const hasRouteDirections = (stops: RouteWithProfile[]): boolean =>
  extractValidCoordinates(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  ).length >= 2;

export const getRouteSegmentStatus = (
  segmentIndex: number,
  activeSegmentIndex: number,
): RouteSegmentStatus => {
  if (segmentIndex < activeSegmentIndex) {
    return 'past';
  }

  if (segmentIndex === activeSegmentIndex) {
    return 'active';
  }

  return 'upcoming';
};

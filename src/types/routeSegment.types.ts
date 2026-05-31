import type { LatLng } from '../utils/routeDistance';

export type RouteSegmentStatus = 'past' | 'active' | 'upcoming';

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
  stepInstructions: string[];
}

export type RouteSheetTab = 'stops' | 'directions';

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

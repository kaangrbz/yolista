import { useEffect, useRef } from 'react';
import type { LatLng } from '../utils/routeDistance';
import { haversineDistanceKm } from '../utils/routeDistance';
import {
  ROUTE_SEGMENT_ADVANCE_DEBOUNCE_MS,
  ROUTE_SEGMENT_ADVANCE_RADIUS_M,
} from '../constants/mapDefaults';
import type { RouteSegment } from '../types/routeSegment.types';
import type { RouteSheetTab } from '../types/routeSegment.types';

interface UseRouteSegmentProgressParams {
  enabled: boolean;
  routeSheetTab: RouteSheetTab;
  userCoordinate: LatLng | null;
  routeSegments: RouteSegment[];
  activeSegmentIndex: number;
  onAdvance: (nextIndex: number) => void;
}

export const useRouteSegmentProgress = ({
  enabled,
  routeSheetTab,
  userCoordinate,
  routeSegments,
  activeSegmentIndex,
  onAdvance,
}: UseRouteSegmentProgressParams): void => {
  const lastAdvanceAtRef = useRef(0);

  useEffect(() => {
    if (
      !enabled ||
      routeSheetTab !== 'directions' ||
      !userCoordinate ||
      routeSegments.length === 0
    ) {
      return;
    }

    const activeSegment = routeSegments[activeSegmentIndex];

    if (!activeSegment) {
      return;
    }

    const distanceKm = haversineDistanceKm(userCoordinate, activeSegment.to);
    const distanceM = distanceKm * 1000;

    if (distanceM > ROUTE_SEGMENT_ADVANCE_RADIUS_M) {
      return;
    }

    if (activeSegmentIndex >= routeSegments.length - 1) {
      return;
    }

    const now = Date.now();

    if (now - lastAdvanceAtRef.current < ROUTE_SEGMENT_ADVANCE_DEBOUNCE_MS) {
      return;
    }

    lastAdvanceAtRef.current = now;
    onAdvance(activeSegmentIndex + 1);
  }, [
    activeSegmentIndex,
    enabled,
    onAdvance,
    routeSegments,
    routeSheetTab,
    userCoordinate,
  ]);
};

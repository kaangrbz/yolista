import { useCallback, useEffect, useState } from 'react';
import { buildRouteSegments } from '../services/walkingDirectionsService';
import type { RouteSegment } from '../types/routeSegment.types';
import type { LatLng } from '../utils/routeDistance';
import type { RouteWithProfile } from '../model/routes.model';

interface UseRouteSegmentsParams {
  stops: RouteWithProfile[];
  enabled: boolean;
  userLocation: LatLng | null;
  startFromUser: boolean;
}

export function useRouteSegments({
  stops,
  enabled,
  userLocation,
  startFromUser,
}: UseRouteSegmentsParams) {
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSegments = useCallback(async () => {
    if (!enabled || stops.length === 0) {
      setSegments([]);
      return;
    }

    setLoading(true);

    try {
      const nextSegments = await buildRouteSegments(stops, {
        userLocation,
        startFromUser,
      });

      setSegments(nextSegments);
    } catch (error) {
      console.warn('Route segments load error:', error);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, startFromUser, stops, userLocation]);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  return {
    segments,
    loading,
    reloadSegments: loadSegments,
  };
}

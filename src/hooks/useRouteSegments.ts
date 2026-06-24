import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackRouteDetailEvent } from '../analytics/routeDetailAnalytics';
import { buildRouteSegments } from '../services/walkingDirectionsService';
import type { RouteSegment } from '../types/routeSegment.types';
import type { LatLng } from '../utils/routeDistance';
import type { RouteWithProfile } from '../model/routes.model';

interface UseRouteSegmentsParams {
  stops: RouteWithProfile[];
  enabled: boolean;
  userLocation: LatLng | null;
  startFromUser: boolean;
  optimizeOrder?: boolean;
  routeId?: string;
}

export function useRouteSegments({
  stops,
  enabled,
  userLocation,
  startFromUser,
  optimizeOrder = false,
  routeId,
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
        optimizeOrder,
      });

      setSegments(nextSegments);

      const estimatedCount = nextSegments.filter((segment) => segment.isEstimated).length;

      if (estimatedCount > 0 && routeId) {
        trackRouteDetailEvent({
          name: 'route_detail_segments_fallback',
          routeId,
          estimatedSegmentCount: estimatedCount,
        });
      }
    } catch (error) {
      console.warn('Route segments load error:', error);
      setSegments([]);

      if (routeId) {
        trackRouteDetailEvent({
          name: 'route_detail_slide_sync_error',
          routeId,
          reason: 'segments_load_failed',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, optimizeOrder, routeId, startFromUser, stops, userLocation]);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const hasEstimatedSegments = useMemo(
    () => segments.some((segment) => segment.isEstimated),
    [segments],
  );

  return {
    segments,
    loading,
    hasEstimatedSegments,
    reloadSegments: loadSegments,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import RouteDiscoveryService, {
  BoundingBox,
  DiscoveryFilters,
} from '../services/RouteDiscoveryService';
import { RouteWithProfile } from '../model/routes.model';
import {
  VIEWPORT_DEBOUNCE_MS,
  VIEWPORT_MIN_DELTA_CHANGE,
  VIEWPORT_MIN_PAN_FRACTION,
  VIEWPORT_MIN_ZOOM_FRACTION,
} from '../constants/mapDefaults';
import { useAuth } from '../context/AuthContext';

interface UseViewportRoutesParams {
  region: Region | null;
  filters?: DiscoveryFilters;
  enabled?: boolean;
}

interface UseViewportRoutesResult {
  routes: RouteWithProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const regionToBbox = (region: Region): BoundingBox => {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
};

const shouldSkipUpdate = (previous: Region | null, next: Region): boolean => {
  if (!previous) {
    return false;
  }

  const latThreshold = Math.max(
    previous.latitudeDelta * VIEWPORT_MIN_PAN_FRACTION,
    VIEWPORT_MIN_DELTA_CHANGE,
  );
  const lngThreshold = Math.max(
    previous.longitudeDelta * VIEWPORT_MIN_PAN_FRACTION,
    VIEWPORT_MIN_DELTA_CHANGE,
  );
  const latDeltaThreshold = Math.max(
    previous.latitudeDelta * VIEWPORT_MIN_ZOOM_FRACTION,
    VIEWPORT_MIN_DELTA_CHANGE,
  );
  const lngDeltaThreshold = Math.max(
    previous.longitudeDelta * VIEWPORT_MIN_ZOOM_FRACTION,
    VIEWPORT_MIN_DELTA_CHANGE,
  );

  const latDiff = Math.abs(previous.latitude - next.latitude);
  const lngDiff = Math.abs(previous.longitude - next.longitude);
  const latDeltaDiff = Math.abs(previous.latitudeDelta - next.latitudeDelta);
  const lngDeltaDiff = Math.abs(previous.longitudeDelta - next.longitudeDelta);

  return (
    latDiff < latThreshold &&
    lngDiff < lngThreshold &&
    latDeltaDiff < latDeltaThreshold &&
    lngDeltaDiff < lngDeltaThreshold
  );
};

export const useViewportRoutes = ({
  region,
  filters,
  enabled = true,
}: UseViewportRoutesParams): UseViewportRoutesResult => {
  const { user } = useAuth();
  const loggedUserId = user?.id || null;

  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRegionRef = useRef<Region | null>(null);
  const lastFiltersKeyRef = useRef<string>('');
  const requestIdRef = useRef(0);

  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  const runFetch = useCallback(
    async (targetRegion: Region) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const data = await RouteDiscoveryService.fetchRoutesInBoundingBox(
          {
            bbox: regionToBbox(targetRegion),
            filters,
          },
          loggedUserId,
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        setRoutes(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [filters, loggedUserId],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!region) {
      return;
    }

    const filtersChanged = lastFiltersKeyRef.current !== filtersKey;
    lastFiltersKeyRef.current = filtersKey;

    if (!filtersChanged && shouldSkipUpdate(lastRegionRef.current, region)) {
      return;
    }

    lastRegionRef.current = region;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void runFetch(region);
    }, VIEWPORT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [region, enabled, filtersKey, runFetch]);

  const refetch = useCallback(() => {
    if (lastRegionRef.current) {
      void runFetch(lastRegionRef.current);
    }
  }, [runFetch]);

  return {
    routes,
    loading,
    error,
    refetch,
  };
};

export default useViewportRoutes;

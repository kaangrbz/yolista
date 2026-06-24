import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import RouteDiscoveryService, {
  BoundingBox,
  DiscoveryFilters,
} from '../services/RouteDiscoveryService';
import { RouteWithProfile } from '../model/routes.model';
import { VIEWPORT_DEBOUNCE_MS } from '../constants/mapDefaults';
import {
  expandBbox,
  regionToBbox,
  shouldSkipViewportFetch,
} from '../utils/viewportFetch';
import { isAbortError } from '../utils/abortError';
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
  const lastFetchedBboxRef = useRef<BoundingBox | null>(null);
  const lastFiltersKeyRef = useRef<string>('');
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  const cancelInFlightFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
  }, []);

  const runFetch = useCallback(
    async (targetRegion: Region) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const data = await RouteDiscoveryService.fetchRoutesInBoundingBox(
          {
            bbox: regionToBbox(targetRegion),
            filters,
            signal: controller.signal,
          },
          loggedUserId,
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        setRoutes(data);
        hasFetchedRef.current = true;
        lastFetchedBboxRef.current = expandBbox(
          regionToBbox(targetRegion),
          targetRegion.latitude,
        );
      } catch (err) {
        if (isAbortError(err) || requestId !== requestIdRef.current) {
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

    if (
      hasFetchedRef.current &&
      !filtersChanged &&
      shouldSkipViewportFetch(
        lastRegionRef.current,
        region,
        lastFetchedBboxRef.current,
      )
    ) {
      return;
    }

    cancelInFlightFetch();
    lastRegionRef.current = region;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const scheduleFetch = () => {
      void runFetch(region);
    };

    if (!hasFetchedRef.current || filtersChanged) {
      scheduleFetch();
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        cancelInFlightFetch();
      };
    }

    timerRef.current = setTimeout(scheduleFetch, VIEWPORT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      cancelInFlightFetch();
    };
  }, [region, enabled, filtersKey, runFetch, cancelInFlightFetch]);

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

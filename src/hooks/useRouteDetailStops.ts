import { useCallback, useEffect, useState } from 'react';
import RouteModel, { RouteWithProfile } from '../model/routes.model';

export function useRouteDetailStops(routeId: string, userId?: string | null) {
  const [stops, setStops] = useState<RouteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStops = useCallback(async () => {
    if (!routeId) {
      setStops([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const routes = await RouteModel.getRoutesById(routeId, userId || undefined);
      const sorted = [...(routes as RouteWithProfile[])].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
      );

      setStops(sorted);
    } catch (loadError) {
      console.error('Route detail stops load error:', loadError);
      setError('Duraklar yüklenemedi');
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [routeId, userId]);

  useEffect(() => {
    void loadStops();
  }, [loadStops]);

  return {
    stops,
    loading,
    error,
    refreshStops: loadStops,
  };
}

import { useMemo } from 'react';
import type { RouteWithProfile } from '../model/routes.model';
import { useListPostStopMeta } from './useListPostStopMeta';

export function useListPostStopCounts(routes: RouteWithProfile[]) {
  const postIds = useMemo(
    () => routes.map((route) => route.id).filter((id): id is string => Boolean(id)),
    [routes],
  );

  const { stopMetaByPostId, isReady } = useListPostStopMeta(postIds);

  const stopCountsByPostId = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const postId of Object.keys(stopMetaByPostId)) {
      counts[postId] = stopMetaByPostId[postId].count;
    }

    return counts;
  }, [stopMetaByPostId]);

  return {
    stopCountsByPostId,
    stopMetaByPostId,
    isReady,
  };
}

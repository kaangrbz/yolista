import { useMemo } from 'react';
import type { RouteWithProfile } from '../model/routes.model';
import { usePostImagesBatch } from './usePostImagesBatch';

export function useListPostImagesBatch(routes: RouteWithProfile[]) {
  const postIds = useMemo(
    () => routes.map((route) => route.id).filter((id): id is string => Boolean(id)),
    [routes],
  );

  return usePostImagesBatch(postIds);
}

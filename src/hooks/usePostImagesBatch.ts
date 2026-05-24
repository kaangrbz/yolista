import { useEffect, useState } from 'react';
import {
  fetchRouteImageRowsForPosts,
  groupImageRowsByPostId,
  type RouteRowsByPostId,
} from '../services/PostImageSlidesService';

export function usePostImagesBatch(postIds: string[]) {
  const [rowsByPostId, setRowsByPostId] = useState<RouteRowsByPostId>({});
  const [isReady, setIsReady] = useState(false);
  const postIdsKey = [...new Set(postIds.filter(Boolean))].sort().join('|');

  useEffect(() => {
    let isCancelled = false;

    const loadBatch = async () => {
      const uniqueIds = postIdsKey.split('|').filter(Boolean);

      setIsReady(false);

      if (uniqueIds.length === 0) {
        setRowsByPostId({});
        setIsReady(true);
        return;
      }

      const { data, error } = await fetchRouteImageRowsForPosts(uniqueIds);

      if (isCancelled) {
        return;
      }

      if (error) {
        const emptyResult: RouteRowsByPostId = {};

        for (const postId of uniqueIds) {
          emptyResult[postId] = [];
        }

        setRowsByPostId(emptyResult);
        setIsReady(true);
        return;
      }

      const grouped = groupImageRowsByPostId(data ?? []);
      const completeRows: RouteRowsByPostId = {};

      for (const postId of uniqueIds) {
        completeRows[postId] = grouped[postId] ?? [];
      }

      setRowsByPostId(completeRows);
      setIsReady(true);
    };

    loadBatch();

    return () => {
      isCancelled = true;
    };
  }, [postIdsKey]);

  return {
    rowsByPostId,
    isReady,
  };
}

import { useEffect, useState } from 'react';
import {
  fetchStopMetaForPosts,
  type StopMetaByPostId,
} from '../services/PostImageSlidesService';

export function useListPostStopMeta(postIds: string[]) {
  const [stopMetaByPostId, setStopMetaByPostId] = useState<StopMetaByPostId>({});
  const [isReady, setIsReady] = useState(false);
  const postIdsKey = [...new Set(postIds.filter(Boolean))].sort().join('|');

  useEffect(() => {
    let isCancelled = false;

    const loadBatch = async () => {
      const uniqueIds = postIdsKey.split('|').filter(Boolean);

      setIsReady(false);

      if (uniqueIds.length === 0) {
        setStopMetaByPostId({});
        setIsReady(true);
        return;
      }

      const { data, error } = await fetchStopMetaForPosts(uniqueIds);

      if (isCancelled) {
        return;
      }

      if (error) {
        const emptyResult: StopMetaByPostId = {};

        for (const postId of uniqueIds) {
          emptyResult[postId] = { count: 0, titles: [] };
        }

        setStopMetaByPostId(emptyResult);
        setIsReady(true);
        return;
      }

      setStopMetaByPostId(data);
      setIsReady(true);
    };

    void loadBatch();

    return () => {
      isCancelled = true;
    };
  }, [postIdsKey]);

  return {
    stopMetaByPostId,
    isReady,
  };
}

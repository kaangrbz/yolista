import { useSyncExternalStore } from 'react';
import { feedImageWindow } from '../services/FeedImageWindow';

export function useFeedPostImageControl(postId: string, feedIndex: number) {
  return useSyncExternalStore(
    (callback) => feedImageWindow.subscribePost(postId, feedIndex, callback),
    () => feedImageWindow.getPostSnapshot(postId, feedIndex),
    () => feedImageWindow.getPostSnapshot(postId, feedIndex),
  );
}

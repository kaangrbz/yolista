import React, { memo } from 'react';
import type { RouteWithProfile } from '../../model/routes.model';
import type { RouteImageRow } from '../../services/PostImageSlidesService';
import { useFeedPostImageControl } from '../../hooks/useFeedPostImageControl';
import UniversalPost from '../UniversalPost';

export type FeedPostItemProps = {
  item: RouteWithProfile;
  userId: string | null;
  feedIndex: number;
  prefetchedImageRows?: RouteImageRow[];
  stopCountHint?: number | null;
};

function FeedPostItem({
  item,
  userId,
  feedIndex,
  prefetchedImageRows,
  stopCountHint = null,
}: FeedPostItemProps) {
  const postId = item.id || '';
  const { enabled, generation } = useFeedPostImageControl(postId, feedIndex);

  return (
    <UniversalPost
      postId={postId}
      userId={userId}
      initialRoute={item}
      batchImages={true}
      prefetchedImageRows={prefetchedImageRows}
      stopCountHint={stopCountHint}
      imageDownloadEnabled={enabled}
      downloadGeneration={generation}
      feedIndex={feedIndex}
    />
  );
}

export default memo(FeedPostItem, (previous, next) => {
  return (
    previous.item === next.item
    && previous.userId === next.userId
    && previous.feedIndex === next.feedIndex
    && previous.prefetchedImageRows === next.prefetchedImageRows
    && previous.stopCountHint === next.stopCountHint
  );
});

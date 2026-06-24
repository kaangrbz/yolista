import React, { memo } from 'react';
import type { RouteWithProfile } from '../../model/routes.model';
import type { RouteImageRow } from '../../services/PostImageSlidesService';
import { useFeedPostImageControl } from '../../hooks/useFeedPostImageControl';
import UniversalPost from '../UniversalPost';

type HomeFeedPostItemProps = {
  item: RouteWithProfile;
  userId: string;
  feedIndex: number;
  prefetchedImageRows?: RouteImageRow[];
};

function HomeFeedPostItem({
  item,
  userId,
  feedIndex,
  prefetchedImageRows,
}: HomeFeedPostItemProps) {
  const postId = item.id || '';
  const { enabled, generation } = useFeedPostImageControl(postId, feedIndex);

  return (
    <UniversalPost
      postId={postId}
      userId={userId}
      initialRoute={item}
      batchImages={true}
      prefetchedImageRows={prefetchedImageRows}
      imageDownloadEnabled={enabled}
      downloadGeneration={generation}
      feedIndex={feedIndex}
    />
  );
}

export default memo(HomeFeedPostItem, (previous, next) => {
  return (
    previous.item === next.item
    && previous.userId === next.userId
    && previous.feedIndex === next.feedIndex
    && previous.prefetchedImageRows === next.prefetchedImageRows
  );
});

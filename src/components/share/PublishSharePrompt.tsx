import React from 'react';
import ShareModal from '../ShareModal';
import { useRoutePublishStore } from '../../store/routePublishStore';
import { useAuth } from '../../context/AuthContext';
import { getRouteShareLabel } from '../../utils/getRouteDisplayLabel';
import { ShareService } from '../../services/ShareService';

const PublishSharePrompt = (): React.JSX.Element | null => {
  const { user } = useAuth();
  const sharePromptVisible = useRoutePublishStore((state) => state.sharePromptVisible);
  const publishedRouteId = useRoutePublishStore((state) => state.publishedRouteId);
  const publishedRouteMeta = useRoutePublishStore((state) => state.publishedRouteMeta);
  const dismissSharePrompt = useRoutePublishStore((state) => state.dismissSharePrompt);

  if (!sharePromptVisible || !publishedRouteId) {
    return null;
  }

  const postTitle = getRouteShareLabel({
    cities: publishedRouteMeta?.cityName ? { name: publishedRouteMeta.cityName } : null,
    categories: publishedRouteMeta?.categoryName
      ? { name: publishedRouteMeta.categoryName }
      : null,
  });

  return (
    <ShareModal
      visible
      onClose={dismissSharePrompt}
      postId={publishedRouteId}
      postTitle={postTitle}
      postImage={publishedRouteMeta?.previewUri || undefined}
      postUrl={ShareService.generatePostUrl(publishedRouteId)}
      cityName={publishedRouteMeta?.cityName}
      categoryName={publishedRouteMeta?.categoryName}
      stopCount={publishedRouteMeta?.stopCount}
      stopTitles={publishedRouteMeta?.stopTitles}
      authorUsername={publishedRouteMeta?.authorUsername ?? user?.profile?.username}
    />
  );
};

export default PublishSharePrompt;

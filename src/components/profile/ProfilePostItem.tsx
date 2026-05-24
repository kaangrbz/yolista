import React from 'react';
import { RouteWithProfile } from '../../model/routes.model';
import type { RouteImageRow } from '../../services/PostImageSlidesService';
import UniversalPost from '../UniversalPost';

interface ProfilePostItemProps {
  item: RouteWithProfile;
  currentUserId: string | null;
  prefetchedImageRows?: RouteImageRow[];
}

const ProfilePostItem: React.FC<ProfilePostItemProps> = ({
  item,
  currentUserId,
  prefetchedImageRows,
}) => {
  const postId = item.id || '';

  return (
    <UniversalPost
      key={item.id}
      postId={postId}
      userId={currentUserId}
      initialRoute={item}
      batchImages={true}
      prefetchedImageRows={prefetchedImageRows}
    />
  );
};

export default ProfilePostItem;

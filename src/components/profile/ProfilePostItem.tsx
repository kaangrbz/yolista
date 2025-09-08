import React from 'react';
import { RouteWithProfile } from '../../model/routes.model';
import UniversalPost from '../UniversalPost';

interface ProfilePostItemProps {
  item: RouteWithProfile;
  currentUserId: string | null;
}

const ProfilePostItem: React.FC<ProfilePostItemProps> = ({ item, currentUserId }) => {
  return (
    <UniversalPost
      key={item.id}
      postId={item.id || ''}
      userId={currentUserId}
    />
  );
};

export default ProfilePostItem;

import React from 'react';
import RouteImageSkeleton from '../common/smart-image/RouteImageSkeleton';

interface PostImageSkeletonProps {
  width: number;
  height: number;
}

/** @deprecated RouteImageSkeleton kullanın */
const PostImageSkeleton: React.FC<PostImageSkeletonProps> = ({ width, height }) => (
  <RouteImageSkeleton width={width} height={height} borderRadius={0} />
);

export default PostImageSkeleton;

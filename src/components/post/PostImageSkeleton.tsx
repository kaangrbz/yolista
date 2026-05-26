import React from 'react';
import { View } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface PostImageSkeletonProps {
  width: number;
  height: number;
}

const PostImageSkeleton: React.FC<PostImageSkeletonProps> = ({ width, height }) => {
  const styles = useThemedStyles((t) => ({
    container: {
      alignSelf: 'center',
      backgroundColor: t.surfaceMuted,
      overflow: 'hidden',
    },
  }));

  return (
    <View style={[styles.container, { width, height }]}>
      <SimpleSkeletonLoader width={width} height={height} borderRadius={0} />
    </View>
  );
};

export default PostImageSkeleton;

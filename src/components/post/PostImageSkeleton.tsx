import React from 'react';
import { StyleSheet, View } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

interface PostImageSkeletonProps {
  width: number;
  height: number;
}

const PostImageSkeleton: React.FC<PostImageSkeletonProps> = ({ width, height }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <SimpleSkeletonLoader width={width} height={height} borderRadius={0} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
});

export default PostImageSkeleton;

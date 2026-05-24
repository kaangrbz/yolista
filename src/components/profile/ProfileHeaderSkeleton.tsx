import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <SimpleSkeletonLoader
        width="100%"
        height={200}
        borderRadius={0}
        style={styles.headerImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 200,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileHeaderSkeleton;

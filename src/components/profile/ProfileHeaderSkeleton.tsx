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
      
      {/* Action buttons skeleton */}
      <View style={styles.actionButtons}>
        <SimpleSkeletonLoader
          width={40}
          height={40}
          borderRadius={20}
          style={styles.actionButton}
        />
        <SimpleSkeletonLoader
          width={40}
          height={40}
          borderRadius={20}
          style={styles.actionButton}
        />
      </View>
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
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default ProfileHeaderSkeleton;

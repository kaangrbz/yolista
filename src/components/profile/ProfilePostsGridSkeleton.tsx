import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const { width } = Dimensions.get('window');
const itemSize = width / 3;

const ProfilePostsGridSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <SimpleSkeletonLoader
            key={index}
            width={itemSize}
            height={itemSize}
            borderRadius={0}
            style={styles.gridItem}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    borderWidth: 0.5,
    borderColor: '#fff',
  },
});

export default ProfilePostsGridSkeleton;

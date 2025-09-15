import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';

const { width } = Dimensions.get('window');
const itemSize = (width - 4) / 3; // 4px total için 2px gap hesabı

const ProfilePostsGridSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={index} style={styles.gridItemContainer}>
            <SimpleSkeletonLoader
              width={itemSize}
              height={itemSize}
              borderRadius={0}
              style={styles.gridItem}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItemContainer: {
    width: itemSize,
    height: itemSize,
    borderWidth: 1,
    borderColor: '#fff',
  },
  gridItem: {
    flex: 1,
  },
});

export default ProfilePostsGridSkeleton;

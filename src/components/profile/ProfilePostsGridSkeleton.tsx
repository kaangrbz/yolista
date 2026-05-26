import React from 'react';
import { View, Dimensions } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';
import { useThemedStyles } from '../../theme/useThemedStyles';

const { width } = Dimensions.get('window');
const itemSize = (width - 4) / 3;

const ProfilePostsGridSkeleton: React.FC = () => {
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
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
      borderColor: t.background,
    },
    gridItem: {
      flex: 1,
    },
  }));

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

export default ProfilePostsGridSkeleton;

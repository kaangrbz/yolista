import React from 'react';
import { View } from 'react-native';
import SimpleSkeletonLoader from '../common/SimpleSkeletonLoader';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  EXPLORE_MASONRY_COLUMNS,
  getExploreMasonryColumnWidth,
  getMasonryColumnGap,
  getMasonryRowGap,
} from '../../utils/exploreLayoutUtils';

const SKELETON_HEIGHT_RATIOS = [1, 1.45, 0.72, 1, 1.2, 0.85, 1.45, 1, 0.72];
const SKELETON_ITEMS_PER_COLUMN = 6;

const ExploreFeedSkeleton: React.FC = () => {
  const columnWidth = getExploreMasonryColumnWidth();
  const columnGap = getMasonryColumnGap();
  const rowGap = getMasonryRowGap();
  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingTop: 4,
      backgroundColor: t.background,
    },
    column: {
      flexDirection: 'column',
    },
  }));

  const columns = Array.from({ length: EXPLORE_MASONRY_COLUMNS }, (_, columnIndex) => {
    return Array.from({ length: SKELETON_ITEMS_PER_COLUMN }, (_, rowIndex) => {
      const ratioIndex = (columnIndex * SKELETON_ITEMS_PER_COLUMN + rowIndex) % SKELETON_HEIGHT_RATIOS.length;

      return Math.round(columnWidth * SKELETON_HEIGHT_RATIOS[ratioIndex]);
    });
  });

  return (
    <View style={styles.container}>
      {columns.map((columnHeights, columnIndex) => (
        <View
          key={`skeleton-column-${columnIndex}`}
          style={[
            styles.column,
            { width: columnWidth },
            columnIndex < columns.length - 1 && { marginRight: columnGap },
          ]}
        >
          {columnHeights.map((height, rowIndex) => (
            <SimpleSkeletonLoader
              key={`skeleton-cell-${columnIndex}-${rowIndex}`}
              width={columnWidth}
              height={height}
              borderRadius={8}
              style={{ marginBottom: rowGap }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export default ExploreFeedSkeleton;

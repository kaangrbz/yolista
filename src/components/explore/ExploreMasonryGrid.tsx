import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import RouteCard from '../route/RouteCard';
import type { RouteWithProfile } from '../../model/routes.model';
import {
  distributeToMasonryColumns,
  getExploreMasonryColumnWidth,
  getMasonryColumnGap,
  getMasonryRowGap,
  getRouteMasonryHeight,
} from '../../utils/exploreLayoutUtils';

interface ExploreMasonryGridProps {
  routes: RouteWithProfile[];
  userId: string | null;
  onRefresh: () => void;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
}

const ExploreMasonryGrid: React.FC<ExploreMasonryGridProps> = ({
  routes,
  userId,
  onRefresh,
  expandedDescriptions,
  onToggleDescription,
}) => {
  const columnWidth = getExploreMasonryColumnWidth();
  const rowGap = getMasonryRowGap();
  const columnGap = getMasonryColumnGap();

  const columns = useMemo(() => {
    return distributeToMasonryColumns(routes, (route) => getRouteMasonryHeight(route, columnWidth));
  }, [routes, columnWidth]);

  const renderColumn = (columnRoutes: RouteWithProfile[], columnIndex: number) => (
    <View
      key={`masonry-column-${columnIndex}`}
      style={[
        styles.column,
        { width: columnWidth },
        columnIndex < columns.length - 1 && { marginRight: columnGap },
      ]}
    >
      {columnRoutes.map((route) => {
        const cellHeight = getRouteMasonryHeight(route, columnWidth);

        return (
          <View
            key={route.id}
            style={[styles.cell, { height: cellHeight, marginBottom: rowGap }]}
          >
            <RouteCard
              route={route}
              userId={userId}
              onRefresh={onRefresh}
              expandedDescriptions={expandedDescriptions}
              onToggleDescription={onToggleDescription}
              showAuthorHeader={false}
              showConnectingLine={false}
              exploreCellHeight={cellHeight}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {columns.map((columnRoutes, columnIndex) => renderColumn(columnRoutes, columnIndex))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  column: {
    flexDirection: 'column',
  },
  cell: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default ExploreMasonryGrid;

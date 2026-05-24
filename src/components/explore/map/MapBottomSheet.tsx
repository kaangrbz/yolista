import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { RouteWithProfile } from '../../../model/routes.model';
import { BOTTOM_SHEET_SNAP_POINTS } from '../../../constants/mapDefaults';
import { appTheme } from '../../../theme/appTheme';
import MapRouteListItem from './MapRouteListItem';

export type BottomSheetSnap = 'small' | 'medium' | 'large';

export interface MapBottomSheetHandle {
  snapTo: (snap: BottomSheetSnap) => void;
  scrollToRoute: (routeId: string) => void;
}

interface MapBottomSheetProps {
  routes: RouteWithProfile[];
  loading: boolean;
  selectedRouteId: string | null;
  onSelectRoute: (route: RouteWithProfile) => void;
  onSnapChange?: (snap: BottomSheetSnap) => void;
}

const snapIndexFromName = (snap: BottomSheetSnap): number => {
  if (snap === 'small') {
    return 0;
  }

  if (snap === 'large') {
    return 2;
  }

  return 1;
};

const snapNameFromIndex = (index: number): BottomSheetSnap => {
  if (index === 0) {
    return 'small';
  }

  if (index === 2) {
    return 'large';
  }

  return 'medium';
};

export const MapBottomSheet = forwardRef<MapBottomSheetHandle, MapBottomSheetProps>(
  (
    {
      routes,
      loading,
      selectedRouteId,
      onSelectRoute,
      onSnapChange,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheet>(null);
    const horizontalListRef = useRef<FlatList<RouteWithProfile>>(null);

    const snapPoints = useMemo(() => [...BOTTOM_SHEET_SNAP_POINTS], []);

    const currentSnapRef = useRef<BottomSheetSnap>('medium');

    useImperativeHandle(
      ref,
      () => ({
        snapTo: (snap) => {
          sheetRef.current?.snapToIndex(snapIndexFromName(snap));
        },
        scrollToRoute: (routeId) => {
          const index = routes.findIndex((route) => route.id === routeId);

          if (index < 0) {
            return;
          }

          if (currentSnapRef.current === 'medium') {
            horizontalListRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5,
            });
          }
        },
      }),
      [routes],
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        const snap = snapNameFromIndex(index);
        currentSnapRef.current = snap;
        onSnapChange?.(snap);
      },
      [onSnapChange],
    );

    const renderHorizontalItem = useCallback(
      ({ item }: { item: RouteWithProfile }) => {
        return (
          <MapRouteListItem
            route={item}
            variant="horizontal"
            selected={item.id === selectedRouteId}
            onPress={() => onSelectRoute(item)}
          />
        );
      },
      [onSelectRoute, selectedRouteId],
    );

    const renderVerticalItem = useCallback(
      ({ item }: { item: RouteWithProfile }) => {
        return (
          <MapRouteListItem
            route={item}
            variant="vertical"
            selected={item.id === selectedRouteId}
            onPress={() => onSelectRoute(item)}
          />
        );
      },
      [onSelectRoute, selectedRouteId],
    );

    const keyExtractor = useCallback((item: RouteWithProfile) => String(item.id), []);

    return (
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.header}>
          <Text style={styles.headerTitle}>
            {loading ? 'Yükleniyor...' : `${routes.length} rota`}
          </Text>
          <Text style={styles.headerHint}>
            Bu bölgedeki rotalar
          </Text>
        </BottomSheetView>

        <View style={styles.horizontalWrapper}>
          <FlatList
            ref={horizontalListRef}
            data={routes}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
            renderItem={renderHorizontalItem}
            onScrollToIndexFailed={() => undefined}
          />
        </View>

        <BottomSheetFlatList
          data={routes}
          keyExtractor={keyExtractor}
          renderItem={renderVerticalItem}
          contentContainerStyle={styles.verticalContent}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Bu bölgede henüz rota yok. Haritayı kaydırarak başka bölgelere bak.
                </Text>
              </View>
            ) : null
          }
        />
      </BottomSheet>
    );
  },
);

MapBottomSheet.displayName = 'MapBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
  },
  indicator: {
    backgroundColor: appTheme.borderStrong,
    width: 48,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.textPrimary,
  },
  headerHint: {
    fontSize: 12,
    color: appTheme.textSecondary,
    marginTop: 2,
  },
  horizontalWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  horizontalContent: {
    paddingHorizontal: 6,
  },
  verticalContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: appTheme.textSecondary,
    textAlign: 'center',
  },
});

export default MapBottomSheet;

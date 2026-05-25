import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { BOTTOM_SHEET_SNAP_POINTS } from '../../../constants/mapDefaults';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapRouteCard from './MapRouteCard';
import MapRouteRow from './MapRouteRow';
import MapWeatherBadge from './MapWeatherBadge';

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
  /** Hava durumu rozeti için aktif konum (genelde haritanın merkezi). */
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
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
      weatherLatitude,
      weatherLongitude,
    },
    ref,
  ) => {
    const theme = useAppTheme();
    const styles = useThemedStyles((t) => ({
      background: {
        backgroundColor: t.background,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      handle: {
        paddingTop: 10,
        paddingBottom: 6,
      },
      indicator: {
        backgroundColor: t.borderStrong,
        width: 42,
        height: 4,
        borderRadius: 2,
      },
      header: {
        paddingHorizontal: 18,
        paddingTop: 4,
        paddingBottom: 12,
      },
      headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      headerTitleWrapper: {
        flex: 1,
        paddingRight: 12,
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: t.textPrimary,
        letterSpacing: -0.2,
      },
      headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
      },
      headerHint: {
        fontSize: 12,
        color: t.textSecondary,
        marginLeft: 4,
      },
      horizontalWrapper: {
        paddingVertical: 10,
      },
      horizontalContent: {
        paddingHorizontal: 10,
        paddingVertical: 4,
      },
      sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.border,
      },
      sectionHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: t.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      },
      sectionHeaderHint: {
        fontSize: 11,
        color: t.textMuted,
        fontWeight: '600',
      },
      verticalContent: {
        paddingTop: 4,
        paddingBottom: 80,
      },
      rowDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: t.border,
        marginLeft: 92,
      },
      emptyState: {
        paddingHorizontal: 36,
        paddingVertical: 48,
        alignItems: 'center',
      },
      emptyTitle: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '700',
        color: t.textPrimary,
      },
      emptyText: {
        marginTop: 6,
        fontSize: 12,
        color: t.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
      },
    }));

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
          <MapRouteCard
            route={item}
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
          <MapRouteRow
            route={item}
            selected={item.id === selectedRouteId}
            onPress={() => onSelectRoute(item)}
          />
        );
      },
      [onSelectRoute, selectedRouteId],
    );

    const keyExtractor = useCallback(
      (item: RouteWithProfile) => String(item.id),
      [],
    );

    const renderRowSeparator = useCallback(() => <View style={styles.rowDivider} />, [styles.rowDivider]);

    return (
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.indicator}
        handleStyle={styles.handle}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerTitle}>Paylaşılan Rotalar</Text>
              <View style={styles.headerSubtitleRow}>
                <Icon
                  name="map-search-outline"
                  size={12}
                  color={theme.textSecondary}
                />
                <Text style={styles.headerHint}>
                  {loading
                    ? 'Bu bölge yükleniyor...'
                    : `Bu bölgede ${routes.length} rota`}
                </Text>
              </View>
            </View>

            <MapWeatherBadge
              latitude={weatherLatitude}
              longitude={weatherLongitude}
            />
          </View>
        </BottomSheetView>

        {routes.length > 0 ? (
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
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Tüm rotalar</Text>
          {routes.length > 0 ? (
            <Text style={styles.sectionHeaderHint}>
              {routes.length} sonuç
            </Text>
          ) : null}
        </View>

        <BottomSheetFlatList
          data={routes}
          keyExtractor={keyExtractor}
          renderItem={renderVerticalItem}
          ItemSeparatorComponent={renderRowSeparator}
          contentContainerStyle={styles.verticalContent}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={theme.textSecondary} />
                <Text style={styles.emptyText}>Rotalar yükleniyor...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon
                  name="map-marker-off-outline"
                  size={36}
                  color={theme.textMuted}
                />
                <Text style={styles.emptyTitle}>Bu bölgede rota yok</Text>
                <Text style={styles.emptyText}>
                  Haritayı kaydırarak veya uzaklaştırarak başka bölgelere bak.
                </Text>
              </View>
            )
          }
        />
      </BottomSheet>
    );
  },
);

MapBottomSheet.displayName = 'MapBottomSheet';

export default MapBottomSheet;

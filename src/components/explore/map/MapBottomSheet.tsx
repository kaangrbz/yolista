import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { BOTTOM_SHEET_SNAP_POINTS } from '../../../constants/mapDefaults';
import { getRouteDistanceLabel } from '../../../utils/routeDistance';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapRouteRow from './MapRouteRow';
import MapSelectedRouteStops from './MapSelectedRouteStops';
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
  selectedRoute: RouteWithProfile | null;
  selectedRouteStops: RouteWithProfile[];
  showRouteStopsPanel?: boolean;
  activeStopId?: string | null;
  stopsLoading: boolean;
  onSelectRoute: (route: RouteWithProfile) => void;
  onStopPress?: (stop: RouteWithProfile) => void;
  onDismissRouteStops?: () => void;
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

type MapBottomSheetListHeaderProps = {
  loading: boolean;
  headerHint: string;
  showSelectedRouteStops: boolean;
  selectedRouteStops: RouteWithProfile[];
  showRouteStopsPanel: boolean;
  stopsLoading: boolean;
  selectedRoute: RouteWithProfile | null;
  activeStopId: string | null;
  onStopPress?: (stop: RouteWithProfile) => void;
  onDismissRouteStops?: () => void;
  routes: RouteWithProfile[];
  isViewingSelectedRoute: boolean;
  sectionTitle: string;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
  textSecondary: string;
};

const MapBottomSheetListHeader: React.FC<MapBottomSheetListHeaderProps> = ({
  loading,
  headerHint,
  showSelectedRouteStops,
  selectedRouteStops,
  showRouteStopsPanel,
  stopsLoading,
  selectedRoute,
  activeStopId,
  onStopPress,
  onDismissRouteStops,
  routes,
  isViewingSelectedRoute,
  sectionTitle,
  weatherLatitude,
  weatherLongitude,
  styles,
  textSecondary,
}) => (
  <View>
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Paylaşılan Rotalar
          </Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={textSecondary}
              style={styles.headerTitleLoader}
            />
          ) : null}
        </View>

        <MapWeatherBadge
          latitude={weatherLatitude}
          longitude={weatherLongitude}
        />
      </View>

      <View style={styles.headerSubtitleRow}>
        <Icon name="map-search-outline" size={12} color={textSecondary} />
        <Text style={styles.headerHint}>{headerHint}</Text>
      </View>
    </View>

    {showSelectedRouteStops ? (
      <MapSelectedRouteStops
        stops={selectedRouteStops}
        loading={stopsLoading}
        selectedRoute={selectedRoute}
        activeStopId={activeStopId}
        onStopPress={onStopPress}
        onClearSelection={onDismissRouteStops}
      />
    ) : null}

    {!(isViewingSelectedRoute && routes.length === 0) ? (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>{sectionTitle}</Text>
        {routes.length > 0 ? (
          <Text style={styles.sectionHeaderHint}>
            {routes.length} sonuç
          </Text>
        ) : null}
      </View>
    ) : null}
  </View>
);

export const MapBottomSheet = forwardRef<MapBottomSheetHandle, MapBottomSheetProps>(
  (
    {
      routes,
      loading,
      selectedRouteId,
      selectedRoute,
      selectedRouteStops,
      showRouteStopsPanel = true,
      activeStopId = null,
      stopsLoading,
      onSelectRoute,
      onStopPress,
      onDismissRouteStops,
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
        gap: 12,
      },
      headerTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: t.textPrimary,
        letterSpacing: -0.2,
        flexShrink: 1,
      },
      headerTitleLoader: {
        width: 16,
        height: 16,
        transform: [{ scale: 0.7 }],
      },
      headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 4,
        minHeight: 16,
      },
      headerHint: {
        fontSize: 12,
        color: t.textSecondary,
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
        paddingBottom: 30,
      },
      rowDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: t.border,
        marginLeft: 92,
      },
      emptyState: {
        paddingHorizontal: 36,
        paddingVertical: 12,
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
    const verticalListRef = useRef<any>(null);

    const snapPoints = useMemo(() => [...BOTTOM_SHEET_SNAP_POINTS], []);

    const isViewingSelectedRoute = Boolean(
      selectedRouteId && (stopsLoading || selectedRouteStops.length > 0),
    );

    const showSelectedRouteStops =
      showRouteStopsPanel && (stopsLoading || selectedRouteStops.length > 0);

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

          verticalListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        },
      }),
      [routes],
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        onSnapChange?.(snapNameFromIndex(index));
      },
      [onSnapChange],
    );

    const selectedRouteDistanceLabel = useMemo(
      () => getRouteDistanceLabel(selectedRouteStops),
      [selectedRouteStops],
    );

    const renderVerticalItem = useCallback(
      ({ item }: { item: RouteWithProfile }) => {
        const isSelected = item.id === selectedRouteId;

        return (
          <MapRouteRow
            route={item}
            selected={isSelected}
            distanceLabel={isSelected ? selectedRouteDistanceLabel : null}
            onPress={() => {
              if (isSelected) {
                return;
              }

              onSelectRoute(item);
            }}
          />
        );
      },
      [onSelectRoute, selectedRouteDistanceLabel, selectedRouteId],
    );

    const keyExtractor = useCallback(
      (item: RouteWithProfile) => String(item.id),
      [],
    );

    const headerHint = useMemo(() => {
      if (isViewingSelectedRoute && routes.length === 0) {
        return 'Seçili rotanın duraklarını inceliyorsun';
      }

      if (routes.length === 0) {
        return 'Haritayı kaydır veya uzaklaştır';
      }

      if (isViewingSelectedRoute) {
        return `Bu bölgede ${routes.length} rota · seçili rota açık`;
      }

      return `Bu bölgede ${routes.length} rota`;
    }, [isViewingSelectedRoute, routes.length]);

    const sectionTitle = isViewingSelectedRoute
      ? 'Bu bölgedeki rotalar'
      : 'Tüm rotalar';

    const renderRowSeparator = useCallback(() => <View style={styles.rowDivider} />, [styles.rowDivider]);

    const listHeaderPropsRef = useRef<MapBottomSheetListHeaderProps>({
      loading,
      headerHint,
      showSelectedRouteStops,
      selectedRouteStops,
      showRouteStopsPanel,
      stopsLoading,
      selectedRoute,
      activeStopId,
      onStopPress,
      onDismissRouteStops,
      routes,
      isViewingSelectedRoute,
      sectionTitle,
      weatherLatitude,
      weatherLongitude,
      styles,
      textSecondary: theme.textSecondary,
    });

    listHeaderPropsRef.current = {
      loading,
      headerHint,
      showSelectedRouteStops,
      selectedRouteStops,
      showRouteStopsPanel,
      stopsLoading,
      selectedRoute,
      activeStopId,
      onStopPress,
      onDismissRouteStops,
      routes,
      isViewingSelectedRoute,
      sectionTitle,
      weatherLatitude,
      weatherLongitude,
      styles,
      textSecondary: theme.textSecondary,
    };

    const renderListHeader = useCallback(
      () => <MapBottomSheetListHeader {...listHeaderPropsRef.current} />,
      [],
    );

    const renderListEmpty = useCallback(() => {
      if (loading) {
        return null;
      }

      if (isViewingSelectedRoute) {
        return null;
      }

      return (
        <View style={styles.emptyState}>
          <Icon
            name="map-marker-off-outline"
            size={36}
            color={theme.textMuted}
          />
          <Text style={styles.emptyTitle}>Bu bölgede rota yok</Text>
          <Text style={styles.emptyText}>
            Haritayı kaydırarak veya uzaklaştırarak başka bölgelere bak.
            Yakındaki rotaları görmek için arama çubuğunu da kullanabilirsin.
          </Text>
        </View>
      );
    }, [
      isViewingSelectedRoute,
      loading,
      styles.emptyState,
      styles.emptyText,
      styles.emptyTitle,
      theme.textMuted,
    ]);

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
        <BottomSheetFlatList
          ref={verticalListRef}
          data={routes}
          keyExtractor={keyExtractor}
          renderItem={renderVerticalItem}
          ItemSeparatorComponent={renderRowSeparator}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderListEmpty}
          contentContainerStyle={styles.verticalContent}
          onScrollToIndexFailed={() => undefined}
        />
      </BottomSheet>
    );
  },
);

MapBottomSheet.displayName = 'MapBottomSheet';

export default MapBottomSheet;

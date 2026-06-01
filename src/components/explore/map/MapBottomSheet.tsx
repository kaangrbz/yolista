import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetHandle,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import {
  computeMapBottomSheetSnapHeights,
  mapSheetSnapHeight,
  type MapBottomSheetSnapHeights,
} from '../../../constants/mapDefaults';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import { getRouteDistanceLabel } from '../../../utils/routeDistance';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapRouteRow from './MapRouteRow';
import MapRouteDirectionsPanel from './MapRouteDirectionsPanel';
import MapRouteSheetTabs from './MapRouteSheetTabs';
import MapSelectedRouteStops from './MapSelectedRouteStops';
import { getMapStopKey } from './MapRouteStopCard';
import MapBottomSheetHeader from './MapBottomSheetHeader';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';
import type { RouteSegment, RouteSheetTab } from '../../../types/routeSegment.types';
import { useCommentsSheet } from '../../../context/CommentsSheetContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BottomSheetSnap = 'small' | 'medium' | 'large';

export type MapBottomSheetSnapMetrics = {
  sheetHeight: number;
  snapHeights: MapBottomSheetSnapHeights;
};

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
  onOpenRouteInMaps?: () => void;
  onOpenStopInMaps?: (stop: RouteWithProfile) => void;
  startFromUserLocation?: boolean;
  onStartFromUserLocationChange?: (enabled: boolean) => void;
  canStartFromUserLocation?: boolean;
  routeSheetTab?: RouteSheetTab;
  onRouteSheetTabChange?: (tab: RouteSheetTab) => void;
  routeSegments?: RouteSegment[];
  activeSegmentIndex?: number;
  segmentsLoading?: boolean;
  onSegmentPress?: (index: number) => void;
  onOpenActiveStopInMaps?: () => void;
  onOpenRouteDetail?: () => void;
  onSnapChange?: (snap: BottomSheetSnap, metrics: MapBottomSheetSnapMetrics) => void;
  /** Sheet tam açıkken handle safe-area üst boşluğu. */
  topInset?: number;
  /** Hava durumu rozeti için aktif konum (genelde haritanın merkezi). */
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  onClearSelectedRoute?: () => void;
  onShareRoute?: () => void;
  onSaveRoute?: () => void;
  isRouteSaved?: boolean;
  saveLoading?: boolean;
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
  showSelectedRouteStops: boolean;
  selectedRouteStops: RouteWithProfile[];
  stopsLoading: boolean;
  selectedRoute: RouteWithProfile | null;
  activeStopId: string | null;
  onStopPress?: (stop: RouteWithProfile) => void;
  onDismissRouteStops?: () => void;
  onOpenRouteInMaps?: () => void;
  onOpenStopInMaps?: (stop: RouteWithProfile) => void;
  startFromUserLocation?: boolean;
  onStartFromUserLocationChange?: (enabled: boolean) => void;
  canStartFromUserLocation?: boolean;
  routeSheetTab: RouteSheetTab;
  onRouteSheetTabChange?: (tab: RouteSheetTab) => void;
  routeSegments: RouteSegment[];
  activeSegmentIndex: number;
  segmentsLoading: boolean;
  onSegmentPress?: (index: number) => void;
  onOpenActiveStopInMaps?: () => void;
  onOpenRouteDetail?: () => void;
  routes: RouteWithProfile[];
  isViewingSelectedRoute: boolean;
  sectionTitle: string;
  routePreviewLabel: string | null;
  routePreviewMeta: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
  textSecondary: string;
  accent: string;
};

const MapBottomSheetListHeader: React.FC<MapBottomSheetListHeaderProps> = ({
  showSelectedRouteStops,
  selectedRouteStops,
  stopsLoading,
  selectedRoute,
  activeStopId,
  onStopPress,
  onDismissRouteStops,
  onOpenRouteInMaps,
  onOpenStopInMaps,
  startFromUserLocation = false,
  onStartFromUserLocationChange,
  canStartFromUserLocation = false,
  routeSheetTab,
  onRouteSheetTabChange,
  routeSegments,
  activeSegmentIndex,
  segmentsLoading,
  onSegmentPress,
  onOpenActiveStopInMaps,
  onOpenRouteDetail,
  routes,
  isViewingSelectedRoute,
  sectionTitle,
  routePreviewLabel,
  routePreviewMeta,
  styles,
  textSecondary,
  accent,
}) => {
  const { openComments } = useCommentsSheet();

  const handlePreviewCommentPress = () => {
    if (!selectedRoute?.id) {
      return;
    }

    openComments({
      routeId: selectedRoute.id,
      routeOwnerId: selectedRoute.user_id || selectedRoute.profiles?.id || '',
      parentType: 'routeDetail',
    });
  };

  return (
  <View>
    {showSelectedRouteStops && selectedRoute ? (
      <View style={styles.routePreviewStrip}>
        <View style={styles.routePreviewIcon}>
          <Icon name="map-marker-path" size={16} color={accent} />
        </View>
        <View style={styles.routePreviewTextGroup}>
          <Text style={styles.routePreviewTitle} numberOfLines={1}>
            {routePreviewLabel ?? getRouteDisplayLabel(selectedRoute)}
          </Text>
          {stopsLoading ? (
            <ActivityIndicator
              size="small"
              color={textSecondary}
              style={styles.routePreviewLoader}
            />
          ) : routePreviewMeta ? (
            <Text style={styles.routePreviewMeta} numberOfLines={1}>
              {routePreviewMeta}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.routePreviewCommentButton}
          onPress={handlePreviewCommentPress}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Yorumları aç"
        >
          <Icon name="comment-outline" size={16} color={accent} />
          {(selectedRoute.comment_count || 0) > 0 ? (
            <Text style={styles.routePreviewMeta}>{selectedRoute.comment_count}</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    ) : null}

    {showSelectedRouteStops && onRouteSheetTabChange ? (
      <MapRouteSheetTabs
        activeTab={routeSheetTab}
        onTabChange={onRouteSheetTabChange}
      />
    ) : null}

    {showSelectedRouteStops && routeSheetTab === 'stops' ? (
      <MapSelectedRouteStops
        stops={selectedRouteStops}
        loading={stopsLoading}
        selectedRoute={selectedRoute}
        activeStopId={activeStopId}
        onStopPress={onStopPress}
        onClearSelection={onDismissRouteStops}
        onOpenRouteInMaps={onOpenRouteInMaps}
        onOpenStopInMaps={onOpenStopInMaps}
        startFromUserLocation={startFromUserLocation}
        onStartFromUserLocationChange={onStartFromUserLocationChange}
        canStartFromUserLocation={canStartFromUserLocation}
        onOpenRouteDetail={onOpenRouteDetail}
      />
    ) : null}

    {showSelectedRouteStops && routeSheetTab === 'directions' ? (
      <MapRouteDirectionsPanel
        selectedRoute={selectedRoute}
        segments={routeSegments}
        activeSegmentIndex={activeSegmentIndex}
        loading={segmentsLoading || stopsLoading}
        startFromUserLocation={startFromUserLocation}
        canStartFromUserLocation={canStartFromUserLocation}
        onSegmentPress={onSegmentPress ?? (() => undefined)}
        onStartFromUserLocationChange={(enabled) => {
          onStartFromUserLocationChange?.(enabled);
        }}
        onOpenRouteInMaps={onOpenRouteInMaps ?? (() => undefined)}
        onOpenActiveStopInMaps={onOpenActiveStopInMaps ?? (() => undefined)}
        onOpenRouteDetail={onOpenRouteDetail}
      />
    ) : null}

    {!showSelectedRouteStops && routes.length > 0 ? (
      <View
        style={[
          styles.sectionHeader,
          isViewingSelectedRoute && styles.sectionHeaderBordered,
        ]}
      >
        <Text style={styles.sectionHeaderTitle}>{sectionTitle}</Text>
        {routes.length > 0 ? (
          <Text style={styles.sectionHeaderHint}>
            {routes.length} rota
          </Text>
        ) : null}
      </View>
    ) : null}
  </View>
  );
};

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
      onOpenRouteInMaps,
      onOpenStopInMaps,
      startFromUserLocation = false,
      onStartFromUserLocationChange,
      canStartFromUserLocation = false,
      routeSheetTab = 'stops',
      onRouteSheetTabChange,
      routeSegments = [],
      activeSegmentIndex = 0,
      segmentsLoading = false,
      onSegmentPress,
      onOpenActiveStopInMaps,
      onOpenRouteDetail,
      onSnapChange,
      topInset = 0,
      weatherLatitude,
      weatherLongitude,
      onClearSelectedRoute,
      onShareRoute,
      onSaveRoute,
      isRouteSaved = false,
      saveLoading = false,
    },
    ref,
  ) => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useThemedStyles((t) => ({
      background: {
        backgroundColor: t.background,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 24,
      },
      sheetContainer: {
        zIndex: 30,
        elevation: 30,
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
      routePreviewStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 18,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: t.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      },
      routePreviewIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.background,
      },
      routePreviewTextGroup: {
        flex: 1,
        minWidth: 0,
      },
      routePreviewTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: t.textPrimary,
      },
    routePreviewMeta: {
      marginTop: 2,
      fontSize: 12,
      color: t.textSecondary,
    },
    routePreviewCommentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    routePreviewLoader: {
        alignSelf: 'flex-start',
        marginTop: 4,
        transform: [{ scale: 0.75 }],
      },
      sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        marginTop: 4,
      },
      sectionHeaderBordered: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.border,
        marginTop: 8,
        paddingTop: 16,
      },
      sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: t.textPrimary,
        letterSpacing: -0.2,
      },
      sectionHeaderHint: {
        fontSize: 13,
        color: t.textMuted,
        fontWeight: '500',
      },
      verticalContent: {
        paddingTop: 0,
      },
      rowDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: t.border,
        marginLeft: 16 + 72 + 12,
        marginRight: 16,
      },
      emptyState: {
        paddingHorizontal: 32,
        paddingTop: 20,
        paddingBottom: 24,
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

    const { height: windowHeight } = useWindowDimensions();
    const sheetRef = useRef<BottomSheet>(null);
    const verticalListRef = useRef<any>(null);
    const [currentSnap, setCurrentSnap] = useState<BottomSheetSnap>('small');

    const snapHeights = useMemo(
      () => computeMapBottomSheetSnapHeights(windowHeight, 0),
      [windowHeight],
    );

    const snapPoints = useMemo(
      () => [snapHeights.closed, snapHeights.medium, snapHeights.full],
      [snapHeights],
    );

    const contentMinHeight = useMemo(() => {
      return Math.max(windowHeight - snapHeights.closed, 0);
    }, [snapHeights.closed, windowHeight]);

    const isViewingSelectedRoute = Boolean(
      selectedRouteId && (stopsLoading || selectedRouteStops.length > 0),
    );

    const showSelectedRouteStops =
      showRouteStopsPanel && (stopsLoading || selectedRouteStops.length > 0);

    const listContentContainerStyle = useMemo(
      () => [
        styles.verticalContent,
        {
          minHeight:
            !showSelectedRouteStops && routes.length > 0 ? contentMinHeight : undefined,
          paddingBottom: Math.max(insets.bottom, 30),
        },
      ],
      [
        contentMinHeight,
        insets.bottom,
        showSelectedRouteStops,
        routes.length,
        styles.verticalContent,
      ],
    );

    const handleTopInset = currentSnap === 'large' ? topInset : 0;

    const sheetHeaderTitle = useMemo(() => {
      if (!selectedRouteId || !activeStopId || selectedRouteStops.length === 0) {
        return 'Paylaşılan Rotalar';
      }

      const activeStop = selectedRouteStops.find(
        (stop) => getMapStopKey(stop) === activeStopId,
      );
      const stopTitle = activeStop ? getStopPhotoHintLabel(activeStop) : '';

      return stopTitle || 'Paylaşılan Rotalar';
    }, [activeStopId, selectedRouteId, selectedRouteStops]);

    const renderHandle = useCallback(
      (props: React.ComponentProps<typeof BottomSheetHandle>) => (
        <BottomSheetHandle
          {...props}
          indicatorStyle={styles.indicator}
          accessibilityLabel="Rota listesi paneli, yukarı veya aşağı sürükleyin"
        >
          <MapBottomSheetHeader
            title={sheetHeaderTitle}
            loading={loading}
            topInset={handleTopInset}
            weatherLatitude={weatherLatitude}
            weatherLongitude={weatherLongitude}
            selectedRouteId={selectedRouteId}
            isRouteSaved={isRouteSaved}
            onClearSelectedRoute={onClearSelectedRoute}
            onShareRoute={onShareRoute}
            onSaveRoute={onSaveRoute}
            saveLoading={saveLoading}
          />
        </BottomSheetHandle>
      ),
      [
        handleTopInset,
        isRouteSaved,
        loading,
        onClearSelectedRoute,
        onSaveRoute,
        onShareRoute,
        saveLoading,
        selectedRouteId,
        sheetHeaderTitle,
        styles.indicator,
        weatherLatitude,
        weatherLongitude,
      ],
    );

    const emitSnapMetrics = useCallback(
      (snap: BottomSheetSnap) => {
        onSnapChange?.(snap, {
          sheetHeight: mapSheetSnapHeight(snapHeights, snap),
          snapHeights,
        });
      },
      [onSnapChange, snapHeights],
    );

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
        const snap = snapNameFromIndex(index);
        setCurrentSnap(snap);
        emitSnapMetrics(snap);
      },
      [emitSnapMetrics],
    );

    useEffect(() => {
      emitSnapMetrics(currentSnap);
    }, [currentSnap, emitSnapMetrics]);

    const routePreviewLabel = useMemo(() => {
      if (!selectedRoute) {
        return null;
      }

      return getRouteDisplayLabel(selectedRoute);
    }, [selectedRoute]);

    const routePreviewMeta = useMemo(() => {
      if (!selectedRoute || !showSelectedRouteStops) {
        return null;
      }

      if (stopsLoading) {
        return 'Duraklar yükleniyor…';
      }

      const parts: string[] = [];

      if (selectedRouteStops.length > 0) {
        parts.push(`${selectedRouteStops.length} durak`);
      }

      const distanceLabel = getRouteDistanceLabel(selectedRouteStops);

      if (distanceLabel) {
        parts.push(distanceLabel);
      }

      if (routeSheetTab === 'directions' && routeSegments.length > 0) {
        parts.push(`${routeSegments.length} bacak`);
      }

      return parts.length > 0 ? parts.join(' · ') : null;
    }, [
      routeSegments.length,
      routeSheetTab,
      selectedRoute,
      selectedRouteStops,
      showSelectedRouteStops,
      stopsLoading,
    ]);

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
            onPress={() => onSelectRoute(item)}
          />
        );
      },
      [onSelectRoute, selectedRouteDistanceLabel, selectedRouteId],
    );

    const keyExtractor = useCallback(
      (item: RouteWithProfile) => String(item.id),
      [],
    );

    const sectionTitle = isViewingSelectedRoute
      ? 'Bu bölgedeki rotalar'
      : 'Tüm rotalar';

    const renderRowSeparator = useCallback(() => <View style={styles.rowDivider} />, [styles.rowDivider]);

    const listHeaderPropsRef = useRef<MapBottomSheetListHeaderProps>({
      showSelectedRouteStops,
      selectedRouteStops,
      stopsLoading,
      selectedRoute,
      activeStopId,
      onStopPress,
      onDismissRouteStops,
      onOpenRouteInMaps,
      onOpenStopInMaps,
      startFromUserLocation,
      onStartFromUserLocationChange,
      canStartFromUserLocation,
      routeSheetTab,
      onRouteSheetTabChange,
      routeSegments,
      activeSegmentIndex,
      segmentsLoading,
      onSegmentPress,
      onOpenActiveStopInMaps,
      onOpenRouteDetail,
      routes,
      isViewingSelectedRoute,
      sectionTitle,
      routePreviewLabel,
      routePreviewMeta,
      styles,
      textSecondary: theme.textSecondary,
      accent: theme.accent,
    });

    listHeaderPropsRef.current = {
      showSelectedRouteStops,
      selectedRouteStops,
      stopsLoading,
      selectedRoute,
      activeStopId,
      onStopPress,
      onDismissRouteStops,
      onOpenRouteInMaps,
      onOpenStopInMaps,
      startFromUserLocation,
      onStartFromUserLocationChange,
      canStartFromUserLocation,
      routeSheetTab,
      onRouteSheetTabChange,
      routeSegments,
      activeSegmentIndex,
      segmentsLoading,
      onSegmentPress,
      onOpenActiveStopInMaps,
      onOpenRouteDetail,
      routes,
      isViewingSelectedRoute,
      sectionTitle,
      routePreviewLabel,
      routePreviewMeta,
      styles,
      textSecondary: theme.textSecondary,
      accent: theme.accent,
    };

    const renderListHeader = useCallback(
      () => <MapBottomSheetListHeader {...listHeaderPropsRef.current} />,
      [],
    );

    const listData = showSelectedRouteStops ? [] : routes;

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
            {currentSnap === 'large'
              ? ' Sheet\'i aşağı kaydırarak haritaya dönebilirsin.'
              : ' Yakındaki rotaları görmek için arama çubuğunu da kullanabilirsin.'}
          </Text>
        </View>
      );
    }, [
      currentSnap,
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
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableHandlePanningGesture
        enableContentPanningGesture={currentSnap === 'large'}
        activeOffsetY={[-8, 8]}
        failOffsetX={[-12, 12]}
        handleComponent={renderHandle}
        handleStyle={styles.handle}
        backgroundStyle={styles.background}
        style={styles.sheetContainer}
      >
        <BottomSheetFlatList
          ref={verticalListRef}
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderVerticalItem}
          ItemSeparatorComponent={renderRowSeparator}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderListEmpty}
          contentContainerStyle={listContentContainerStyle}
          scrollEnabled={currentSnap === 'large'}
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={() => undefined}
        />
      </BottomSheet>
    );
  },
);

MapBottomSheet.displayName = 'MapBottomSheet';

export default MapBottomSheet;

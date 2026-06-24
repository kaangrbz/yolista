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
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetHandle,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import {
  computeMapBottomSheetSnapHeights,
  mapSheetSnapHeight,
  type MapBottomSheetSnapHeights,
} from '../../../constants/mapDefaults';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapRouteRow from './MapRouteRow';
import MapBottomSheetHeader from './MapBottomSheetHeader';
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
  onSelectRoute: (route: RouteWithProfile) => void;
  onSnapChange?: (snap: BottomSheetSnap, metrics: MapBottomSheetSnapMetrics) => void;
  /** Sheet tam açıkken handle safe-area üst boşluğu. */
  topInset?: number;
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
  routes: RouteWithProfile[];
  sectionTitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

const MapBottomSheetListHeader: React.FC<MapBottomSheetListHeaderProps> = ({
  routes,
  sectionTitle,
  styles,
}) => {
  if (routes.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{sectionTitle}</Text>
      <Text style={styles.sectionHeaderHint}>{routes.length} rota</Text>
    </View>
  );
};

export const MapBottomSheet = forwardRef<MapBottomSheetHandle, MapBottomSheetProps>(
  (
    {
      routes,
      loading,
      onSelectRoute,
      onSnapChange,
      topInset = 0,
      weatherLatitude,
      weatherLongitude,
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

    const listContentContainerStyle = useMemo(
      () => [
        styles.verticalContent,
        {
          minHeight: routes.length > 0 ? contentMinHeight : undefined,
          paddingBottom: Math.max(insets.bottom, 30),
        },
      ],
      [contentMinHeight, insets.bottom, routes.length, styles.verticalContent],
    );

    const handleTopInset = currentSnap === 'large' ? topInset : 0;

    const sheetHeaderTitle = 'Paylaşılan Rotalar';

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
            hideRouteActions
          />
        </BottomSheetHandle>
      ),
      [
        handleTopInset,
        loading,
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


    const renderVerticalItem = useCallback(
      ({ item }: { item: RouteWithProfile }) => (
        <MapRouteRow
          route={item}
          onPress={() => onSelectRoute(item)}
        />
      ),
      [onSelectRoute],
    );

    const keyExtractor = useCallback(
      (item: RouteWithProfile) => String(item.id),
      [],
    );

    const sectionTitle = 'Tüm rotalar';

    const renderRowSeparator = useCallback(() => <View style={styles.rowDivider} />, [styles.rowDivider]);

    const listHeaderPropsRef = useRef<MapBottomSheetListHeaderProps>({
      routes,
      sectionTitle,
      styles,
    });

    listHeaderPropsRef.current = {
      routes,
      sectionTitle,
      styles,
    };

    const renderListHeader = useCallback(
      () => <MapBottomSheetListHeader {...listHeaderPropsRef.current} />,
      [],
    );

    const listData = routes;

    const renderListEmpty = useCallback(() => {
      if (loading) {
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

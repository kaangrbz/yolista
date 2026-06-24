import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RouteWithProfile } from '../../../model/routes.model';
import type { RouteSegment } from '../../../types/routeSegment.types';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { getRouteDistanceLabel } from '../../../utils/routeDistance';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';
import { buildMapRouteTimeline } from '../../../utils/buildMapRouteTimeline';
import MapHeaderIconButton from './MapHeaderIconButton';
import MapRouteTimelineStopRow from './MapRouteTimelineStopRow';
import MapRouteTimelineLeg from './MapRouteTimelineLeg';
import MapRouteStopImagePreviewModal from './MapRouteStopImagePreviewModal';
import { getMapStopKey } from './MapRouteStopCard';

interface MapRouteTimelinePanelProps {
  stops: RouteWithProfile[];
  stopsLoading: boolean;
  selectedRoute: RouteWithProfile | null;
  activeStopId?: string | null;
  segments: RouteSegment[];
  activeSegmentIndex: number;
  segmentsLoading?: boolean;
  startFromUserLocation?: boolean;
  isRouteSaved?: boolean;
  saveLoading?: boolean;
  onStopPress?: (stop: RouteWithProfile) => void;
  onSegmentPress?: (index: number) => void;
  onOpenRouteInMaps?: () => void;
  onOpenActiveStopInMaps?: () => void;
  onClearSelectedRoute?: () => void;
  onShareRoute?: () => void;
  onSaveRoute?: () => void;
  showDragHandle?: boolean;
  scrollMode?: 'bottomSheet' | 'scroll' | 'embedded';
  /** Bottom sheet tam yükseklikte içeriğin kırpılmaması için. */
  fillAvailableHeight?: boolean;
}

const getRouteTimelineTitle = (
  selectedRoute: RouteWithProfile | null,
  stops: RouteWithProfile[],
): string => {
  const mainStop =
    stops.find((stop) => stop.order_index === 0) ?? stops[0] ?? selectedRoute;

  if (mainStop) {
    const label = getStopPhotoHintLabel(mainStop);

    if (label) {
      return label;
    }
  }

  return selectedRoute?.title?.trim() || 'Rota';
};

const getRouteTimelineMeta = (
  selectedRoute: RouteWithProfile | null,
  stops: RouteWithProfile[],
): string | null => {
  const city = selectedRoute?.cities?.name?.trim();
  const category = selectedRoute?.categories?.name?.trim();
  const left = [city, category].filter(Boolean).join(' • ');

  const rightParts: string[] = [];

  if (stops.length > 0) {
    rightParts.push(`${stops.length} durak`);
  }

  const distanceLabel = getRouteDistanceLabel(stops);

  if (distanceLabel) {
    rightParts.push(distanceLabel);
  }

  const right = rightParts.join(' • ');

  if (left && right) {
    return `${left} | ${right}`;
  }

  return left || right || null;
};

export const MapRouteTimelinePanel: React.FC<MapRouteTimelinePanelProps> = ({
  stops,
  stopsLoading,
  selectedRoute,
  activeStopId = null,
  segments,
  activeSegmentIndex,
  segmentsLoading = false,
  startFromUserLocation = false,
  isRouteSaved = false,
  saveLoading = false,
  onStopPress,
  onSegmentPress,
  onOpenRouteInMaps,
  onOpenActiveStopInMaps,
  onClearSelectedRoute,
  onShareRoute,
  onSaveRoute,
  showDragHandle = true,
  scrollMode = 'bottomSheet',
  fillAvailableHeight = false,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  const stopOffsetsRef = useRef<Record<string, number>>({});
  const [previewStop, setPreviewStop] = useState<RouteWithProfile | null>(null);

  const timelineItems = useMemo(
    () =>
      buildMapRouteTimeline(stops, segments, {
        startFromUserLocation,
      }),
    [segments, startFromUserLocation, stops],
  );

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [stops],
  );

  const stopNumberByKey = useMemo(() => {
    const map = new Map<string, number>();

    sortedStops.forEach((stop, index) => {
      map.set(getMapStopKey(stop), index + 1);
    });

    return map;
  }, [sortedStops]);

  const title = getRouteTimelineTitle(selectedRoute, stops);
  const meta = getRouteTimelineMeta(selectedRoute, stops);
  const usesFlexibleScroll =
    fillAvailableHeight || scrollMode === 'bottomSheet';

  const styles = useThemedStyles((t) => ({
    wrapper: {
      flex: usesFlexibleScroll ? 1 : undefined,
      paddingBottom: usesFlexibleScroll ? 0 : 8,
    },
    dragHandle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
      marginTop: 4,
      marginBottom: 12,
    },
    headerBlock: {
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    titleGroup: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: -0.3,
      lineHeight: 24,
    },
    meta: {
      fontSize: 13,
      color: t.textMuted,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    primaryButton: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: MAP_ACTIVE_ROUTE_BORDER,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    scrollArea: {
      flex: usesFlexibleScroll ? 1 : undefined,
      flexGrow: scrollMode === 'scroll' ? 1 : undefined,
    },
    scrollContent: {
      paddingBottom: Math.max(insets.bottom, 16),
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 28,
    },
    loadingText: {
      fontSize: 13,
      color: t.textSecondary,
    },
    emptyText: {
      fontSize: 13,
      color: t.textMuted,
      textAlign: 'center',
      paddingVertical: 24,
      paddingHorizontal: 24,
    },
  }));

  const scrollToActiveStop = useCallback(() => {
    if (!activeStopId) {
      return;
    }

    const offset = stopOffsetsRef.current[activeStopId];

    if (typeof offset === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, offset - 24), animated: true });
    }
  }, [activeStopId]);

  useEffect(() => {
    scrollToActiveStop();
  }, [scrollToActiveStop]);

  const handleStopLayout = useCallback((stopKey: string, y: number) => {
    stopOffsetsRef.current[stopKey] = y;
  }, []);

  const isLoading = stopsLoading || segmentsLoading;

  let renderedStopCount = 0;
  const totalStops = sortedStops.length;

  const timelineContent =
    isLoading && stops.length === 0 ? (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
        <Text style={styles.loadingText}>Duraklar yükleniyor…</Text>
      </View>
    ) : timelineItems.length === 0 ? (
      <Text style={styles.emptyText}>Bu rotada görüntülenecek durak yok.</Text>
    ) : (
      timelineItems.map((item, index) => {
        if (item.type === 'leg') {
          return (
            <MapRouteTimelineLeg
              key={`leg-${item.segment.id}-${index}`}
              segment={item.segment}
              segmentIndex={item.segmentIndex}
              activeSegmentIndex={activeSegmentIndex}
              onSegmentPress={onSegmentPress}
              onOpenDirections={
                onOpenActiveStopInMaps
                  ? () => {
                      onSegmentPress?.(item.segmentIndex);
                      onOpenActiveStopInMaps();
                    }
                  : undefined
              }
            />
          );
        }

        renderedStopCount += 1;
        const stopKey = getMapStopKey(item.stop);
        const stopNumber = stopNumberByKey.get(stopKey) ?? renderedStopCount;
        const isLastStop = renderedStopCount >= totalStops;

        return (
          <View
            key={`stop-${stopKey}-${index}`}
            onLayout={(event) => {
              handleStopLayout(stopKey, event.nativeEvent.layout.y);
            }}
          >
            <MapRouteTimelineStopRow
              stop={item.stop}
              stopNumber={stopNumber}
              selected={activeStopId === stopKey}
              showConnectorBelow={!isLastStop}
              onPress={onStopPress ? () => onStopPress(item.stop) : undefined}
              onImagePress={() => setPreviewStop(item.stop)}
            />
          </View>
        );
      })
    );

  const ScrollContainer: React.ComponentType<any> =
    scrollMode === 'scroll'
      ? ScrollView
      : scrollMode === 'embedded'
        ? View
        : BottomSheetScrollView;

  return (
    <View style={styles.wrapper}>
      {showDragHandle ? <View style={styles.dragHandle} /> : null}

      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {meta ? (
              <Text style={styles.meta} numberOfLines={2}>
                {meta}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            {onShareRoute ? (
              <MapHeaderIconButton
                iconName="share-variant"
                onPress={onShareRoute}
                accessibilityLabel="Rotayı paylaş"
              />
            ) : null}
            {onSaveRoute ? (
              <MapHeaderIconButton
                iconName={isRouteSaved ? 'bookmark' : 'bookmark-outline'}
                onPress={onSaveRoute}
                accessibilityLabel="Rotayı kaydet"
                loading={saveLoading}
                active={isRouteSaved}
              />
            ) : null}
            {onClearSelectedRoute ? (
              <MapHeaderIconButton
                iconName="close"
                onPress={onClearSelectedRoute}
                accessibilityLabel="Rota seçimini kapat"
              />
            ) : null}
          </View>
        </View>

        {onOpenRouteInMaps ? (
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.88}
            onPress={onOpenRouteInMaps}
            accessibilityRole="button"
            accessibilityLabel="Konumundan rotayı başlat"
          >
            <Icon name="rocket-launch-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Konumundan Rotayı Başlat</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollContainer
        {...(scrollMode === 'embedded'
          ? {}
          : {
              ref: scrollRef,
              nestedScrollEnabled: scrollMode === 'bottomSheet',
              keyboardShouldPersistTaps: 'handled' as const,
              showsVerticalScrollIndicator: scrollMode === 'scroll',
            })}
        style={styles.scrollArea}
        contentContainerStyle={
          scrollMode === 'embedded' ? undefined : styles.scrollContent
        }
      >
        {timelineContent}
      </ScrollContainer>

      <MapRouteStopImagePreviewModal
        stop={previewStop}
        visible={previewStop !== null}
        onClose={() => setPreviewStop(null)}
      />
    </View>
  );
};

export default MapRouteTimelinePanel;

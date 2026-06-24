import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LatLng } from 'react-native-maps';
import type { RouteWithProfile } from '../../model/routes.model';
import { useRouteDetailStops } from '../../hooks/useRouteDetailStops';
import { useRouteSegments } from '../../hooks/useRouteSegments';
import { requestLocation } from '../../permissions';
import { getLastKnownLocationSync } from '../../services/lastKnownLocationStorage';
import { openStopInMaps } from '../../utils/openInMaps';
import { showToast } from '../../utils/alert';
import { prefetchMapPreviewImages } from '../../utils/mapPreviewImageCache';
import { getMapStopKey } from '../explore/map/MapRouteStopCard';
import MapRouteTimelinePanel from '../explore/map/MapRouteTimelinePanel';
import { useThemedStyles } from '../../theme/useThemedStyles';

const DEFAULT_SHEET_OPEN_SNAP_INDEX = 1;
const SHEET_SNAP_POINTS = ['30%', '58%', '100%'] as const;

interface PostRoutePreviewSheetProps {
  visible: boolean;
  routeId: string;
  userId: string | null;
  initialRoute?: RouteWithProfile | null;
  isRouteSaved?: boolean;
  saveLoading?: boolean;
  onClose: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

const mergeRouteMeta = (
  stops: RouteWithProfile[],
  initialRoute?: RouteWithProfile | null,
): RouteWithProfile | null => {
  const fromStops =
    stops.find((stop) => stop.order_index === 0) ?? stops[0] ?? null;

  if (fromStops) {
    return {
      ...fromStops,
      cities: fromStops.cities ?? initialRoute?.cities,
      categories: fromStops.categories ?? initialRoute?.categories,
      profiles: fromStops.profiles ?? initialRoute?.profiles,
      title: fromStops.title?.trim() ? fromStops.title : initialRoute?.title ?? '',
    };
  }

  return initialRoute ?? null;
};

export const PostRoutePreviewSheet: React.FC<PostRoutePreviewSheetProps> = ({
  visible,
  routeId,
  userId,
  initialRoute = null,
  isRouteSaved = false,
  saveLoading = false,
  onClose,
  onShare,
  onSave,
  onLoadingChange,
}) => {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [startFromUserLocation, setStartFromUserLocation] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(
    () => getLastKnownLocationSync(),
  );

  const styles = useThemedStyles((t) => ({
    background: {
      backgroundColor: t.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    indicator: {
      backgroundColor: t.borderStrong,
      width: 42,
      height: 4,
      borderRadius: 2,
    },
    sheetContent: {
      flex: 1,
    },
  }));

  const { stops, loading: stopsLoading } = useRouteDetailStops(
    visible ? routeId : '',
    userId,
  );

  const selectedRoute = useMemo(
    () => mergeRouteMeta(stops, initialRoute),
    [initialRoute, stops],
  );

  const { segments, loading: segmentsLoading } = useRouteSegments({
    stops,
    enabled: visible && stops.length > 0,
    userLocation: userCoordinate,
    startFromUser: startFromUserLocation,
    routeId,
  });

  const snapPoints = useMemo(() => [...SHEET_SNAP_POINTS], []);

  const firstStopCoordinate = useMemo((): LatLng | null => {
    const sorted = [...stops].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
    );
    const firstStop = sorted.find(
      (stop) =>
        typeof stop.latitude === 'number' && typeof stop.longitude === 'number',
    );

    if (!firstStop) {
      return null;
    }

    return {
      latitude: firstStop.latitude as number,
      longitude: firstStop.longitude as number,
    };
  }, [stops]);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();

      return;
    }

    sheetRef.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setActiveStopId(null);
      setActiveSegmentIndex(0);
      setStartFromUserLocation(false);
      onLoadingChange?.(false);
      return;
    }

    if (stops.length > 0) {
      prefetchMapPreviewImages(stops);
    }
  }, [onLoadingChange, stops, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    onLoadingChange?.(stopsLoading);
  }, [onLoadingChange, stopsLoading, visible]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const syncActiveStopFromSegment = useCallback(
    (segmentIndex: number) => {
      const segment = segments[segmentIndex];

      if (!segment) {
        return;
      }

      const targetStop = segment.targetStopId
        ? stops.find(
            (stop) => stop.id && String(stop.id) === segment.targetStopId,
          )
        : stops.find(
            (stop) => stop.order_index === segment.targetStopOrderIndex,
          );

      if (targetStop) {
        setActiveStopId(getMapStopKey(targetStop));
      }
    },
    [segments, stops],
  );

  const handleStopPress = useCallback((stop: RouteWithProfile) => {
    setActiveStopId(getMapStopKey(stop));
  }, []);

  const handleSegmentPress = useCallback(
    (index: number) => {
      setActiveSegmentIndex(index);
      syncActiveStopFromSegment(index);
    },
    [syncActiveStopFromSegment],
  );

  const handleOpenActiveStopInMaps = useCallback(() => {
    const segment = segments[activeSegmentIndex];

    if (!segment) {
      return;
    }

    void openStopInMaps(segment.to, { from: segment.from });
  }, [activeSegmentIndex, segments]);

  const ensureUserLocation = useCallback(async (): Promise<LatLng | null> => {
    const cached = userCoordinate ?? getLastKnownLocationSync();

    if (cached) {
      setUserCoordinate(cached);
      return cached;
    }

    const granted = await requestLocation();

    if (!granted) {
      showToast('error', 'Konum izni gerekli');
      return null;
    }

    const next = getLastKnownLocationSync();

    if (next) {
      setUserCoordinate(next);
    }

    return next;
  }, [userCoordinate]);

  const handleOpenRouteInMaps = useCallback(async () => {
    if (!firstStopCoordinate) {
      showToast('error', 'Rotanın başlangıç durağında konum yok');
      return;
    }

    const coordinate = userCoordinate ?? (await ensureUserLocation());

    if (!coordinate) {
      return;
    }

    setStartFromUserLocation(true);
    setActiveSegmentIndex(0);

    const approachSegment = segments.find(
      (segment) => segment.variant === 'approach',
    );

    if (approachSegment) {
      void openStopInMaps(approachSegment.to, { from: approachSegment.from });
      return;
    }

    void openStopInMaps(firstStopCoordinate, { from: coordinate });
  }, [
    ensureUserLocation,
    firstStopCoordinate,
    segments,
    userCoordinate,
  ]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={DEFAULT_SHEET_OPEN_SNAP_INDEX}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      topInset={insets.top}
      bottomInset={insets.bottom}
    >
      <BottomSheetView style={styles.sheetContent}>
        <MapRouteTimelinePanel
        stops={stops}
        stopsLoading={stopsLoading}
        selectedRoute={selectedRoute}
        activeStopId={activeStopId}
        segments={segments}
        activeSegmentIndex={activeSegmentIndex}
        segmentsLoading={segmentsLoading}
        startFromUserLocation={startFromUserLocation}
        isRouteSaved={isRouteSaved}
        saveLoading={saveLoading}
        onStopPress={handleStopPress}
        onSegmentPress={handleSegmentPress}
        onOpenRouteInMaps={handleOpenRouteInMaps}
        onOpenActiveStopInMaps={handleOpenActiveStopInMaps}
        onClearSelectedRoute={handleDismiss}
        onShareRoute={onShare}
        onSaveRoute={onSave}
        showDragHandle={false}
        fillAvailableHeight
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default PostRoutePreviewSheet;

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetHandle, BottomSheetView } from '@gorhom/bottom-sheet';
import type { RouteWithProfile } from '../../../model/routes.model';
import {
  computeMapBottomSheetSnapHeights,
  mapSheetSnapHeight,
  type MapBottomSheetSnapHeights,
} from '../../../constants/mapDefaults';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapRouteTimelinePanel from './MapRouteTimelinePanel';
import type { RouteSegment } from '../../../types/routeSegment.types';
import type {
  BottomSheetSnap,
  MapBottomSheetSnapMetrics,
} from './MapBottomSheet';

export interface MapRoutePreviewSheetHandle {
  snapTo: (snap: BottomSheetSnap) => void;
}

interface MapRoutePreviewSheetProps {
  selectedRoute: RouteWithProfile | null;
  selectedRouteStops: RouteWithProfile[];
  stopsLoading: boolean;
  activeStopId?: string | null;
  routeSegments?: RouteSegment[];
  activeSegmentIndex?: number;
  segmentsLoading?: boolean;
  startFromUserLocation?: boolean;
  isRouteSaved?: boolean;
  saveLoading?: boolean;
  onStopPress?: (stop: RouteWithProfile) => void;
  onSegmentPress?: (index: number) => void;
  onOpenRouteInMaps?: () => void;
  onOpenActiveStopInMaps?: () => void;
  onShareRoute?: () => void;
  onSaveRoute?: () => void;
  onClose: () => void;
  onSnapChange?: (snap: BottomSheetSnap, metrics: MapBottomSheetSnapMetrics) => void;
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

export const MapRoutePreviewSheet = forwardRef<
  MapRoutePreviewSheetHandle,
  MapRoutePreviewSheetProps
>(
  (
    {
      selectedRoute,
      selectedRouteStops,
      stopsLoading,
      activeStopId = null,
      routeSegments = [],
      activeSegmentIndex = 0,
      segmentsLoading = false,
      startFromUserLocation = false,
      isRouteSaved = false,
      saveLoading = false,
      onStopPress,
      onSegmentPress,
      onOpenRouteInMaps,
      onOpenActiveStopInMaps,
      onShareRoute,
      onSaveRoute,
      onClose,
      onSnapChange,
    },
    ref,
  ) => {
    const styles = useThemedStyles((t) => ({
      background: {
        backgroundColor: t.background,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
        elevation: 28,
      },
      sheetContainer: {
        zIndex: 50,
        elevation: 50,
      },
      sheetContent: {
        flex: 1,
      },
      handle: {
        paddingTop: 0,
        paddingBottom: 0,
      },
      indicator: {
        backgroundColor: t.borderStrong,
        width: 42,
        height: 4,
        borderRadius: 2,
      },
    }));

    const { height: windowHeight } = useWindowDimensions();
    const sheetRef = useRef<BottomSheet>(null);
    const [currentSnap, setCurrentSnap] = useState<BottomSheetSnap>('medium');

    const snapHeights = useMemo(
      () => computeMapBottomSheetSnapHeights(windowHeight, 0),
      [windowHeight],
    );

    const snapPoints = useMemo(
      () => [snapHeights.closed, snapHeights.medium, snapHeights.full],
      [snapHeights],
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
      }),
      [],
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

    const renderHandle = useCallback(
      (props: React.ComponentProps<typeof BottomSheetHandle>) => (
        <BottomSheetHandle
          {...props}
          indicatorStyle={styles.indicator}
          style={styles.handle}
          accessibilityLabel="Rota önizlemesi, yukarı veya aşağı sürükleyin"
        />
      ),
      [styles.handle, styles.indicator],
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableHandlePanningGesture
        enableContentPanningGesture={currentSnap === 'large'}
        activeOffsetY={[-8, 8]}
        failOffsetX={[-12, 12]}
        handleComponent={renderHandle}
        backgroundStyle={styles.background}
        style={styles.sheetContainer}
      >
        <BottomSheetView style={styles.sheetContent}>
          <MapRouteTimelinePanel
            stops={selectedRouteStops}
            stopsLoading={stopsLoading}
            selectedRoute={selectedRoute}
            activeStopId={activeStopId}
            segments={routeSegments}
            activeSegmentIndex={activeSegmentIndex}
            segmentsLoading={segmentsLoading}
            startFromUserLocation={startFromUserLocation}
            isRouteSaved={isRouteSaved}
            saveLoading={saveLoading}
            onStopPress={onStopPress}
            onSegmentPress={onSegmentPress}
            onOpenRouteInMaps={onOpenRouteInMaps}
            onOpenActiveStopInMaps={onOpenActiveStopInMaps}
            onClearSelectedRoute={onClose}
            onShareRoute={onShareRoute}
            onSaveRoute={onSaveRoute}
            showDragHandle={false}
            fillAvailableHeight
          />
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

MapRoutePreviewSheet.displayName = 'MapRoutePreviewSheet';

export default MapRoutePreviewSheet;

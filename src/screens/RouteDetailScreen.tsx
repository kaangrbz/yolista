import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import RouteDetailLayout from '../components/routeDetail/RouteDetailLayout';
import RouteDetailMapModal from '../components/routeDetail/RouteDetailMapModal';
import UserLocationProbe from '../components/common/UserLocationProbe';
import type { RouteDetailHeroMode } from '../components/routeDetail/RouteDetailHeroToggle';
import { trackRouteDetailEvent } from '../analytics/routeDetailAnalytics';
import { useRouteDetailStops } from '../hooks/useRouteDetailStops';
import { useRouteSegments } from '../hooks/useRouteSegments';
import { useNestedScrollDragLock } from '../hooks/useNestedScrollDragLock';
import { useThemedStyles } from '../theme/useThemedStyles';
import { requestLocation } from '../permissions';
import { showToast } from '../utils/alert';
import { extractValidCoordinates } from '../utils/routeDistance';
import {
  openRouteInMaps,
  openStopInMaps,
  resolveTravelModeForDistanceKm,
} from '../utils/openInMaps';
import { totalRouteDistanceKmFromPoints } from '../utils/routeDistance';
import { findSegmentIndexForStop } from '../utils/routeMapFit';
import {
  estimateOrderSavingsPercent,
  getNavigationStopCoordinates,
  optimizeStopsForShortestPath,
} from '../utils/routeOrderOptimization';
import {
  hasRouteDirections,
  type RouteSheetTab,
} from '../types/routeSegment.types';
import type { RouteDetailParams } from '../types/routeDetailNavigation.types';
import type { LatLng } from '../utils/routeDistance';

const FLOATING_CTA_SCROLL_PADDING = 96;

type RouteDetailScreenProps = NativeStackScreenProps<
  { RouteDetail: RouteDetailParams },
  'RouteDetail'
>;

const clampIndex = (index: number | undefined, length: number): number => {
  if (length <= 0) {
    return 0;
  }

  const safe = typeof index === 'number' && Number.isFinite(index) ? index : 0;

  return Math.min(Math.max(0, safe), length - 1);
};

export const RouteDetailScreen: React.FC<RouteDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const params = route.params;
  const routeId = params.routeId;

  const [userId, setUserId] = useState<string | null>(null);
  const [routeDetailTab, setRouteDetailTab] = useState<RouteSheetTab>(
    params.initialTab ?? 'stops',
  );
  const [heroMode, setHeroMode] = useState<RouteDetailHeroMode>(
    params.initialTab === 'directions' ? 'map' : 'photos',
  );
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(
    params.initialStopIndex ?? 0,
  );
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(
    params.initialSegmentIndex ?? 0,
  );
  const [startFromUserLocation, setStartFromUserLocation] = useState(
    Boolean(params.startFromUserLocation),
  );
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(null);
  const [locationProbeEnabled, setLocationProbeEnabled] = useState(
    Boolean(params.startFromUserLocation),
  );
  const [optimizeRouteOrder, setOptimizeRouteOrder] = useState(false);

  const { stops, loading: stopsLoading } = useRouteDetailStops(routeId, userId);
  const { scrollEnabled, setDragInteractionActive } = useNestedScrollDragLock({
    reenableDelayMs: 800,
  });

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    scrollContentWithFloatingCta: {
      paddingBottom: FLOATING_CTA_SCROLL_PADDING,
    },
  }));

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    void fetchUserId();
  }, []);

  useEffect(() => {
    setRouteDetailTab(params.initialTab ?? 'stops');
    setActiveStopIndex(params.initialStopIndex ?? 0);
    setActiveSegmentIndex(params.initialSegmentIndex ?? 0);
    setStartFromUserLocation(Boolean(params.startFromUserLocation));
    setLocationProbeEnabled(Boolean(params.startFromUserLocation));
    setHeroMode(params.initialTab === 'directions' ? 'map' : 'photos');
  }, [
    params.initialSegmentIndex,
    params.initialStopIndex,
    params.initialTab,
    params.startFromUserLocation,
    routeId,
  ]);

  useEffect(() => {
    if (stops.length === 0) {
      return;
    }

    if (activeStopIndex >= stops.length) {
      setActiveStopIndex(stops.length - 1);
    }
  }, [activeStopIndex, stops.length]);

  const firstStopCoordinate = useMemo(() => {
    const first = stops.find(
      (stop) =>
        typeof stop.latitude === 'number' &&
        typeof stop.longitude === 'number',
    );

    if (!first) {
      return null;
    }

    return {
      latitude: first.latitude as number,
      longitude: first.longitude as number,
    };
  }, [stops]);

  const canStartFromUserLocation = firstStopCoordinate !== null;

  const headerTitle = useMemo(() => {
    const cityName = stops[0]?.cities?.name?.trim();
    const stopCount = stops.length;

    if (cityName && stopCount > 0) {
      return `${cityName} · ${stopCount} durak`;
    }

    if (cityName) {
      return cityName;
    }

    if (stopCount > 0) {
      return `${stopCount} durak`;
    }

    return 'Rota Detayı';
  }, [stops]);

  const routeCoords = useMemo(
    () =>
      extractValidCoordinates(
        stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      ),
    [stops],
  );

  const directionsAvailable = useMemo(() => hasRouteDirections(stops), [stops]);

  const { segments, loading: segmentsLoading, hasEstimatedSegments } =
    useRouteSegments({
      stops,
      enabled: stops.length > 0,
      userLocation: userCoordinate,
      startFromUser: startFromUserLocation,
      routeId,
      optimizeOrder: optimizeRouteOrder,
    });

  const showFloatingDirectionsCta =
    routeDetailTab === 'directions' &&
    segments.length > 0 &&
    routeCoords.length > 0;

  const syncStopFromSegment = useCallback(
    (segmentIndex: number) => {
      const segment = segments[segmentIndex];

      if (!segment) {
        return;
      }

      if (segment.targetStopId) {
        const targetIndex = stops.findIndex(
          (stop) => stop.id && String(stop.id) === segment.targetStopId,
        );

        if (targetIndex >= 0) {
          setActiveStopIndex(targetIndex);
          return;
        }
      }

      const targetIndex = stops.findIndex(
        (stop) => stop.order_index === segment.targetStopOrderIndex,
      );

      if (targetIndex >= 0) {
        setActiveStopIndex(targetIndex);
      }
    },
    [segments, stops],
  );

  useEffect(() => {
    if (segments.length === 0) {
      return;
    }

    setActiveSegmentIndex((previous) => {
      if (params.initialSegmentIndex !== undefined) {
        return clampIndex(params.initialSegmentIndex, segments.length);
      }

      return clampIndex(previous, segments.length);
    });
  }, [params.initialSegmentIndex, segments.length]);

  useEffect(() => {
    if (
      routeDetailTab !== 'directions' ||
      segments.length === 0 ||
      params.initialSegmentIndex === undefined
    ) {
      return;
    }

    syncStopFromSegment(
      clampIndex(params.initialSegmentIndex, segments.length),
    );
  }, [
    params.initialSegmentIndex,
    routeDetailTab,
    segments.length,
    syncStopFromSegment,
  ]);

  useEffect(() => {
    if (routeDetailTab === 'directions' && !directionsAvailable) {
      setRouteDetailTab('stops');
    }
  }, [directionsAvailable, routeDetailTab]);

  const handleTabChange = useCallback(
    (tab: RouteSheetTab) => {
      if (tab === 'directions' && !directionsAvailable) {
        return;
      }

      setRouteDetailTab(tab);

      trackRouteDetailEvent({
        name: 'route_detail_tab_change',
        routeId,
        tab,
        surface: 'detail',
      });

      if (tab === 'directions') {
        setHeroMode('map');
      }
    },
    [directionsAvailable, routeId],
  );

  const handleSegmentPress = useCallback(
    (index: number) => {
      setActiveSegmentIndex(index);
      syncStopFromSegment(index);
    },
    [syncStopFromSegment],
  );

  const handleActiveStopIndexChange = useCallback(
    (index: number) => {
      setActiveStopIndex(index);

      if (routeDetailTab !== 'directions' || segments.length === 0) {
        return;
      }

      setActiveSegmentIndex(findSegmentIndexForStop(stops, segments, index));
    },
    [routeDetailTab, segments, stops],
  );

  const handleStartFromUserLocationChange = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setStartFromUserLocation(false);
        setLocationProbeEnabled(false);
        return;
      }

      const granted = await requestLocation();

      if (!granted) {
        showToast('error', 'Konum izni gerekli');
        return;
      }

      setStartFromUserLocation(true);
      setActiveSegmentIndex(0);
      setLocationProbeEnabled(true);
    },
    [],
  );

  const handleUserCoordinate = useCallback((coordinate: LatLng) => {
    setUserCoordinate(coordinate);
    setLocationProbeEnabled(false);
  }, []);

  const navigationCoords = useMemo(
    () => getNavigationStopCoordinates(stops, optimizeRouteOrder),
    [optimizeRouteOrder, stops],
  );

  const optimizeSavingsPercent = useMemo(
    () => estimateOrderSavingsPercent(stops, optimizeStopsForShortestPath(stops)),
    [stops],
  );

  const handleOpenRouteInMaps = useCallback(() => {
    if (navigationCoords.length === 0) {
      return;
    }

    trackRouteDetailEvent({
      name: 'route_detail_maps_cta',
      routeId,
      scope: 'full_route',
      travelMode: resolveTravelModeForDistanceKm(
        totalRouteDistanceKmFromPoints(navigationCoords),
      ),
      surface: 'detail',
    });

    void openRouteInMaps(navigationCoords, {
      optimizeWaypoints: optimizeRouteOrder,
    });
  }, [navigationCoords, optimizeRouteOrder, routeId]);

  const handleOpenActiveStopInMaps = useCallback(() => {
    const segment = segments[activeSegmentIndex];

    if (!segment) {
      return;
    }

    void openStopInMaps(segment.to, { from: segment.from });
  }, [activeSegmentIndex, segments]);

  const handleExpandMap = useCallback(() => {
    trackRouteDetailEvent({
      name: 'route_detail_map_expand',
      routeId,
      source: 'stops_panel',
    });
    setMapModalVisible(true);
  }, [routeId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <UserLocationProbe
        enabled={locationProbeEnabled}
        onCoordinate={handleUserCoordinate}
      />

      <RouteDetailLayout
        navigation={navigation}
        headerTitle={headerTitle}
        routeId={routeId}
        userId={userId}
        stops={stops}
        stopsLoading={stopsLoading}
        heroMode={heroMode}
        onHeroModeChange={setHeroMode}
        activeStopIndex={activeStopIndex}
        onActiveStopIndexChange={handleActiveStopIndexChange}
        routeDetailTab={routeDetailTab}
        onTabChange={handleTabChange}
        segments={segments}
        segmentsLoading={segmentsLoading}
        activeSegmentIndex={activeSegmentIndex}
        onSegmentPress={handleSegmentPress}
        startFromUserLocation={startFromUserLocation}
        canStartFromUserLocation={canStartFromUserLocation}
        onStartFromUserLocationChange={handleStartFromUserLocationChange}
        useFloatingPrimaryCta={showFloatingDirectionsCta}
        onNestedScrollLockChange={setDragInteractionActive}
        onExpandMap={handleExpandMap}
        hasEstimatedSegments={hasEstimatedSegments}
        optimizeRouteOrder={optimizeRouteOrder}
        onOptimizeRouteOrderChange={setOptimizeRouteOrder}
        optimizeSavingsPercent={optimizeSavingsPercent}
        scrollEnabled={scrollEnabled}
        onOpenRouteInMaps={handleOpenRouteInMaps}
        onOpenActiveStopInMaps={handleOpenActiveStopInMaps}
        scrollContentStyle={
          showFloatingDirectionsCta ? styles.scrollContentWithFloatingCta : undefined
        }
      />

      <RouteDetailMapModal
        visible={mapModalVisible}
        stops={stops}
        activeStopIndex={activeStopIndex}
        onClose={() => setMapModalVisible(false)}
        onStopPress={setActiveStopIndex}
      />
    </SafeAreaView>
  );
};

export default RouteDetailScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RouteDetailHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';
import ThemedScrollView from '../components/common/ThemedScrollView';
import RouteDetailTabs from '../components/routeDetail/RouteDetailTabs';
import RouteDetailExperienceSection from '../components/routeDetail/RouteDetailExperienceSection';
import RouteStopsTabPanel from '../components/routeDetail/RouteStopsTabPanel';
import RouteDirectionsTabPanel from '../components/routeDetail/RouteDirectionsTabPanel';
import UserLocationProbe from '../components/common/UserLocationProbe';
import { useRouteDetailStops } from '../hooks/useRouteDetailStops';
import { useRouteSegments } from '../hooks/useRouteSegments';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useAppTheme } from '../context/AppThemeContext';
import { requestLocation } from '../permissions';
import { showToast } from '../utils/alert';
import type { RouteSheetTab } from '../types/routeSegment.types';
import type { RouteDetailParams } from '../types/routeDetailNavigation.types';
import type { LatLng } from '../utils/routeDistance';

const ROUTE_DETAIL_HEADER_HEIGHT = 52;

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

  const theme = useAppTheme();
  const { stops, loading: stopsLoading } = useRouteDetailStops(routeId, userId);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    tabLoading: {
      paddingVertical: 24,
      alignItems: 'center',
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
  }, [
    params.initialSegmentIndex,
    params.initialStopIndex,
    params.initialTab,
    params.startFromUserLocation,
    routeId,
  ]);

  useEffect(() => {
    if (activeStopIndex >= stops.length && stops.length > 0) {
      setActiveStopIndex(0);
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

  const { segments, loading: segmentsLoading } = useRouteSegments({
    stops,
    enabled: stops.length > 0,
    userLocation: userCoordinate,
    startFromUser: startFromUserLocation,
  });

  const syncStopFromSegment = useCallback(
    (segmentIndex: number) => {
      const segment = segments[segmentIndex];

      if (!segment) {
        return;
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

  const handleSegmentPress = useCallback(
    (index: number) => {
      setActiveSegmentIndex(index);
      syncStopFromSegment(index);
    },
    [syncStopFromSegment],
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

  const detailBelowCarouselSlot =
    stopsLoading ? (
      <View style={styles.tabLoading}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    ) : (
      <RouteDetailExperienceSection>
        <RouteDetailTabs
          activeTab={routeDetailTab}
          onTabChange={setRouteDetailTab}
        />

        {routeDetailTab === 'stops' ? (
          <RouteStopsTabPanel
            stops={stops}
            activeStopIndex={activeStopIndex}
            onStopPress={setActiveStopIndex}
          />
        ) : (
          <RouteDirectionsTabPanel
            stops={stops}
            segments={segments}
            activeSegmentIndex={activeSegmentIndex}
            loading={segmentsLoading}
            startFromUserLocation={startFromUserLocation}
            canStartFromUserLocation={canStartFromUserLocation}
            onSegmentPress={handleSegmentPress}
            onStartFromUserLocationChange={handleStartFromUserLocationChange}
          />
        )}
      </RouteDetailExperienceSection>
    );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <RouteDetailHeader navigation={navigation} />
      <UserLocationProbe
        enabled={locationProbeEnabled}
        onCoordinate={handleUserCoordinate}
      />

      <ThemedScrollView
        reservedTop={ROUTE_DETAIL_HEADER_HEIGHT}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
      >
        <UniversalPost
          postId={routeId}
          userId={userId}
          showFullScreen={false}
          detailBelowCarouselSlot={detailBelowCarouselSlot}
          activeSlideIndex={activeStopIndex}
          onActiveSlideIndexChange={setActiveStopIndex}
        />
      </ThemedScrollView>
    </SafeAreaView>
  );
};

export default RouteDetailScreen;

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RouteDetailHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';
import ThemedScrollView from '../components/common/ThemedScrollView';
import RouteSplitView from '../components/routeDetail/RouteSplitView';
import { useRouteDetailStops } from '../hooks/useRouteDetailStops';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useAppTheme } from '../context/AppThemeContext';

const ROUTE_DETAIL_HEADER_HEIGHT = 52;

export const RouteDetailScreen = ({
  navigation,
  route,
}: {
  navigation: any;
  route: { params: { routeId: string } };
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const routeId = route.params.routeId;
  const theme = useAppTheme();
  const { stops, loading: stopsLoading } = useRouteDetailStops(routeId, userId);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    stopsLoading: {
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
    if (activeStopIndex >= stops.length) {
      setActiveStopIndex(0);
    }
  }, [activeStopIndex, stops.length]);

  const detailExperienceSlot =
    stopsLoading ? (
      <View style={styles.stopsLoading}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    ) : stops.length > 0 ? (
      <RouteSplitView
        stops={stops}
        activeStopIndex={activeStopIndex}
        onStopPress={setActiveStopIndex}
      />
    ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <RouteDetailHeader navigation={navigation} />

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
          detailExperienceSlot={detailExperienceSlot}
          activeSlideIndex={activeStopIndex}
          onActiveSlideIndexChange={setActiveStopIndex}
        />
      </ThemedScrollView>
    </SafeAreaView>
  );
};

export default RouteDetailScreen;

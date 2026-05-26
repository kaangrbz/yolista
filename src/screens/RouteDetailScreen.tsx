import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RouteDetailHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';
import ThemedScrollView from '../components/common/ThemedScrollView';
import { useThemedStyles } from '../theme/useThemedStyles';

const ROUTE_DETAIL_HEADER_HEIGHT = 52;

export const RouteDetailScreen = ({ navigation, route }: { navigation: any, route: { params: { routeId: string } } }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const routeId = route.params.routeId;
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
  }));

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUserId();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <RouteDetailHeader navigation={navigation} />

      <ThemedScrollView
        reservedTop={ROUTE_DETAIL_HEADER_HEIGHT}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <UniversalPost
          postId={routeId}
          userId={userId}
          showFullScreen={true}
        />
      </ThemedScrollView>
    </SafeAreaView>
  );
};

export default RouteDetailScreen;

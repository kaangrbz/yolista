import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import RouteModel from '../model/routes.model';
import { getRandomNumber } from '../utils/math';
import { RouteWithProfile } from '../model/routes.model';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { RouteDetailHeader } from '../components/header/Header';
import RouteList from '../components/route/RouteList';

export const RouteDetailScreen = ({ navigation, route }: { navigation: any, route: { params: { routeId: string } } }) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isRouteDeleted, setIsRouteDeleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const routeId = route.params.routeId;

  // Fetch current user ID
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

  const loadRoute = async () => {
    try {
      // Pass userId to getRoutesById to enable did_like functionality
      let routes = await RouteModel.getRoutesById(routeId, userId || undefined)
      if (routes && routes.length > 0 && routes[0].is_deleted) {
        setIsRouteDeleted(true);
        return;
      }
      setTimeout(() => {
        setRoutes(routes);

        setIsPageLoading(false)
      }, getRandomNumber(200, 500));

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {

    loadRoute();
  }, [routeId, userId]); // Re-fetch when userId changes

  const handleLike = async (entityId: string, isLiked: boolean) => {
    if (!userId) {
      // Handle unauthenticated user - maybe show login prompt
      console.log('User must be logged in to like routes');
      return;
    }

    try {
      if (isLiked) {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: userId,
            entity_id: entityId,
            entity_type: 'route'
          });

        if (error) throw error;
      } else {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({
            user_id: userId,
            entity_id: entityId,
            entity_type: 'route'
          });

        if (error) throw error;
      }

      // No need to refresh the entire route data - the UI is already updated optimistically
    } catch (error) {
      console.error('Error toggling like:', error);
      // You might want to revert the optimistic update here
    }
  };

  const handleSave = (routeId: string) => {
    // TODO: Implement save functionality
    console.log('Save route:', routeId);
  };

  const handleShare = (routeId: string) => {
    // TODO: Implement share functionality
    console.log('Share route:', routeId);
  };

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadRoute();
      setRefreshing(false);
    } catch (error) {
      console.error('Error refreshing route:', error);
      showToast('error', 'Rota yenilenirken bir hata oluştu');
      setRefreshing(false);
    }
  }, [routeId]);

  const handleRoutePress = useCallback((routeId: string) => {
    // We're already on the detail screen, no need to navigate
    console.log('Route pressed:', routeId);
  }, []);

  const handleToggleDescription = useCallback((routeId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  }, []);

  if (isRouteDeleted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Bu rota silinmiş veya artık mevcut değil.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {isPageLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='small' />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <RouteDetailHeader
            navigation={navigation}
          />

          <RouteList
            routes={routes}
            loading={isPageLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onRoutePress={(routeId) => handleRoutePress(routeId)}
            expandedDescriptions={expandedDescriptions}
            onToggleDescription={(routeId) => handleToggleDescription(routeId)}
            userId={userId}
            onRefreshRoutes={loadRoute}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
    paddingLeft: 8, // Add some left padding for the connecting line
  },
  // routeCard styles are now in the RouteCard component
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  authorUsername: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    paddingHorizontal: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  routesContainer: {
    marginTop: 20,
  },
  routeCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeImage: {
    width: '100%',
    height: 200,
    borderRadius: 0,
  },
  routeContent: {
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  routeNote: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
});

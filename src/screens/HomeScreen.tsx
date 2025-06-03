import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RouteWithProfile } from '../model/routes.model';
import { CityState, useCityStore } from '../store/cityStore';
import GlobalFloatingAction from '../components/common/GlobalFloatingAction';
import { navigate, PageName } from '../types/navigation';
import { checkFirstTime } from '../utils/welcome';
import { supabase } from '../lib/supabase';
import { HomeHeader } from '../components/header/Header';
import RouteList from '../components/route/RouteList';
import RouteModel from '../model/routes.model';
import {useRoute} from '@react-navigation/native';


export const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation();
  const selectedCityId = useCityStore((state: CityState) => state.selectedCityId);
  const route = useRoute();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();

    checkFirstTime();
    fetchRoutes();
  }, []);

  // Only fetch routes when selectedCityId changes
  useEffect(() => {
    if (selectedCityId) {
      fetchRoutes();
    }
  }, [selectedCityId]);

  function shuffleArray(array: RouteWithProfile[]) {
    for (let i = array.length - 1; i > 0; i--) {
      // Pick a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements at i and j
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  

  const fetchRoutes = async () => {
    try {
      // Use selectedCityId from component scope
      const cityId = selectedCityId || 0;
      setIsLoading(true);

      // if (!cityId) {
      //   // Clear routes or show a message if no city is selected
      //   setRoutes([]);
      //   // Optional: Show a less intrusive message than Alert
      //   console.log('No city selected, clearing routes.');
      //   // Alert.alert('Bir şehir seçin', 'Lütfen bir şehir seçin');
      //   // return;
      // }

      // // Fetch routes using the cityId from the component scope
      // let data = await RouteModel.getAllRoutesByCityId(cityId);

      // console.log('data', data);

      let data = await RouteModel.getRoutes({ limit: 20, onlyMain: true });

      setRoutes(shuffleArray(data || []));
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Hata', 'Rotalar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    try {
      setIsReloading(true);
      setRefreshing(true);
      // fetchRoutes will now use the correct selectedCityId from component scope
      await fetchRoutes();
      setRefreshing(false);
      setIsReloading(false);
    } catch (error) {
      console.error('Error refreshing routes:', error);
      Alert.alert('Hata', 'Rotalar yenilenirken bir hata oluştu');
      setIsReloading(false);
      setRefreshing(false);
    }
  }, [selectedCityId]);

  const handleRoutePress = useCallback((routeId: string) => {
    navigate(navigation, PageName.RouteDetail, { routeId });
  }, [navigation]);

  const handleToggleDescription = useCallback((routeId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />
      <RouteList
        routes={routes}
        routeId={route.params?.routeId || ''} 
        loading={isLoading || isReloading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onRoutePress={handleRoutePress}
        onRefreshRoutes={fetchRoutes}
        expandedDescriptions={expandedDescriptions}
        onToggleDescription={handleToggleDescription}
        userId={userId}
      />


      <GlobalFloatingAction />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categoriesContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 25,
    marginRight: 12,
  },
  categoryText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  routesContainer: {
  },
  noRoutesContainer: {
    paddingTop: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeCard: {
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  routeImage: {
    width: '100%',
    height: 200,
  },
  routeInfo: {
  },
  routeTitle: {
    fontSize: 18,
    paddingTop: 10,
    paddingHorizontal: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
  },
  noRoutesText: {
    fontSize: 16,
    width: '70%',
    color: '#666',
    textAlign: 'center',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  reactionText: {
    marginLeft: 4,
    color: '#666',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  commentContainer: {
    borderStartWidth: 1,
    borderEndWidth: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    color: '#222',
  },
  commentImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  routeDescription: {
    fontSize: 14,
    paddingHorizontal: 16,
    color: '#666',
  },
  seeMoreText: {
    color: '#666',
    marginTop: 2,
    fontSize: 12,
    paddingHorizontal: 16,
  },
});

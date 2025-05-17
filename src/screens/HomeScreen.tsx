import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import RouteModel, { RouteWithProfile } from '../model/routes.model';
import { CityState, useCityStore } from '../store/cityStore';
import { LoadingFloatingAction, AuthorInfo } from '../components';
import { getRandomNumber } from '../utils/math';
import { navigate, PageName } from '../types/navigation';
import { checkFirstTime } from '../utils/welcome';
import { NoImage } from '../assets';
import { supabase } from '../lib/supabase';

export const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);

  // Get selected city ID from store at the top level
  const selectedCityId = useCityStore((state: CityState) => state.selectedCityId);

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

  const fetchRoutes = async () => {
    try {
      // Use selectedCityId from component scope
      const cityId = selectedCityId || 0;
      setIsLoading(true);

      if (!cityId) {
        // Clear routes or show a message if no city is selected
        setRoutes([]);
        // Optional: Show a less intrusive message than Alert
        console.log('No city selected, clearing routes.');
        // Alert.alert('Bir şehir seçin', 'Lütfen bir şehir seçin');
        // return;
      }

      // Fetch routes using the cityId from the component scope
      let data = await RouteModel.getAllRoutesByCityId(cityId);

      console.log('data', data);

      if (data.length === 0) {
        data = await RouteModel.getAllRoutes();

        console.log('routes all', data);

      }

      setRoutes(data || []);
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

  const renderRouteCard = (route: RouteWithProfile) => (
    <TouchableOpacity
      key={route.id}
      style={styles.routeCard}
      onPress={() => navigate(navigation, PageName.RouteDetail, { routeId: route.id })}>
      <AuthorInfo
        fullName={route.profiles?.full_name}
        isVerified={route.profiles?.is_verified}
        username={route.profiles?.username}
        createdAt={route.created_at}
        authorId={route.author_id}
        callback={fetchRoutes}
        loggedUserId={userId}
        routeId={route.id}
      />
      <Image
        source={route.image_url ? { uri: route.image_url } : NoImage}
        style={styles.routeImage}
        resizeMode="contain"
      />
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        <View style={styles.routeDetails}>
          <View style={styles.detailItem}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.detailText}>{route.cities?.name}</Text>
          </View>
        </View>
        <View style={styles.reactionContainer}>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="comment-outline" size={18} color="#121" />
            <Text style={styles.reactionText}>{getRandomNumber(1, 10)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="heart-outline" size={18} color="#c00" />
            <Text style={[styles.reactionText]}>{getRandomNumber(1, 50)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="eye-outline" size={18} color="#121" />
            <Text style={styles.reactionText}>{getRandomNumber(50, 500)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="bookmark-outline" size={18} color="#121" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem}>
            <Icon name="share-variant" size={18} color="#121" />
          </TouchableOpacity>
        </View>
        <View style={styles.commentContainer}>
          <View style={styles.commentInputContainer}>
            <Image
              source={{
                uri:
                  route.image_url ||
                  `https://picsum.photos/20/20`,
              }}
              style={styles.commentImage}
            />
            <TextInput
              placeholder="Yorum yap"
              placeholderTextColor="#666"
              style={styles.commentInput}
            />
            <TouchableOpacity>
              <Icon name="send" size={20} color="#121" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.lighter }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={filterRoutes}
          onAddCategory={() => navigation.navigate('AddCategory')}
          loading={isLoading}
        /> */}
        {isReloading || isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#222" />
          </View>
        ) : (
          routes.length > 0 ? (
            <View style={styles.routesContainer}>
              {routes.map(renderRouteCard)}
            </View>
          ) : (
            <View style={styles.noRoutesContainer}>
              <Text style={styles.noRoutesText}>Rota bulunamadı, hemen aşağıdaki butona tıklayarak yeni bir rota oluştur!</Text>
            </View>
          )
        )}

        {/* just spacer */}
        <View style={{ height: 80 }} />
      </ScrollView>
      <LoadingFloatingAction
        backgroundColor='#121212'
        iconName='plus'
        onPress={() => navigate(navigation, PageName.CreateRoute)}

      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
    marginVertical: 10,
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
  },
  routeInfo: {
  },
  routeTitle: {
    fontSize: 18,
    paddingTop: 10,
    paddingHorizontal: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
    // borderRadius: 10,
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
});

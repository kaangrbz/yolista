import React, {useEffect, useState} from 'react';
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
import {Colors} from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import FloatingActionButton from '../components/FloatingActionButton';
import RouteModel, {RouteWithProfile} from '../model/routes.model';
import { CityState, useCityStore } from '../store/cityStore';
import { DropdownMenu } from '../components/DropdownMenu';
import { supabase } from '../lib/supabase';
import { getTimeAgo } from '../utils/timeAgo';
import { Seperator } from '../components/Seperator.component';
import { getRandomNumber } from '../utils/math';

export const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [visibleDropdown, setVisibleDropdown] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation();

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
  }, []);

  // Get selected city ID from store at the top level
  const selectedCityId = useCityStore((state: CityState) => state.selectedCityId);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem('has_seen_welcome');
        if (!hasSeenWelcome) {
          Alert.alert(
            "Yolista'ya Hoş Geldiniz! 👋",
            'Yolista ile şehrinizi keşfedin, yeni rotalar bulun ve unutulmaz deneyimler yaşayın. Şehir içi, doğa ve tarihi rotaları keşfetmeye başlayın!',
            [
              {
                text: 'Harika!',
                onPress: async () => {
                  await AsyncStorage.setItem('has_seen_welcome', 'true');
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Hoş geldiniz mesajı hatası:', error);
      }
    };

    checkFirstTime();
    fetchRoutes();
    // Add selectedCityId to dependency array
  }, [selectedCityId]);

  const fetchRoutes = async () => {
    try {
      // Use selectedCityId from component scope
      const cityId = selectedCityId;
      setIsLoading(true);

      if (!cityId) {
        // Clear routes or show a message if no city is selected
        setRoutes([]);
        // Optional: Show a less intrusive message than Alert
        console.log('No city selected, clearing routes.');
        // Alert.alert('Bir şehir seçin', 'Lütfen bir şehir seçin');
        return;
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

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const { error } = await RouteModel.deleteRoute(routeId);
      if (error) {
        console.error('Error deleting route:', error);
        Alert.alert('Hata', 'Rota silme işlemi sırasında bir hata oluştu');
        return;
      }
      Alert.alert('Başarılı', 'Rota silme işlemi başarılı');
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Hata', 'Rota silme işlemi sırasında bir hata oluştu');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setIsReloading(true);
    setRefreshing(true);
    // fetchRoutes will now use the correct selectedCityId from component scope
    await fetchRoutes();
    setRefreshing(false);
    setIsReloading(false);
    // Add selectedCityId to dependency array
  }, [selectedCityId]);

  const renderRouteCard = (route: RouteWithProfile) => (
    <TouchableOpacity
      key={route.id}
      style={styles.routeCard}
      onPress={() => navigation.navigate('RouteDetail', {routeId: route.id})}>
      <View style={styles.authorContainer}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {route.profiles?.full_name || 'Kaan'}
          </Text>
          {(route.profiles?.is_verified || false) && (
            <Icon
              name="check-decagram"
              size={16}
              color="#1DA1F2"
              style={styles.verifiedIcon}
            />
          )}
          <Text style={styles.authorUsername}>
            @{route.profiles?.username || 'kaangrx'}
          </Text>
          <Seperator />
          <Text style={styles.timeAgo}>{getTimeAgo(route.created_at)}</Text>
        </View>
        <DropdownMenu visible={visibleDropdown} handleOpen={() => setVisibleDropdown(true)} handleClose={() => setVisibleDropdown(false)} trigger={<Icon name="dots-vertical" size={20} color="#666" />}>
          {/* <TouchableOpacity style={styles.menuOption}>
            <Icon name="pencil" size={20} color="#666" style={styles.menuItemIcon} />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity> */}
          {userId === route.author_id && (
            <TouchableOpacity style={styles.menuOption} onPress={() => handleDeleteRoute(route.id)}>
              <Icon name="delete" size={20} color="#c00" style={styles.menuItemIcon} />
              <Text style={[styles.menuText, {color: '#c00'}]}>Sil</Text>
            </TouchableOpacity>
          )}
        </DropdownMenu>
      </View>
      <Image
        source={{
          uri:
            route.image_url ||
            `https://picsum.photos/300/150?random=${Math.floor(
              Math.random() * 10000,
            )}`,
        }}
        style={styles.routeImage}
      />
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        <View style={styles.routeDetails}>
          <View style={styles.detailItem}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.detailText}>{route.cities?.name}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>4.5</Text>
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
    <View style={[styles.container, {backgroundColor: Colors.lighter}]}>
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
        <View style={{height: 80}} />
      </ScrollView>
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateRoute')}
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
    padding: 16,
  },
  noRoutesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
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
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  addCategoryButton: {
    backgroundColor: '#666',
    borderWidth: 2,
    borderColor: '#12121250',
    borderStyle: 'dashed',
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
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
  noRoutesText: {
    fontSize: 16,
    width: '70%',
    color: '#666',
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#222',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  menuItemIcon: {
    marginRight: 10,
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
    paddingVertical: 8,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: '#f0f0f0',
    // borderRadius: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },
  commentImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

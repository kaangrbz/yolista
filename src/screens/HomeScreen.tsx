import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import FloatingActionButton from '../components/FloatingActionButton';
import {supabase} from '../lib/supabase';
import CategoryList from '../components/CategoryList';
import {Database} from '../types/database.types';
import RouteModel, {RouteWithProfile} from '../model/routes.model';

type Category = Database['public']['Tables']['categories']['Row'];

export const HomeScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigation = useNavigation();

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
    fetchCategories();
    fetchRoutes();
  }, []);

  useEffect(() => {
    // Simulate async request
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const fetchCategories = async () => {
    try {
      const {data, error} = await supabase
        .from('categories')
        .select('*')
        .limit(7)
        .order('index', {ascending: true}); // 'index' sütununa göre sıralama

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Hata', 'Kategoriler yüklenirken bir hata oluştu');
    }
  };

  const fetchRoutes = async () => {
    try {
      // const data = await RouteModel.getAllRoutes();

      // const {data, error} = await supabase.rpc(
      //   'get_active_routes_with_profiles',
      // );

      // if (error) throw error;

      let {data, error} = await supabase.rpc('get_active_routes_with_profiles');
      if (error) console.error(error);
      else console.log(data);

      console.log('Routes:', data);

      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Hata', 'Rotalar yüklenirken bir hata oluştu');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setIsReloading(true);
    setRefreshing(true);
    await fetchCategories();
    await fetchRoutes();
    setRefreshing(false);
    setIsReloading(false);
  }, []);

  const filterRoutes = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchRoutes();
    // if (categoryId === null) {
    //   setRoutes(allRoutes);
    // } else {
    //   setRoutes(allRoutes.filter(route => route.categoryId === categoryId));
    // }
  };

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
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="dots-vertical" size={20} color="#666" />
        </TouchableOpacity>
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
            <Text style={styles.detailText}>{route.city_id}</Text>
          </View>
          {/* <View style={styles.detailItem}>
            <Icon name="map-marker-distance" size={16} color="#666" />
            <Text style={styles.detailText}>2.8 km</Text>
          </View> */}
          {/* <View style={styles.detailItem}>
            <Icon2 name="location-pin" size={16} color="#d00" />
            <Text style={styles.detailText}>2</Text>
          </View> */}
          <View style={styles.detailItem}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>4.5</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? Colors.darker : Colors.lighter},
      ]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={filterRoutes}
          onAddCategory={() => navigation.navigate('AddCategory')}
          loading={isLoading}
        />
        {isReloading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        ) : (
          <View style={styles.routesContainer}>
            {routes.length > 0 ? (
              routes.map(renderRouteCard)
            ) : (
              <Text style={styles.noRoutesText}>Rotalar bulunamadı</Text>
            )}
          </View>
        )}
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  routeInfo: {
    padding: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
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
    color: '#666',
    textAlign: 'center',
  },
});

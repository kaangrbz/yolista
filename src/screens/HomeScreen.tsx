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

const {width} = Dimensions.get('window');

const categories = [
  {id: 1, name: 'Şehir İçi', icon: 'city', color: '#2C3E50'},
  {id: 2, name: 'Doğa Rotaları', icon: 'tree', color: '#27AE60'},
  {id: 3, name: 'Tarihi Yerler', icon: 'castle', color: '#8B4513'},
];

const allRoutes = [
  {
    id: 1,
    title: 'Kemeraltı Turu',
    image: 'https://picsum.photos/400/200',
    distance: '2.5 km',
    location: 'Konak, İzmir',
    rating: 4.8,
    categoryId: 1,
    pinCount: 8,
    author: {
      name: 'Kaan',
      username: '@kaangrbz',
      isVerified: true,
    },
  },
  {
    id: 2,
    title: 'Kordon Yürüyüşü',
    image: 'https://picsum.photos/400/201',
    distance: '3.1 km',
    location: 'Alsancak, İzmir',
    rating: 4.6,
    categoryId: 1,
    pinCount: 5,
    author: {
      name: 'Ayşe',
      username: '@aysegezgin',
      isVerified: true,
    },
  },
  {
    id: 3,
    title: 'Efes Antik Kenti',
    image: 'https://picsum.photos/400/202',
    distance: '1.8 km',
    location: 'Selçuk, İzmir',
    rating: 4.9,
    categoryId: 3,
    pinCount: 12,
    author: {
      name: 'Mehmet',
      username: '@mehmetkultur',
      isVerified: false,
    },
  },
  {
    id: 4,
    title: 'Sapanca Gölü Turu',
    image: 'https://picsum.photos/400/203',
    distance: '4.2 km',
    location: 'Sapanca, İzmir',
    rating: 4.7,
    categoryId: 2,
    pinCount: 6,
    author: {
      name: 'Zeynep',
      username: '@zeynepdoga',
      isVerified: true,
    },
  },
  {
    id: 5,
    title: 'Asansör Turu',
    image: 'https://picsum.photos/400/204',
    distance: '1.5 km',
    location: 'Karataş, İzmir',
    rating: 4.5,
    categoryId: 3,
    pinCount: 3,
    author: {
      name: 'Can',
      username: '@canizmir',
      isVerified: false,
    },
  },
  {
    id: 6,
    title: 'Çeşme Kalesi',
    image: 'https://picsum.photos/400/205',
    distance: '2.8 km',
    location: 'Çeşme, İzmir',
    rating: 4.4,
    categoryId: 3,
    pinCount: 4,
    author: {
      name: 'Elif',
      username: '@elifgezgin',
      isVerified: true,
    },
  },
];

export const HomeScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [routes, setRoutes] = useState(allRoutes);
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
  }, []);

  useEffect(() => {
    // Simulate async request
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRoutes(allRoutes);
      setRefreshing(false);
    }, 1500);
  }, []);

  const filterRoutes = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setRoutes(allRoutes);
    } else {
      setRoutes(allRoutes.filter(route => route.categoryId === categoryId));
    }
  };

  const renderCategories = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            {backgroundColor: selectedCategory === null ? '#121212dd' : '#666'},
          ]}
          onPress={() => filterRoutes(null)}>
          <Icon name="view-grid" size={24} color="white" />
          <Text style={styles.categoryText}>Tümü</Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor:
                  selectedCategory === category.id ? category.color : '#666',
              },
            ]}
            onPress={() => filterRoutes(category.id)}>
            <Icon name={category.icon} size={24} color="white" />
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.categoryButton, styles.addCategoryButton]}
          onPress={() => navigation.navigate('AddCategory')}>
          <Icon name="plus" size={24} color="white" />
          <Text style={styles.categoryText}>Öneride Bulun</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderRouteCard = (route: (typeof routes)[0]) => (
    <TouchableOpacity
      key={route.id}
      style={styles.routeCard}
      onPress={() => navigation.navigate('RouteDetail', {routeId: route.id})}>
      <View style={styles.authorContainer}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{route.author.name}</Text>
          {route.author.isVerified && (
            <Icon
              name="check-decagram"
              size={16}
              color="#1DA1F2"
              style={styles.verifiedIcon}
            />
          )}
          <Text style={styles.authorUsername}>{route.author.username}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="dots-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <Image source={{uri: route.image}} style={styles.routeImage} />
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        <View style={styles.routeDetails}>
          <View style={styles.detailItem}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.detailText}>{route.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="map-marker-distance" size={16} color="#666" />
            <Text style={styles.detailText}>{route.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon2 name="location-pin" size={16} color="#d00" />
            <Text style={styles.detailText}>{route.pinCount}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{route.rating}</Text>
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
        {renderCategories()}
        <View style={styles.routesContainer}>
          {routes.map(renderRouteCard)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
});

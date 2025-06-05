import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, ListRenderItem, RefreshControl, ScrollView } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryItem } from '../types/category.types';
import CategoryModel from '../model/category.modal';
import { ExploreHeader } from '../components/header/Header';
import GlobalFloatingAction from '../components/common/GlobalFloatingAction';
import RouteModel, { RouteWithProfile, GetRoutesProps } from '../model/routes.model';
import { navigate, PageName } from '../types/navigation';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import UserModel, { User } from '../model/user.model';

const NUM_COLUMNS = 2;
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 4) / NUM_COLUMNS; // 3 items per row with 2px gap

// Types

interface ExploreItem {
  id: string;
  image: string;
  likes: number;
  title: string;
  location: string;
}

// Mock data - replace with your actual data source

/*
Array(15).fill(0).map((_, index) => ({
  id: String(index + 1),
  image: `https://picsum.photos/500/500?random=${index}`,
  likes: Math.floor(Math.random() * 1000) + 100,
  title: `Amazing Route ${index + 1}`,
  location: `City ${String.fromCharCode(65 + (index % 5))}`,
}))
*/

const ExploreScreen = () => {
  const isFocused = useIsFocused();

  const route = useRoute();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState(route.params?.categoryId || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [isFocused]);

  const handleSearch = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setIsLoading(true);
    searchTimeout.current = setTimeout(async () => {

      if (searchQuery.length > 0) {
        let users = await UserModel.getUsers(searchQuery);
        console.log('users', users);
        setUsers(users);
      } else {
        setUsers([]);
      }

      await fetchExploreItems();
      setIsLoading(false);
    }, 1000);
  };


  const fetchCategories = async () => {
    try {
      const categories: CategoryItem[] = await CategoryModel.getCategories();

      categories.unshift({
        id: 0,
        name: 'Tümü',
        icon_name: 'routes',
        description: 'Tüm Rotalar',
        index: 0,
      });


      setCategories(categories.sort((a, b) => a.index - b.index));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, activeCategory]);

  const fetchExploreItems = async () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setIsLoading(true);
    try {
      let props: GetRoutesProps = { onlyMain: true, categoryId: activeCategory, searchQuery: searchQuery }
      const routes = await RouteModel.getRoutes(props);
      setRoutes(routes);
    } catch (error) {
      console.error('Error fetching explore items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // fetchCategories();
    fetchExploreItems();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderCategoryItem: ListRenderItem<CategoryItem> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item.id && styles.activeCategoryItem,
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Icon
        name={item.icon_name}
        size={20}
        color={activeCategory === item.id ? '#fff' : '#333'}
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.categoryText,
          activeCategory === item.id && styles.activeCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderExploreItem: ListRenderItem<RouteWithProfile> = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.exploreItem,
        { marginRight: (index + 1) % 3 === 0 ? 0 : 2 },
      ]}
      activeOpacity={0.8}
      onPress={() => navigate(navigation, PageName.RouteDetail, { routeId: item.id })}
    >
      <Image source={{ uri: item.image_url || 'https://picsum.photos/300/300?random=' + item.id }} style={styles.exploreImage} />
      <View style={styles.overlay}>
        <View style={styles.row}>
          <View style={styles.cityContainer}>
            <Icon name="map-marker" size={16} color="#fff" />
            <Text style={styles.cityText}>{item.cities.name}</Text>
          </View>
          <View style={styles.likeContainer}>
            <Icon name="heart" size={16} color="#fff" />
            <Text style={styles.likeCount}>{item?.like_count?.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>

          <TouchableOpacity style={styles.userContainer} onPress={() => navigation.navigate('ProfileMain', { userId: item.profiles.id })}>
            <Text style={styles.userName}>{item.profiles.full_name}</Text>
            <Text style={styles.userUsername}>@{item.profiles.username}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem: ListRenderItem<User> = ({ user }: { user: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProfileMain', { userId: user.id })}
    >
      <Image source={{ uri: user.image_url || 'https://picsum.photos/300/300?random=' + user.id }} style={styles.userImage} />
      <View style={styles.overlay}>
        <View style={styles.infoContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{user.full_name}</Text>

          <TouchableOpacity style={styles.userContainer}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ExploreHeader onSearch={() => console.log('search')} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rota, Yer, Kategori, Şehir Ara.."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          autoFocus={false}
        />
      </View>

      {
        users.length > 0 && (
        <>
          <Text style={styles.usersTitle}>Kullanıcılar</Text>
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
          />
        </>
        )
      }

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Explore Grid */}
      {
        isLoading && (
          <ActivityIndicator size="small" style={{ flex: 1 }} color="#000" />
        )
      }

      {
        !isLoading && routes.length > 0 && (
          <FlatList
            data={routes}
            renderItem={renderExploreItem}
            onRefresh={onRefresh}
            refreshing={refreshing}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#333', '#121212']}
                tintColor="#000000"
                titleColor="#000000"
              />
            }
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            ListEmptyComponent={() => (
              <View style={styles.noRoutesContainer}>
                <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
              </View>
            )}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.exploreList}
            showsVerticalScrollIndicator={false}
          />
        )
      }

      {/* No Routes alert */}
      {
        routes.length === 0 && !isLoading && activeCategory === 0 && (
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#333', '#121212']}
              tintColor="#000000"
              titleColor="#000000"
            />
          }>
            <View style={styles.noRoutesContainer}>
              <Text style={styles.noRoutesText}>Hiç Rota Bulunamadı</Text>
            </View>
          </ScrollView>
        )
      }

      {
        routes.length === 0 && !isLoading && activeCategory !== 0 && (
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#333', '#121212']}
              tintColor="#000000"
              titleColor="#000000"
            />
          }>
            <View style={styles.noRoutesContainer}>
              <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
            </View>
          </ScrollView>
        )
      }
      <GlobalFloatingAction />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#000',
    fontSize: 16,
  },
  noRoutesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noRoutesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  usersList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#F5F5F5',
  },
  userImage: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
  },
  usersTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeCategoryItem: {
    backgroundColor: '#000',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  exploreList: {
    padding: 1,
  },
  columnWrapper: {
    marginBottom: 2,
  },
  exploreItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
  },
  exploreImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    justifyContent: 'space-between',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cityText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 6,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 1,
  },
  userUsername: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    opacity: 0.9,
  },
});

export default ExploreScreen;
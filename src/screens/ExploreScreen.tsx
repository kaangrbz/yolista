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
import CategoryModel from '../model/category.model';
import { ExploreHeader } from '../components/header/Header';
import GlobalFloatingAction from '../components/common/GlobalFloatingAction';
import RouteModel, { RouteWithProfile, GetRoutesProps } from '../model/routes.model';
import { navigate, PageName } from '../types/navigation';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import UserModel, { User } from '../model/user.model';
import UserCard from '../components/user/UserCard';
import { supabase } from '../lib/supabase';
import RouteCard from '../components/route/RouteCard';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '../utils/alert';

const NUM_COLUMNS = 3;
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 4) / NUM_COLUMNS; // 3 items per row with 2px gap
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - 32 - (COLUMN_COUNT - 1) * 8) / COLUMN_COUNT;

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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [isFocused]);

  const handleSearch = () => {
    setUsers([]);
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

      await fetchRoutes();
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
        is_disabled: false,
      });


      setCategories(categories.sort((a, b) => a.index - b.index));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, activeCategory]);

  const fetchRoutes = async () => {
    try {
      let props: GetRoutesProps = { onlyMain: true, categoryId: activeCategory, searchQuery: searchQuery }
      const routes = await RouteModel.getRoutes(props);
      setRoutes(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      showToast('error', 'Rotalar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRoutes();
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

  const handleToggleDescription = (routeId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  const renderItem = ({ item, index }: { item: RouteWithProfile; index: number }) => (
    <View style={[
      styles.cardWrapper,
      { marginRight: (index + 1) % COLUMN_COUNT !== 0 ? 8 : 0 }
    ]}>
      <RouteCard
        route={item}
        userId={user?.id || null}
        onRefresh={fetchRoutes}
        expandedDescriptions={expandedDescriptions}
        onToggleDescription={handleToggleDescription}
        showAuthorHeader={false}
        showConnectingLine={false}
      />
    </View>
  );

  const renderUserItem: ListRenderItem<User> = ({ item }: { item: User }): React.JSX.Element | undefined => {

    if (!item) {
      return;
    }
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProfileMain', { userId: item?.id })}
      >
        <UserCard user={item} onPress={() => navigation.navigate('ProfileMain', { userId: item?.id })} />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
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

      <ScrollView refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#333', '#121212']}
              tintColor="#000000"
              titleColor="#000000"
            />
          }>

      {
        users.length > 0 && (
          <>
            <Text style={styles.title}>Kullanıcılar</Text>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersList}
            />
          </>
        )
      }

<Text style={styles.title}>Rotalar</Text>
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
          <View style={{paddingTop: 20}}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        )
      }

      {
        !isLoading && routes.length > 0 && (
          <FlatList
            data={routes}
            renderItem={renderItem}
            onRefresh={onRefresh}
            refreshing={refreshing}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            ListEmptyComponent={() => (
              <View style={styles.noRoutesContainer}>
                <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      }

      {/* No Routes alert */}
      {
        routes.length === 0 && !isLoading && activeCategory === 0 && (
            <View style={styles.noRoutesContainer}>
              <Text style={styles.noRoutesText}>Hiç Rota Bulunamadı</Text>
            </View>
        )
      }

      {
        routes.length === 0 && !isLoading && activeCategory !== 0 && (
            <View style={styles.noRoutesContainer}>
              <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
            </View>
        )
      }

        <View style={{height: 200}}></View>
          </ScrollView>
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
    justifyContent: 'flex-end',
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
    backgroundColor: '#F5F5F5',
  },
  userImage: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
  },
  title: {
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
  listContent: {
    padding: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
});

export default ExploreScreen;
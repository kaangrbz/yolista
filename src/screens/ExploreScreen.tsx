import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, ListRenderItem, RefreshControl, ScrollView } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryItem } from '../types/category.types';
import CategoryModel from '../model/category.model';
import { ExploreHeader } from '../components/header/Header';  
import { RouteWithProfile } from '../model/routes.model';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import UserModel, { User } from '../model/user.model';
import UserCard from '../components/user/UserCard';
import RouteCard from '../components/route/RouteCard';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '../utils/alert';
import { useExplorePosts } from '../hooks/usePosts';

const NUM_COLUMNS = 3;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width) / NUM_COLUMNS;

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
  const [activeCategory, setActiveCategory] = useState((route.params as any)?.categoryId || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Posts hook
  const { posts: routes, isLoading, refresh: refreshPosts, loadMore, hasMore, updateOptions } = useExplorePosts(activeCategory, searchQuery, 20);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [isFocused]);

  const handleSearch = () => {
    setUsers([]);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {

      if (searchQuery.length > 0) {
        let users = await UserModel.getUsers(searchQuery);
        console.log('users', users);
        setUsers(users);
      } else {
        setUsers([]);
      }

      // Posts hook'u güncelle
      updateOptions({
        exploreFeed: { categoryId: activeCategory, searchQuery: searchQuery, limit: 20 }
      });
      await refreshPosts();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      console.log('ExploreScreen - Loading more posts...');
      setIsLoadingMore(true);
      loadMore().finally(() => {
        // 1 saniye bekle, sonra tekrar yüklemeye izin ver
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1000);
      });
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

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

  const renderItem = ({ item }: { item: RouteWithProfile }) => (
    <View style={styles.cardWrapper}>
      <RouteCard
        route={item}
        userId={user?.id || null}
        onRefresh={refreshPosts}
        expandedDescriptions={expandedDescriptions}
        onToggleDescription={handleToggleDescription}
        showAuthorHeader={false}
        showConnectingLine={false}
      />
    </View>
  );

  const renderUserItem: ListRenderItem<User> = ({ item }: { item: User }) => {
    if (!item) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate('ProfileMain', { userId: item?.id })}
      >
        <UserCard user={item as any} onPress={() => (navigation as any).navigate('ProfileMain', { userId: item?.id })} />
      </TouchableOpacity>
    );
  };

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
            keyExtractor={(item) => item.id || ''}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => 
              ((isLoading || isLoadingMore) && hasMore) ? <ActivityIndicator size="small" color="#000" style={{padding: 20}} /> : null
            }
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
    width: CARD_WIDTH,
    height: CARD_WIDTH,
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
  },
  cardWrapper: {
    width: CARD_WIDTH,
    aspectRatio: 1,
  },
});

export default ExploreScreen;
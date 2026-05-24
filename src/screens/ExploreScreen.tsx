import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
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
import ExploreMasonryGrid from '../components/explore/ExploreMasonryGrid';
import ExploreFeedSkeleton from '../components/explore/ExploreFeedSkeleton';
import { useAuth } from '../context/AuthContext';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExplorePosts } from '../hooks/usePosts';
import { KeyboardAwareContainer } from '../components/common';
import {
  EXPLORE_LAYOUT_MODE,
  getExploreGridCardWidth,
} from '../utils/exploreLayoutUtils';
import { isInitialListLoading } from '../utils/listRefreshUtils';

const GRID_CARD_WIDTH = getExploreGridCardWidth();
const SEARCH_DEBOUNCE_MS = 500;

const ExploreScreen = () => {
  const isFocused = useIsFocused();

  const route = useRoute();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCategory, setActiveCategory] = useState((route.params as any)?.categoryId || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const { posts: routes, isLoading, refresh: refreshPosts, loadMore, hasMore } = useExplorePosts(
    activeCategory,
    debouncedSearchQuery,
    20,
  );

  useEffect(() => {
    fetchCategories();
  }, [isFocused]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    let isCancelled = false;

    const fetchUsers = async () => {
      if (debouncedSearchQuery.length === 0) {
        setUsers([]);

        return;
      }

      const foundUsers = await UserModel.getUsers(debouncedSearchQuery);

      if (!isCancelled) {
        setUsers(foundUsers);
      }
    };

    void fetchUsers();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchQuery]);

  const fetchCategories = async () => {
    try {
      const fetchedCategories: CategoryItem[] = await CategoryModel.getCategories();

      fetchedCategories.unshift({
        id: 0,
        name: 'Tümü',
        icon_name: 'routes',
        description: 'Tüm Rotalar',
        index: 0,
        is_disabled: false,
      });

      setCategories(fetchedCategories.sort((a, b) => a.index - b.index));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const isInitialLoading = isInitialListLoading(isLoading, routes.length);
  const isLoadingMore = isLoading && routes.length > 0 && !refreshing;

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = 160;
      const isNearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - distanceFromBottom;

      if (isNearBottom) {
        handleLoadMore();
      }
    },
    [handleLoadMore],
  );

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
    setExpandedDescriptions((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  };

  const renderGridRoute = (item: RouteWithProfile) => (
    <View key={item.id} style={styles.gridCardWrapper}>
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
        onPress={() => {
          if (!item?.username) {
            return;
          }

          (navigation as any).navigate(
            'ProfileMain',
            buildProfileNavigationParams({
              username: item.username,
              currentUserId: user?.id,
            }),
          );
        }}
      >
        <UserCard
          user={item as any}
          onPress={() => {
            if (!item?.username) {
              return;
            }

            (navigation as any).navigate(
              'ProfileMain',
              buildProfileNavigationParams({
                username: item.username,
                currentUserId: user?.id,
              }),
            );
          }}
        />
      </TouchableOpacity>
    );
  };

  const showRoutesContent = !isInitialLoading && routes.length > 0;
  const useMasonryLayout = EXPLORE_LAYOUT_MODE === 'masonry';

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareContainer enableScrollView={false} keyboardVerticalOffset={0}>
      <ExploreHeader />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rota, Yer, Kategori, Şehir Ara.."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            autoFocus={false}
            returnKeyType="search"
            blurOnSubmit={true}
          />
        </View>

        <TouchableOpacity
          style={styles.mapToggleButton}
          activeOpacity={0.85}
          onPress={() => (navigation as any).navigate('ExploreMap')}
        >
          <Icon name="map-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333', '#121212']}
            tintColor="#000000"
            titleColor="#000000"
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        {users.length > 0 && (
          <>
            <Text style={styles.title}>Kullanıcılar</Text>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersList}
            />
          </>
        )}

        <Text style={styles.title}>Rotalar</Text>

        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {isInitialLoading && <ExploreFeedSkeleton />}

        {showRoutesContent && !useMasonryLayout && (
          <View style={styles.gridContainer}>
            {routes.map(renderGridRoute)}
          </View>
        )}

        {showRoutesContent && useMasonryLayout && (
          <ExploreMasonryGrid
            routes={routes}
            userId={user?.id || null}
            onRefresh={refreshPosts}
            expandedDescriptions={expandedDescriptions}
            onToggleDescription={handleToggleDescription}
          />
        )}

        {routes.length === 0 && !isLoading && activeCategory === 0 && (
          <View style={styles.noRoutesContainer}>
            <Text style={styles.noRoutesText}>Hiç Rota Bulunamadı</Text>
          </View>
        )}

        {routes.length === 0 && !isLoading && activeCategory !== 0 && (
          <View style={styles.noRoutesContainer}>
            <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
          </View>
        )}

        {isLoadingMore && hasMore && (
          <ActivityIndicator size="small" color="#000" style={styles.footerLoader} />
        )}

        <View style={styles.scrollBottomSpacer} />
      </ScrollView>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  mapToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
    fontSize: 16,
  },
  noRoutesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userItem: {
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    marginVertical: 6,
  },
  categoriesList: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCardWrapper: {
    width: GRID_CARD_WIDTH,
    aspectRatio: 1,
  },
  footerLoader: {
    paddingVertical: 12,
  },
  scrollBottomSpacer: {
    height: 120,
  },
});

export default ExploreScreen;

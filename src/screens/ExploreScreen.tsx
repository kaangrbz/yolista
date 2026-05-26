import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  ListRenderItem,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedRefreshControl from '../components/common/ThemedRefreshControl';
import { useThemedScrollSurface } from '../theme/useThemedScrollSurface';
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
import { useExplorePosts } from '../hooks/usePosts';
import { KeyboardAwareContainer } from '../components/common';
import {
  EXPLORE_LAYOUT_MODE,
  getExploreGridCardWidth,
} from '../utils/exploreLayoutUtils';
import { isInitialListLoading } from '../utils/listRefreshUtils';
import { useAppTheme } from '../context/AppThemeContext';
import { useThemedStyles } from '../theme/useThemedStyles';

const GRID_CARD_WIDTH = getExploreGridCardWidth();
const SEARCH_DEBOUNCE_MS = 500;

const ExploreScreen = () => {
  const isFocused = useIsFocused();
  const theme = useAppTheme();
  const scrollSurface = useThemedScrollSurface();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
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
      backgroundColor: t.surfaceMuted,
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    mapToggleButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: t.textPrimary,
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
      color: t.textPrimary,
      fontSize: 16,
    },
    noRoutesContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    noRoutesText: {
      fontSize: 16,
      color: t.textSecondary,
      textAlign: 'center',
    },
    categoriesContainer: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
    },
    usersList: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    userItem: {
      backgroundColor: t.surfaceMuted,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      marginHorizontal: 12,
      marginVertical: 6,
      color: t.textPrimary,
    },
    categoriesList: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
    },
    activeCategoryItem: {
      backgroundColor: t.textPrimary,
    },
    categoryIcon: {
      marginRight: 6,
    },
    categoryText: {
      fontSize: 14,
      color: t.textPrimary,
      fontWeight: '500',
    },
    activeCategoryText: {
      color: t.background,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: t.background,
    },
    gridCardWrapper: {
      width: GRID_CARD_WIDTH,
      aspectRatio: 1,
    },
    footerLoader: {
      paddingVertical: 12,
    },
    nestedList: {
      backgroundColor: t.background,
    },
    scrollBottomSpacer: {
      height: 120,
    },
  }));

  const route = useRoute();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCategory, setActiveCategory] = useState((route.params as any)?.categoryId || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
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
        color={activeCategory === item.id ? theme.background : theme.textPrimary}
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAwareContainer
        enableScrollView={false}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
      <ExploreHeader />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rota, Yer, Kategori, Şehir Ara.."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.textMuted}
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
          <Icon name="map-outline" size={20} color={theme.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={scrollSurface.style}
        contentContainerStyle={scrollSurface.contentContainerStyle}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              style={styles.nestedList}
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
            style={styles.nestedList}
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
          <ActivityIndicator size="small" color={theme.textPrimary} style={styles.footerLoader} />
        )}

        <View style={styles.scrollBottomSpacer} />
      </ScrollView>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
};

export default ExploreScreen;

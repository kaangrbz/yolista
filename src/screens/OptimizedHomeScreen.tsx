import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Lazy imports
const UniversalPost = React.lazy(() => import('../components/UniversalPost'));
const HomeHeader = React.lazy(() => import('../components/header/Header'));
const StoriesBar = React.lazy(() => import('../components/StoriesBar'));

// Hooks
import { useLazyList } from '../hooks/useLazyList';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../context/AuthContext';

// Components
import OptimizedImage from '../components/common/OptimizedImage';
import LazyComponent from '../components/common/LazyComponent';

const { height: screenHeight } = Dimensions.get('window');

// Memoized components
const PostItem = memo(({ item, userId, onRefresh }: any) => {
  return (
    <LazyComponent rootMargin={screenHeight * 0.5}>
      <React.Suspense fallback={<PostSkeleton />}>
        <UniversalPost
          route={item}
          userId={userId}
          onRefresh={onRefresh}
        />
      </React.Suspense>
    </LazyComponent>
  );
});

const PostSkeleton = memo(() => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonHeader} />
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonText} />
  </View>
));

const LoadingFooter = memo(({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) {return null;}

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#1DA1F2" />
    </View>
  );
});

const EndMessage = memo(() => (
  <View style={styles.endContainer}>
    <Text style={styles.endText}>✨ Tüm içerikleri gördün!</Text>
    <Text style={styles.endSubText}>Yeni paylaşımlar için tekrar kontrol et</Text>
  </View>
));

export const OptimizedHomeScreen = memo(() => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  // Use optimized posts hook
  const {
    routes,
    stories,
    isLoading,
    isLoadingMore,
    hasMore,
    refreshRoutes,
    loadMoreRoutes,
  } = usePosts(userId);

  // Use lazy list for better performance
  const {
    visibleData: visibleRoutes,
    loadMore: loadMoreVisible,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useLazyList({
    data: routes,
    initialLoadCount: 5,
    loadMoreCount: 5,
    threshold: 0.7,
  });

  // Memoized callbacks
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshRoutes();
    } finally {
      setRefreshing(false);
    }
  }, [refreshRoutes]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMoreRoutes();
      loadMoreVisible();
    }
  }, [isLoadingMore, hasMore, loadMoreRoutes, loadMoreVisible]);

  const handleStoryPress = useCallback((storyId: string) => {
    // Handle story press
    console.log('Story pressed:', storyId);
  }, []);

  const handleAddStory = useCallback(() => {
    // Handle add story
    console.log('Add story pressed');
  }, []);

  // Optimized render functions
  const renderPost = useCallback(({ item }: { item: any }) => (
    <PostItem
      item={item}
      userId={userId}
      onRefresh={refreshRoutes}
    />
  ), [userId, refreshRoutes]);

  const renderHeader = useCallback(() => (
    <LazyComponent>
      <React.Suspense fallback={<StoriesSkeleton />}>
        <StoriesBar
          stories={stories}
          onStoryPress={handleStoryPress}
          onAddStory={handleAddStory}
        />
      </React.Suspense>
    </LazyComponent>
  ), [stories, handleStoryPress, handleAddStory]);

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return <LoadingFooter isLoading={true} />;
    }

    if (!hasMore && !isLoading && visibleRoutes.length > 0) {
      return <EndMessage />;
    }

    return null;
  }, [isLoadingMore, hasMore, isLoading, visibleRoutes.length]);

  const keyExtractor = useCallback((item: any, index: number) =>
    item.id || index.toString(), []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 400, // Estimated item height
    offset: 400 * index,
    index,
  }), []);

  // Focus effect for data loading
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        setUserId(user.id);
      }
    }, [user?.id])
  );

  // Success message animation
  useEffect(() => {
    if (showSuccessMessage) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessMessage(false);
      });
    }
  }, [showSuccessMessage, fadeAnim]);

  const StoriesSkeleton = memo(() => (
    <View style={styles.storiesSkeletonContainer}>
      {[...Array(5)].map((_, index) => (
        <View key={index} style={styles.storySkeleton} />
      ))}
    </View>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <React.Suspense fallback={<HeaderSkeleton />}>
        <HomeHeader />
      </React.Suspense>

      {/* Success Message */}
      {showSuccessMessage && (
        <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      )}

      <FlatList
        data={visibleRoutes}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </SafeAreaView>
  );
});

const HeaderSkeleton = memo(() => (
  <View style={styles.headerSkeleton}>
    <View style={styles.headerSkeletonContent} />
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
    flex: 1,
  },
  successMessage: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  successText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  endSubText: {
    fontSize: 14,
    color: '#666',
  },
  skeletonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  skeletonHeader: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonImage: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonText: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '80%',
  },
  storiesSkeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storySkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  headerSkeleton: {
    height: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerSkeletonContent: {
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
  },
});

OptimizedHomeScreen.displayName = 'OptimizedHomeScreen';

export default OptimizedHomeScreen;

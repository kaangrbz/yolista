import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { RouteWithProfile } from '../model/routes.model';
import WelcomeModal from '../components/common/WelcomeModal';
import { markWelcomeSeen, shouldShowWelcome } from '../utils/welcome';
import { supabase } from '../lib/supabase';
import { HomeHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';
import { useHomePosts } from '../hooks/usePosts';
import { useListPostImagesBatch } from '../hooks/useListPostImagesBatch';
import { useRoutePublishStore } from '../store/routePublishStore';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { isInitialListLoading } from '../utils/listRefreshUtils';

export const HomeScreen = () => {
  const [userId, setUserId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const flatListRef = useRef<FlatList<RouteWithProfile>>(null);

  const route = useRoute();
  const navigation = useNavigation();

  const { posts: routes, isLoading, refresh: refreshPosts, loadMore, hasMore } = useHomePosts(userId, 10);
  const isInitialLoading = isInitialListLoading(isLoading, routes.length);

  const { rowsByPostId } = useListPostImagesBatch(routes);

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

    shouldShowWelcome().then((shouldShow) => {
      if (shouldShow) {
        setShowWelcomeModal(true);
      }
    });
  }, []);

  const handleWelcomeDismiss = async () => {
    await markWelcomeSeen();
    setShowWelcomeModal(false);
  };

  useEffect(() => {
    const params = route.params as { showSuccessMessage?: boolean; successMessage?: string } | undefined;
    if (params?.showSuccessMessage) {
      setSuccessMessage(params.successMessage || 'Rota başarıyla paylaşıldı! 🎉');
      setShowSuccessMessage(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessMessage(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [route.params, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const params = route.params as { scrollToTop?: boolean } | undefined;

      if (params?.scrollToTop) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        });
        navigation.setParams({ scrollToTop: undefined } as never);
      }
    }, [route.params, navigation]),
  );

  useEffect(() => {
    let previousPhase = useRoutePublishStore.getState().phase;

    return useRoutePublishStore.subscribe((state) => {
      if (state.phase === 'success' && previousPhase !== 'success') {
        Promise.resolve(refreshPosts()).catch(() => {
          // Feed refresh is best-effort
        });
      }

      previousPhase = state.phase;
    });
  }, [refreshPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      loadMore().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const renderPost = useCallback(({ item }: { item: RouteWithProfile }) => {
    const postId = item.id || '';

    return (
      <UniversalPost
        postId={postId}
        userId={userId}
        initialRoute={item}
        batchImages={true}
        prefetchedImageRows={rowsByPostId[postId]}
      />
    );
  }, [userId, rowsByPostId]);

  const renderEmpty = () => {
    if (!isInitialLoading) {
      return null;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1DA1F2" />
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1DA1F2" />
        </View>
      );
    }

    if (!hasMore && !isLoading) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>✨ Tüm içerikleri gördün!</Text>
          <Text style={styles.endSubText}>Yeni paylaşımlar için tekrar kontrol et</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />

      {showSuccessMessage && (
        <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      )}

      <WelcomeModal visible={showWelcomeModal} onDismiss={handleWelcomeDismiss} />

      <FlatList
        ref={flatListRef}
        data={routes}
        renderItem={renderPost}
        keyExtractor={(item) => item.id || ''}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
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
  endContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  endSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
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
    marginBottom: 4,
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
  routeDescription: {
    fontSize: 14,
    paddingHorizontal: 16,
    color: '#666',
  },
  seeMoreText: {
    color: '#666',
    marginTop: 2,
    fontSize: 12,
    paddingHorizontal: 16,
  },
  successMessage: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

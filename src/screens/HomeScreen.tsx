import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '../theme/useThemedStyles';
import ThemedRefreshControl from '../components/common/ThemedRefreshControl';
import { RouteWithProfile } from '../model/routes.model';
import { useAuth } from '../context/AuthContext';
import WelcomeModal from '../components/common/WelcomeModal';
import { markWelcomeSeen, shouldShowWelcome } from '../utils/welcome';
import { HomeHeader } from '../components/header/Header';
import UniversalPost from '../components/UniversalPost';
import { useHomePosts } from '../hooks/usePosts';
import { useListPostImagesBatch } from '../hooks/useListPostImagesBatch';
import { useRoutePublishStore } from '../store/routePublishStore';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { isInitialListLoading } from '../utils/listRefreshUtils';

export const HomeScreen = () => {
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    flatList: {
      flex: 1,
      backgroundColor: t.background,
    },
    loadingContainer: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    endContainer: {
      paddingVertical: 30,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    endText: {
      fontSize: 16,
      color: t.textPrimary,
      fontWeight: '600',
      marginBottom: 5,
    },
    endSubText: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
    },
    successMessage: {
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
      backgroundColor: t.accentPositive,
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
  }));

  const { user } = useAuth();
  const userId = user?.id ?? '';
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

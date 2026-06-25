import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RouteWithProfile } from '../../model/routes.model';
import { useListPostImagesBatch } from '../../hooks/useListPostImagesBatch';
import { useListPostStopCounts } from '../../hooks/useListPostStopCounts';
import { useFeedImageWindow } from '../../hooks/useFeedImageWindow';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import ThemedRefreshControl from '../common/ThemedRefreshControl';
import FeedPostItem from './FeedPostItem';

export type RouteFeedListMode = 'home' | 'profile' | 'saved' | 'liked';

const EMPTY_STATE_CONFIG: Record<
  Exclude<RouteFeedListMode, 'home'>,
  { icon: string; text: string }
> = {
  profile: {
    icon: 'image-outline',
    text: 'Henüz gönderi yok',
  },
  saved: {
    icon: 'bookmark-outline',
    text: 'Henüz kaydedilen gönderi yok',
  },
  liked: {
    icon: 'heart-outline',
    text: 'Henüz beğenilen gönderi yok',
  },
};

export type RouteFeedListProps = {
  mode: RouteFeedListMode;
  routes: RouteWithProfile[];
  userId: string | null;
  listRef?: React.RefObject<FlatList<RouteWithProfile> | null>;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
  isListLoading?: boolean;
  hasMore?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
};

const RouteFeedList: React.FC<RouteFeedListProps> = ({
  mode,
  routes,
  userId,
  listRef,
  ListHeaderComponent,
  refreshing = false,
  onRefresh,
  onEndReached,
  isLoadingMore = false,
  isInitialLoading = false,
  isListLoading = false,
  hasMore = false,
  onScroll,
  scrollEventThrottle,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
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
    emptyPosts: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: t.textSecondary,
      marginTop: 12,
    },
    footerLoading: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  }));

  const { rowsByPostId } = useListPostImagesBatch(routes);
  const { stopCountsByPostId } = useListPostStopCounts(routes);
  const { viewabilityConfigCallbackPairs } = useFeedImageWindow(routes);

  const emptyConfig = mode !== 'home' ? EMPTY_STATE_CONFIG[mode] : null;

  const renderPost = useCallback<ListRenderItem<RouteWithProfile>>(({ item, index }) => {
    const postId = item.id || '';
    const stopCount = stopCountsByPostId[postId];
    const stopCountHint = stopCount != null && stopCount > 0 ? stopCount : null;

    return (
      <FeedPostItem
        item={item}
        userId={userId}
        feedIndex={index}
        prefetchedImageRows={rowsByPostId[postId]}
        stopCountHint={stopCountHint}
      />
    );
  }, [rowsByPostId, stopCountsByPostId, userId]);

  const renderEmpty = useCallback(() => {
    if (mode === 'home') {
      if (!isInitialLoading) {
        return null;
      }

      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1DA1F2" />
        </View>
      );
    }

    if (isInitialLoading) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator color="#1DA1F2" />
        </View>
      );
    }

    if (!emptyConfig) {
      return null;
    }

    return (
      <View style={styles.emptyPosts}>
        <Icon name={emptyConfig.icon} size={48} color={theme.textMuted} />
        <Text style={styles.emptyText}>{emptyConfig.text}</Text>
      </View>
    );
  }, [emptyConfig, isInitialLoading, mode, styles, theme.textMuted]);

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#1DA1F2" />
        </View>
      );
    }

    if (mode === 'home' && !hasMore && !isListLoading) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>✨ Tüm içerikleri gördün!</Text>
          <Text style={styles.endSubText}>Yeni paylaşımlar için tekrar kontrol et</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, isInitialLoading, isListLoading, isLoadingMore, mode, styles]);

  const refreshControl = useMemo(() => {
    if (!onRefresh) {
      return undefined;
    }

    return (
      <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    );
  }, [onRefresh, refreshing]);

  return (
    <FlatList
      ref={listRef}
      data={routes}
      renderItem={renderPost}
      keyExtractor={(item) => item.id || ''}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      updateCellsBatchingPeriod={50}
      windowSize={5}
      initialNumToRender={3}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      style={styles.flatList}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    />
  );
};

export default RouteFeedList;

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedRefreshControl from '../common/ThemedRefreshControl';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Profile } from '../../model/profile.model';
import { SOCIAL_LIST_PAGE_SIZE } from '../../constants/socialListPageSize';
import { mergeUniqueProfiles } from '../../utils/mergeUniqueProfiles';
import { mergeProfilesPreservingUnchanged } from '../../utils/listRefreshUtils';
import { sanitizeSocialListSearchInput } from '../../utils/socialListSearch';
import { buildProfileNavigationParams } from '../../utils/profileSlug';
import { showToast } from '../../utils/alert';
import { showConfirm } from '../common/ConfirmModal';
import UserModel from '../../model/user.model';
import { useAuth } from '../../context/AuthContext';
import UserCard from '../user/UserCard';
import { SocialListHeader } from '../header/Header';
import { SocialListFollowChip } from './SocialListFollowChip';
import { KeyboardAwareContainer } from '../common';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

export type FetchSocialProfilesPage = (
  offset: number,
  limit: number,
  searchQuery: string,
) => Promise<{ items: Profile[]; totalCount: number }>;

type SocialUserListScreenProps = {
  navigation: any;
  title: string;
  emptyMessage: string;
  summaryLabel: (total: number) => string;
  fetchPage: FetchSocialProfilesPage;
  listKey: string;
  initialTotalHint?: number;
};

export const SocialUserListScreen: React.FC<SocialUserListScreenProps> = ({
  navigation,
  title,
  emptyMessage,
  summaryLabel,
  fetchPage,
  listKey,
  initialTotalHint,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    listTop: {
      paddingTop: 8,
      paddingBottom: 8,
      gap: 6,
    },
    summaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
      letterSpacing: -0.1,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 34,
      paddingHorizontal: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderRadius: 8,
      backgroundColor: t.surfaceMuted,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 0,
      fontSize: 14,
      color: t.textPrimary,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    listContentGrow: {
      flexGrow: 1,
    },
    emptyWrap: {
      flex: 1,
      paddingTop: 32,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footer: {
      paddingVertical: 8,
      alignItems: 'center',
    },
  }));

  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id;

  const [items, setItems] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [followingById, setFollowingById] = useState<Record<string, boolean>>(
    {},
  );
  const [followActionLoading, setFollowActionLoading] = useState<
    Record<string, boolean>
  >({});
  const isFocused = useIsFocused();

  const displayTotal =
    totalCount !== null ? totalCount : (initialTotalHint ?? null);

  const activeSearch = sanitizeSocialListSearchInput(debouncedSearch);

  const assumeAllFollowed = Boolean(
    currentUserId && listKey === `following:${currentUserId}`,
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 320);

    return () => {
      clearTimeout(handle);
    };
  }, [searchText]);

  useEffect(() => {
    setItems([]);
    setTotalCount(null);
    setHasMore(true);
    setFollowingById({});
    setFollowActionLoading({});
  }, [listKey, activeSearch]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      try {
        const result = await fetchPage(0, SOCIAL_LIST_PAGE_SIZE, activeSearch);

        if (cancelled) {
          return;
        }

        setItems(result.items);
        setTotalCount(result.totalCount);
        setHasMore(result.items.length < result.totalCount);
      } catch (error) {
        if (!cancelled) {
          console.error('Social list load error:', error);
          setItems([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [listKey, isFocused, fetchPage, activeSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const result = await fetchPage(0, SOCIAL_LIST_PAGE_SIZE, activeSearch);

      setItems((previousItems) => {
        if (previousItems.length > 0) {
          return mergeProfilesPreservingUnchanged(previousItems, result.items);
        }

        return result.items;
      });
      setTotalCount(result.totalCount);
      setHasMore(result.items.length < result.totalCount);
    } catch (error) {
      console.error('Social list refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, activeSearch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }

    setLoadingMore(true);

    try {
      const offset = items.length;
      const result = await fetchPage(offset, SOCIAL_LIST_PAGE_SIZE, activeSearch);
      const merged = mergeUniqueProfiles(items, result.items);

      setTotalCount(result.totalCount);
      setItems(merged);
      setHasMore(merged.length < result.totalCount);
    } catch (error) {
      console.error('Social list load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, items, loading, loadingMore, activeSearch]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const targetIds = [...new Set(items.map((profile) => profile.id))].filter(
      (id) => id !== currentUserId,
    );

    if (targetIds.length === 0) {
      return;
    }

    if (assumeAllFollowed) {
      setFollowingById((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const id of targetIds) {
          if (next[id] === undefined) {
            next[id] = true;
            changed = true;
          }
        }

        return changed ? next : prev;
      });

      return;
    }

    const missing = targetIds.filter((id) => followingById[id] === undefined);

    if (missing.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const followed = await UserModel.getFollowedIdsAmong(
          currentUserId,
          missing,
        );

        if (cancelled) {
          return;
        }

        setFollowingById((prev) => {
          const next = { ...prev };

          for (const id of missing) {
            next[id] = followed.has(id);
          }

          return next;
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Follow batch load error:', error);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, items, assumeAllFollowed, followingById]);

  const runFollow = useCallback(
    async (targetId: string) => {
      if (!currentUserId) {
        return;
      }

      setFollowActionLoading((prev) => ({ ...prev, [targetId]: true }));

      const result = await UserModel.followUser(currentUserId, targetId);

      setFollowActionLoading((prev) => ({ ...prev, [targetId]: false }));

      if (result.success) {
        setFollowingById((prev) => ({ ...prev, [targetId]: true }));
        showToast('success', result.message, '');

        return;
      }

      showToast('error', result.message, 'Hata');
    },
    [currentUserId],
  );

  const runUnfollow = useCallback(
    async (targetId: string) => {
      if (!currentUserId) {
        return;
      }

      setFollowActionLoading((prev) => ({ ...prev, [targetId]: true }));

      const result = await UserModel.unfollowUser(currentUserId, targetId);

      setFollowActionLoading((prev) => ({ ...prev, [targetId]: false }));

      if (result.success) {
        setFollowingById((prev) => ({ ...prev, [targetId]: false }));
        showToast('success', result.message, '');

        return;
      }

      showToast('error', result.message, 'Hata');
    },
    [currentUserId],
  );

  const handleFollowChipPress = useCallback(
    (targetId: string) => {
      if (!currentUserId) {
        return;
      }

      const explicit = followingById[targetId];
      const isFollowing =
        explicit !== undefined ? Boolean(explicit) : assumeAllFollowed;

      if (isFollowing) {
        showConfirm({
          title: 'Takibi bırak',
          message: 'Bu kullanıcıyı takipten çıkarmak istiyor musun?',
          icon: 'account-remove-outline',
          actions: [
            { key: 'cancel', label: 'İptal', variant: 'ghost' },
            {
              key: 'unfollow',
              label: 'Takibi bırak',
              variant: 'destructive',
              onPress: () => {
                void runUnfollow(targetId);
              },
            },
          ],
        });

        return;
      }

      void runFollow(targetId);
    },
    [assumeAllFollowed, currentUserId, followingById, runFollow, runUnfollow],
  );

  const isInitialLoading = loading && items.length === 0;

  const listEmpty = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
        </View>
      );
    }

    const noResultsCopy =
      activeSearch.length > 0
        ? 'Aramanızla eşleşen kullanıcı yok'
        : emptyMessage;

    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{noResultsCopy}</Text>
      </View>
    );
  };

  const listFooter = () => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.textPrimary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SocialListHeader navigation={navigation} title={title} />
      <KeyboardAwareContainer enableScrollView={false} keyboardVerticalOffset={0}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const showFollowChip =
            Boolean(currentUserId) && item.id !== currentUserId;
          const explicitFollow = followingById[item.id];
          const followKnown =
            explicitFollow !== undefined || assumeAllFollowed;
          const followIsOn =
            explicitFollow !== undefined
              ? Boolean(explicitFollow)
              : assumeAllFollowed;

          return (
            <UserCard
              user={item}
              compact
              endAdornment={
                showFollowChip ? (
                  <SocialListFollowChip
                    isKnown={followKnown}
                    isLoading={Boolean(followActionLoading[item.id])}
                    isFollowing={followIsOn}
                    onPress={() => {
                      handleFollowChipPress(item.id);
                    }}
                  />
                ) : undefined
              }
              onPress={() => {
                if (!item.username) {
                  return;
                }

                navigation.navigate(
                  'ProfileMain',
                  buildProfileNavigationParams({ username: item.username }),
                );
              }}
            />
          );
        }}
        ListHeaderComponent={
          <View style={styles.listTop}>
            <View style={styles.searchRow}>
              <Icon
                name="magnify"
                size={18}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="İsim veya kullanıcı adı"
                placeholderTextColor={theme.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="never"
                returnKeyType="search"
              />
              {searchText.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Aramayı temizle"
                >
                  <Icon name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {displayTotal !== null && items.length > 0 ? (
              <Text style={styles.summaryText}>
                {summaryLabel(displayTotal)}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentGrow,
        ]}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
      />
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedRefreshControl from '../components/common/ThemedRefreshControl';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationsHeader } from '../components/header/Header';
import { useIsFocused } from '@react-navigation/native';
import NotificationModel, { NotificationType } from '../model/notifications.model';
import { useAuth } from '../context/AuthContext';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import { getTimeAgo } from '../utils/timeAgo';
import CachedProfileAvatar from '../components/common/CachedProfileAvatar';
import { profileAvatarCache } from '../services/ProfileAvatarCache';
import {
  getCachedNotifications,
  setCachedNotifications,
} from '../services/NotificationsListCache';
import { mergeNotificationsPreservingUnchanged } from '../utils/listRefreshUtils';
import { formatNotificationActionLabel } from '../utils/notificationLabel';
import { useAppTheme } from '../context/AppThemeContext';
import { useThemedStyles } from '../theme/useThemedStyles';

const DEFAULT_NOTIFICATION_COLOR = '#8E8E93';

const isSenderProfileMissing = (item: NotificationType): boolean => {
  if (!item.profiles) {
    profileAvatarCache.markProfileDeleted(item.sender_id);
    return true;
  }

  if (item.profiles.is_deleted) {
    profileAvatarCache.markProfileDeleted(item.sender_id);
    return true;
  }

  return false;
};

const getSenderUsername = (item: NotificationType): string => {
  if (item.profiles?.username) {
    return item.profiles.username;
  }

  return 'silinmiş hesap';
};

const getNotificationLabel = (item: NotificationType): string => {
  const typeLabel = item.notification_types?.label;

  if (typeLabel) {
    return formatNotificationActionLabel(typeLabel, item.message);
  }

  return item.message ?? 'bildirim gönderdi';
};

interface NotificationItemProps {
  item: NotificationType;
  action: () => void;
  label: string;
  onPressProfile: (username: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  action,
  label,
  onPressProfile,
}) => {
  const styles = useThemedStyles((t) => ({
    notificationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
      backgroundColor: t.background,
    },
    unreadNotification: {
      backgroundColor: t.id === 'light' ? '#F8F9FF' : t.surfaceMuted,
    },
    notificationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notificationText: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      flexWrap: 'wrap',
    },
    usernameTouchable: {
      marginRight: 4,
    },
    username: {
      fontWeight: '600',
      color: t.textPrimary,
      lineHeight: 20,
      fontSize: 15,
    },
    usernameMuted: {
      color: t.textMuted,
    },
    message: {
      color: t.textSecondary,
      lineHeight: 20,
      fontSize: 15,
    },
    timeText: {
      fontSize: 13,
      color: t.textMuted,
      marginTop: 4,
      marginLeft: 8,
    },
  }));

  const profileMissing = isSenderProfileMissing(item);
  const typeMeta = item.notification_types;
  const iconName = typeMeta?.icon_name ?? 'bell';
  const iconColor = typeMeta?.color ?? DEFAULT_NOTIFICATION_COLOR;

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification,
      ]}
      activeOpacity={0.7}
      onPress={action}
    >
      <View style={styles.notificationLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${iconColor}20` },
          ]}
        >
          <Icon name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationText}>
            <TouchableOpacity
              style={styles.usernameTouchable}
              disabled={profileMissing || !item.profiles?.username}
              onPress={() => {
                if (!item.profiles?.username) {
                  return;
                }

                onPressProfile(item.profiles.username);
              }}
            >
              <Text
                style={[
                  styles.username,
                  profileMissing && styles.usernameMuted,
                ]}
              >
                {getSenderUsername(item)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.message}>{label}</Text>
          </View>

          <Text style={styles.timeText}>{getTimeAgo(item.created_at)}</Text>
        </View>
      </View>

      <CachedProfileAvatar
        userId={item.sender_id}
        imageUrl={item.profiles?.image_url}
        imagePreviewUrl={item.profiles?.image_preview_url}
        profileDeleted={profileMissing}
        size={44}
      />
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    loaderWrap: {
      paddingTop: 20,
      alignItems: 'center',
    },
    list: {
      flex: 1,
      backgroundColor: t.background,
    },
    listContent: {
      flexGrow: 1,
      backgroundColor: t.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: t.textMuted,
      textAlign: 'center',
    },
  }));

  const { user, setUnreadNotificationCount } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const fetchNotifications = useCallback(
    async (options: { showFullLoader?: boolean; silent?: boolean } = {}) => {
      const showFullLoader = options.showFullLoader === true;
      const silent = options.silent === true;

      if (!user?.id) {
        return;
      }

      try {
        if (showFullLoader) {
          setIsInitialLoading(true);
        }

        const fetchedNotifications = await NotificationModel.getNotifications({
          userId: user.id,
        });

        setCachedNotifications(user.id, fetchedNotifications);
        setNotifications((previousNotifications) => {
          if (silent && previousNotifications.length > 0) {
            return mergeNotificationsPreservingUnchanged(
              previousNotifications,
              fetchedNotifications,
            );
          }

          return fetchedNotifications;
        });
        hasLoadedOnceRef.current = true;
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        if (showFullLoader) {
          setIsInitialLoading(false);
        }

        setRefreshing(false);
      }
    },
    [user?.id],
  );

  const markNotificationsRead = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      await NotificationModel.markAsRead({ userId: user.id });
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [setUnreadNotificationCount, user?.id]);

  useEffect(() => {
    if (!isFocused || !user?.id) {
      return;
    }

    const cached = getCachedNotifications(user.id);

    if (cached && cached.length > 0) {
      setNotifications(cached);
      setIsInitialLoading(false);
      hasLoadedOnceRef.current = true;
      void fetchNotifications({ silent: true });
    } else if (!hasLoadedOnceRef.current) {
      void fetchNotifications({ showFullLoader: true });
    } else {
      void fetchNotifications({ silent: true });
    }

    void markNotificationsRead();
  }, [
    isFocused,
    user?.id,
    fetchNotifications,
    markNotificationsRead,
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchNotifications({ silent: true });
  }, [fetchNotifications]);

  const navigateToProfile = useCallback(
    (username: string) => {
      navigation.navigate('ProfileStack', {
        screen: 'ProfileMain',
        params: buildProfileNavigationParams({ username }),
      });
    },
    [navigation],
  );

  const navigateToRoute = useCallback(
    (routeId: string) => {
      navigation.navigate('HomeStack', {
        screen: 'RouteDetail',
        params: { routeId },
      });
    },
    [navigation],
  );

  const getNotificationAction = useCallback(
    (item: NotificationType): (() => void) => {
      const navTarget = item.notification_types?.nav_target ?? 'route';

      if (navTarget === 'profile') {
        return () => {
          if (!item.profiles?.username) {
            return;
          }

          navigateToProfile(item.profiles.username);
        };
      }

      if (navTarget === 'route' && item.entity_id) {
        return () => {
          navigateToRoute(item.entity_id);
        };
      }

      return () => {};
    },
    [navigateToProfile, navigateToRoute],
  );

  const renderItem = ({ item }: { item: NotificationType }) => (
    <NotificationItem
      item={item}
      action={getNotificationAction(item)}
      label={getNotificationLabel(item)}
      onPressProfile={navigateToProfile}
    />
  );

  if (isInitialLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <NotificationsHeader />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={theme.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <NotificationsHeader />
      <FlatList
        data={notifications}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bildirim bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;

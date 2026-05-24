import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationsHeader } from '../components/header/Header';
import { useIsFocused } from '@react-navigation/native';
import NotificationModel, {
  NotificationType,
  NotificationEntityType,
} from '../model/notifications.model';
import { useAuth } from '../context/AuthContext';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import { useNavigation } from '@react-navigation/native';
import { getTimeAgo } from '../utils/timeAgo';
import CachedProfileAvatar from '../components/common/CachedProfileAvatar';
import { profileAvatarCache } from '../services/ProfileAvatarCache';
import {
  getCachedNotifications,
  setCachedNotifications,
} from '../services/NotificationsListCache';
import { mergeNotificationsPreservingUnchanged } from '../utils/listRefreshUtils';

const renderNotificationIcon = (type: NotificationEntityType) => {
  switch (type) {
    case 'like':
      return <Icon name="heart" size={20} color="#FF3B30" />;
    case 'comment':
      return <Icon name="comment" size={20} color="#34C759" />;
    case 'follow':
      return <Icon name="account-plus" size={20} color="#007AFF" />;
    case 'mention':
      return <Icon name="at" size={20} color="#AF52DE" />;
    default:
      return <Icon name="bell" size={20} color="#8E8E93" />;
  }
};

const getNotificationColor = (type: NotificationEntityType) => {
  switch (type) {
    case 'like':
      return '#FF3B30';
    case 'comment':
      return '#34C759';
    case 'follow':
      return '#007AFF';
    case 'mention':
      return '#AF52DE';
    default:
      return '#8E8E93';
  }
};

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

interface NotificationItemProps {
  item: NotificationType;
  action: () => void;
  label: string;
  navigation: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  action,
  label,
  navigation,
}) => {
  const profileMissing = isSenderProfileMissing(item);

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
            { backgroundColor: `${getNotificationColor(item.entity_type)}20` },
          ]}
        >
          {renderNotificationIcon(item.entity_type)}
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

                navigation.navigate(
                  'ProfileMain' as never,
                  buildProfileNavigationParams({
                    username: item.profiles.username,
                  }) as never,
                );
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
  const { user, setUnreadNotificationCount } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
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

  type NotificationAction = {
    action: () => void;
    label: string;
  };

  const notificationHandlers = {
    follow: (item: NotificationType) => ({
      action: () => {
        if (!item.profiles?.username) {
          return;
        }

        navigation.navigate(
          'ProfileMain' as never,
          buildProfileNavigationParams({
            username: item.profiles.username,
          }) as never,
        );
      },
      label: 'seni takip etti',
    }),
    like: (item: NotificationType) => ({
      action: () => {
        navigation.navigate('RouteDetail' as never, { routeId: item.entity_id } as never);
      },
      label: 'rotanı beğendi',
    }),
    comment: (item: NotificationType) => ({
      action: () => {
        navigation.navigate('RouteDetail' as never, { routeId: item.entity_id } as never);
      },
      label: 'yorum yaptı',
    }),
    mention: (item: NotificationType) => ({
      action: () => {
        navigation.navigate('RouteDetail' as never, { routeId: item.entity_id } as never);
      },
      label: 'etiketledi',
    }),
  };

  const getNotificationHandler = (item: NotificationType): NotificationAction => {
    return notificationHandlers[item.entity_type](item);
  };

  const renderItem = ({ item }: { item: NotificationType }) => {
    const { action, label } = getNotificationHandler(item);

    return (
      <NotificationItem
        item={item}
        action={action}
        label={label}
        navigation={navigation}
      />
    );
  };

  if (isInitialLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <NotificationsHeader navigation={navigation} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#333" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NotificationsHeader navigation={navigation} />
      <FlatList
        data={notifications}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333', '#121212']}
            tintColor="#000000"
            titleColor="#000000"
          />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderWrap: {
    paddingTop: 20,
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
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
    color: '#000',
    lineHeight: 20,
    fontSize: 15,
  },
  usernameMuted: {
    color: '#8E8E93',
  },
  message: {
    color: '#8E8E93',
    lineHeight: 20,
    fontSize: 15,
  },
  timeText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    marginLeft: 8,
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
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default NotificationsScreen;

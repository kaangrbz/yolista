import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { RefreshControl } from 'react-native'; // Add this line
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationsHeader } from '../components/header/Header';
import { useIsFocused } from '@react-navigation/native';
import NotificationModel, { NotificationType, NotificationEntityType } from '../model/notifications.model';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { getTimeAgo } from '../utils/timeAgo';
import { Seperator } from '../components';

const NotificationsScreen = () => {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [notifications, setNotifications] = React.useState<NotificationType[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [lastCreatedAt, setLastCreatedAt] = React.useState<string | null>(null);

  useEffect(() => {
    setIsLoadingNotifications(true);
    if (isFocused && user?.id) {
      fetchNotifications();
    }
  }, [isFocused, user?.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user?.id) {
      timer = setInterval(() => {
        NotificationModel.markAsRead({ userId: user.id });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [user?.id]);

  const fetchNotifications = async (type: 'initial' | 'loadMore' = 'initial') => {
    try {
      if (!user?.id) return;
      
      // const _lastCreatedAt = type === 'loadMore' ? notifications[notifications.length - 1].created_at : null;
      
      // if (lastCreatedAt === _lastCreatedAt) {
      //   setIsLoadingNotifications(false);
      //   return;
      // }
      // setLastCreatedAt(_lastCreatedAt);

      const fetchedNotifications = await NotificationModel.getNotifications({ userId: user.id});
      // setLastCreatedAt(fetchedNotifications[fetchedNotifications.length - 1].created_at);

      if (type === 'loadMore') {
        setNotifications(fetchedNotifications);
      } else {
        setNotifications(fetchedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setTimeout(() => {
        setIsLoadingNotifications(false);
      }, 200);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [user?.id]);

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

  type NotificationAction = {
    action: () => void;
    label: string;
  };

  const notificationHandlers = {
    follow: (item: NotificationType, navigation: any) => ({
      action: () => {
        navigation.navigate('ProfileMain', { userId: item.sender_id });
      },
      label: 'seni takip etti'
    }),
    like: (item: NotificationType, navigation: any) => ({
      action: () => {
        navigation.navigate('RouteDetail', { routeId: item.entity_id });
      },
      label: 'rotanı beğendi'
    }),
    comment: (item: NotificationType, navigation: any) => ({
      action: () => {
        navigation.navigate('RouteDetail', { routeId: item.entity_id });
      },
      label: 'yorum yaptı'
    }),
    mention: (item: NotificationType, navigation: any) => ({
      action: () => {
        navigation.navigate('RouteDetail', { routeId: item.entity_id });
      },
      label: 'etiketledi'
    })
  };

  const getNotificationHandler = (item: NotificationType, navigation: any): NotificationAction => {
    return notificationHandlers[item.entity_type](item, navigation);
  };

  const renderItem = ({ item }: { item: NotificationType }) => {
    const { action, label } = getNotificationHandler(item, navigation);

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
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.entity_type) + '20' }]}>
            {renderNotificationIcon(item.entity_type)}
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationText}>
                <TouchableOpacity style={styles.username} onPress={()=> {
                  navigation.navigate('ProfileMain', { userId: item.sender_id });
                }}>
                  <Text style={styles.username}>{item.profiles.username}</Text>
                </TouchableOpacity>
              <Text style={styles.message}>{label}</Text>
            </View>

            <Text style={styles.timeText}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>
        {item.profiles.image_url && (
          <Image
            source={{ uri: item.profiles.image_url }}
            style={styles.userImage}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoadingNotifications) {
    return ( 
      <SafeAreaView style={styles.container}>
        <NotificationsHeader />
        <View style={{ paddingTop: 20 }}>
          <ActivityIndicator size="small" color="#333" />
        </View>
      </SafeAreaView>
    );
  }

  // const handleLoadMore = async () => {
  //   console.log('handleLoadMore');
  //   setIsLoadingMore(true);
    
  //   await fetchNotifications('loadMore');
  //   setTimeout(() => {
  //     setIsLoadingMore(false);
  //   }, 1000);
    
  // };

  return (
    <SafeAreaView style={styles.container}>
      <NotificationsHeader />
      <View style={styles.container}>
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
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#333" style={{ paddingVertical: 10 }} />
            ) : null
          }
          // onEndReached={handleLoadMore}
          // onEndReachedThreshold={0.5}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  notificationCount: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  listContent: {
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
  },
  username: {
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
    lineHeight: 20,
    fontSize: 15,
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
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
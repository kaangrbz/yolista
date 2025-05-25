import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseHeader, NotificationsHeader } from '../components/header/Header';

type NotificationType = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  username: string;
  message: string;
  time: string;
  read: boolean;
  userImage?: string;
};

const NotificationsScreen = () => {
  // Mock data - replace with your actual data source
  const [notifications, setNotifications] = React.useState<NotificationType[]>([
    {
      id: '1',
      type: 'like',
      username: 'johndoe',
      message: 'liked your route',
      time: '2h',
      read: false,
      userImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: '2',
      type: 'comment',
      username: 'sarahsmith',
      message: 'commented: "Great route!"',
      time: '5h',
      read: false,
      userImage: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
      id: '3',
      type: 'follow',
      username: 'mikejohnson',
      message: 'started following you',
      time: '1d',
      read: true,
      userImage: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
      id: '4',
      type: 'mention',
      username: 'traveler123',
      message: 'mentioned you in a comment',
      time: '2d',
      read: true,
      userImage: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'account-plus';
      case 'mention':
        return 'at';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
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

  const renderItem = ({ item }: { item: NotificationType }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.notificationLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Icon 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.username} </Text>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
      {item.userImage && (
        <Image 
          source={{ uri: item.userImage }} 
          style={styles.userImage} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <NotificationsHeader />
      
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingBottom: 20,
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
  },
  notificationText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  username: {
    fontWeight: '600',
    color: '#000',
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
});

export default NotificationsScreen;
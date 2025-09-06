import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import UniversalPost from '../UniversalPost';

interface ProfileSavedPostsProps {
  savedPosts: RouteWithProfile[];
  currentUserId: string | null;
}

const ProfileSavedPosts: React.FC<ProfileSavedPostsProps> = ({
  savedPosts,
  currentUserId,
}) => {
  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="bookmark-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz kaydedilen gönderi yok</Text>
    </View>
  );

  const renderPostItem = ({ item }: { item: RouteWithProfile }) => (
    <UniversalPost
      key={item.id}
      postId={item.id || ''}
      userId={currentUserId}
    />
  );

  if (savedPosts.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={savedPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id || ''}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default ProfileSavedPosts;

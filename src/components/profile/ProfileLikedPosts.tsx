import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import UniversalPost from '../UniversalPost';

interface ProfileLikedPostsProps {
  likedPosts: RouteWithProfile[];
  currentUserId: string | null;
}

const ProfileLikedPosts: React.FC<ProfileLikedPostsProps> = ({
  likedPosts,
  currentUserId,
}) => {
  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="heart-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz beğenilen gönderi yok</Text>
    </View>
  );

  const renderPostItem = ({ item }: { item: RouteWithProfile }) => (
    <UniversalPost
      key={item.id}
      postId={item.id || ''}
      userId={currentUserId}
    />
  );

  if (likedPosts.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={likedPosts}
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

export default ProfileLikedPosts;

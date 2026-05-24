import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import UniversalPost from '../UniversalPost';
import { useListPostImagesBatch } from '../../hooks/useListPostImagesBatch';

interface ProfileLikedPostsProps {
  likedPosts: RouteWithProfile[];
  currentUserId: string | null;
  loadingMore?: boolean;
  initialLoading?: boolean;
}

const ProfileLikedPosts: React.FC<ProfileLikedPostsProps> = ({
  likedPosts,
  currentUserId,
  loadingMore = false,
  initialLoading = false,
}) => {
  const { rowsByPostId } = useListPostImagesBatch(likedPosts);

  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="heart-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz beğenilen gönderi yok</Text>
    </View>
  );

  const renderPostItem = useCallback(({ item }: { item: RouteWithProfile }) => {
    const postId = item.id || '';

    return (
      <UniversalPost
        key={item.id}
        postId={postId}
        userId={currentUserId}
        initialRoute={item}
        batchImages={true}
        prefetchedImageRows={rowsByPostId[postId]}
      />
    );
  }, [currentUserId, rowsByPostId]);

  if (initialLoading) {
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color="#1DA1F2" />
      </View>
    );
  }

  if (likedPosts.length === 0) {
    return renderEmptyState();
  }

  const renderFooter = () => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color="#1DA1F2" />
      </View>
    );
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={likedPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id || ''}
        ListFooterComponent={renderFooter}
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
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ProfileLikedPosts;

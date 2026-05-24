import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import UniversalPost from '../UniversalPost';
import { useListPostImagesBatch } from '../../hooks/useListPostImagesBatch';

interface ProfileSavedPostsProps {
  savedPosts: RouteWithProfile[];
  currentUserId: string | null;
  loadingMore?: boolean;
  initialLoading?: boolean;
}

const ProfileSavedPosts: React.FC<ProfileSavedPostsProps> = ({
  savedPosts,
  currentUserId,
  loadingMore = false,
  initialLoading = false,
}) => {
  const { rowsByPostId } = useListPostImagesBatch(savedPosts);

  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="bookmark-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz kaydedilen gönderi yok</Text>
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

  if (savedPosts.length === 0) {
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
        data={savedPosts}
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

export default ProfileSavedPosts;

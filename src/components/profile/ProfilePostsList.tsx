import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useListPostImagesBatch } from '../../hooks/useListPostImagesBatch';
import ProfilePostItem from './ProfilePostItem';

interface ProfilePostsListProps {
  routes: RouteWithProfile[];
  currentUserId: string | null;
}

const ProfilePostsList: React.FC<ProfilePostsListProps> = ({
  routes,
  currentUserId,
}) => {
  const { rowsByPostId } = useListPostImagesBatch(routes);

  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="image-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz gönderi yok</Text>
    </View>
  );

  const renderPostItem = useCallback(({ item }: { item: RouteWithProfile }) => {
    const postId = item.id || '';

    return (
      <ProfilePostItem
        item={item}
        currentUserId={currentUserId}
        prefetchedImageRows={rowsByPostId[postId]}
      />
    );
  }, [currentUserId, rowsByPostId]);

  if (routes.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={routes}
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

export default ProfilePostsList;

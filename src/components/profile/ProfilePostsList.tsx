import React, { useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useListPostImagesBatch } from '../../hooks/useListPostImagesBatch';
import ProfilePostItem from './ProfilePostItem';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface ProfilePostsListProps {
  routes: RouteWithProfile[];
  currentUserId: string | null;
}

const ProfilePostsList: React.FC<ProfilePostsListProps> = ({
  routes,
  currentUserId,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    listContainer: {
      flex: 1,
      backgroundColor: t.background,
    },
    flatList: {
      backgroundColor: t.background,
    },
    emptyPosts: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: t.textSecondary,
      marginTop: 12,
    },
  }));

  const { rowsByPostId } = useListPostImagesBatch(routes);

  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="image-outline" size={48} color={theme.textMuted} />
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
        style={styles.flatList}
      />
    </View>
  );
};

export default ProfilePostsList;

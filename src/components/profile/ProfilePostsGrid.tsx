import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import ProfilePostsGridSkeleton from './ProfilePostsGridSkeleton';
import ProfileGridItem from './ProfileGridItem';

interface ProfilePostsGridProps {
  routes: RouteWithProfile[];
  onRoutePress: (routeId: string) => void;
  loading?: boolean;
}

const ProfilePostsGrid: React.FC<ProfilePostsGridProps> = ({
  routes,
  onRoutePress,
  loading = false,
}) => {
  const renderEmptyState = () => (
    <View style={styles.emptyPosts}>
      <Icon name="image-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Henüz gönderi yok</Text>
    </View>
  );

  const renderGridItem = ({ item, index }: { item: RouteWithProfile; index: number }) => (
    <ProfileGridItem
      item={item}
      index={index}
      onRoutePress={onRoutePress}
    />
  );

  if (loading) {
    return <ProfilePostsGridSkeleton />;
  }

  if (routes.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.gridContainer}>
      <FlatList
        data={routes}
        numColumns={3}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id || ''}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContent}
        style={styles.flatList}
        nestedScrollEnabled={true}
        getItemLayout={(data, index) => ({
          length: (Dimensions.get('window').width - 4) / 3,
          offset: ((Dimensions.get('window').width - 4) / 3) * Math.floor(index / 3),
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    minHeight: 300, // Minimum height to ensure visibility
  },
  flatList: {
    flexGrow: 1,
  },
  gridContent: {
    flexGrow: 1,
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

export default ProfilePostsGrid;

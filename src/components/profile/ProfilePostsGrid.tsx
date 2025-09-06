import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import CachedImage from '../common/CachedImage';
import ProfilePostsGridSkeleton from './ProfilePostsGridSkeleton';

const { width } = Dimensions.get('window');

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
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => onRoutePress(item.id || '')}
    >
      <CachedImage
        source={{ uri: 'https://picsum.photos/400/400?random=' + index }}
        style={styles.gridImage}
        resizeMode="cover"
        showRetryButton={false}
        fallbackSource={{ uri: 'https://via.placeholder.com/400x400/f0f0f0/999?text=No+Image' }}
      />
    </TouchableOpacity>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    flexGrow: 1,
  },
  gridItem: {
    width: width / 3,
    height: width / 3,
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  gridImage: {
    width: '100%',
    height: '100%',
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

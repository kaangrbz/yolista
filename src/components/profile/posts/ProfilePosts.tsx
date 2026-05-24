import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UniversalPost from '../../UniversalPost';
import { RouteWithProfile } from '../../../model/routes.model';
import { useListPostImagesBatch } from '../../../hooks/useListPostImagesBatch';

const { width } = Dimensions.get('window');

type ViewType = 'grid' | 'list' | 'masonry';

interface ProfilePostsProps {
  routes: RouteWithProfile[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  currentUserId: string | null;
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({
  routes,
  isLoading,
  refreshing,
  onRefresh,
  currentUserId,
  viewType,
  onViewTypeChange,
  fadeAnim,
  scaleAnim,
}) => {
  const { rowsByPostId } = useListPostImagesBatch(routes);

  const getPrefetchedRows = (route: RouteWithProfile) => {
    const postId = route.id || '';

    return rowsByPostId[postId];
  };

  const renderGridView = () => (
    <View style={styles.gridContainer}>
      {routes.map((route, index) => (
        <View key={route.id} style={[styles.gridItem, { width: (width - 60) / 2 }]}>
          <UniversalPost
            postId={route.id || ''}
            userId={currentUserId}
            initialRoute={route}
            batchImages={true}
            prefetchedImageRows={getPrefetchedRows(route)}
            showFullScreen={false}
          />
        </View>
      ))}
    </View>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      {routes.map((route) => (
        <View key={route.id} style={styles.listItem}>
          <UniversalPost
            postId={route.id || ''}
            userId={currentUserId}
            initialRoute={route}
            batchImages={true}
            prefetchedImageRows={getPrefetchedRows(route)}
            showFullScreen={false}
          />
        </View>
      ))}
    </View>
  );

  const renderMasonryView = () => (
    <View style={styles.masonryContainer}>
      {routes.map((route, index) => (
        <View
          key={route.id}
          style={[
            styles.masonryItem,
            {
              width: (width - 60) / 2,
              height: index % 3 === 0 ? 200 : 150,
              marginTop: index > 1 ? 10 : 0,
            },
          ]}
        >
          <UniversalPost
            postId={route.id || ''}
            userId={currentUserId}
            initialRoute={route}
            batchImages={true}
            prefetchedImageRows={getPrefetchedRows(route)}
            showFullScreen={false}
          />
        </View>
      ))}
    </View>
  );

  const renderPosts = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      );
    }

    if (routes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="image-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Henüz paylaşım yok</Text>
          <Text style={styles.emptySubtext}>
            İlk gönderinizi paylaşmak için + butonuna dokunun
          </Text>
        </View>
      );
    }

    switch (viewType) {
      case 'grid':
        return renderGridView();
      case 'list':
        return renderListView();
      case 'masonry':
        return renderMasonryView();
      default:
        return renderGridView();
    }
  };

  return (
    <View style={styles.container}>
      {/* View Type Selector */}
      <Animated.View
        style={[
          styles.viewTypeContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.viewTypeButton, viewType === 'grid' && styles.activeViewTypeButton]}
          onPress={() => onViewTypeChange('grid')}
          activeOpacity={0.7}
        >
          <Icon name="view-grid" size={20} color={viewType === 'grid' ? '#fff' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTypeButton, viewType === 'list' && styles.activeViewTypeButton]}
          onPress={() => onViewTypeChange('list')}
          activeOpacity={0.7}
        >
          <Icon name="view-list" size={20} color={viewType === 'list' ? '#fff' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTypeButton, viewType === 'masonry' && styles.activeViewTypeButton]}
          onPress={() => onViewTypeChange('masonry')}
          activeOpacity={0.7}
        >
          <Icon name="view-module" size={20} color={viewType === 'masonry' ? '#fff' : '#666'} />
        </TouchableOpacity>
      </Animated.View>

      {/* Posts Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.postsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {renderPosts()}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  viewTypeButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  activeViewTypeButton: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
  },
  scrollView: {
    flex: 1,
  },
  postsContainer: {
    padding: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridItem: {
    marginBottom: 10,
  },
  listContainer: {
    gap: 10,
  },
  listItem: {
    marginBottom: 10,
  },
  masonryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  masonryItem: {
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfilePosts;

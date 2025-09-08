import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { RouteWithProfile } from '../model/routes.model';
import { checkFirstTime } from '../utils/welcome';
import { supabase } from '../lib/supabase';
import { HomeHeader } from '../components/header/Header';
import StoriesBar from '../components/StoriesBar';
import UniversalPost from '../components/UniversalPost';
import { useHomePosts } from '../hooks/usePosts';


export const HomeScreen = () => {
  const [userId, setUserId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Mock stories data
  const [stories] = useState([
    { id: '1', username: 'mark_zuckerberg', image_url: 'https://picsum.photos/100/100?random=1', isViewed: false },
    { id: '2', username: 'elon_musk', image_url: 'https://picsum.photos/100/100?random=2', isViewed: true },
    { id: '3', username: 'bill_gates', image_url: 'https://picsum.photos/100/100?random=3', isViewed: true },
    { id: '4', username: 'taylor_swift', image_url: 'https://picsum.photos/100/100?random=4', isViewed: true },
    { id: '5', username: 'jeff_bezos', image_url: 'https://picsum.photos/100/100?random=5', isViewed: true },
  ]);

  // Posts hook
  const { posts: routes, isLoading, refresh: refreshPosts, loadMore, hasMore } = useHomePosts(userId, 10);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
    checkFirstTime();
  }, []);

  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      loadMore().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const handleStoryPress = (storyId: string) => {
    // Story görüntüleme logic'i buraya gelecek
  };

  const handleAddStory = () => {
    // Hikaye ekleme logic'i buraya gelecek
  };
  
  const renderPost = ({ item }: { item: RouteWithProfile }) => (
    <UniversalPost
      postId={item.id || ''}
      userId={userId}
    />
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1DA1F2" />
          {/* <Text style={styles.loadingText}>Daha fazla yükleniyor...</Text> */}
        </View>
      );
    }
    
    if (!hasMore && !isLoading) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>✨ Tüm içerikleri gördün!</Text>
          <Text style={styles.endSubText}>Yeni paylaşımlar için tekrar kontrol et</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderHeader = () => (
    <StoriesBar
      stories={stories}
      onStoryPress={handleStoryPress}
      onAddStory={handleAddStory}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />
      
      <FlatList
        data={routes}
        renderItem={renderPost}
        keyExtractor={(item) => item.id || ''}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
    flex: 1,
  },
  categoriesContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  endContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  endSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 25,
    marginRight: 12,
  },
  categoryText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  routesContainer: {
  },
  noRoutesContainer: {
    paddingTop: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeCard: {
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  routeImage: {
    width: '100%',
    height: 200,
  },
  routeInfo: {
  },
  routeTitle: {
    fontSize: 18,
    paddingTop: 10,
    paddingHorizontal: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
  },
  noRoutesText: {
    fontSize: 16,
    width: '70%',
    color: '#666',
    textAlign: 'center',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  reactionText: {
    marginLeft: 4,
    color: '#666',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  commentContainer: {
    borderStartWidth: 1,
    borderEndWidth: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    color: '#222',
  },
  commentImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  routeDescription: {
    fontSize: 14,
    paddingHorizontal: 16,
    color: '#666',
  },
  seeMoreText: {
    color: '#666',
    marginTop: 2,
    fontSize: 12,
    paddingHorizontal: 16,
  },
});

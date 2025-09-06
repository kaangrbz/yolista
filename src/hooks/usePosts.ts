import { useState, useEffect, useCallback, useRef } from 'react';
import RouteModel, { RouteWithProfile, GetRoutesProps } from '../model/routes.model';
import { showToast } from '../utils/alert';

export interface PostOptions {
  homeFeed?: {
    loggedUserId: string;
    limit?: number;
  };
  exploreFeed?: {
    categoryId?: number;
    searchQuery?: string;
    limit?: number;
  };
  profileFeed?: {
    userId: string;
    limit?: number;
  };
}

export interface UsePostsResult {
  posts: RouteWithProfile[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const usePosts = (options: PostOptions): UsePostsResult => {
  const [posts, setPosts] = useState<RouteWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Options'ı ref olarak sakla
  const optionsRef = useRef<PostOptions>(options);
  const lastOptionsRef = useRef<string>('');

  // Options değişikliklerini takip et
  const currentOptionsString = JSON.stringify(options);
  
  useEffect(() => {
    if (currentOptionsString !== lastOptionsRef.current) {
      optionsRef.current = options;
      lastOptionsRef.current = currentOptionsString;
      
      // Options değiştiğinde posts'ları sıfırla ve yeniden yükle
      if (isInitialized) {
        setCurrentPage(0);
        setPosts([]);
        setHasMore(true);
        fetchPosts(true);
      }
    }
  }, [currentOptionsString, isInitialized]);

  // Limit'i hesapla
  const getLimit = (): number => {
    if (options.homeFeed?.limit) return options.homeFeed.limit;
    if (options.exploreFeed?.limit) return options.exploreFeed.limit;
    if (options.profileFeed?.limit) return options.profileFeed.limit;
    return 10;
  };


  // Post'ları getir
  const fetchPosts = useCallback(async (reset: boolean = false) => {
    if (isLoading) return;

    // Profile feed için userId kontrolü
    const currentOptions = optionsRef.current;
    if (currentOptions.profileFeed && (!currentOptions.profileFeed.userId || currentOptions.profileFeed.userId === '')) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Reset durumunda sayfa ve posts'ları sıfırla
      let pageToUse = currentPage;
      if (reset) {
        pageToUse = 0;
        setCurrentPage(0);
        setPosts([]);
      }

      // Props'ları oluştur
      const baseProps: GetRoutesProps = {
        onlyMain: true,
        limit: getLimit(),
        offset: pageToUse * getLimit(),
      };

      let props: GetRoutesProps = baseProps;
      if (currentOptions.homeFeed) {
        props = {
          ...baseProps,
          loggedUserId: currentOptions.homeFeed.loggedUserId,
        };
      } else if (currentOptions.exploreFeed) {
        props = {
          ...baseProps,
          categoryId: currentOptions.exploreFeed.categoryId,
          searchQuery: currentOptions.exploreFeed.searchQuery,
        };
      } else if (currentOptions.profileFeed) {
        props = {
          ...baseProps,
          userId: currentOptions.profileFeed.userId,
        };
      }

      const newPosts = await RouteModel.getRoutes(props);

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
      }

      const limit = getLimit();
      const hasMoreData = newPosts.length === limit;
      setHasMore(hasMoreData);
      
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      } else {
        setCurrentPage(1);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Postlar yüklenirken bir hata oluştu');
      setIsLoading(false);
      showToast('error', 'Postlar yüklenirken bir hata oluştu');
    }
  }, [isLoading, currentPage]);

  // Refresh fonksiyonu
  const refresh = useCallback(async () => {
    await fetchPosts(true);
  }, [fetchPosts]);

  // Load more fonksiyonu
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchPosts(false);
    }
  }, [hasMore, isLoading, fetchPosts]);

  // İlk yükleme
  useEffect(() => {
    if (!isInitialized) {
      fetchPosts(true);
      setIsInitialized(true);
    }
  }, [isInitialized, fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
};

// Yardımcı hook'lar
export const useHomePosts = (loggedUserId: string, limit?: number) => {
  return usePosts({
    homeFeed: { loggedUserId, limit }
  });
};

export const useExplorePosts = (categoryId?: number, searchQuery?: string, limit?: number) => {
  return usePosts({
    exploreFeed: { categoryId, searchQuery, limit }
  });
};

export const useProfilePosts = (userId: string, limit?: number) => {
  return usePosts({
    profileFeed: { userId, limit }
  });
};
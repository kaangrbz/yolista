import { useState, useEffect, useCallback, useRef } from 'react';
import RouteModel, { RouteWithProfile, GetRoutesProps } from '../model/routes.model';
import { showToast } from '../utils/alert';
import { mergeRoutesPreservingUnchanged } from '../utils/listRefreshUtils';

type FetchPostsOptions = {
  reset?: boolean;
  silent?: boolean;
};

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
  const isFetchingRef = useRef(false);

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
        void fetchPosts({ reset: true });
      }
    }
  }, [currentOptionsString, isInitialized]);

  // Limit'i hesapla
  const getLimit = (): number => {
    if (options.homeFeed?.limit) {return options.homeFeed.limit;}
    if (options.exploreFeed?.limit) {return options.exploreFeed.limit;}
    if (options.profileFeed?.limit) {return options.profileFeed.limit;}
    return 10;
  };


  // Post'ları getir
  const fetchPosts = useCallback(async (options: FetchPostsOptions = {}) => {
    const reset = options.reset === true;
    const silent = options.silent === true;

    if (isFetchingRef.current) {
      return;
    }

    if (isLoading && !silent) {
      return;
    }

    // Profile feed için userId kontrolü
    const currentOptions = optionsRef.current;
    if (currentOptions.profileFeed && (!currentOptions.profileFeed.userId || currentOptions.profileFeed.userId === '')) {
      return;
    }

    isFetchingRef.current = true;

    try {
      if (!silent) {
        setIsLoading(true);
      }

      setError(null);

      let pageToUse = currentPage;

      if (reset) {
        pageToUse = 0;
        setCurrentPage(0);

        if (!silent) {
          setPosts([]);
        }
      }

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
        setPosts((previousPosts) => {
          if (silent && previousPosts.length > 0) {
            return mergeRoutesPreservingUnchanged(previousPosts, newPosts);
          }

          return newPosts;
        });
      } else {
        setPosts((previousPosts) => {
          const existingIds = new Set(previousPosts.map((post) => post.id));
          const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id));

          return [...previousPosts, ...uniqueNewPosts];
        });
      }

      const limit = getLimit();
      const hasMoreData = newPosts.length === limit;
      setHasMore(hasMoreData);

      if (!reset) {
        setCurrentPage((previousPage) => previousPage + 1);
      } else {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Postlar yüklenirken bir hata oluştu');
      showToast('error', 'Postlar yüklenirken bir hata oluştu');
    } finally {
      isFetchingRef.current = false;

      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [isLoading, currentPage]);

  const refresh = useCallback(async () => {
    await fetchPosts({ reset: true, silent: true });
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchPosts({ reset: false });
    }
  }, [hasMore, isLoading, fetchPosts]);

  useEffect(() => {
    if (!isInitialized) {
      void fetchPosts({ reset: true });
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
    homeFeed: { loggedUserId, limit },
  });
};

export const useExplorePosts = (categoryId?: number, searchQuery?: string, limit?: number) => {
  return usePosts({
    exploreFeed: { categoryId, searchQuery, limit },
  });
};

export const useProfilePosts = (userId: string, limit?: number) => {
  return usePosts({
    profileFeed: { userId, limit },
  });
};

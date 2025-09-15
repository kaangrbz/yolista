import { useState, useCallback, useRef, useEffect } from 'react';
import { ViewToken } from 'react-native';

interface UseLazyListProps<T> {
  data: T[];
  initialLoadCount?: number;
  loadMoreCount?: number;
  threshold?: number;
}

interface UseLazyListReturn<T> {
  visibleData: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: any;
  resetList: () => void;
}

export function useLazyList<T>({
  data,
  initialLoadCount = 10,
  loadMoreCount = 10,
  threshold = 0.5,
}: UseLazyListProps<T>): UseLazyListReturn<T> {
  const [visibleCount, setVisibleCount] = useState(initialLoadCount);
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) {return;}

    setIsLoading(true);

    // Clear previous timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Simulate loading delay for better UX
    loadingTimeoutRef.current = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + loadMoreCount, data.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore, loadMoreCount, data.length]);

  const resetList = useCallback(() => {
    setVisibleCount(initialLoadCount);
    setIsLoading(false);
  }, [initialLoadCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Reset when data changes significantly
  useEffect(() => {
    if (data.length === 0) {
      resetList();
    }
  }, [data.length, resetList]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Optional: Track viewable items for analytics or preloading
    const viewableKeys = viewableItems.map(item => item.key);
    // console.log('Viewable items:', viewableKeys);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: threshold * 100,
    minimumViewTime: 100,
  };

  return {
    visibleData,
    isLoading,
    hasMore,
    loadMore,
    onViewableItemsChanged,
    viewabilityConfig,
    resetList,
  };
}

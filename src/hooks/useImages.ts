import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageService } from '../services/ImageService';
import { feedImageWindow } from '../services/FeedImageWindow';
import { feedImageDownloadLog } from '../services/feedImageDownloadDebug';
import {
  downloadSlidesWithWindow,
  fetchRouteImageRowsForPost,
  metaSlidesFromRows,
  type RouteImageRow,
} from '../services/PostImageSlidesService';
import type { PostImageSlide, PostImageSlideMeta } from '../types/postImage.types';

export type { PostImageSlide, PostImageSlideMeta } from '../types/postImage.types';

interface UseImagesOptions {
  leadSlide?: PostImageSlideMeta | null;
  prefetchedRows?: RouteImageRow[];
  batchMode?: boolean;
  enabled?: boolean;
  slidePrefetchAhead?: number;
  eagerSlides?: boolean;
  downloadGeneration?: number;
  feedIndex?: number;
}

function slidesFromLeadMeta(leadSlide: PostImageSlideMeta | null | undefined): PostImageSlide[] {
  if (!leadSlide) {
    return [];
  }

  return [{ uri: null, ...leadSlide }];
}

function countSlidesWithUri(slides: PostImageSlide[]): number {
  return slides.filter((slide) => slide.uri !== null).length;
}

function mergeSlidesWithExisting(
  routes: RouteImageRow[],
  existingSlides: PostImageSlide[],
): PostImageSlide[] {
  const metaSlides = metaSlidesFromRows(routes);

  return metaSlides.map((slide, index) => ({
    ...slide,
    uri: existingSlides[index]?.uri ?? slide.uri,
  }));
}

export const useImages = (
  postId: string,
  ownerUserId?: string,
  options?: UseImagesOptions,
) => {
  const leadSlide = options?.leadSlide ?? null;
  const batchMode = options?.batchMode === true;
  const prefetchedRows = options?.prefetchedRows;
  const hasPrefetchedRows = Boolean(prefetchedRows && prefetchedRows.length > 0);
  const enabled = options?.enabled !== false;
  const slidePrefetchAhead = options?.slidePrefetchAhead ?? 1;
  const eagerSlides = options?.eagerSlides === true;
  const downloadGeneration = options?.downloadGeneration ?? 0;
  const feedIndex = options?.feedIndex;

  const routesRef = useRef<RouteImageRow[]>([]);
  const slidesRef = useRef<PostImageSlide[]>([]);
  const loadSessionRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const [routesReady, setRoutesReady] = useState(() => {
    if (batchMode) {
      return prefetchedRows !== undefined;
    }

    return hasPrefetchedRows;
  });

  const [slides, setSlides] = useState<PostImageSlide[]>(() => {
    if (hasPrefetchedRows && prefetchedRows) {
      return metaSlidesFromRows(prefetchedRows);
    }

    return slidesFromLeadMeta(leadSlide);
  });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  slidesRef.current = slides;

  const downloadWindow = useCallback(
    async (
      currentSlideIndex: number,
      routes: RouteImageRow[],
      downloadOptions?: { eager?: boolean },
    ) => {
      const session = loadSessionRef.current + 1;
      loadSessionRef.current = session;
      const startGeneration = downloadGeneration;
      const hasVisibleSlide = countSlidesWithUri(slidesRef.current) > 0;
      const shouldEager = downloadOptions?.eager === true || eagerSlides;

      if (!hasVisibleSlide) {
        setLoading(true);
      }

      setError(null);

      feedImageDownloadLog('downloadWindow started', {
        postId,
        feedIndex,
        currentSlideIndex,
        generation: startGeneration,
        enabled,
        eager: shouldEager,
      });

      try {
        const downloadedSlides = await downloadSlidesWithWindow(routes, {
          currentIndex: currentSlideIndex,
          prefetchAhead: slidePrefetchAhead,
          eagerSlides: shouldEager,
          allowNetwork: enabled,
          existingSlides: slidesRef.current,
          postId,
          postIndex: feedIndex,
          downloadGeneration: startGeneration,
          shouldContinue: () =>
            loadSessionRef.current === session &&
            feedImageWindow.getGeneration(postId) === startGeneration &&
            enabledRef.current,
          onSlidesUpdate: (nextSlides) => {
            if (
              loadSessionRef.current !== session ||
              feedImageWindow.getGeneration(postId) !== startGeneration
            ) {
              feedImageDownloadLog('onSlidesUpdate ignored (stale)', {
                postId,
                session,
                generation: startGeneration,
              });
              return;
            }

            slidesRef.current = nextSlides;
            setSlides(nextSlides);

            if (countSlidesWithUri(nextSlides) > 0) {
              setLoading(false);
            }
          },
        });

        if (
          loadSessionRef.current !== session ||
          feedImageWindow.getGeneration(postId) !== startGeneration
        ) {
          feedImageDownloadLog('downloadWindow aborted (stale)', {
            postId,
            session,
            generation: startGeneration,
          });
          return;
        }

        slidesRef.current = downloadedSlides;
        setSlides(downloadedSlides);

        if (countSlidesWithUri(downloadedSlides) === 0 && enabled) {
          setError('Bu gönderi için resim bulunamadı');
        }
      } catch {
        if (loadSessionRef.current === session) {
          setError('Resimler yüklenirken beklenmeyen bir hata oluştu');
          const fallback = slidesFromLeadMeta(leadSlide);
          slidesRef.current = fallback;
          setSlides(fallback);
        }
      } finally {
        if (loadSessionRef.current === session) {
          setLoading(false);
        }
      }
    },
    [downloadGeneration, eagerSlides, enabled, feedIndex, leadSlide, postId, slidePrefetchAhead],
  );

  const loadRoutes = useCallback(async () => {
    if (!postId) {
      routesRef.current = [];
      setRoutesReady(false);
      slidesRef.current = [];
      setSlides([]);
      setLoading(false);
      return;
    }

    if (batchMode && prefetchedRows === undefined) {
      setRoutesReady(false);
      slidesRef.current = slidesFromLeadMeta(leadSlide);
      setSlides(slidesFromLeadMeta(leadSlide));
      setLoading(true);
      setError(null);
      return;
    }

    let routes: RouteImageRow[] = [];

    try {
      if (batchMode && prefetchedRows) {
        routes = prefetchedRows;
      } else if (hasPrefetchedRows && prefetchedRows) {
        routes = prefetchedRows;
      } else {
        const { data, error: routesError } = await fetchRouteImageRowsForPost(postId);

        if (routesError) {
          setError('Resimler yüklenirken hata oluştu');
          slidesRef.current = slidesFromLeadMeta(leadSlide);
          setSlides(slidesFromLeadMeta(leadSlide));
          setLoading(false);
          return;
        }

        routes = data ?? [];
      }

      routesRef.current = routes;
      setRoutesReady(true);

      if (routes.length === 0) {
        slidesRef.current = slidesFromLeadMeta(leadSlide);
        setSlides(slidesFromLeadMeta(leadSlide));
        setLoading(false);
        return;
      }

      const metaSlides = mergeSlidesWithExisting(routes, slidesRef.current);
      slidesRef.current = metaSlides;
      setSlides(metaSlides);

      if (countSlidesWithUri(metaSlides) === 0) {
        setLoading(true);
      }
    } catch {
      setError('Resimler yüklenirken beklenmeyen bir hata oluştu');
      slidesRef.current = slidesFromLeadMeta(leadSlide);
      setSlides(slidesFromLeadMeta(leadSlide));
      setLoading(false);
    }
  }, [
    batchMode,
    hasPrefetchedRows,
    leadSlide,
    postId,
    prefetchedRows,
  ]);

  useEffect(() => {
    if (batchMode) {
      if (prefetchedRows === undefined) {
        setRoutesReady(false);
        slidesRef.current = slidesFromLeadMeta(leadSlide);
        setSlides(slidesFromLeadMeta(leadSlide));
      } else {
        routesRef.current = prefetchedRows;
        setRoutesReady(true);
        const merged = mergeSlidesWithExisting(prefetchedRows, slidesRef.current);
        slidesRef.current = merged;
        setSlides(merged);
      }
    } else if (hasPrefetchedRows && prefetchedRows) {
      routesRef.current = prefetchedRows;
      setRoutesReady(true);
      const merged = mergeSlidesWithExisting(prefetchedRows, slidesRef.current);
      slidesRef.current = merged;
      setSlides(merged);
    } else {
      setRoutesReady(false);
      slidesRef.current = slidesFromLeadMeta(leadSlide);
      setSlides(slidesFromLeadMeta(leadSlide));
    }

    setCurrentIndex(0);
  }, [postId, leadSlide?.width, leadSlide?.height, leadSlide?.imageAlignment, hasPrefetchedRows, prefetchedRows, batchMode]);

  useEffect(() => {
    loadSessionRef.current += 1;
    void loadRoutes();
  }, [loadRoutes, ownerUserId]);

  useEffect(() => {
    loadSessionRef.current += 1;
  }, [enabled, downloadGeneration]);

  useEffect(() => {
    if (!routesReady || routesRef.current.length === 0) {
      return;
    }

    if (!enabled && countSlidesWithUri(slidesRef.current) > 0) {
      return;
    }

    void downloadWindow(currentIndex, routesRef.current);
  }, [currentIndex, downloadWindow, enabled, downloadGeneration, routesReady]);

  const handleImageScroll = (event: any, screenWidth: number) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const downloadAllSlides = useCallback(() => {
    if (!routesReady || routesRef.current.length === 0) {
      return;
    }

    void downloadWindow(currentIndex, routesRef.current, { eager: true });
  }, [currentIndex, downloadWindow, routesReady]);

  const refreshImages = async () => {
    if (postId) {
      ImageService.clearCache();
    }

    loadSessionRef.current += 1;
    await loadRoutes();
  };

  const images = slides
    .map((slide) => slide.uri)
    .filter((uri): uri is string => uri !== null);

  return {
    slides,
    images,
    loading,
    error,
    currentIndex,
    handleImageScroll,
    goToImage,
    downloadAllSlides,
    refreshImages,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { ImageService } from '../services/ImageService';
import {
  downloadSlidesProgressive,
  fetchRouteImageRowsForPost,
  metaSlidesFromRows,
  type RouteImageRow,
} from '../services/PostImageSlidesService';
import type { PostImageSlide, PostImageSlideMeta } from '../types/postImage.types';

export type { PostImageSlide, PostImageSlideMeta } from '../types/postImage.types';

interface UseImagesOptions {
  leadSlide?: PostImageSlideMeta | null;
  /** Batch modunda: undefined = meta henüz gelmedi, dizi = indirmeye hazır. */
  prefetchedRows?: RouteImageRow[];
  /** true ise tek post SELECT yok; prefetchedRows gelene kadar beklenir. */
  batchMode?: boolean;
}

function slidesFromLeadMeta(leadSlide: PostImageSlideMeta | null | undefined): PostImageSlide[] {
  if (!leadSlide) {
    return [];
  }

  return [
    {
      uri: null,
      ...leadSlide,
    },
  ];
}

function countSlidesWithUri(slides: PostImageSlide[]): number {
  return slides.filter((slide) => slide.uri !== null).length;
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

  const [slides, setSlides] = useState<PostImageSlide[]>(() => {
    if (hasPrefetchedRows && prefetchedRows) {
      return metaSlidesFromRows(prefetchedRows);
    }

    return slidesFromLeadMeta(leadSlide);
  });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadRouteImages = useCallback(async () => {
    if (!postId) {
      setSlides([]);
      setLoading(false);
      return;
    }

    if (batchMode && prefetchedRows === undefined) {
      setSlides(slidesFromLeadMeta(leadSlide));
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let routes: RouteImageRow[] = [];

      if (batchMode && prefetchedRows) {
        routes = prefetchedRows;
      } else if (hasPrefetchedRows && prefetchedRows) {
        routes = prefetchedRows;
      } else {
        const { data, error: routesError } = await fetchRouteImageRowsForPost(postId);

        if (routesError) {
          setError('Resimler yüklenirken hata oluştu');
          setSlides(slidesFromLeadMeta(leadSlide));
          return;
        }

        routes = data ?? [];
      }

      if (routes.length === 0) {
        setSlides(slidesFromLeadMeta(leadSlide));
        setLoading(false);
        return;
      }

      const downloadedSlides = await downloadSlidesProgressive(routes, (nextSlides) => {
        setSlides(nextSlides);

        if (countSlidesWithUri(nextSlides) > 0) {
          setLoading(false);
        }
      });

      setSlides(downloadedSlides);

      if (countSlidesWithUri(downloadedSlides) === 0) {
        setError('Bu gönderi için resim bulunamadı');
      }
    } catch {
      setError('Resimler yüklenirken beklenmeyen bir hata oluştu');
      setSlides(slidesFromLeadMeta(leadSlide));
    } finally {
      setLoading(false);
    }
  }, [postId, leadSlide, batchMode, hasPrefetchedRows, prefetchedRows]);

  useEffect(() => {
    if (hasPrefetchedRows && prefetchedRows) {
      setSlides(metaSlidesFromRows(prefetchedRows));
    } else {
      setSlides(slidesFromLeadMeta(leadSlide));
    }

    setCurrentIndex(0);
  }, [postId, leadSlide?.width, leadSlide?.height, leadSlide?.imageAlignment, hasPrefetchedRows, prefetchedRows, batchMode]);

  useEffect(() => {
    loadRouteImages();
  }, [loadRouteImages, ownerUserId]);

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

  const refreshImages = async () => {
    if (postId) {
      ImageService.clearCache();
    }

    await loadRouteImages();
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
    refreshImages,
  };
};

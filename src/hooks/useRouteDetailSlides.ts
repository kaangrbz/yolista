import { useCallback, useEffect, useState } from 'react';
import { trackRouteDetailEvent } from '../analytics/routeDetailAnalytics';
import type { RouteWithProfile } from '../model/routes.model';
import { ImageService } from '../services/ImageService';
import type { PostImageSlide } from '../types/postImage.types';
import { getStopPhotoHintLabel } from '../utils/getStopPhotoHintLabel';
import { normalizeImageDimension } from '../utils/imageUtils';

function stopToSlideMeta(stop: RouteWithProfile): Omit<PostImageSlide, 'uri'> {
  return {
    hint: getStopPhotoHintLabel(stop) || null,
    width: normalizeImageDimension(stop.image_width ?? undefined),
    height: normalizeImageDimension(stop.image_height ?? undefined),
    imageAlignment: stop.image_alignment ?? null,
    imageUrl: stop.image_url ?? null,
    imagePreviewUrl: stop.image_preview_url ?? null,
    userId: stop.user_id ?? null,
  };
}

async function downloadStopSlide(stop: RouteWithProfile): Promise<PostImageSlide> {
  const meta = stopToSlideMeta(stop);
  const userId = stop.user_id || '';

  if (!stop.image_url || !userId) {
    return {
      uri: null,
      ...meta,
    };
  }

  try {
    const uri = await ImageService.downloadPostImage(stop.image_url, userId);

    return {
      uri,
      ...meta,
    };
  } catch {
    return {
      uri: null,
      ...meta,
    };
  }
}

function sortStopsByOrder(stops: RouteWithProfile[]): RouteWithProfile[] {
  return [...stops].sort(
    (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
  );
}

export function useRouteDetailSlides(
  stops: RouteWithProfile[],
  enabled: boolean,
  routeId?: string,
) {
  const [slides, setSlides] = useState<PostImageSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadSlides = useCallback(async () => {
    if (!enabled || stops.length === 0) {
      setSlides([]);
      setLoading(false);
      setError(null);
      setCurrentIndex(0);

      return;
    }

    const sortedStops = sortStopsByOrder(stops);
    const metaSlides = sortedStops.map((stop) => ({
      uri: null,
      ...stopToSlideMeta(stop),
    }));

    setSlides(metaSlides);
    setLoading(true);
    setError(null);

    try {
      const downloaded = await Promise.all(sortedStops.map(downloadStopSlide));

      if (downloaded.length !== sortedStops.length) {
        if (__DEV__) {
          console.warn(
            '[RouteDetail] Durak sayısı ile slide sayısı uyuşmuyor:',
            sortedStops.length,
            downloaded.length,
          );
        }

        if (routeId) {
          trackRouteDetailEvent({
            name: 'route_detail_slide_sync_error',
            routeId,
            reason: 'stop_slide_count_mismatch',
            expectedCount: sortedStops.length,
            actualCount: downloaded.length,
          });
        }
      }

      setSlides(downloaded);
      setCurrentIndex((previous) =>
        Math.min(Math.max(0, previous), Math.max(0, downloaded.length - 1)),
      );
    } catch (loadError) {
      console.warn('Route detail slides load error:', loadError);
      setError('Durak görselleri yüklenemedi');

      if (routeId) {
        trackRouteDetailEvent({
          name: 'route_detail_slide_sync_error',
          routeId,
          reason: 'slides_load_failed',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, routeId, stops]);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const handleImageScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }, screenWidth: number) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / screenWidth);
      setCurrentIndex(index);
    },
    [],
  );

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < slides.length) {
        setCurrentIndex(index);
      }
    },
    [slides.length],
  );

  const refreshSlides = useCallback(async () => {
    await loadSlides();
  }, [loadSlides]);

  return {
    slides,
    loading,
    error,
    currentIndex,
    slideCount: slides.length,
    handleImageScroll,
    goToImage,
    refreshSlides,
  };
}

import { useCallback, useMemo } from 'react';
import { Dimensions } from 'react-native';
import type { PostImageSlide, PostImageSlideMeta } from '../types/postImage.types';
import { getPostCarouselDisplayHeight } from '../utils/imageUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CAROUSEL_HEIGHT_OPTIONS = {
  minHeight: 250,
  maxHeight: 1080,
  defaultHeight: 400,
} as const;

interface UsePostImageLayoutOptions {
  /** Rota detay: uri olmayan placeholder slide'ları da carousel indeksine dahil et. */
  keepPlaceholderSlides?: boolean;
  /**
   * Carousel çerçevesi ilk slaytın image_width/image_height oranına kilitlenir
   * (varsayılan: true).
   */
  lockToFirstPhotoDimensions?: boolean;
  /** Yüksekliği min/max aralığına sıkıştır (varsayılan: kilitli modda kapalı). */
  clampHeight?: boolean;
  /** image_width/height yoksa image_alignment yedeği (varsayılan: kilitli modda kapalı). */
  useImageAlignmentFallback?: boolean;
}

export function usePostImageLayout(
  imageSlides: PostImageSlide[],
  leadSlide: PostImageSlideMeta | null,
  options?: UsePostImageLayoutOptions,
) {
  const keepPlaceholderSlides = options?.keepPlaceholderSlides ?? false;
  const lockToFirstPhotoDimensions = options?.lockToFirstPhotoDimensions ?? true;
  const clampHeight = options?.clampHeight ?? !lockToFirstPhotoDimensions;
  const useImageAlignmentFallback =
    options?.useImageAlignmentFallback ?? !lockToFirstPhotoDimensions;

  const heightOptions = useMemo(
    () => ({
      ...CAROUSEL_HEIGHT_OPTIONS,
      clamp: clampHeight,
      useImageAlignmentFallback,
    }),
    [clampHeight, useImageAlignmentFallback],
  );

  const getSlideDisplayHeight = useCallback(
    (slide: PostImageSlideMeta) => {
      return getPostCarouselDisplayHeight(
        SCREEN_WIDTH,
        slide.width,
        slide.height,
        slide.imageAlignment,
        heightOptions,
      );
    },
    [heightOptions],
  );

  const carouselSlides = useMemo(
    () =>
      keepPlaceholderSlides
        ? imageSlides
        : imageSlides.filter((slide) => slide.uri !== null),
    [imageSlides, keepPlaceholderSlides],
  );

  const carouselImages = useMemo(
    () => carouselSlides.map((slide) => slide.uri),
    [carouselSlides],
  );

  const carouselHints = useMemo(
    () => carouselSlides.map((slide) => slide.hint?.trim() || null),
    [carouselSlides],
  );

  const displayHeights = useMemo(() => {
    if (carouselSlides.length === 0) {
      return [];
    }

    if (lockToFirstPhotoDimensions) {
      const firstSlideHeight = getSlideDisplayHeight(carouselSlides[0]);

      return carouselSlides.map(() => firstSlideHeight);
    }

    return carouselSlides.map((slide) => getSlideDisplayHeight(slide));
  }, [carouselSlides, getSlideDisplayHeight, lockToFirstPhotoDimensions]);

  const imagePlaceholderHeight = useMemo(() => {
    if (imageSlides.length > 0) {
      return getSlideDisplayHeight(imageSlides[0]);
    }

    if (leadSlide) {
      return getSlideDisplayHeight(leadSlide);
    }

    return SCREEN_WIDTH;
  }, [imageSlides, leadSlide, getSlideDisplayHeight]);

  return {
    carouselHeightOptions: CAROUSEL_HEIGHT_OPTIONS,
    screenWidth: SCREEN_WIDTH,
    imagePlaceholderHeight,
    carouselSlides,
    carouselImages,
    carouselHints,
    displayHeights,
  };
}

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

export function usePostImageLayout(
  imageSlides: PostImageSlide[],
  leadSlide: PostImageSlideMeta | null,
) {
  const getSlideDisplayHeight = useCallback((slide: PostImageSlideMeta) => {
    return getPostCarouselDisplayHeight(
      SCREEN_WIDTH,
      slide.width,
      slide.height,
      slide.imageAlignment,
      CAROUSEL_HEIGHT_OPTIONS,
    );
  }, []);

  const readyImageSlides = useMemo(
    () => imageSlides.filter((slide) => slide.uri !== null),
    [imageSlides],
  );

  const carouselImages = useMemo(
    () => readyImageSlides.map((slide) => slide.uri as string),
    [readyImageSlides],
  );

  const displayHeights = useMemo(
    () => readyImageSlides.map((slide) => getSlideDisplayHeight(slide)),
    [readyImageSlides, getSlideDisplayHeight],
  );

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
    readyImageSlides,
    carouselImages,
    displayHeights,
  };
}

import type { RouteWithProfile } from '../model/routes.model';
import type { PostImageSlide } from '../types/postImage.types';

const getRouteStopKey = (stop: RouteWithProfile): string =>
  String(stop.id ?? stop.order_index ?? '');

export function resolveCarouselIndexForRouteStop(
  stop: RouteWithProfile,
  slides: PostImageSlide[],
  stops: RouteWithProfile[],
): number {
  if (slides.length === 0) {
    return 0;
  }

  const sortedStops = [...stops].sort(
    (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
  );
  const stopsWithImages = sortedStops.filter((candidate) =>
    Boolean(candidate.image_url?.trim()),
  );

  const stopIndex = stopsWithImages.findIndex(
    (candidate) => getRouteStopKey(candidate) === getRouteStopKey(stop),
  );

  if (stopIndex >= 0) {
    return Math.min(stopIndex, slides.length - 1);
  }

  const stopImageUrl = stop.image_url?.trim();

  if (stopImageUrl) {
    const byUrl = slides.findIndex(
      (slide) => slide.imageUrl?.trim() === stopImageUrl,
    );

    if (byUrl >= 0) {
      return byUrl;
    }
  }

  const stopHint = stop.title?.trim();

  if (stopHint) {
    const byHint = slides.findIndex((slide) => slide.hint?.trim() === stopHint);

    if (byHint >= 0) {
      return byHint;
    }
  }

  return 0;
}

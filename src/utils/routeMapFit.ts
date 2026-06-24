import type { RouteSegment } from '../types/routeSegment.types';
import type { LatLng, LatLngLike } from './routeDistance';
import { extractValidCoordinates } from './routeDistance';

export const ROUTE_MAP_OVERVIEW_PADDING = {
  top: 36,
  right: 36,
  bottom: 36,
  left: 36,
};

export const ROUTE_MAP_SEGMENT_FOCUS_PADDING = {
  top: 52,
  right: 52,
  bottom: 52,
  left: 52,
};

export const getDirectionsMapFitCoordinates = (
  segments: RouteSegment[],
  stops: LatLngLike[] = [],
): LatLng[] => {
  const segmentPoints = segments.flatMap((segment) => segment.coordinates);
  const stopPoints = extractValidCoordinates(stops);

  if (segmentPoints.length === 0) {
    return stopPoints;
  }

  if (stopPoints.length === 0) {
    return segmentPoints;
  }

  return [...segmentPoints, ...stopPoints];
};

export const getSegmentFocusCoordinates = (segment: RouteSegment): LatLng[] => {
  if (segment.coordinates.length >= 2) {
    return segment.coordinates;
  }

  return extractValidCoordinates([segment.from, segment.to]);
};

export const findSegmentIndexForStop = (
  stops: Array<{ id?: string | number; order_index?: number }>,
  segments: RouteSegment[],
  stopIndex: number,
): number => {
  if (segments.length === 0 || stopIndex < 0) {
    return 0;
  }

  const stop = stops[stopIndex];

  if (!stop) {
    return 0;
  }

  if (stop.id) {
    const stopId = String(stop.id);
    const idMatch = segments.findIndex(
      (segment) => segment.targetStopId === stopId,
    );

    if (idMatch >= 0) {
      return idMatch;
    }
  }

  const orderIndex = stop.order_index ?? stopIndex;

  const targetMatch = segments.findIndex(
    (segment) => segment.targetStopOrderIndex === orderIndex,
  );

  if (targetMatch >= 0) {
    return targetMatch;
  }

  if (stopIndex === 0) {
    const firstRoute = segments.findIndex((segment) => segment.variant === 'route');

    return firstRoute >= 0 ? firstRoute : 0;
  }

  return Math.min(Math.max(0, stopIndex - 1), segments.length - 1);
};

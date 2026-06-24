import type { RouteWithProfile } from '../model/routes.model';
import type { RouteSegment } from '../types/routeSegment.types';

export type MapRouteTimelineStopItem = {
  type: 'stop';
  stop: RouteWithProfile;
  stopIndex: number;
};

export type MapRouteTimelineLegItem = {
  type: 'leg';
  segment: RouteSegment;
  segmentIndex: number;
};

export type MapRouteTimelineItem =
  | MapRouteTimelineStopItem
  | MapRouteTimelineLegItem;

const sortStops = (stops: RouteWithProfile[]): RouteWithProfile[] =>
  [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

const matchesStop = (segment: RouteSegment, stop: RouteWithProfile): boolean => {
  if (stop.id && segment.targetStopId) {
    return segment.targetStopId === String(stop.id);
  }

  return segment.targetStopOrderIndex === (stop.order_index ?? 0);
};

export function buildMapRouteTimeline(
  stops: RouteWithProfile[],
  segments: RouteSegment[],
  options: { startFromUserLocation?: boolean } = {},
): MapRouteTimelineItem[] {
  const sorted = sortStops(stops);

  if (sorted.length === 0) {
    return [];
  }

  const items: MapRouteTimelineItem[] = [];
  const usedSegmentIndices = new Set<number>();

  if (
    options.startFromUserLocation &&
    segments[0]?.variant === 'approach'
  ) {
    items.push({ type: 'leg', segment: segments[0], segmentIndex: 0 });
    usedSegmentIndices.add(0);
  }

  sorted.forEach((stop, stopIndex) => {
    items.push({ type: 'stop', stop, stopIndex });

    const nextStop = sorted[stopIndex + 1];

    if (!nextStop) {
      return;
    }

    const segmentIndex = segments.findIndex(
      (segment, index) =>
        !usedSegmentIndices.has(index) && matchesStop(segment, nextStop),
    );

    if (segmentIndex < 0) {
      return;
    }

    usedSegmentIndices.add(segmentIndex);
    items.push({
      type: 'leg',
      segment: segments[segmentIndex],
      segmentIndex,
    });
  });

  return items;
}

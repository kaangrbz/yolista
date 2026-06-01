import type { RouteSheetTab } from './routeSegment.types';

export type RouteDetailParams = {
  routeId: string;
  initialTab?: RouteSheetTab;
  initialStopIndex?: number;
  initialSegmentIndex?: number;
  startFromUserLocation?: boolean;
};

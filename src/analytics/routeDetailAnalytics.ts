import type { RouteSheetTab } from '../types/routeSegment.types';

export type RouteDetailTravelMode = 'walking' | 'driving';

export type RouteDetailAnalyticsEvent =
  | {
      name: 'route_detail_tab_change';
      routeId: string;
      tab: RouteSheetTab;
      surface: 'detail' | 'map_sheet';
    }
  | {
      name: 'route_detail_map_expand';
      routeId: string;
      source: 'hero' | 'stops_panel' | 'map_modal' | 'map_sheet';
    }
  | {
      name: 'route_detail_maps_cta';
      routeId: string;
      scope: 'full_route' | 'segment' | 'stop';
      travelMode: RouteDetailTravelMode;
      surface: 'detail' | 'map_sheet';
    }
  | {
      name: 'route_detail_slide_sync_error';
      routeId: string;
      reason: string;
      expectedCount?: number;
      actualCount?: number;
    }
  | {
      name: 'route_detail_segments_fallback';
      routeId: string;
      estimatedSegmentCount: number;
    };

export function trackRouteDetailEvent(event: RouteDetailAnalyticsEvent): void {
  if (__DEV__) {
    console.log('[routeDetailAnalytics]', event);
  }
}

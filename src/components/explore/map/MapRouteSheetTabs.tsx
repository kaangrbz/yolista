import React from 'react';
import type { RouteSheetTab } from '../../../types/routeSegment.types';
import RouteTabBar from '../../routeDetail/RouteTabBar';

interface MapRouteSheetTabsProps {
  activeTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
}

export const MapRouteSheetTabs: React.FC<MapRouteSheetTabsProps> = (props) => (
  <RouteTabBar {...props} />
);

export default MapRouteSheetTabs;

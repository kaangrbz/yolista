import React from 'react';
import type { RouteSheetTab } from '../../types/routeSegment.types';
import RouteTabBar from './RouteTabBar';

interface RouteDetailTabsProps {
  activeTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
  disabledTabs?: Partial<Record<RouteSheetTab, string>>;
}

export const RouteDetailTabs: React.FC<RouteDetailTabsProps> = (props) => (
  <RouteTabBar {...props} marginHorizontal={16} />
);

export default RouteDetailTabs;

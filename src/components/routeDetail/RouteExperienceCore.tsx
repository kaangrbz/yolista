import React, { useMemo } from 'react';
import type { RouteWithProfile } from '../../model/routes.model';
import type { RouteSegment, RouteSheetTab } from '../../types/routeSegment.types';
import { hasRouteDirections } from '../../types/routeSegment.types';
import RouteDetailTabs from './RouteDetailTabs';
import RouteDetailExperienceSection from './RouteDetailExperienceSection';
import RouteStopsTabPanel from './RouteStopsTabPanel';
import RouteDirectionsTabPanel from './RouteDirectionsTabPanel';
import MapRouteTimelinePanel from '../explore/map/MapRouteTimelinePanel';
import type { RouteDetailHeroMode } from './RouteDetailHeroToggle';

const DIRECTIONS_DISABLED_MESSAGE =
  'En az iki koordinatlı durak gerekir — navigasyon kullanılamaz';

interface RouteExperienceCoreBase {
  activeTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
}

export interface RouteExperienceCoreDetailProps extends RouteExperienceCoreBase {
  variant: 'detail';
  routeId?: string;
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onStopPress: (index: number) => void;
  segments: RouteSegment[];
  activeSegmentIndex: number;
  segmentsLoading: boolean;
  startFromUserLocation: boolean;
  canStartFromUserLocation: boolean;
  onSegmentPress: (index: number) => void;
  onStartFromUserLocationChange: (enabled: boolean) => void;
  useFloatingPrimaryCta: boolean;
  onNestedScrollLockChange?: (isActive: boolean) => void;
  onExpandMap?: () => void;
  showSummaryBar?: boolean;
  wrapInSection?: boolean;
  optimizeRouteOrder?: boolean;
  onOptimizeRouteOrderChange?: (enabled: boolean) => void;
  optimizeSavingsPercent?: number | null;
  heroMode?: RouteDetailHeroMode;
}

export interface RouteExperienceCoreMapProps {
  variant: 'mapSheet';
  stops: RouteWithProfile[];
  stopsLoading: boolean;
  selectedRoute: RouteWithProfile | null;
  activeStopId: string | null;
  onStopPress?: (stop: RouteWithProfile) => void;
  onOpenRouteInMaps?: () => void;
  startFromUserLocation: boolean;
  segments: RouteSegment[];
  activeSegmentIndex: number;
  segmentsLoading: boolean;
  onSegmentPress?: (index: number) => void;
  onOpenActiveStopInMaps?: () => void;
  isRouteSaved?: boolean;
  saveLoading?: boolean;
  onClearSelectedRoute?: () => void;
  onShareRoute?: () => void;
  onSaveRoute?: () => void;
}

export type RouteExperienceCoreProps =
  | RouteExperienceCoreDetailProps
  | RouteExperienceCoreMapProps;

const useDirectionsTabState = (stops: RouteWithProfile[]) => {
  const directionsAvailable = useMemo(() => hasRouteDirections(stops), [stops]);

  const disabledTabs = useMemo(
    () =>
      directionsAvailable
        ? undefined
        : { directions: DIRECTIONS_DISABLED_MESSAGE },
    [directionsAvailable],
  );

  return { directionsAvailable, disabledTabs };
};

const renderDetailExperience = (props: RouteExperienceCoreDetailProps) => {
  const { disabledTabs } = useDirectionsTabState(props.stops);

  const tabContent =
    props.activeTab === 'stops' ? (
      <RouteStopsTabPanel
        stops={props.stops}
        activeStopIndex={props.activeStopIndex}
        onStopPress={props.onStopPress}
        onNestedScrollLockChange={props.onNestedScrollLockChange}
        onExpandMap={props.onExpandMap}
        showSummaryBar={props.showSummaryBar ?? false}
        hideEmbeddedMap={props.heroMode === 'map'}
      />
    ) : (
      <RouteDirectionsTabPanel
        routeId={props.routeId}
        stops={props.stops}
        segments={props.segments}
        activeSegmentIndex={props.activeSegmentIndex}
        activeStopIndex={props.activeStopIndex}
        loading={props.segmentsLoading}
        startFromUserLocation={props.startFromUserLocation}
        canStartFromUserLocation={props.canStartFromUserLocation}
        onSegmentPress={props.onSegmentPress}
        onStartFromUserLocationChange={props.onStartFromUserLocationChange}
        onNestedScrollLockChange={props.onNestedScrollLockChange}
        useFloatingPrimaryCta={props.useFloatingPrimaryCta}
        surface="detail"
        optimizeRouteOrder={props.optimizeRouteOrder}
        onOptimizeRouteOrderChange={props.onOptimizeRouteOrderChange}
        optimizeSavingsPercent={props.optimizeSavingsPercent}
      />
    );

  const core = (
    <>
      <RouteDetailTabs
        activeTab={props.activeTab}
        onTabChange={props.onTabChange}
        disabledTabs={disabledTabs}
      />
      {tabContent}
    </>
  );

  if (props.wrapInSection === false) {
    return core;
  }

  return <RouteDetailExperienceSection>{core}</RouteDetailExperienceSection>;
};

const renderMapSheetExperience = (props: RouteExperienceCoreMapProps) => (
  <MapRouteTimelinePanel
    stops={props.stops}
    stopsLoading={props.stopsLoading}
    selectedRoute={props.selectedRoute}
    activeStopId={props.activeStopId}
    segments={props.segments}
    activeSegmentIndex={props.activeSegmentIndex}
    segmentsLoading={props.segmentsLoading}
    startFromUserLocation={props.startFromUserLocation}
    isRouteSaved={props.isRouteSaved}
    saveLoading={props.saveLoading}
    onStopPress={props.onStopPress}
    onSegmentPress={props.onSegmentPress}
    onOpenRouteInMaps={props.onOpenRouteInMaps}
    onOpenActiveStopInMaps={props.onOpenActiveStopInMaps}
    onClearSelectedRoute={props.onClearSelectedRoute}
    onShareRoute={props.onShareRoute}
    onSaveRoute={props.onSaveRoute}
  />
);

export const RouteExperienceCore: React.FC<RouteExperienceCoreProps> = (props) => {
  if (props.variant === 'detail') {
    return renderDetailExperience(props);
  }

  return renderMapSheetExperience(props);
};

export default RouteExperienceCore;

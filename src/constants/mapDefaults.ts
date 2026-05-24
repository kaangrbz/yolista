import { Region } from 'react-native-maps';

export const DEFAULT_MAP_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

export const USER_LOCATION_ZOOM_DELTA = 0.05;
export const ROUTE_FOCUS_ZOOM_DELTA = 0.02;

export const VIEWPORT_DEBOUNCE_MS = 400;
export const VIEWPORT_MIN_DELTA_CHANGE = 0.0005;

export const BOTTOM_SHEET_SNAP_POINTS = ['12%', '45%', '92%'] as const;

export const CLUSTER_RADIUS = 50;
export const CLUSTER_MIN_POINTS = 2;

export const MAP_FILTER_DEFAULT_DISTANCE_KM = 25;
export const MAP_FILTER_DISTANCE_OPTIONS_KM = [5, 10, 25, 50, 100] as const;

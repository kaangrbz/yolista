import { Region } from 'react-native-maps';

export const DEFAULT_MAP_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

// Türkiye'yi tam kapsayan bbox (konum izni yokken kullanılır).
// Köşeler: KB (Edirne) → GD (Hakkari) çevresi
export const TURKEY_BOUNDS = {
  northEast: { latitude: 42.2, longitude: 45.0 },
  southWest: { latitude: 35.8, longitude: 25.8 },
} as const;

export const TURKEY_REGION: Region = {
  latitude: (TURKEY_BOUNDS.northEast.latitude + TURKEY_BOUNDS.southWest.latitude) / 2,
  longitude: (TURKEY_BOUNDS.northEast.longitude + TURKEY_BOUNDS.southWest.longitude) / 2,
  latitudeDelta:
    TURKEY_BOUNDS.northEast.latitude - TURKEY_BOUNDS.southWest.latitude,
  longitudeDelta:
    TURKEY_BOUNDS.northEast.longitude - TURKEY_BOUNDS.southWest.longitude,
};

export const USER_LOCATION_ZOOM_DELTA = 0.05;
export const ROUTE_FOCUS_ZOOM_DELTA = 0.02;
/** Keşif haritası — durak odaklanırken merkezi güneye kaydır (pin bottom sheet üstünde kalsın). */
export const MAP_STOP_FOCUS_LATITUDE_OFFSET_FRACTION = 0.22;

export const regionForStopFocus = (
  coordinate: { latitude: number; longitude: number },
  latitudeDelta: number = ROUTE_FOCUS_ZOOM_DELTA,
  longitudeDelta: number = ROUTE_FOCUS_ZOOM_DELTA,
): Region => ({
  latitude:
    coordinate.latitude - latitudeDelta * MAP_STOP_FOCUS_LATITUDE_OFFSET_FRACTION,
  longitude: coordinate.longitude,
  latitudeDelta,
  longitudeDelta,
});
/** Bu delta'dan daha zoom-out ise konum atarken ROUTE_FOCUS_ZOOM_DELTA'ya yakınlaştır. */
export const ROUTE_ASSIGN_PRESERVE_ZOOM_MAX_DELTA = 0.05;

export const VIEWPORT_DEBOUNCE_MS = 400;
/** Mutlak minimum — çok küçük pan/zoom değişimlerinde yeniden sorgu atlanır. */
export const VIEWPORT_MIN_DELTA_CHANGE = 0.0005;
/** Viewport boyutunun yüzdesi olarak göreli eşik (pan). */
export const VIEWPORT_MIN_PAN_FRACTION = 0.02;
/** Zoom delta'sı için göreli eşik. */
export const VIEWPORT_MIN_ZOOM_FRACTION = 0.03;

export const BOTTOM_SHEET_SNAP_POINTS = ['12%', '45%', '92%'] as const;

export const CLUSTER_RADIUS = 50;
export const CLUSTER_MIN_POINTS = 2;

export const MAP_FILTER_DEFAULT_DISTANCE_KM = 15;
export const MAP_FILTER_DISTANCE_OPTIONS_KM = [5, 15] as const;

/** Keşif haritası — seçili / aktif rota önizleme çerçevesi */
export const MAP_ACTIVE_ROUTE_BORDER = '#2563eb';

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

export const regionForUserLocation = (
  coordinate: { latitude: number; longitude: number },
  delta: number = USER_LOCATION_ZOOM_DELTA,
): Region => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

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

export const VIEWPORT_DEBOUNCE_MS = 600;
/** Son sorgu bbox'ına eklenecek tampon (viewport boyutunun oranı). */
export const VIEWPORT_FETCH_PADDING_FRACTION = 0.35;
/** Merkez en az bu kadar kaymadıysa yeniden sorgu atlanır (metre). */
export const VIEWPORT_MIN_PAN_METERS = 500;
/** latitudeDelta/longitudeDelta oranı en az 2^N kadar değişmediyse zoom sayılmaz. */
export const VIEWPORT_MIN_ZOOM_LEVELS = 2;

/** Bottom sheet sürükleme tutamacı (padding + indicator). */
export const MAP_BOTTOM_SHEET_HANDLE_HEIGHT = 20;

/** Header ölçülmeden önce kullanılan tahmini yükseklik. */
export const MAP_BOTTOM_SHEET_HEADER_FALLBACK_HEIGHT = 46;

/** Header ölçülmeden önce kullanılan tahmini kapalı yükseklik (tutamak + header). */
export const MAP_BOTTOM_SHEET_CLOSED_FALLBACK_HEIGHT =
  MAP_BOTTOM_SHEET_HANDLE_HEIGHT + MAP_BOTTOM_SHEET_HEADER_FALLBACK_HEIGHT;

export type MapBottomSheetSnapHeights = {
  closed: number;
  medium: number;
  full: number;
};

/** Kapalı: ölçülen tutamak+header · önizleme: + ekranın 1/5'i · tam: ekran yüksekliği. */
export const computeMapBottomSheetSnapHeights = (
  screenHeight: number,
  handleHeight: number,
): MapBottomSheetSnapHeights => {
  const closed =
    handleHeight > 0 ? handleHeight : MAP_BOTTOM_SHEET_CLOSED_FALLBACK_HEIGHT;
  const medium = closed + screenHeight / 5;
  const full = screenHeight;

  return { closed, medium, full };
};

export type MapSheetSnapMode = 'small' | 'medium' | 'large';

export const mapSheetSnapHeight = (
  heights: MapBottomSheetSnapHeights,
  snap: MapSheetSnapMode,
): number => {
  if (snap === 'small') {
    return heights.closed;
  }

  if (snap === 'large') {
    return heights.full;
  }

  return heights.medium;
};

/** Harita fitToCoordinates — bottom sheet yüksekliğine göre alt boşluk. */
export const mapSheetEdgePadding = (
  sheetHeight: number,
  overrides: Partial<{ top: number; right: number; bottom: number; left: number }> = {},
) => ({
  top: 160,
  right: 48,
  bottom: Math.round(sheetHeight + 16),
  left: 48,
  ...overrides,
});

export const CLUSTER_RADIUS = 50;
export const CLUSTER_MIN_POINTS = 2;

/** Bu mesafenin üzerindeki rotalar harici haritada araba moduyla açılır. */
export const MAPS_DRIVING_MODE_MIN_KM = 2;

export const MAP_FILTER_DEFAULT_DISTANCE_KM = 15;
export const MAP_FILTER_DISTANCE_OPTIONS_KM = [5, 15] as const;

/** Yakınım / km filtresi için harita zoom delta (yarıçap + padding). */
export const regionDeltaForDistanceKm = (distanceKm: number): number => {
  const diameterKm = distanceKm * 2 * 1.25;
  return Math.max(diameterKm / 111, 0.012);
};

/** Keşif haritası — seçili / aktif rota önizleme çerçevesi */
export const MAP_ACTIVE_ROUTE_BORDER = '#2563eb';

/** Rota sekmesi — segment polyline tonları (opacity değil, ayrı stroke). */
export const ROUTE_SEGMENT_ACTIVE = MAP_ACTIVE_ROUTE_BORDER;
export const ROUTE_SEGMENT_PAST = '#94a3b8';
export const ROUTE_SEGMENT_UPCOMING = '#cbd5e1';
export const ROUTE_SEGMENT_APPROACH_ACTIVE = '#0d9488';
export const ROUTE_SEGMENT_APPROACH_MUTED = '#64748b';
export const ROUTE_SEGMENT_HALO = '#ffffff';

/** GPS ile otomatik sonraki bacak (metre). */
export const ROUTE_SEGMENT_ADVANCE_RADIUS_M = 80;
export const ROUTE_SEGMENT_ADVANCE_DEBOUNCE_MS = 4000;

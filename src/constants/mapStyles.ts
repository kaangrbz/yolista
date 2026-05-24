/**
 * Harita tile sağlayıcısı URL'leri.
 *
 * `react-native-maps` üzerinde `mapType="none"` + `<UrlTile />` ile
 * tamamen özel raster tile katmanı kullanıyoruz. Bu sayede:
 *   - iOS'ta Google Maps API key gerekmiyor (Apple Maps base'i de gizli)
 *   - Android'de Google Maps key gerekmiyor (base layer "none")
 *   - Aynı görsel her iki platformda tutarlı
 *
 * Carto basemaps anonim erişime izin verir (attribution zorunlu).
 * Production için: kendi MapTiler / Stadia / Carto plan'ına geçmek
 * önerilir (rate limit ve SLA için).
 */

export type MapStyleMode = 'light' | 'dark' | 'satellite';

export interface TileSource {
  urlTemplate: string;
  maximumZ: number;
  attribution: string;
  /** UI'da gösterilecek MaterialCommunityIcons adı. */
  iconName: string;
  /**
   * Opsiyonel ikinci tile katmanı (örn. uydu üzerine yer isimleri).
   * `react-native-maps` UrlTile'ın `shouldReplaceMapContent` ile
   * altta render edilen base katmanın üstüne çizilir.
   */
  overlayUrlTemplate?: string;
}

export const tileSources: Record<MapStyleMode, TileSource> = {
  light: {
    urlTemplate: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    maximumZ: 19,
    attribution: '© OSM · CARTO',
    iconName: 'weather-sunny',
  },
  dark: {
    urlTemplate: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    maximumZ: 19,
    attribution: '© OSM · CARTO',
    iconName: 'weather-night',
  },
  satellite: {
    urlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maximumZ: 19,
    attribution: '© Esri · Maxar',
    iconName: 'satellite-variant',
  },
};

export const MAP_STYLE_CYCLE: MapStyleMode[] = ['light', 'dark', 'satellite'];

export const getTileSource = (mode: MapStyleMode): TileSource => {
  return tileSources[mode];
};

export const getNextMapStyle = (mode: MapStyleMode): MapStyleMode => {
  const index = MAP_STYLE_CYCLE.indexOf(mode);
  const nextIndex = (index + 1) % MAP_STYLE_CYCLE.length;

  return MAP_STYLE_CYCLE[nextIndex];
};

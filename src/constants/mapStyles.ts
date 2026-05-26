/**
 * Harita stil modları — platform sağlayıcısının kendi katmanları kullanılır.
 * Android: Google Maps (PROVIDER_GOOGLE)
 * iOS: Apple MapKit (PROVIDER_DEFAULT)
 */

export type MapStyleMode = 'light' | 'satellite';

export interface MapStyleDefinition {
  /** UI'da gösterilecek MaterialCommunityIcons adı. */
  iconName: string;
}

export const mapStyleDefinitions: Record<MapStyleMode, MapStyleDefinition> = {
  light: {
    iconName: 'weather-sunny',
  },
  satellite: {
    iconName: 'satellite-variant',
  },
};

export const MAP_STYLE_CYCLE: MapStyleMode[] = ['light', 'satellite'];

export const getMapStyleDefinition = (mode: MapStyleMode): MapStyleDefinition => {
  return mapStyleDefinitions[mode];
};

export const getNextMapStyle = (mode: MapStyleMode): MapStyleMode => {
  const index = MAP_STYLE_CYCLE.indexOf(mode);
  const nextIndex = (index + 1) % MAP_STYLE_CYCLE.length;

  return MAP_STYLE_CYCLE[nextIndex];
};

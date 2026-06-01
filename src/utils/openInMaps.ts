import { Linking, Platform } from 'react-native';
import { MAPS_DRIVING_MODE_MIN_KM } from '../constants/mapDefaults';
import {
  haversineDistanceKm,
  totalRouteDistanceKmFromPoints,
  type LatLng,
} from './routeDistance';

type TravelMode = 'walking' | 'driving';

export type OpenInMapsOptions = {
  /** Mesafe biliniyorsa doğrudan mod seçimi. */
  distanceKm?: number;
  /** Tek hedef açılışında başlangıç noktası (mesafe hesabı için). */
  from?: LatLng;
};

const formatCoord = ({ latitude, longitude }: LatLng): string =>
  `${latitude},${longitude}`;

export const resolveTravelModeForDistanceKm = (
  distanceKm: number,
): TravelMode =>
  distanceKm >= MAPS_DRIVING_MODE_MIN_KM ? 'driving' : 'walking';

const resolveTravelModeForStops = (stops: LatLng[]): TravelMode => {
  if (stops.length < 2) {
    return 'walking';
  }

  return resolveTravelModeForDistanceKm(totalRouteDistanceKmFromPoints(stops));
};

const resolveTravelModeForOpenStop = (
  coordinate: LatLng,
  options: OpenInMapsOptions = {},
): TravelMode => {
  if (typeof options.distanceKm === 'number') {
    return resolveTravelModeForDistanceKm(options.distanceKm);
  }

  if (options.from) {
    return resolveTravelModeForDistanceKm(
      haversineDistanceKm(options.from, coordinate),
    );
  }

  return 'walking';
};

/**
 * Google Maps universal URL (opens native app when installed).
 * @see https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export const buildGoogleMapsDirectionsUrl = (
  stops: LatLng[],
  travelMode: TravelMode = 'walking',
): string | null => {
  if (stops.length === 0) {
    return null;
  }

  if (stops.length === 1) {
    const stop = stops[0];
    const params = new URLSearchParams({
      api: '1',
      destination: formatCoord(stop),
      travelmode: travelMode,
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops
    .slice(1, -1)
    .map((stop) => formatCoord(stop))
    .join('|');

  const params = new URLSearchParams({
    api: '1',
    origin: formatCoord(origin),
    destination: formatCoord(destination),
    travelmode: travelMode,
  });

  if (waypoints) {
    params.set('waypoints', waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

/**
 * Apple Maps unified directions URL (iOS 18.4+; older sürümlerde de çoğu cihazda açılır).
 * Ara duraklar tekrarlayan `waypoint` parametresiyle eklenir.
 * @see https://developer.apple.com/documentation/mapkit/unified-map-urls
 */
export const buildAppleMapsDirectionsUrl = (
  stops: LatLng[],
  mode: TravelMode = 'walking',
): string | null => {
  if (stops.length === 0) {
    return null;
  }

  if (stops.length === 1) {
    const params = new URLSearchParams({
      destination: formatCoord(stops[0]),
      mode,
    });

    return `https://maps.apple.com/directions?${params.toString()}`;
  }

  const params = new URLSearchParams({
    source: formatCoord(stops[0]),
    destination: formatCoord(stops[stops.length - 1]),
    mode,
  });

  stops.slice(1, -1).forEach((stop) => {
    params.append('waypoint', formatCoord(stop));
  });

  return `https://maps.apple.com/directions?${params.toString()}`;
};

/**
 * Eski Apple Maps URL şeması — birden fazla `daddr` ile durak zinciri.
 * Unified URL açılmazsa yedek.
 */
export const buildAppleMapsLegacyDirectionsUrl = (
  stops: LatLng[],
  dirflg: 'w' | 'd' = 'w',
): string | null => {
  if (stops.length === 0) {
    return null;
  }

  const params = new URLSearchParams({ dirflg });

  if (stops.length === 1) {
    params.set('daddr', formatCoord(stops[0]));
    return `https://maps.apple.com/?${params.toString()}`;
  }

  params.set('saddr', formatCoord(stops[0]));

  stops.slice(1).forEach((stop) => {
    params.append('daddr', formatCoord(stop));
  });

  return `https://maps.apple.com/?${params.toString()}`;
};

async function tryOpenUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

const appleLegacyDirFlag = (travelMode: TravelMode): 'w' | 'd' =>
  travelMode === 'driving' ? 'd' : 'w';

const androidNavigationMode = (travelMode: TravelMode): 'w' | 'd' =>
  travelMode === 'driving' ? 'd' : 'w';

export async function openStopInMaps(
  coordinate: LatLng,
  options: OpenInMapsOptions = {},
): Promise<void> {
  const stops = [coordinate];
  const travelMode = resolveTravelModeForOpenStop(coordinate, options);

  if (Platform.OS === 'ios') {
    const appleUrl = buildAppleMapsDirectionsUrl(stops, travelMode);

    if (appleUrl && (await tryOpenUrl(appleUrl))) {
      return;
    }

    const legacyUrl = `maps://?daddr=${formatCoord(coordinate)}&dirflg=${appleLegacyDirFlag(travelMode)}`;

    if (await tryOpenUrl(legacyUrl)) {
      return;
    }
  }

  if (Platform.OS === 'android') {
    const nativeUrl = `google.navigation:q=${formatCoord(coordinate)}&mode=${androidNavigationMode(travelMode)}`;

    try {
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }
    } catch {
      // Google Maps web / intent fallback
    }
  }

  const googleUrl = buildGoogleMapsDirectionsUrl(stops, travelMode);

  if (googleUrl) {
    await tryOpenUrl(googleUrl);
  }
}

export async function openRouteInMaps(stops: LatLng[]): Promise<void> {
  if (stops.length === 0) {
    return;
  }

  const travelMode = resolveTravelModeForStops(stops);
  const appleLegacyFlag = appleLegacyDirFlag(travelMode);

  if (Platform.OS === 'ios') {
    const appleUrl = buildAppleMapsDirectionsUrl(stops, travelMode);

    if (appleUrl && (await tryOpenUrl(appleUrl))) {
      return;
    }

    const legacyUrl = buildAppleMapsLegacyDirectionsUrl(stops, appleLegacyFlag);

    if (legacyUrl && (await tryOpenUrl(legacyUrl))) {
      return;
    }
  }

  const googleUrl = buildGoogleMapsDirectionsUrl(stops, travelMode);

  if (googleUrl) {
    await tryOpenUrl(googleUrl);
  }
}

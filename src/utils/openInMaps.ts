import { Linking, Platform } from 'react-native';
import type { LatLng } from './routeDistance';

type TravelMode = 'walking' | 'driving';

const formatCoord = ({ latitude, longitude }: LatLng): string =>
  `${latitude},${longitude}`;

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

export async function openStopInMaps(coordinate: LatLng): Promise<void> {
  const stops = [coordinate];

  if (Platform.OS === 'ios') {
    const appleUrl = buildAppleMapsDirectionsUrl(stops, 'walking');

    if (appleUrl && (await tryOpenUrl(appleUrl))) {
      return;
    }

    const legacyUrl = `maps://?daddr=${formatCoord(coordinate)}&dirflg=w`;

    if (await tryOpenUrl(legacyUrl)) {
      return;
    }
  }

  if (Platform.OS === 'android') {
    const nativeUrl = `google.navigation:q=${formatCoord(coordinate)}&mode=w`;

    try {
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }
    } catch {
      // Google Maps web / intent fallback
    }
  }

  const googleUrl = buildGoogleMapsDirectionsUrl(stops, 'walking');

  if (googleUrl) {
    await tryOpenUrl(googleUrl);
  }
}

export async function openRouteInMaps(stops: LatLng[]): Promise<void> {
  if (stops.length === 0) {
    return;
  }

  if (Platform.OS === 'ios') {
    const appleUrl = buildAppleMapsDirectionsUrl(stops, 'walking');

    if (appleUrl && (await tryOpenUrl(appleUrl))) {
      return;
    }

    const legacyUrl = buildAppleMapsLegacyDirectionsUrl(stops, 'w');

    if (legacyUrl && (await tryOpenUrl(legacyUrl))) {
      return;
    }
  }

  const googleUrl = buildGoogleMapsDirectionsUrl(stops, 'walking');

  if (googleUrl) {
    await tryOpenUrl(googleUrl);
  }
}

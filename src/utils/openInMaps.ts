import { Linking, Platform } from 'react-native';
import type { LatLng } from './routeDistance';

const buildGoogleMapsDirectionsUrl = (stops: LatLng[]): string | null => {
  if (stops.length === 0) {
    return null;
  }

  if (stops.length === 1) {
    const stop = stops[0];
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops
    .slice(1, -1)
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join('|');

  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
  });

  if (waypoints) {
    params.set('waypoints', waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export async function openStopInMaps(coordinate: LatLng): Promise<void> {
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinate.latitude},${coordinate.longitude}`;
  const nativeUrl =
    Platform.OS === 'ios'
      ? `maps://?daddr=${coordinate.latitude},${coordinate.longitude}`
      : `google.navigation:q=${coordinate.latitude},${coordinate.longitude}`;

  try {
    if (await Linking.canOpenURL(nativeUrl)) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch {
    // Google Maps web fallback
  }

  await Linking.openURL(googleUrl);
}

export async function openRouteInMaps(stops: LatLng[]): Promise<void> {
  const url = buildGoogleMapsDirectionsUrl(stops);

  if (!url) {
    return;
  }

  await Linking.openURL(url);
}

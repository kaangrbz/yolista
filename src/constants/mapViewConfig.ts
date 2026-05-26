import { Platform } from 'react-native';
import {
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  type MapType,
  type Provider,
} from 'react-native-maps';
import { MapStyleMode } from './mapStyles';

/** Android → Google Maps, iOS → Apple MapKit. */
export function getMapProvider(): Provider {
  return Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
}

export function getNativeMapType(mode: MapStyleMode): MapType {
  if (mode === 'satellite') {
    return 'hybrid';
  }

  return 'standard';
}

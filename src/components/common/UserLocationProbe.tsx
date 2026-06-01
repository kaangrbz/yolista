import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import type { LatLng } from '../../utils/routeDistance';
import { getMapProvider } from '../../constants/mapViewConfig';

interface UserLocationProbeProps {
  enabled: boolean;
  onCoordinate: (coordinate: LatLng) => void;
}

/**
 * Konum izni verildikten sonra tek seferlik kullanıcı koordinatı alır.
 */
export const UserLocationProbe: React.FC<UserLocationProbeProps> = ({
  enabled,
  onCoordinate,
}) => {
  const deliveredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      deliveredRef.current = false;
    }
  }, [enabled]);

  if (!enabled || deliveredRef.current) {
    return null;
  }

  return (
    <View style={styles.probe} pointerEvents="none">
      <MapView
        provider={getMapProvider()}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        onUserLocationChange={(event) => {
          const coordinate = event.nativeEvent.coordinate;

          if (!coordinate || deliveredRef.current) {
            return;
          }

          deliveredRef.current = true;
          onCoordinate({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  probe: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  map: {
    width: 1,
    height: 1,
  },
});

export default UserLocationProbe;

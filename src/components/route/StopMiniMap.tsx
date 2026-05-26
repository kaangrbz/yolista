import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import { ROUTE_FOCUS_ZOOM_DELTA } from '../../constants/mapDefaults';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopMiniMapProps {
  latitude: number;
  longitude: number;
}

export const StopMiniMap: React.FC<StopMiniMapProps> = ({
  latitude,
  longitude,
}) => {
  const styles = useThemedStyles((t) => ({
    wrapper: {
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    map: {
      width: '100%',
      height: '100%',
    },
  }));

  return (
    <View style={styles.wrapper}>
      <MapView
        provider={getMapProvider()}
        mapType={getNativeMapType('light')}
        style={styles.map}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        pointerEvents="none"
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
          longitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
};

export default StopMiniMap;

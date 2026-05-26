import React from 'react';
import { Marker } from 'react-native-maps';
import MapClusterMarker from './MapClusterMarker';

interface MapClusterMarkerWrapperProps {
  clusterId: number;
  latitude: number;
  longitude: number;
  count: number;
  onPress: () => void;
}

export const MapClusterMarkerWrapper: React.FC<MapClusterMarkerWrapperProps> = ({
  clusterId,
  latitude,
  longitude,
  count,
  onPress,
}) => {
  return (
    <Marker
      key={`cluster-${clusterId}`}
      identifier={`cluster-${clusterId}`}
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
    >
      <MapClusterMarker count={count} />
    </Marker>
  );
};

export default MapClusterMarkerWrapper;

import React from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { RouteWithProfile } from '../../../model/routes.model';
import { getMapMarkerAnchorProps } from '../../../constants/mapMarkerLayout';
import { useMapMarkerViewTracking } from '../../../hooks/useMapMarkerViewTracking';
import { getMapStopLabel } from './MapRouteStopCard';
import MapRouteMarker from './MapRouteMarker';

interface MapRouteStopMarkerProps {
  stop: RouteWithProfile;
  selected?: boolean;
  onPress?: (stop: RouteWithProfile) => void;
}

export const MapRouteStopMarker: React.FC<MapRouteStopMarkerProps> = ({
  stop,
  selected = false,
  onPress,
}) => {
  const { tracksViewChanges, handleMarkerReady } = useMapMarkerViewTracking({
    userId: stop.user_id,
    imageUrl: stop.image_url,
    imagePreviewUrl: stop.image_preview_url,
  });

  if (
    typeof stop.latitude !== 'number' ||
    typeof stop.longitude !== 'number'
  ) {
    return null;
  }

  const stopLabel = getMapStopLabel(stop);

  return (
    <Marker
      identifier={stop.id ? `stop-${stop.id}` : undefined}
      coordinate={{
        latitude: stop.latitude,
        longitude: stop.longitude,
      }}
      {...getMapMarkerAnchorProps()}
      zIndex={selected ? 21 : 20}
      tracksViewChanges={tracksViewChanges}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.(stop);
      }}
      title={stopLabel || undefined}
      description={stop.description?.trim() || stop.location_label || undefined}
    >
      <MapRouteMarker
        imageUrl={stop.image_url || null}
        imagePreviewUrl={stop.image_preview_url || null}
        userId={stop.user_id || null}
        iconName={stop.categories?.icon_name}
        selected={selected}
        orderLabel={String((stop.order_index ?? 0) + 1)}
        onImageReady={handleMarkerReady}
        collapsable={Platform.OS === 'android' ? false : undefined}
      />
    </Marker>
  );
};

export default MapRouteStopMarker;

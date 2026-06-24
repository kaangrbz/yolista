import React from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { RouteWithProfile } from '../../../model/routes.model';
import { getMapMarkerAnchorProps } from '../../../constants/mapMarkerLayout';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import { useMapMarkerViewTracking } from '../../../hooks/useMapMarkerViewTracking';
import MapRouteMarker from './MapRouteMarker';

interface MapRouteGroupMarkerProps {
  group: RouteWithProfile[];
  selectedRouteId: string | null;
  dimmed?: boolean;
  onPress: (route: RouteWithProfile) => void;
}

export const MapRouteGroupMarker: React.FC<MapRouteGroupMarkerProps> = ({
  group,
  selectedRouteId,
  dimmed = false,
  onPress,
}) => {
  const primary = group[0];
  const { tracksViewChanges, handleMarkerReady } = useMapMarkerViewTracking({
    userId: primary?.user_id,
    imageUrl: primary?.image_url,
    imagePreviewUrl: primary?.image_preview_url,
  });

  if (
    !primary ||
    typeof primary.latitude !== 'number' ||
    typeof primary.longitude !== 'number'
  ) {
    return null;
  }

  const isSelected = group.some((route) => route.id === selectedRouteId);

  return (
    <Marker
      identifier={primary.id || undefined}
      coordinate={{
        latitude: primary.latitude,
        longitude: primary.longitude,
      }}
      {...getMapMarkerAnchorProps()}
      tracksViewChanges={tracksViewChanges}
      onPress={(event) => {
        event.stopPropagation();
        onPress(primary);
      }}
      title={
        group.length > 1 ? `${group.length} rota` : getRouteDisplayLabel(primary)
      }
      description={primary.cities?.name}
    >
      <MapRouteMarker
        imageUrl={primary.image_url || null}
        imagePreviewUrl={primary.image_preview_url || null}
        userId={primary.user_id || null}
        iconName={primary.categories?.icon_name}
        selected={isSelected}
        dimmed={dimmed}
        stackCount={group.length}
        stackItems={group.slice(0, 5).map((route) => ({
          imageUrl: route.image_url || null,
          imagePreviewUrl: route.image_preview_url || null,
          userId: route.user_id || null,
          iconName: route.categories?.icon_name,
          estimatedLocation: route.location_source === 'city_center',
        }))}
        estimatedLocation={primary.location_source === 'city_center'}
        onImageReady={handleMarkerReady}
        collapsable={Platform.OS === 'android' ? false : undefined}
      />
    </Marker>
  );
};

export default MapRouteGroupMarker;

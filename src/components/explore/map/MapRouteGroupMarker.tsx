import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { RouteWithProfile } from '../../../model/routes.model';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import {
  getMarkerImageKey,
  isMarkerImageReady,
  markMarkerImageReady,
} from '../../../utils/mapMarkerImageReady';
import MapRouteMarker from './MapRouteMarker';

const TRACKING_SETTLE_MS = 400;

interface MapRouteGroupMarkerProps {
  group: RouteWithProfile[];
  selectedRouteId: string | null;
  onPress: (route: RouteWithProfile) => void;
  onCalloutPress: (route: RouteWithProfile) => void;
}

/**
 * Custom map marker with route thumbnail preview.
 * tracksViewChanges must be toggled: stay true while the image loads, then false
 * so react-native-maps snapshots the view (permanent true often renders blank on Android).
 */
export const MapRouteGroupMarker: React.FC<MapRouteGroupMarkerProps> = ({
  group,
  selectedRouteId,
  onPress,
  onCalloutPress,
}) => {
  const primary = group[0];
  const imageKey = getMarkerImageKey(
    primary?.user_id,
    primary?.image_url,
    primary?.image_preview_url,
  );
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(
    () =>
      (!!primary?.image_url || !!primary?.image_preview_url) &&
      !isMarkerImageReady(imageKey),
  );

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const scheduleTrackingOff = useCallback(() => {
    clearSettleTimer();
    markMarkerImageReady(imageKey);
    setTracksViewChanges(true);
    settleTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      settleTimerRef.current = null;
    }, TRACKING_SETTLE_MS);
  }, [clearSettleTimer, imageKey]);

  useEffect(() => {
    clearSettleTimer();

    if (!primary?.image_url && !primary?.image_preview_url) {
      setTracksViewChanges(false);
      return;
    }

    if (isMarkerImageReady(imageKey)) {
      setTracksViewChanges(false);
      return;
    }

    setTracksViewChanges(true);

    return clearSettleTimer;
  }, [primary?.id, primary?.image_url, primary?.image_preview_url, imageKey, clearSettleTimer]);

  useEffect(() => () => clearSettleTimer(), [clearSettleTimer]);

  if (
    !primary ||
    typeof primary.latitude !== 'number' ||
    typeof primary.longitude !== 'number'
  ) {
    return null;
  }

  const isSelected = group.some((route) => route.id === selectedRouteId);
  const markerKey = primary.id
    ? `group-${primary.id}`
    : `group-${primary.latitude.toFixed(4)}-${primary.longitude.toFixed(4)}`;

  return (
    <Marker
      key={markerKey}
      identifier={primary.id || undefined}
      coordinate={{
        latitude: primary.latitude,
        longitude: primary.longitude,
      }}
      tracksViewChanges={tracksViewChanges}
      onPress={(event) => {
        event.stopPropagation();
        onPress(primary);
      }}
      onCalloutPress={() => onCalloutPress(primary)}
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
        stackCount={group.length}
        estimatedLocation={primary.location_source === 'city_center'}
        onImageReady={scheduleTrackingOff}
        collapsable={Platform.OS === 'android' ? false : undefined}
      />
    </Marker>
  );
};

export default MapRouteGroupMarker;

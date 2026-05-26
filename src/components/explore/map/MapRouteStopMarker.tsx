import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { RouteWithProfile } from '../../../model/routes.model';
import { getMapStopLabel } from './MapRouteStopCard';
import MapRouteMarker from './MapRouteMarker';
import {
  getMarkerImageKey,
  isMarkerImageReady,
  markMarkerImageReady,
} from '../../../utils/mapMarkerImageReady';

const TRACKING_SETTLE_MS = 400;

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
  const imageKey = getMarkerImageKey(
    stop.user_id,
    stop.image_url,
    stop.image_preview_url,
  );
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(
    () =>
      (!!stop.image_url || !!stop.image_preview_url) &&
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

    if (!stop.image_url && !stop.image_preview_url) {
      setTracksViewChanges(false);
      return;
    }

    if (isMarkerImageReady(imageKey)) {
      setTracksViewChanges(false);
      return;
    }

    setTracksViewChanges(true);

    return clearSettleTimer;
  }, [stop.id, stop.image_url, stop.image_preview_url, imageKey, clearSettleTimer]);

  useEffect(() => () => clearSettleTimer(), [clearSettleTimer]);

  useEffect(() => {
    clearSettleTimer();
    setTracksViewChanges(true);
    settleTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      settleTimerRef.current = null;
    }, TRACKING_SETTLE_MS);

    return clearSettleTimer;
  }, [clearSettleTimer, selected]);

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
      zIndex={selected ? 21 : 20}
      tracksViewChanges={tracksViewChanges}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.(stop);
      }}
      title={stopLabel}
      description={stop.description?.trim() || stop.location_label || undefined}
    >
      <MapRouteMarker
        imageUrl={stop.image_url || null}
        imagePreviewUrl={stop.image_preview_url || null}
        userId={stop.user_id || null}
        iconName={stop.categories?.icon_name}
        selected={selected}
        orderLabel={String((stop.order_index ?? 0) + 1)}
        onImageReady={scheduleTrackingOff}
        collapsable={Platform.OS === 'android' ? false : undefined}
      />
    </Marker>
  );
};

export default MapRouteStopMarker;

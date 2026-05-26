import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  getMarkerImageKey,
  isMarkerImageReady,
  markMarkerImageReady,
} from '../utils/mapMarkerImageReady';

const TRACKING_SETTLE_MS = Platform.OS === 'android' ? 600 : 400;

interface UseMapMarkerViewTrackingOptions {
  userId?: string | null;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  /** Görsel yoksa snapshot hemen kapanır. */
  hasVisual?: boolean;
}

export function useMapMarkerViewTracking({
  userId,
  imageUrl,
  imagePreviewUrl,
  hasVisual = true,
}: UseMapMarkerViewTrackingOptions) {
  const imageKey = getMarkerImageKey(userId, imageUrl, imagePreviewUrl);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(() => {
    if (!hasVisual || (!imageUrl && !imagePreviewUrl)) {
      return false;
    }

    return !isMarkerImageReady(imageKey);
  });

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const handleMarkerReady = useCallback(() => {
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

    if (!hasVisual || (!imageUrl && !imagePreviewUrl)) {
      setTracksViewChanges(false);
      return;
    }

    if (isMarkerImageReady(imageKey)) {
      setTracksViewChanges(false);
      return;
    }

    setTracksViewChanges(true);

    return clearSettleTimer;
  }, [clearSettleTimer, hasVisual, imageKey, imagePreviewUrl, imageUrl]);

  useEffect(() => () => clearSettleTimer(), [clearSettleTimer]);

  return {
    tracksViewChanges,
    handleMarkerReady,
  };
}

import { Region } from 'react-native-maps';
import { BoundingBox } from '../services/RouteDiscoveryService';
import {
  VIEWPORT_FETCH_PADDING_FRACTION,
  VIEWPORT_MIN_PAN_METERS,
  VIEWPORT_MIN_ZOOM_LEVELS,
} from '../constants/mapDefaults';
import { haversineDistanceKm } from './routeDistance';

export const regionToBbox = (region: Region): BoundingBox => ({
  minLat: region.latitude - region.latitudeDelta / 2,
  maxLat: region.latitude + region.latitudeDelta / 2,
  minLng: region.longitude - region.longitudeDelta / 2,
  maxLng: region.longitude + region.longitudeDelta / 2,
});

const metersToLatDelta = (meters: number): number => meters / 111_320;

const metersToLngDelta = (meters: number, latitude: number): number => {
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const denominator = 111_320 * Math.max(Math.abs(cosLat), 0.01);
  return meters / denominator;
};

export const expandBbox = (
  bbox: BoundingBox,
  latitude: number,
  paddingFraction: number = VIEWPORT_FETCH_PADDING_FRACTION,
  minPaddingMeters: number = VIEWPORT_MIN_PAN_METERS,
): BoundingBox => {
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSpan = bbox.maxLng - bbox.minLng;

  const latPadding = Math.max(
    latSpan * paddingFraction,
    metersToLatDelta(minPaddingMeters),
  );
  const lngPadding = Math.max(
    lngSpan * paddingFraction,
    metersToLngDelta(minPaddingMeters, latitude),
  );

  return {
    minLat: bbox.minLat - latPadding,
    maxLat: bbox.maxLat + latPadding,
    minLng: bbox.minLng - lngPadding,
    maxLng: bbox.maxLng + lngPadding,
  };
};

export const bboxContains = (outer: BoundingBox, inner: BoundingBox): boolean =>
  outer.minLat <= inner.minLat &&
  outer.maxLat >= inner.maxLat &&
  outer.minLng <= inner.minLng &&
  outer.maxLng >= inner.maxLng;

/** Web harita zoom seviyesi farkı (log2 tabanlı). */
export const zoomLevelDelta = (previous: Region, next: Region): number => {
  const previousDelta = Math.max(previous.latitudeDelta, previous.longitudeDelta);
  const nextDelta = Math.max(next.latitudeDelta, next.longitudeDelta);

  if (previousDelta <= 0 || nextDelta <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(Math.log2(nextDelta / previousDelta));
};

export const centerPanMeters = (previous: Region, next: Region): number =>
  haversineDistanceKm(
    { latitude: previous.latitude, longitude: previous.longitude },
    { latitude: next.latitude, longitude: next.longitude },
  ) * 1000;

/**
 * Viewport rotaları için yeniden sorgu atlanmalı mı?
 * Önce genişletilmiş bbox kapsamına bakılır; dışına çıkıldıysa
 * pan (m) ve zoom seviyesi eşikleri birlikte değerlendirilir.
 */
export const shouldSkipViewportFetch = (
  previous: Region | null,
  next: Region,
  lastFetchedBbox: BoundingBox | null,
): boolean => {
  if (!previous || !lastFetchedBbox) {
    return false;
  }

  const nextViewportBbox = regionToBbox(next);

  if (bboxContains(lastFetchedBbox, nextViewportBbox)) {
    return true;
  }

  const panMeters = centerPanMeters(previous, next);
  const zoomDelta = zoomLevelDelta(previous, next);

  return (
    panMeters < VIEWPORT_MIN_PAN_METERS &&
    zoomDelta < VIEWPORT_MIN_ZOOM_LEVELS
  );
};

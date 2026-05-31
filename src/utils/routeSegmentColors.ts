import {
  ROUTE_SEGMENT_ACTIVE,
  ROUTE_SEGMENT_APPROACH_ACTIVE,
  ROUTE_SEGMENT_APPROACH_MUTED,
  ROUTE_SEGMENT_PAST,
  ROUTE_SEGMENT_UPCOMING,
} from '../constants/mapDefaults';
import type {
  RouteSegmentStatus,
  RouteSegmentVariant,
} from '../types/routeSegment.types';

export const getSegmentStrokeColor = (
  status: RouteSegmentStatus,
  variant: RouteSegmentVariant,
): string => {
  if (variant === 'approach') {
    return status === 'active'
      ? ROUTE_SEGMENT_APPROACH_ACTIVE
      : ROUTE_SEGMENT_APPROACH_MUTED;
  }

  if (status === 'active') {
    return ROUTE_SEGMENT_ACTIVE;
  }

  if (status === 'past') {
    return ROUTE_SEGMENT_PAST;
  }

  return ROUTE_SEGMENT_UPCOMING;
};

export const formatDurationFromSeconds = (
  seconds: number | null,
): string | null => {
  if (seconds === null || seconds <= 0) {
    return null;
  }

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours} sa`;
  }

  return `${hours} sa ${remainder} dk`;
};

export const formatDistanceFromMeters = (
  meters: number | null,
): string | null => {
  if (meters === null || meters <= 0) {
    return null;
  }

  const km = meters / 1000;

  if (km < 0.05) {
    return '~0 km';
  }

  if (km < 10) {
    return `~${km.toFixed(1)} km`;
  }

  return `~${Math.round(km)} km`;
};

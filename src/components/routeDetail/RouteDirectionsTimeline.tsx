import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  MAP_ACTIVE_ROUTE_BORDER,
  ROUTE_SEGMENT_APPROACH_ACTIVE,
  ROUTE_SEGMENT_PAST,
  ROUTE_SEGMENT_UPCOMING,
} from '../../constants/mapDefaults';
import type { RouteSegment } from '../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../types/routeSegment.types';
import {
  formatDistanceFromMeters,
  formatDurationFromSeconds,
  getSegmentStrokeColor,
} from '../../utils/routeSegmentColors';
import { getStopLetterLabel } from '../../utils/getStopOrderLabel';

const getTimelineDurationColor = (
  status: ReturnType<typeof getRouteSegmentStatus>,
  variant: RouteSegment['variant'],
): string => {
  if (variant === 'approach') {
    return status === 'active' ? ROUTE_SEGMENT_APPROACH_ACTIVE : ROUTE_SEGMENT_PAST;
  }

  if (status === 'active') {
    return MAP_ACTIVE_ROUTE_BORDER;
  }

  if (status === 'past') {
    return ROUTE_SEGMENT_PAST;
  }

  return ROUTE_SEGMENT_UPCOMING;
};

export type RouteDirectionsTimelineStyles = {
  timeline: object;
  timelineRow: object;
  timelineRail: object;
  timelineDot: object;
  timelineLine: object;
  timelineContent: object;
  timelineContentActive: object;
  timelineLabel: object;
  timelineSub: object;
  timelineDuration: object;
};

interface RouteDirectionsTimelineProps {
  segments: RouteSegment[];
  activeSegmentIndex: number;
  onSegmentPress: (index: number) => void;
  styles: RouteDirectionsTimelineStyles;
  dotBorderColor: string;
}

export const RouteDirectionsTimeline: React.FC<RouteDirectionsTimelineProps> = ({
  segments,
  activeSegmentIndex,
  onSegmentPress,
  styles,
  dotBorderColor,
}) => (
  <View style={styles.timeline}>
    {segments.map((segment, index) => {
      const status = getRouteSegmentStatus(index, activeSegmentIndex);
      const isActive = status === 'active';
      const isLast = index === segments.length - 1;
      const durationLabel = formatDurationFromSeconds(segment.durationSeconds);
      const distanceLabel = formatDistanceFromMeters(segment.distanceMeters);
      const estimateSuffix = segment.isEstimated ? ' (tahmini)' : '';
      const metricsLabel = [durationLabel, distanceLabel]
        .filter(Boolean)
        .join(' · ');
      const railColor = getSegmentStrokeColor(status, segment.variant);
      const durationColor = getTimelineDurationColor(status, segment.variant);
      const isUserOrigin = segment.variant === 'approach';

      return (
        <TouchableOpacity
          key={segment.id}
          style={[styles.timelineRow, !isActive && { opacity: 0.42 }]}
          activeOpacity={0.85}
          onPress={() => onSegmentPress(index)}
        >
          <View style={styles.timelineRail}>
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: railColor,
                  borderColor: dotBorderColor,
                  ...(isActive ? { transform: [{ scale: 1.12 }] } : {}),
                },
              ]}
            >
              {isUserOrigin ? (
                <Icon name="crosshairs-gps" size={10} color="#fff" />
              ) : (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#fff',
                  }}
                >
                  {getStopLetterLabel(
                    segment.navigationOptimized
                      ? segment.visitIndex
                      : segment.targetStopOrderIndex,
                  )}
                </Text>
              )}
            </View>
            {!isLast ? (
              <View
                style={[styles.timelineLine, { backgroundColor: railColor }]}
              />
            ) : null}
          </View>

          <View
            style={[
              styles.timelineContent,
              isActive && styles.timelineContentActive,
            ]}
          >
            <Text style={styles.timelineLabel} numberOfLines={isActive ? 2 : 1}>
              {isActive ? `${segment.fromLabel} → ${segment.toLabel}` : segment.toLabel}
            </Text>
            {metricsLabel ? (
              <Text
                style={[styles.timelineDuration, { color: durationColor }]}
              >
                {`${metricsLabel}${estimateSuffix}`}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default RouteDirectionsTimeline;

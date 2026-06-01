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
      const railColor = getSegmentStrokeColor(status, segment.variant);
      const durationColor = getTimelineDurationColor(status, segment.variant);
      const isUserOrigin = segment.variant === 'approach';

      return (
        <TouchableOpacity
          key={segment.id}
          style={styles.timelineRow}
          activeOpacity={0.85}
          onPress={() => onSegmentPress(index)}
        >
          <View style={styles.timelineRail}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: railColor, borderColor: dotBorderColor },
              ]}
            >
              {isUserOrigin ? (
                <Icon name="circle" size={8} color="#fff" />
              ) : (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#fff',
                  }}
                >
                  {String.fromCharCode(
                    65 + Math.max(0, segment.targetStopOrderIndex),
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
            <Text style={styles.timelineLabel} numberOfLines={2}>
              {segment.toLabel}
            </Text>
            <Text style={styles.timelineSub} numberOfLines={1}>
              {segment.fromLabel} → {segment.toLabel}
            </Text>
            {durationLabel ? (
              <Text
                style={[styles.timelineDuration, { color: durationColor }]}
              >
                {[durationLabel, distanceLabel].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default RouteDirectionsTimeline;

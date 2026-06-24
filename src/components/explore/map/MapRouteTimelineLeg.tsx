import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import type { RouteSegment } from '../../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../../types/routeSegment.types';
import {
  formatDistanceFromMeters,
  formatDurationFromSeconds,
} from '../../../utils/routeSegmentColors';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

const RAIL_WIDTH = 28;

interface MapRouteTimelineLegProps {
  segment: RouteSegment;
  segmentIndex: number;
  activeSegmentIndex: number;
  onSegmentPress?: (index: number) => void;
  onOpenDirections?: () => void;
}

export const MapRouteTimelineLeg: React.FC<MapRouteTimelineLegProps> = ({
  segment,
  segmentIndex,
  activeSegmentIndex,
  onSegmentPress,
  onOpenDirections,
}) => {
  const theme = useAppTheme();
  const status = getRouteSegmentStatus(segmentIndex, activeSegmentIndex);
  const isActive = status === 'active';

  const distanceLabel = formatDistanceFromMeters(segment.distanceMeters);
  const durationLabel = formatDurationFromSeconds(segment.durationSeconds);
  const metrics = [distanceLabel, durationLabel].filter(Boolean).join(' • ');
  const estimateSuffix = segment.isEstimated ? ' (tahmini)' : '';

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      minHeight: 44,
      opacity: isActive ? 1 : 0.72,
    },
    rail: {
      width: RAIL_WIDTH,
      alignItems: 'center',
      marginRight: 10,
    },
    line: {
      width: 2,
      flex: 1,
      backgroundColor: MAP_ACTIVE_ROUTE_BORDER,
      opacity: isActive ? 0.85 : 0.35,
      borderRadius: 1,
    },
    capsuleWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 4,
    },
    capsule: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: isActive ? MAP_ACTIVE_ROUTE_BORDER : t.border,
    },
    metrics: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
    },
    directionsChip: {
      marginLeft: 2,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: isActive ? MAP_ACTIVE_ROUTE_BORDER : t.background,
    },
    directionsText: {
      fontSize: 10,
      fontWeight: '700',
      color: isActive ? '#fff' : t.textSecondary,
    },
  }));

  const handlePress = () => {
    onSegmentPress?.(segmentIndex);
  };

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={!onSegmentPress}
    >
      <View style={styles.rail}>
        <View style={styles.line} />
      </View>

      <View style={styles.capsuleWrap}>
        <View style={styles.capsule}>
          <Icon
            name={segment.variant === 'approach' ? 'crosshairs-gps' : 'car-outline'}
            size={14}
            color={isActive ? MAP_ACTIVE_ROUTE_BORDER : theme.textMuted}
          />
          {metrics ? (
            <Text style={styles.metrics}>
              {`${metrics}${estimateSuffix}`}
            </Text>
          ) : null}
          {onOpenDirections ? (
            <TouchableOpacity
              style={styles.directionsChip}
              onPress={(event) => {
                event.stopPropagation?.();
                onOpenDirections();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={styles.directionsText}>Yol Tarifi Al</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MapRouteTimelineLeg;

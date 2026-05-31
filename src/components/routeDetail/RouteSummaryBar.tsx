import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  estimateWalkingMinutes,
  extractValidCoordinates,
  formatWalkingDuration,
  getRouteDistanceLabel,
  totalRouteDistanceKmFromPoints,
} from '../../utils/routeDistance';

interface RouteSummaryBarProps {
  stops: RouteWithProfile[];
}

export const RouteSummaryBar: React.FC<RouteSummaryBarProps> = ({ stops }) => {
  const coords = extractValidCoordinates(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );
  const distanceLabel = getRouteDistanceLabel(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );
  const totalKm = totalRouteDistanceKmFromPoints(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );
  const walkingLabel =
    coords.length >= 2 ? formatWalkingDuration(estimateWalkingMinutes(totalKm)) : null;

  const styles = useThemedStyles((t) => ({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      gap: 10,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textPrimary,
    },
    metaMuted: {
      fontSize: 13,
      color: t.textSecondary,
    },
  }));

  const metaParts = [`${stops.length} durak`];

  if (distanceLabel) {
    metaParts.push(distanceLabel);
  }

  if (walkingLabel) {
    metaParts.push(walkingLabel);
  }

  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        {metaParts.map((part, index) => (
          <React.Fragment key={part}>
            {index > 0 ? <Text style={styles.metaMuted}>·</Text> : null}
            <Text style={styles.metaText}>{part}</Text>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default RouteSummaryBar;

import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useAppTheme } from '../../context/AppThemeContext';
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
  const theme = useAppTheme();

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
      paddingBottom: 12,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
  }));

  const chips: { icon: string; label: string }[] = [
    { icon: 'map-marker-multiple', label: `${stops.length} durak` },
  ];

  if (distanceLabel) {
    chips.push({ icon: 'map-marker-distance', label: distanceLabel });
  }

  if (walkingLabel) {
    chips.push({ icon: 'walk', label: walkingLabel });
  }

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <Icon name={chip.icon} size={14} color={theme.textSecondary} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default RouteSummaryBar;

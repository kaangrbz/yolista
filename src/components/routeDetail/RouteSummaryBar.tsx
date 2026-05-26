import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { openRouteInMaps } from '../../utils/openInMaps';

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
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
    },
    mapsButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
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

      {coords.length > 0 ? (
        <TouchableOpacity
          style={styles.mapsButton}
          activeOpacity={0.85}
          onPress={() => {
            void openRouteInMaps(coords);
          }}
        >
          <Icon name="google-maps" size={16} color={theme.accent} />
          <Text style={styles.mapsButtonText}>Tüm rotayı haritada aç</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default RouteSummaryBar;

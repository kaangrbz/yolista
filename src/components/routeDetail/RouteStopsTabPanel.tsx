import React, { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import RouteDetailMap from './RouteDetailMap';
import RouteSummaryBar from './RouteSummaryBar';
import { extractValidCoordinates } from '../../utils/routeDistance';
import { openRouteInMaps } from '../../utils/openInMaps';
import MapRouteStopCard, {
  getMapStopLabel,
  MAP_ROUTE_STOP_CARD_STEP,
} from '../explore/map/MapRouteStopCard';

interface RouteStopsTabPanelProps {
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onStopPress: (index: number) => void;
}

export const RouteStopsTabPanel: React.FC<RouteStopsTabPanelProps> = ({
  stops,
  activeStopIndex,
  onStopPress,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    container: {
      paddingBottom: 8,
    },
    sectionLabel: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      letterSpacing: 0.4,
    },
    mapSpacing: {
      paddingTop: 4,
      paddingBottom: 4,
    },
    horizontalContent: {
      paddingHorizontal: 10,
      paddingBottom: 4,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    actionsRow: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    mapsButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
    emptyText: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      fontSize: 13,
      color: t.textSecondary,
      textAlign: 'center',
    },
  }));

  const routeCoords = extractValidCoordinates(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );

  const ownerUserId = stops[0]?.user_id || '';

  useEffect(() => {
    if (stops.length === 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: Math.max(0, activeStopIndex * MAP_ROUTE_STOP_CARD_STEP - 10),
      animated: true,
    });
  }, [activeStopIndex, stops.length]);

  const handleOpenRouteInMaps = useCallback(() => {
    if (routeCoords.length === 0) {
      return;
    }

    void openRouteInMaps(routeCoords);
  }, [routeCoords]);

  if (stops.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Bu rotada durak yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapSpacing}>
        <RouteDetailMap
          stops={stops}
          activeStopIndex={activeStopIndex}
          onStopPress={onStopPress}
          variant="embedded"
        />
      </View>

      <RouteSummaryBar stops={stops} />

      <Text style={styles.sectionLabel}>Durakları keşfet</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContent}
        nestedScrollEnabled
      >
        {stops.map((stop, index) => {
          const stopWithOwner = stop.user_id ? stop : { ...stop, user_id: ownerUserId };

          return (
            <MapRouteStopCard
              key={stop.id ?? `stop-${index}`}
              stop={stopWithOwner}
              stopLabel={getMapStopLabel(stop)}
              selected={index === activeStopIndex}
              onPress={() => onStopPress(index)}
            />
          );
        })}
      </ScrollView>

      {routeCoords.length > 0 ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.mapsButton}
            activeOpacity={0.85}
            onPress={handleOpenRouteInMaps}
            accessibilityRole="button"
            accessibilityLabel="Tüm rotayı haritada aç"
          >
            <Icon name="google-maps" size={18} color={theme.accent} />
            <Text style={styles.mapsButtonText}>Tüm rotayı haritada aç</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default RouteStopsTabPanel;

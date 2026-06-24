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
import { openRouteInMaps, openStopInMaps } from '../../utils/openInMaps';
import MapRouteStopCard, {
  getMapStopLabel,
  MAP_ROUTE_STOP_CARD_STEP,
} from '../explore/map/MapRouteStopCard';
import { ROUTE_EXTERNAL_NAV_DISCLAIMER } from '../../constants/routeDetailCopy';

interface RouteStopsTabPanelProps {
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onStopPress: (index: number) => void;
  onNestedScrollLockChange?: (isActive: boolean) => void;
  onExpandMap?: () => void;
  showSummaryBar?: boolean;
  hideEmbeddedMap?: boolean;
}

export const RouteStopsTabPanel: React.FC<RouteStopsTabPanelProps> = ({
  stops,
  activeStopIndex,
  onStopPress,
  onNestedScrollLockChange,
  onExpandMap,
  showSummaryBar = true,
  hideEmbeddedMap = false,
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
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
      marginHorizontal: 16,
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
    },
    expandButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
    mapsButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    mapsButtonPrimary: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    mapsButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
    mapsButtonTextPrimary: {
      color: '#fff',
    },
    actionsButtonsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    mapsDisclaimer: {
      marginTop: 8,
      fontSize: 11,
      lineHeight: 15,
      color: t.textMuted,
      textAlign: 'center',
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

  const activeStop = stops[activeStopIndex];

  const handleOpenActiveStopInMaps = useCallback(() => {
    if (
      !activeStop ||
      typeof activeStop.latitude !== 'number' ||
      typeof activeStop.longitude !== 'number'
    ) {
      return;
    }

    void openStopInMaps({
      latitude: activeStop.latitude,
      longitude: activeStop.longitude,
    });
  }, [activeStop]);

  const handleOpenRouteInMaps = useCallback(() => {
    if (routeCoords.length === 0) {
      return;
    }

    void openRouteInMaps(routeCoords);
  }, [routeCoords]);

  const activeStopHasCoordinate =
    Boolean(activeStop) &&
    typeof activeStop?.latitude === 'number' &&
    typeof activeStop?.longitude === 'number';

  if (stops.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Bu rotada durak yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hideEmbeddedMap ? (
        onExpandMap ? (
          <TouchableOpacity
            style={styles.expandButton}
            activeOpacity={0.85}
            onPress={onExpandMap}
            accessibilityRole="button"
            accessibilityLabel="Haritayı tam ekran aç"
          >
            <Icon name="arrow-expand" size={16} color={theme.textPrimary} />
            <Text style={styles.expandButtonText}>Haritayı tam ekran aç</Text>
          </TouchableOpacity>
        ) : null
      ) : (
        <View style={styles.mapSpacing}>
          <RouteDetailMap
            stops={stops}
            activeStopIndex={activeStopIndex}
            onStopPress={onStopPress}
            variant="embedded"
            onMapInteractionChange={onNestedScrollLockChange}
          />
          {onExpandMap ? (
            <TouchableOpacity
              style={styles.expandButton}
              activeOpacity={0.85}
              onPress={onExpandMap}
              accessibilityRole="button"
              accessibilityLabel="Haritayı genişlet"
            >
              <Icon name="arrow-expand" size={16} color={theme.textPrimary} />
              <Text style={styles.expandButtonText}>Haritayı genişlet</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {showSummaryBar ? <RouteSummaryBar stops={stops} /> : null}

      <Text style={styles.sectionLabel}>Durakları keşfet</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContent}
        nestedScrollEnabled
        directionalLockEnabled
        onScrollBeginDrag={() => onNestedScrollLockChange?.(true)}
        onScrollEndDrag={() => onNestedScrollLockChange?.(false)}
        onMomentumScrollEnd={() => onNestedScrollLockChange?.(false)}
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
          <View style={styles.actionsButtonsRow}>
            {activeStopHasCoordinate ? (
              <TouchableOpacity
                style={[styles.mapsButton, styles.mapsButtonPrimary]}
                activeOpacity={0.88}
                onPress={handleOpenActiveStopInMaps}
                accessibilityRole="button"
                accessibilityLabel="Seçili durağı haritada aç"
              >
                <Icon name="map-marker-radius" size={16} color="#fff" />
                <Text style={[styles.mapsButtonText, styles.mapsButtonTextPrimary]}>
                  Seçili durak
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.mapsButton}
              activeOpacity={0.85}
              onPress={handleOpenRouteInMaps}
              accessibilityRole="button"
              accessibilityLabel="Tüm rotayı haritada aç"
            >
              <Icon name="google-maps" size={16} color={theme.accent} />
              <Text style={styles.mapsButtonText}>Tüm rota</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mapsDisclaimer}>{ROUTE_EXTERNAL_NAV_DISCLAIMER}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default RouteStopsTabPanel;

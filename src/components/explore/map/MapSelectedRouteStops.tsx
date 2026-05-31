import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import { getRouteDistanceLabel, extractValidCoordinates } from '../../../utils/routeDistance';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import MapRouteStopCard, {
  getMapStopKey,
  getMapStopLabel,
  MAP_ROUTE_STOP_CARD_STEP,
} from './MapRouteStopCard';

interface MapSelectedRouteStopsProps {
  stops: RouteWithProfile[];
  loading: boolean;
  selectedRoute: RouteWithProfile | null;
  activeStopId?: string | null;
  onStopPress?: (stop: RouteWithProfile) => void;
  onClearSelection?: () => void;
  onOpenRouteInMaps?: () => void;
  onOpenStopInMaps?: (stop: RouteWithProfile) => void;
  startFromUserLocation?: boolean;
  onStartFromUserLocationChange?: (enabled: boolean) => void;
  canStartFromUserLocation?: boolean;
}

const MapSelectedRouteStops: React.FC<MapSelectedRouteStopsProps> = ({
  stops,
  loading,
  selectedRoute,
  activeStopId = null,
  onStopPress,
  onClearSelection,
  onOpenRouteInMaps,
  onOpenStopInMaps,
  startFromUserLocation = false,
  onStartFromUserLocationChange,
  canStartFromUserLocation = false,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingVertical: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerMeta: {
      fontSize: 11,
      color: t.textMuted,
      fontWeight: '600',
    },
    clearButton: {
      marginLeft: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceMuted,
    },
    horizontalContent: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: t.textSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
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
    mapsButtonActive: {
      backgroundColor: t.background,
      borderWidth: 1.5,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    mapsButtonTextActive: {
      color: t.accent,
    },
  }));

  const displayStops = useMemo(() => {
    return [...stops].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
    );
  }, [stops]);

  const ownerUserId =
    selectedRoute?.user_id || selectedRoute?.profiles?.id || '';

  const canScrollStops = displayStops.length > 1;

  const distanceLabel = useMemo(
    () => getRouteDistanceLabel(displayStops),
    [displayStops],
  );

  const routeCoords = useMemo(
    () =>
      extractValidCoordinates(
        displayStops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      ),
    [displayStops],
  );

  const activeStop = useMemo(() => {
    if (!activeStopId) {
      return null;
    }

    return (
      displayStops.find((stop) => getMapStopKey(stop) === activeStopId) ?? null
    );
  }, [activeStopId, displayStops]);

  const activeStopHasCoordinate =
    activeStop &&
    typeof activeStop.latitude === 'number' &&
    typeof activeStop.longitude === 'number';

  useEffect(() => {
    if (!canScrollStops) {
      return;
    }

    if (!activeStopId || loading || displayStops.length === 0) {
      return;
    }

    const index = displayStops.findIndex(
      (stop) => getMapStopKey(stop) === activeStopId,
    );

    if (index < 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: Math.max(0, index * MAP_ROUTE_STOP_CARD_STEP - 10),
      animated: true,
    });
  }, [activeStopId, canScrollStops, displayStops, loading]);

  const renderStopCard = useCallback(
    (item: RouteWithProfile) => {
      const stopWithOwner = item.user_id
        ? item
        : { ...item, user_id: ownerUserId };

      return (
        <MapRouteStopCard
          key={getMapStopKey(item)}
          stop={stopWithOwner}
          stopLabel={getMapStopLabel(item)}
          selected={activeStopId === getMapStopKey(item)}
          onPress={onStopPress ? () => onStopPress(item) : undefined}
        />
      );
    },
    [activeStopId, onStopPress, ownerUserId],
  );

  const routeLabel = selectedRoute
    ? getRouteDisplayLabel(selectedRoute)
    : 'Seçili rota';

  const headerMeta = useMemo(() => {
    if (loading || displayStops.length === 0) {
      return null;
    }

    const parts = [`${displayStops.length} durak`];

    if (distanceLabel) {
      parts.push(distanceLabel);
    }

    return parts.join(' · ');
  }, [displayStops.length, distanceLabel, loading]);

  if (!loading && displayStops.length === 0) {
    return null;
  }

  if (!selectedRoute && !loading) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {routeLabel}
        </Text>
        {!loading && headerMeta ? (
          <Text style={styles.headerMeta}>{headerMeta}</Text>
        ) : null}
        {onClearSelection ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSelection}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Ana rotaya dön"
            activeOpacity={0.75}>
            <Icon name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {!loading && routeCoords.length > 0 && onOpenRouteInMaps ? (
        <View style={styles.actionsRow}>
          {canStartFromUserLocation && onStartFromUserLocationChange ? (
            <TouchableOpacity
              style={[
                styles.mapsButton,
                startFromUserLocation && styles.mapsButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                void onStartFromUserLocationChange(!startFromUserLocation);
              }}
              accessibilityState={{ selected: startFromUserLocation }}
            >
              <Icon
                name="crosshairs-gps"
                size={16}
                color={startFromUserLocation ? theme.accent : theme.textSecondary}
              />
              <Text
                style={[
                  styles.mapsButtonText,
                  startFromUserLocation && styles.mapsButtonTextActive,
                ]}
              >
                Konumumdan başla
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.mapsButton}
            activeOpacity={0.85}
            onPress={onOpenRouteInMaps}
          >
            <Icon name="google-maps" size={16} color={theme.accent} />
            <Text style={styles.mapsButtonText}>Tüm rotayı haritada aç</Text>
          </TouchableOpacity>

          {activeStopHasCoordinate && activeStop && onOpenStopInMaps ? (
            <TouchableOpacity
              style={styles.mapsButton}
              activeOpacity={0.85}
              onPress={() => onOpenStopInMaps(activeStop)}
            >
              <Icon name="map-marker-radius" size={16} color={theme.accent} />
              <Text style={styles.mapsButtonText}>Bu durağı haritada aç</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.loadingText}>Duraklar yükleniyor...</Text>
        </View>
      ) :
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
          nestedScrollEnabled
          scrollEnabled={canScrollStops}
          directionalLockEnabled>
          {displayStops.map((stop) => renderStopCard(stop))}
        </ScrollView>
        }
    </View>
  );
};

export default React.memo(MapSelectedRouteStops);

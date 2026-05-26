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
}

const MapSelectedRouteStops: React.FC<MapSelectedRouteStopsProps> = ({
  stops,
  loading,
  selectedRoute,
  activeStopId = null,
  onStopPress,
  onClearSelection,
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
  }));

  const displayStops = useMemo(() => {
    return [...stops].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
    );
  }, [stops]);

  const ownerUserId =
    selectedRoute?.user_id || selectedRoute?.profiles?.id || '';

  useEffect(() => {
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
  }, [activeStopId, displayStops, loading]);

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

  if (!loading && displayStops.length === 0) {
    return null;
  }

  if (!selectedRoute && !loading) {
    return null;
  }

  const routeLabel = selectedRoute
    ? getRouteDisplayLabel(selectedRoute)
    : 'Seçili rota';

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {routeLabel}
        </Text>
        {!loading && displayStops.length > 0 ? (
          <Text style={styles.headerMeta}>
            {displayStops.length} durak
          </Text>
        ) : null}
        {onClearSelection ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSelection}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Durakları kapat"
            activeOpacity={0.75}>
            <Icon name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.loadingText}>Duraklar yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
          nestedScrollEnabled
          directionalLockEnabled>
          {displayStops.map((stop) => renderStopCard(stop))}
        </ScrollView>
      )}
    </View>
  );
};

export default React.memo(MapSelectedRouteStops);

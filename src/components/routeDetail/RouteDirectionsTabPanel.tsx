import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import type { RouteSegment } from '../../types/routeSegment.types';
import {
  formatDistanceFromMeters,
  formatDurationFromSeconds,
} from '../../utils/routeSegmentColors';
import RouteSegmentMap from './RouteSegmentMap';
import RouteDirectionsTimeline from './RouteDirectionsTimeline';
import RouteDirectionsStepsList from './RouteDirectionsStepsList';
import { trackRouteDetailEvent } from '../../analytics/routeDetailAnalytics';
import {
  openRouteInMaps,
  openStopInMaps,
  resolveTravelModeForDistanceKm,
  type TravelMode,
} from '../../utils/openInMaps';
import {
  extractValidCoordinates,
  totalRouteDistanceKmFromPoints,
} from '../../utils/routeDistance';
import { ROUTE_EXTERNAL_NAV_DISCLAIMER } from '../../constants/routeDetailCopy';
import { getNavigationStopCoordinates } from '../../utils/routeOrderOptimization';

interface RouteDirectionsTabPanelProps {
  routeId?: string;
  stops: RouteWithProfile[];
  segments: RouteSegment[];
  activeSegmentIndex: number;
  activeStopIndex?: number;
  loading: boolean;
  startFromUserLocation: boolean;
  canStartFromUserLocation: boolean;
  onSegmentPress: (index: number) => void;
  onStartFromUserLocationChange: (enabled: boolean) => void;
  onNestedScrollLockChange?: (isActive: boolean) => void;
  useFloatingPrimaryCta?: boolean;
  surface?: 'detail' | 'map_sheet';
  optimizeRouteOrder?: boolean;
  onOptimizeRouteOrderChange?: (enabled: boolean) => void;
  optimizeSavingsPercent?: number | null;
}

export const RouteDirectionsTabPanel: React.FC<RouteDirectionsTabPanelProps> = ({
  stops,
  segments,
  activeSegmentIndex,
  activeStopIndex = 0,
  loading,
  startFromUserLocation,
  canStartFromUserLocation,
  onSegmentPress,
  onStartFromUserLocationChange,
  onNestedScrollLockChange,
  useFloatingPrimaryCta = false,
  routeId,
  surface = 'detail',
  optimizeRouteOrder = false,
  onOptimizeRouteOrderChange,
  optimizeSavingsPercent = null,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
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
    chipActive: {
      backgroundColor: t.background,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
      borderWidth: 1.5,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
    timeline: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    timelineRow: {
      flexDirection: 'row',
      minHeight: 56,
    },
    timelineRail: {
      width: 28,
      alignItems: 'center',
    },
    timelineDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
    },
    timelineLine: {
      flex: 1,
      width: 3,
      borderRadius: 2,
      marginVertical: 2,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 14,
      paddingLeft: 8,
      paddingRight: 4,
      borderRadius: 10,
      paddingTop: 2,
    },
    timelineContentActive: {
      backgroundColor: t.surfaceMuted,
      borderLeftWidth: 3,
      borderLeftColor: MAP_ACTIVE_ROUTE_BORDER,
      paddingLeft: 10,
    },
    timelineLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
    },
    timelineSub: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 2,
    },
    timelineDuration: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    stepsSection: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
    },
    stepsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    stepText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: t.textPrimary,
    },
    actionsRow: {
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 46,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: theme.accent,
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    secondaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    secondaryButton: {
      flex: 1,
      minWidth: '46%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    secondaryButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    loadingText: {
      fontSize: 13,
      color: t.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    mapsDisclaimer: {
      fontSize: 11,
      lineHeight: 15,
      color: t.textMuted,
      textAlign: 'center',
    },
    optimizeHint: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      fontSize: 11,
      lineHeight: 15,
      color: t.textMuted,
    },
  }));

  const totals = useMemo(() => {
    let totalSeconds = 0;
    let totalMeters = 0;
    let hasDuration = false;
    let hasDistance = false;

    segments.forEach((segment) => {
      if (segment.durationSeconds) {
        totalSeconds += segment.durationSeconds;
        hasDuration = true;
      }

      if (segment.distanceMeters) {
        totalMeters += segment.distanceMeters;
        hasDistance = true;
      }
    });

    return {
      durationLabel: hasDuration
        ? formatDurationFromSeconds(totalSeconds)
        : null,
      distanceLabel: hasDistance
        ? formatDistanceFromMeters(totalMeters)
        : null,
    };
  }, [segments]);

  const activeSegment = segments[activeSegmentIndex];
  const activeSteps = activeSegment?.directionSteps ?? [];
  const coordStops = extractValidCoordinates(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );
  const navigationCoords = useMemo(
    () => getNavigationStopCoordinates(stops, optimizeRouteOrder),
    [optimizeRouteOrder, stops],
  );
  const canOptimizeOrder = coordStops.length >= 3;

  const totalKm = useMemo(
    () => totalRouteDistanceKmFromPoints(coordStops),
    [coordStops],
  );

  const suggestedTravelMode = useMemo(
    () => resolveTravelModeForDistanceKm(totalKm),
    [totalKm],
  );

  const [travelMode, setTravelMode] = useState<TravelMode>(suggestedTravelMode);

  useEffect(() => {
    setTravelMode(suggestedTravelMode);
  }, [suggestedTravelMode]);

  const hasEstimatedSegments = segments.some((segment) => segment.isEstimated);

  const trackMapsCta = (scope: 'full_route' | 'segment' | 'stop') => {
    if (!routeId) {
      return;
    }

    trackRouteDetailEvent({
      name: 'route_detail_maps_cta',
      routeId,
      scope,
      travelMode,
      surface,
    });
  };

  const handleOpenRouteInMaps = () => {
    if (navigationCoords.length === 0) {
      return;
    }

    trackMapsCta('full_route');
    void openRouteInMaps(navigationCoords, {
      travelMode,
      optimizeWaypoints: optimizeRouteOrder,
    });
  };

  const handleOpenActiveSegmentInMaps = () => {
    if (!activeSegment) {
      return;
    }

    trackMapsCta('segment');
    void openRouteInMaps([activeSegment.from, activeSegment.to], { travelMode });
  };

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text style={styles.loadingText}>Yol tarifi hazırlanıyor...</Text>
      </View>
    );
  }

  if (segments.length === 0) {
    const singleStop = coordStops.length === 1;

    return (
      <View style={styles.wrapper}>
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>
            {singleStop
              ? 'Tek nokta — yönlendirme yok'
              : 'Koordinatlı durak bulunamadı'}
          </Text>
        </View>
        {singleStop ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={() => {
                trackMapsCta('stop');
                void openStopInMaps(coordStops[0], { travelMode });
              }}
            >
              <Icon name="google-maps" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Google Maps'te aç</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  const summaryChips: { icon: string; label: string }[] = [
    { icon: 'routes', label: `${segments.length} bacak` },
  ];

  if (totals.distanceLabel) {
    summaryChips.push({
      icon: 'map-marker-distance',
      label: hasEstimatedSegments ? `${totals.distanceLabel} (tahmini)` : totals.distanceLabel,
    });
  }

  if (totals.durationLabel) {
    summaryChips.push({
      icon: travelMode === 'driving' ? 'car' : 'walk',
      label: hasEstimatedSegments
        ? `${totals.durationLabel} (tahmini)`
        : totals.durationLabel,
    });
  }

  const travelModeChips: { id: TravelMode; label: string; icon: string }[] = [
    { id: 'walking', label: 'Yürüyüş', icon: 'walk' },
    { id: 'driving', label: 'Sürüş', icon: 'car' },
  ];

  return (
    <View style={styles.wrapper}>
      <RouteSegmentMap
        segments={segments}
        activeSegmentIndex={activeSegmentIndex}
        activeStopIndex={activeStopIndex}
        stops={stops}
        onMapInteractionChange={onNestedScrollLockChange}
      />

      <View style={styles.chipRow}>
        {summaryChips.map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <Icon name={chip.icon} size={14} color={theme.textSecondary} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}

        {travelModeChips.map((chip) => {
          const isActive = travelMode === chip.id;

          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.85}
              onPress={() => setTravelMode(chip.id)}
            >
              <Icon
                name={chip.icon}
                size={14}
                color={isActive ? theme.accent : theme.textSecondary}
              />
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}

        {canOptimizeOrder && onOptimizeRouteOrderChange ? (
          <TouchableOpacity
            style={[styles.chip, optimizeRouteOrder && styles.chipActive]}
            activeOpacity={0.85}
            onPress={() => onOptimizeRouteOrderChange(!optimizeRouteOrder)}
          >
            <Icon
              name="map-marker-path"
              size={14}
              color={optimizeRouteOrder ? theme.accent : theme.textSecondary}
            />
            <Text style={styles.chipText}>
              En kısa sıra
              {optimizeSavingsPercent
                ? ` · ~%${optimizeSavingsPercent}`
                : ''}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canStartFromUserLocation ? (
          <TouchableOpacity
            style={[styles.chip, startFromUserLocation && styles.chipActive]}
            activeOpacity={0.85}
            onPress={() => {
              void onStartFromUserLocationChange(!startFromUserLocation);
            }}
          >
            <Icon
              name="crosshairs-gps"
              size={14}
              color={startFromUserLocation ? theme.accent : theme.textSecondary}
            />
            <Text style={styles.chipText}>Konumumdan başla</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {optimizeRouteOrder ? (
        <Text style={styles.optimizeHint}>
          Navigasyon sırası mesafeye göre optimize edildi. Fotoğraf ve durak
          sırası aynı kaldı.
        </Text>
      ) : null}

      <RouteDirectionsTimeline
        segments={segments}
        activeSegmentIndex={activeSegmentIndex}
        onSegmentPress={onSegmentPress}
        styles={styles}
        dotBorderColor={theme.background}
      />

      <RouteDirectionsStepsList
        steps={activeSteps}
        segmentId={activeSegment?.id}
        styles={styles}
        iconColor={theme.textMuted}
      />

      {activeSegment ? (
        <View style={styles.actionsRow}>
          {!useFloatingPrimaryCta ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.88}
                onPress={handleOpenRouteInMaps}
              >
                <Icon name="navigation" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Google Maps'te başlat</Text>
              </TouchableOpacity>
              <Text style={styles.mapsDisclaimer}>{ROUTE_EXTERNAL_NAV_DISCLAIMER}</Text>
            </>
          ) : null}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              useFloatingPrimaryCta && { alignSelf: 'stretch', minWidth: '100%' },
            ]}
            activeOpacity={0.85}
            onPress={handleOpenActiveSegmentInMaps}
          >
            <Icon name="map-marker-path" size={16} color={theme.accent} />
            <Text style={styles.secondaryButtonText}>Bu bacak (harici)</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default RouteDirectionsTabPanel;

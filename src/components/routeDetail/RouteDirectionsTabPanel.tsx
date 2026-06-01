import React, { useMemo } from 'react';
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
import { openRouteInMaps, openStopInMaps } from '../../utils/openInMaps';
import { extractValidCoordinates } from '../../utils/routeDistance';

interface RouteDirectionsTabPanelProps {
  stops: RouteWithProfile[];
  segments: RouteSegment[];
  activeSegmentIndex: number;
  loading: boolean;
  startFromUserLocation: boolean;
  canStartFromUserLocation: boolean;
  onSegmentPress: (index: number) => void;
  onStartFromUserLocationChange: (enabled: boolean) => void;
}

export const RouteDirectionsTabPanel: React.FC<RouteDirectionsTabPanelProps> = ({
  stops,
  segments,
  activeSegmentIndex,
  loading,
  startFromUserLocation,
  canStartFromUserLocation,
  onSegmentPress,
  onStartFromUserLocationChange,
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
  const activeSteps = activeSegment?.stepInstructions ?? [];
  const coordStops = extractValidCoordinates(
    stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  );

  const handleOpenRouteInMaps = () => {
    if (coordStops.length === 0) {
      return;
    }

    void openRouteInMaps(coordStops);
  };

  const handleOpenActiveSegmentInMaps = () => {
    if (!activeSegment) {
      return;
    }

    void openRouteInMaps([activeSegment.from, activeSegment.to]);
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
              onPress={() => void openStopInMaps(coordStops[0])}
            >
              <Icon name="google-maps" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Haritada aç</Text>
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
    summaryChips.push({ icon: 'map-marker-distance', label: totals.distanceLabel });
  }

  if (totals.durationLabel) {
    summaryChips.push({ icon: 'walk', label: totals.durationLabel });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.chipRow}>
        {summaryChips.map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <Icon name={chip.icon} size={14} color={theme.textSecondary} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}

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

      <RouteSegmentMap
        segment={activeSegment ?? null}
        segmentIndex={activeSegmentIndex}
        activeSegmentIndex={activeSegmentIndex}
      />

      <RouteDirectionsTimeline
        segments={segments}
        activeSegmentIndex={activeSegmentIndex}
        onSegmentPress={onSegmentPress}
        styles={styles}
        dotBorderColor={theme.background}
      />

      {activeSteps.length > 0 ? (
        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>Adımlar</Text>
          {activeSteps.map((step, index) => (
            <View key={`${activeSegment?.id}-step-${index}`} style={styles.stepRow}>
              <Icon
                name="arrow-up-bold"
                size={14}
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.88}
          onPress={handleOpenRouteInMaps}
        >
          <Icon name="navigation" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Başlat</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          {activeSegment ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={handleOpenActiveSegmentInMaps}
            >
              <Icon name="map-marker-path" size={16} color={theme.accent} />
              <Text style={styles.secondaryButtonText}>Bu bacak</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={handleOpenRouteInMaps}
          >
            <Icon name="google-maps" size={16} color={theme.accent} />
            <Text style={styles.secondaryButtonText}>Tüm rota</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RouteDirectionsTabPanel;

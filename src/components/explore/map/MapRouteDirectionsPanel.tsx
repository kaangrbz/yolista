import React, { useMemo } from 'react';
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
import {
  MAP_ACTIVE_ROUTE_BORDER,
  ROUTE_SEGMENT_APPROACH_ACTIVE,
  ROUTE_SEGMENT_PAST,
  ROUTE_SEGMENT_UPCOMING,
} from '../../../constants/mapDefaults';
import type { RouteSegment } from '../../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../../types/routeSegment.types';
import {
  formatDistanceFromMeters,
  formatDurationFromSeconds,
  getSegmentStrokeColor,
} from '../../../utils/routeSegmentColors';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';

interface MapRouteDirectionsPanelProps {
  selectedRoute: RouteWithProfile | null;
  segments: RouteSegment[];
  activeSegmentIndex: number;
  loading: boolean;
  startFromUserLocation: boolean;
  canStartFromUserLocation: boolean;
  onSegmentPress: (index: number) => void;
  onStartFromUserLocationChange: (enabled: boolean) => void;
  onOpenRouteInMaps: () => void;
  onOpenActiveStopInMaps: () => void;
}

const getTimelineDurationColor = (
  status: ReturnType<typeof getRouteSegmentStatus>,
  variant: RouteSegment['variant'],
): string => {
  if (variant === 'approach') {
    return status === 'active' ? ROUTE_SEGMENT_APPROACH_ACTIVE : ROUTE_SEGMENT_PAST;
  }

  if (status === 'active') {
    return MAP_ACTIVE_ROUTE_BORDER;
  }

  if (status === 'past') {
    return ROUTE_SEGMENT_PAST;
  }

  return ROUTE_SEGMENT_UPCOMING;
};

export const MapRouteDirectionsPanel: React.FC<MapRouteDirectionsPanelProps> = ({
  selectedRoute,
  segments,
  activeSegmentIndex,
  loading,
  startFromUserLocation,
  canStartFromUserLocation,
  onSegmentPress,
  onStartFromUserLocationChange,
  onOpenRouteInMaps,
  onOpenActiveStopInMaps,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingBottom: 12,
    },
    modeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    modeTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: -0.3,
    },
    modeMeta: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
    },
    toggleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
    },
    chipActive: {
      backgroundColor: t.background,
      borderWidth: 1.5,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textPrimary,
    },
    timeline: {
      paddingHorizontal: 18,
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
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 4,
    },
    stepsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 18,
      paddingTop: 12,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: theme.accent,
    },
    primaryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
    },
    secondaryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: t.textSecondary,
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

  const routeTitle = selectedRoute
    ? getRouteDisplayLabel(selectedRoute)
    : 'Rota';

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text style={styles.loadingText}>Yol tarifi hazırlanıyor...</Text>
      </View>
    );
  }

  if (segments.length === 0) {
    return (
      <View style={styles.loadingRow}>
        <Text style={styles.loadingText}>Koordinatlı durak bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrapper}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.modeHeader}>
        <Text style={styles.modeTitle}>Yürüyüş</Text>
        <Text style={styles.modeMeta}>
          {[totals.durationLabel, totals.distanceLabel]
            .filter(Boolean)
            .join(' · ') || routeTitle}
        </Text>
      </View>

      {canStartFromUserLocation ? (
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.chip, startFromUserLocation && styles.chipActive]}
            activeOpacity={0.85}
            onPress={() => {
              void onStartFromUserLocationChange(!startFromUserLocation);
            }}
          >
            <Icon
              name="crosshairs-gps"
              size={16}
              color={startFromUserLocation ? theme.accent : theme.textSecondary}
            />
            <Text style={styles.chipText}>Konumumdan başla</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.timeline}>
        {segments.map((segment, index) => {
          const status = getRouteSegmentStatus(index, activeSegmentIndex);
          const isActive = status === 'active';
          const isLast = index === segments.length - 1;
          const durationLabel = formatDurationFromSeconds(
            segment.durationSeconds,
          );
          const distanceLabel = formatDistanceFromMeters(
            segment.distanceMeters,
          );
          const railColor = getSegmentStrokeColor(status, segment.variant);
          const durationColor = getTimelineDurationColor(
            status,
            segment.variant,
          );
          const isUserOrigin = segment.variant === 'approach';

          return (
            <TouchableOpacity
              key={segment.id}
              style={styles.timelineRow}
              activeOpacity={0.85}
              onPress={() => onSegmentPress(index)}
            >
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: railColor },
                  ]}
                >
                  {isUserOrigin ? (
                    <Icon name="circle" size={8} color="#fff" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: '#fff',
                      }}
                    >
                      {String.fromCharCode(
                        65 + Math.max(0, segment.targetStopOrderIndex),
                      )}
                    </Text>
                  )}
                </View>
                {!isLast ? (
                  <View
                    style={[styles.timelineLine, { backgroundColor: railColor }]}
                  />
                ) : null}
              </View>

              <View
                style={[
                  styles.timelineContent,
                  isActive && styles.timelineContentActive,
                ]}
              >
                <Text style={styles.timelineLabel} numberOfLines={2}>
                  {segment.toLabel}
                </Text>
                <Text style={styles.timelineSub} numberOfLines={1}>
                  {segment.fromLabel} → {segment.toLabel}
                </Text>
                {durationLabel ? (
                  <Text
                    style={[styles.timelineDuration, { color: durationColor }]}
                  >
                    {[durationLabel, distanceLabel].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

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
          onPress={onOpenRouteInMaps}
        >
          <Icon name="navigation" size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>Başlat</Text>
        </TouchableOpacity>

        {activeSegment ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.88}
            onPress={onOpenActiveStopInMaps}
          >
            <Icon name="map-marker-radius" size={16} color={theme.accent} />
            <Text style={styles.secondaryButtonText}>Bu durağı aç</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default MapRouteDirectionsPanel;

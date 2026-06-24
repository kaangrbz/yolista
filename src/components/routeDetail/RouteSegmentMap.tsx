import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import {
  MAP_ACTIVE_ROUTE_BORDER,
  ROUTE_SEGMENT_HALO,
} from '../../constants/mapDefaults';
import { getMapMarkerAnchorProps } from '../../constants/mapMarkerLayout';
import type { RouteWithProfile } from '../../model/routes.model';
import type { RouteSegment } from '../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../types/routeSegment.types';
import {
  formatDistanceFromMeters,
  formatDurationFromSeconds,
  getSegmentStrokeColor,
  getSegmentStrokeColorFaded,
} from '../../utils/routeSegmentColors';
import { getStopLetterLabel } from '../../utils/getStopOrderLabel';
import {
  getDirectionsMapFitCoordinates,
  getSegmentFocusCoordinates,
  ROUTE_MAP_OVERVIEW_PADDING,
  ROUTE_MAP_SEGMENT_FOCUS_PADDING,
} from '../../utils/routeMapFit';
import MapRouteMarker from '../explore/map/MapRouteMarker';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

const MAP_HEIGHT = 232;

interface RouteSegmentMapProps {
  segments: RouteSegment[];
  activeSegmentIndex: number;
  activeStopIndex?: number;
  stops?: RouteWithProfile[];
  onMapInteractionChange?: (isActive: boolean) => void;
}

export const RouteSegmentMap: React.FC<RouteSegmentMapProps> = ({
  segments,
  activeSegmentIndex,
  activeStopIndex = 0,
  stops = [],
  onMapInteractionChange,
}) => {
  const mapRef = useRef<MapView>(null);
  const hasOverviewFitRef = useRef(false);
  const prevSegmentIndexRef = useRef(activeSegmentIndex);
  const prevStopIndexRef = useRef(activeStopIndex);
  const theme = useAppTheme();

  const activeSegment = segments[activeSegmentIndex];

  const styles = useThemedStyles((t) => ({
    wrapper: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    mapShell: {
      height: MAP_HEIGHT,
      position: 'relative',
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
    overlay: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      zIndex: 2,
    },
    legBadge: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: t.overlayDark,
    },
    legBadgeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: t.id === 'light' ? '#fff' : t.textPrimary,
    },
    legMeta: {
      fontSize: 11,
      fontWeight: '700',
      color: t.id === 'light' ? '#fff' : t.textPrimary,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: t.overlayDark,
      overflow: 'hidden',
    },
  }));

  const fitCoordinates = useMemo(
    () =>
      getDirectionsMapFitCoordinates(
        segments,
        stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      ),
    [segments, stops],
  );

  const legMetaLabel = useMemo(() => {
    if (!activeSegment) {
      return null;
    }

    return [
      formatDurationFromSeconds(activeSegment.durationSeconds),
      formatDistanceFromMeters(activeSegment.distanceMeters),
    ]
      .filter(Boolean)
      .join(' · ');
  }, [activeSegment]);

  const initialRegion = useMemo(() => {
    if (fitCoordinates.length === 0) {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    if (fitCoordinates.length === 1) {
      return {
        ...fitCoordinates[0],
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }

    const latitudes = fitCoordinates.map((point) => point.latitude);
    const longitudes = fitCoordinates.map((point) => point.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.012),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.012),
    };
  }, [fitCoordinates]);

  const segmentsKey = useMemo(
    () => segments.map((segment) => segment.id).join('|'),
    [segments],
  );

  useEffect(() => {
    hasOverviewFitRef.current = false;
  }, [segmentsKey]);

  useEffect(() => {
    if (fitCoordinates.length < 2) {
      if (fitCoordinates.length === 1) {
        mapRef.current?.animateToRegion(
          {
            ...fitCoordinates[0],
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          300,
        );
      }

      return;
    }

    if (!hasOverviewFitRef.current) {
      mapRef.current?.fitToCoordinates(fitCoordinates, {
        edgePadding: ROUTE_MAP_OVERVIEW_PADDING,
        animated: true,
      });
      hasOverviewFitRef.current = true;
      prevSegmentIndexRef.current = activeSegmentIndex;
      prevStopIndexRef.current = activeStopIndex;
    }
  }, [fitCoordinates]);

  useEffect(() => {
    if (!hasOverviewFitRef.current) {
      return;
    }

    const segmentChanged = prevSegmentIndexRef.current !== activeSegmentIndex;
    const stopChanged = prevStopIndexRef.current !== activeStopIndex;

    prevSegmentIndexRef.current = activeSegmentIndex;
    prevStopIndexRef.current = activeStopIndex;

    if (!segmentChanged && !stopChanged) {
      return;
    }

    const segment = segments[activeSegmentIndex];
    const focusCoords = segment ? getSegmentFocusCoordinates(segment) : [];

    if (focusCoords.length >= 2) {
      mapRef.current?.fitToCoordinates(focusCoords, {
        edgePadding: ROUTE_MAP_SEGMENT_FOCUS_PADDING,
        animated: true,
      });
      return;
    }

    const stop = stops[activeStopIndex];

    if (
      typeof stop?.latitude === 'number' &&
      typeof stop?.longitude === 'number'
    ) {
      mapRef.current?.animateToRegion(
        {
          latitude: stop.latitude,
          longitude: stop.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        320,
      );
    }
  }, [activeSegmentIndex, activeStopIndex, segments, stops]);

  if (segments.length === 0 || fitCoordinates.length === 0) {
    return null;
  }

  const activeTargetOrderIndex = activeSegment?.targetStopOrderIndex;

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapShell}>
        <MapView
          ref={mapRef}
          provider={getMapProvider()}
          mapType={getNativeMapType('light')}
          style={styles.map}
          initialRegion={initialRegion}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          onPanDrag={() => onMapInteractionChange?.(true)}
          onRegionChangeComplete={() => onMapInteractionChange?.(false)}
        >
          {segments.map((segment, index) => {
            if (segment.coordinates.length < 2) {
              return null;
            }

            const status = getRouteSegmentStatus(index, activeSegmentIndex);
            const isActive = status === 'active';
            const isApproach = segment.variant === 'approach';
            const strokeColor = isActive
              ? getSegmentStrokeColor(status, segment.variant)
              : getSegmentStrokeColorFaded(status, segment.variant);
            const strokeWidth = isActive ? 4.5 : 2;

            return (
              <React.Fragment key={segment.id}>
                {isActive && !isApproach ? (
                  <Polyline
                    coordinates={segment.coordinates}
                    strokeColor={ROUTE_SEGMENT_HALO}
                    strokeWidth={strokeWidth + 4}
                    lineCap="round"
                    lineJoin="round"
                    zIndex={17 + index}
                  />
                ) : null}
                <Polyline
                  coordinates={segment.coordinates}
                  strokeColor={strokeColor}
                  strokeWidth={strokeWidth}
                  lineDashPattern={
                    isApproach ? [8, 6] : isActive ? undefined : [10, 8]
                  }
                  lineCap="round"
                  lineJoin="round"
                  zIndex={18 + index}
                />
              </React.Fragment>
            );
          })}

          {stops.map((stop, index) => {
            if (
              typeof stop.latitude !== 'number' ||
              typeof stop.longitude !== 'number'
            ) {
              return null;
            }

            const orderIndex = stop.order_index ?? index;
            const letter = getStopLetterLabel(orderIndex);
            const isActiveStop = activeSegment?.targetStopId
            ? Boolean(
                stop.id && String(stop.id) === String(activeSegment.targetStopId),
              )
            : activeTargetOrderIndex === orderIndex;

            return (
              <Marker
                key={stop.id ?? `stop-${index}`}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                {...getMapMarkerAnchorProps()}
                zIndex={isActiveStop ? 24 : 20}
                onPress={() => onMapInteractionChange?.(false)}
              >
                <MapRouteMarker
                  imageUrl={stop.image_url || null}
                  imagePreviewUrl={stop.image_preview_url || null}
                  userId={stop.user_id || stop.profiles?.id || null}
                  iconName={stop.categories?.icon_name}
                  selected={isActiveStop}
                  dimmed={!isActiveStop}
                  accentColor={MAP_ACTIVE_ROUTE_BORDER}
                  orderLabel={letter}
                  collapsable={Platform.OS === 'android' ? false : undefined}
                />
              </Marker>
            );
          })}
        </MapView>

        {activeSegment ? (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.legBadge}>
              <Icon
                name={
                  activeSegment.variant === 'approach'
                    ? 'crosshairs-gps'
                    : 'map-marker-path'
                }
                size={14}
                color={theme.id === 'light' ? '#fff' : theme.textPrimary}
              />
              <Text style={styles.legBadgeText} numberOfLines={1}>
                {`${activeSegment.fromLabel} → ${activeSegment.toLabel}`}
              </Text>
            </View>
            {legMetaLabel ? (
              <Text style={styles.legMeta}>{legMetaLabel}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default RouteSegmentMap;

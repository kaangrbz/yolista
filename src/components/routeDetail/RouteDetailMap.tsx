import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RouteWithProfile } from '../../model/routes.model';
import {
  MAP_ACTIVE_ROUTE_BORDER,
  ROUTE_SEGMENT_HALO,
} from '../../constants/mapDefaults';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import { getMapMarkerAnchorProps } from '../../constants/mapMarkerLayout';
import type { RouteSegment } from '../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../types/routeSegment.types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  extractValidCoordinates,
  type LatLng,
} from '../../utils/routeDistance';
import {
  getSegmentStrokeColor,
  getSegmentStrokeColorFaded,
} from '../../utils/routeSegmentColors';
import { getStopLetterLabel } from '../../utils/getStopOrderLabel';
import {
  findSegmentIndexForStop,
  getDirectionsMapFitCoordinates,
  ROUTE_MAP_OVERVIEW_PADDING,
  ROUTE_MAP_SEGMENT_FOCUS_PADDING,
  getSegmentFocusCoordinates,
} from '../../utils/routeMapFit';
import MapRouteMarker from '../explore/map/MapRouteMarker';

const MAP_HEIGHT_FULL = 220;
const MAP_HEIGHT_EMBEDDED = 188;

interface RouteDetailMapProps {
  stops: RouteWithProfile[];
  activeStopIndex: number;
  segments?: RouteSegment[];
  activeSegmentIndex?: number;
  onStopPress?: (index: number) => void;
  variant?: 'fullBleed' | 'embedded' | 'hero' | 'modal';
  height?: number;
  onMapInteractionChange?: (isActive: boolean) => void;
}

export const RouteDetailMap: React.FC<RouteDetailMapProps> = ({
  stops,
  activeStopIndex,
  segments = [],
  activeSegmentIndex,
  onStopPress,
  variant = 'fullBleed',
  height,
  onMapInteractionChange,
}) => {
  const mapRef = useRef<MapView>(null);
  const hasOverviewFitRef = useRef(false);
  const prevStopIndexRef = useRef(activeStopIndex);
  const isEmbedded = variant === 'embedded';
  const isHero = variant === 'hero';
  const isModal = variant === 'modal';

  const resolvedSegmentIndex = useMemo(() => {
    if (typeof activeSegmentIndex === 'number' && activeSegmentIndex >= 0) {
      return activeSegmentIndex;
    }

    return findSegmentIndexForStop(stops, segments, activeStopIndex);
  }, [activeSegmentIndex, activeStopIndex, segments, stops]);

  const styles = useThemedStyles((t) => ({
    wrapper: {
      height: isModal ? undefined : (height ?? (isEmbedded ? MAP_HEIGHT_EMBEDDED : MAP_HEIGHT_FULL)),
      width: '100%',
      flex: isModal ? 1 : undefined,
      overflow: 'hidden',
      ...(isEmbedded
        ? {
            marginHorizontal: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surfaceMuted,
          }
        : null),
      ...(isHero
        ? {
            backgroundColor: t.surfaceMuted,
          }
        : null),
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
    overlay: {
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.overlayDark,
    },
    overlayText: {
      fontSize: 11,
      fontWeight: '700',
      color: t.id === 'light' ? '#fff' : t.textPrimary,
    },
  }));

  const stopCoordinates = useMemo(
    () =>
      extractValidCoordinates(
        stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      ),
    [stops],
  );

  const fitCoordinates = useMemo(() => {
    if (segments.length > 0) {
      return getDirectionsMapFitCoordinates(
        segments,
        stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      );
    }

    return stopCoordinates;
  }, [segments, stopCoordinates, stops]);

  const hasSegmentGeometry = segments.some(
    (segment) => segment.coordinates.length >= 2,
  );
  const showStoryOrderOverlay =
    isHero && !hasSegmentGeometry && stopCoordinates.length > 1;
  const hasEstimatedSegments = segments.some((segment) => segment.isEstimated);

  const initialRegion = useMemo(() => {
    if (fitCoordinates.length === 0) {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    if (fitCoordinates.length === 1) {
      return {
        ...fitCoordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
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
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
    };
  }, [fitCoordinates]);

  const segmentsKey = useMemo(
    () => segments.map((segment) => segment.id).join('|'),
    [segments],
  );

  useEffect(() => {
    hasOverviewFitRef.current = false;
  }, [segmentsKey, stops.length]);

  useEffect(() => {
    if (fitCoordinates.length === 0) {
      return;
    }

    if (fitCoordinates.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...fitCoordinates[0],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        250,
      );
      return;
    }

    if (!hasOverviewFitRef.current) {
      mapRef.current?.fitToCoordinates(fitCoordinates, {
        edgePadding: ROUTE_MAP_OVERVIEW_PADDING,
        animated: true,
      });
      hasOverviewFitRef.current = true;
      prevStopIndexRef.current = activeStopIndex;
    }
  }, [fitCoordinates]);

  useEffect(() => {
    if (!hasOverviewFitRef.current) {
      return;
    }

    if (prevStopIndexRef.current === activeStopIndex) {
      return;
    }

    prevStopIndexRef.current = activeStopIndex;

    const segment = segments[resolvedSegmentIndex];
    const focusCoords = segment ? getSegmentFocusCoordinates(segment) : [];

    if (focusCoords.length >= 2) {
      mapRef.current?.fitToCoordinates(focusCoords, {
        edgePadding: ROUTE_MAP_SEGMENT_FOCUS_PADDING,
        animated: true,
      });
      return;
    }

    const target = stopCoordinates[activeStopIndex];

    if (!target) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...target,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      250,
    );
  }, [activeStopIndex, resolvedSegmentIndex, segments, stopCoordinates]);

  return (
    <View style={styles.wrapper}>
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
        {hasSegmentGeometry
          ? segments.map((segment, index) => {
              if (segment.coordinates.length < 2) {
                return null;
              }

              const status = getRouteSegmentStatus(index, resolvedSegmentIndex);
              const isActive = status === 'active';
              const isApproach = segment.variant === 'approach';
              const strokeColor = isActive
                ? getSegmentStrokeColor(status, segment.variant)
                : getSegmentStrokeColorFaded(status, segment.variant);
              const strokeWidth = isActive ? 4 : 2.5;

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
            })
          : stopCoordinates.length > 1
            ? (
                <Polyline
                  coordinates={stopCoordinates}
                  strokeColor={MAP_ACTIVE_ROUTE_BORDER}
                  strokeWidth={3}
                  lineDashPattern={[10, 8]}
                  lineCap="round"
                  lineJoin="round"
                />
              )
            : null}

        {stops.map((stop, index) => {
          if (
            typeof stop.latitude !== 'number' ||
            typeof stop.longitude !== 'number'
          ) {
            return null;
          }

          const coordinate: LatLng = {
            latitude: stop.latitude,
            longitude: stop.longitude,
          };
          const isActive = index === activeStopIndex;

          return (
            <Marker
              key={stop.id ?? `stop-${index}`}
              coordinate={coordinate}
              onPress={() => onStopPress?.(index)}
              {...getMapMarkerAnchorProps()}
            >
              <MapRouteMarker
                imageUrl={stop.image_url}
                imageThumbUrl={stop.image_thumb_url}
                imageMediumUrl={stop.image_medium_url}
                userId={stop.user_id}
                selected={isActive}
                dimmed={!isActive && stops.length > 1}
                orderLabel={getStopLetterLabel(stop.order_index ?? index)}
                collapsable={false}
              />
            </Marker>
          );
        })}
      </MapView>

      {showStoryOrderOverlay ? (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Hikâye sırası</Text>
        </View>
      ) : null}

      {isHero && hasEstimatedSegments ? (
        <View style={[styles.overlay, { top: showStoryOrderOverlay ? 42 : 10 }]}>
          <Text style={styles.overlayText}>Tahmini rota</Text>
        </View>
      ) : null}
    </View>
  );
};

export default RouteDetailMap;

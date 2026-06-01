import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import type { RouteSegment } from '../../types/routeSegment.types';
import { getSegmentStrokeColor } from '../../utils/routeSegmentColors';
import { getRouteSegmentStatus } from '../../types/routeSegment.types';
import { useThemedStyles } from '../../theme/useThemedStyles';

const MAP_HEIGHT = 168;

interface RouteSegmentMapProps {
  segment: RouteSegment | null;
  segmentIndex: number;
  activeSegmentIndex: number;
}

export const RouteSegmentMap: React.FC<RouteSegmentMapProps> = ({
  segment,
  segmentIndex,
  activeSegmentIndex,
}) => {
  const mapRef = useRef<MapView>(null);

  const styles = useThemedStyles((t) => ({
    wrapper: {
      height: MAP_HEIGHT,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
  }));

  const coordinates = useMemo(
    () => segment?.coordinates ?? [],
    [segment?.coordinates],
  );

  const initialRegion = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    if (coordinates.length === 1) {
      return {
        ...coordinates[0],
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }

    const latitudes = coordinates.map((point) => point.latitude);
    const longitudes = coordinates.map((point) => point.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.012),
      longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.012),
    };
  }, [coordinates]);

  useEffect(() => {
    if (coordinates.length < 2) {
      if (coordinates.length === 1) {
        mapRef.current?.animateToRegion(
          {
            ...coordinates[0],
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          250,
        );
      }

      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 28, right: 28, bottom: 28, left: 28 },
      animated: true,
    });
  }, [coordinates, segment?.id]);

  if (!segment || coordinates.length === 0) {
    return null;
  }

  const status = getRouteSegmentStatus(segmentIndex, activeSegmentIndex);
  const strokeColor = getSegmentStrokeColor(status, segment.variant);

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        provider={getMapProvider()}
        mapType={getNativeMapType('light')}
        style={styles.map}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none"
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={strokeColor}
          strokeWidth={4}
        />
      </MapView>
    </View>
  );
};

export default RouteSegmentMap;

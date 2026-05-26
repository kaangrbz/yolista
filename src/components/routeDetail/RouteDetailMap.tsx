import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RouteWithProfile } from '../../model/routes.model';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import {
  extractValidCoordinates,
  LatLng,
} from '../../utils/routeDistance';

const MAP_HEIGHT = 220;
const ACTIVE_PIN = MAP_ACTIVE_ROUTE_BORDER;
const DEFAULT_PIN = '#4CAF50';

interface RouteDetailMapProps {
  stops: RouteWithProfile[];
  activeStopIndex: number;
  onStopPress?: (index: number) => void;
}

export const RouteDetailMap: React.FC<RouteDetailMapProps> = ({
  stops,
  activeStopIndex,
  onStopPress,
}) => {
  const mapRef = useRef<MapView>(null);

  const coordinates = useMemo(
    () =>
      extractValidCoordinates(
        stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      ),
    [stops],
  );

  const initialRegion = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    if (coordinates.length === 1) {
      return {
        ...coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
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
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
    };
  }, [coordinates]);

  useEffect(() => {
    if (coordinates.length === 0) {
      return;
    }

    if (coordinates.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...coordinates[0],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        250,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [coordinates]);

  useEffect(() => {
    const target = coordinates[activeStopIndex];

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
  }, [activeStopIndex, coordinates]);

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
      >
        {coordinates.length > 1 ? (
          <Polyline
            coordinates={coordinates}
            strokeColor={MAP_ACTIVE_ROUTE_BORDER}
            strokeWidth={3}
          />
        ) : null}

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

          return (
            <Marker
              key={stop.id ?? `stop-${index}`}
              coordinate={coordinate}
              pinColor={index === activeStopIndex ? ACTIVE_PIN : DEFAULT_PIN}
              onPress={() => onStopPress?.(index)}
              title={String(index + 1)}
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: MAP_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});

export default RouteDetailMap;

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LatLng, Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  MAP_ACTIVE_ROUTE_BORDER,
  ROUTE_SEGMENT_HALO,
} from '../../../constants/mapDefaults';
import type { RouteSegment } from '../../../types/routeSegment.types';
import { getRouteSegmentStatus } from '../../../types/routeSegment.types';
import { getPolylineDirectionMarkers } from '../../../utils/mapPolyline';
import { getSegmentStrokeColor } from '../../../utils/routeSegmentColors';

interface MapRoutePolylineLayerProps {
  showRoute: boolean;
  /** Duraklar sekmesi — tek parça rota. */
  routeCoordinates?: LatLng[];
  approachCoordinates?: LatLng[];
  /** Rota sekmesi — bacak bazlı tonlar. */
  segments?: RouteSegment[];
  activeSegmentIndex?: number;
}

const MapRouteDirectionMarker: React.FC<{
  coordinate: LatLng;
  rotation: number;
  color: string;
}> = ({ coordinate, rotation, color }) => (
  <Marker
    coordinate={coordinate}
    anchor={{ x: 0.5, y: 0.5 }}
    centerOffset={{ x: 0, y: 0 }}
    flat
    rotation={rotation}
    zIndex={19}
    tracksViewChanges={false}
  >
    <View style={[styles.directionMarker, { backgroundColor: color }]}>
      <Icon name="navigation" size={14} color={ROUTE_SEGMENT_HALO} />
    </View>
  </Marker>
);

export const MapRoutePolylineLayer: React.FC<MapRoutePolylineLayerProps> = ({
  showRoute,
  routeCoordinates = [],
  approachCoordinates = [],
  segments = [],
  activeSegmentIndex = 0,
}) => {
  const useSegmentMode = segments.length > 0;

  const legacyDirectionMarkers = useMemo(
    () =>
      !useSegmentMode && showRoute && routeCoordinates.length > 1
        ? getPolylineDirectionMarkers(routeCoordinates)
        : [],
    [routeCoordinates, showRoute, useSegmentMode],
  );

  const activeSegment = useSegmentMode
    ? segments[activeSegmentIndex]
    : null;

  const activeDirectionMarkers = useMemo(
    () =>
      activeSegment && activeSegment.coordinates.length > 1
        ? getPolylineDirectionMarkers(activeSegment.coordinates)
        : [],
    [activeSegment],
  );

  if (!showRoute) {
    return null;
  }

  if (useSegmentMode) {
    return (
      <>
        {segments.map((segment, index) => {
          if (segment.coordinates.length < 2) {
            return null;
          }

          const status = getRouteSegmentStatus(index, activeSegmentIndex);
          const strokeColor = getSegmentStrokeColor(status, segment.variant);
          const isApproach = segment.variant === 'approach';
          const isActive = status === 'active';
          const strokeWidth = isActive ? 3.5 : 2.5;

          return (
            <React.Fragment key={segment.id}>
              {isActive && !isApproach ? (
                <Polyline
                  coordinates={segment.coordinates}
                  strokeColor={ROUTE_SEGMENT_HALO}
                  strokeWidth={strokeWidth + 3}
                  lineCap="round"
                  lineJoin="round"
                  zIndex={17 + index}
                />
              ) : null}
              <Polyline
                coordinates={segment.coordinates}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                lineDashPattern={isApproach ? [8, 6] : undefined}
                lineCap="round"
                lineJoin="round"
                zIndex={18 + index}
              />
            </React.Fragment>
          );
        })}

        {activeDirectionMarkers.map((marker, index) => (
          <MapRouteDirectionMarker
            key={`segment-direction-${index}`}
            coordinate={marker.coordinate}
            rotation={marker.rotation}
            color={MAP_ACTIVE_ROUTE_BORDER}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {approachCoordinates.length > 1 ? (
        <Polyline
          coordinates={approachCoordinates}
          strokeColor={getSegmentStrokeColor('active', 'approach')}
          strokeWidth={2}
          lineDashPattern={[8, 6]}
          lineCap="round"
          zIndex={17}
        />
      ) : null}

      {routeCoordinates.length > 1 ? (
        <>
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={ROUTE_SEGMENT_HALO}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
            zIndex={18}
          />
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={MAP_ACTIVE_ROUTE_BORDER}
            strokeWidth={3.5}
            lineCap="round"
            lineJoin="round"
            zIndex={19}
          />
          {legacyDirectionMarkers.map((marker, index) => (
            <MapRouteDirectionMarker
              key={`route-direction-${index}`}
              coordinate={marker.coordinate}
              rotation={marker.rotation}
              color={MAP_ACTIVE_ROUTE_BORDER}
            />
          ))}
        </>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  directionMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ROUTE_SEGMENT_HALO,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default MapRoutePolylineLayer;

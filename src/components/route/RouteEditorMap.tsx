import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';
import {
  DEFAULT_MAP_REGION,
  ROUTE_ASSIGN_PRESERVE_ZOOM_MAX_DELTA,
  ROUTE_FOCUS_ZOOM_DELTA,
} from '../../constants/mapDefaults';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import {
  getNextMapStyle,
  MapStyleMode,
} from '../../constants/mapStyles';
import MapStyleToggle from '../explore/map/MapStyleToggle';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface RouteEditorMapProps {
  stops: RouteStop[];
  activeStopIndex: number | null;
  readOnly?: boolean;
  layout?: 'compact' | 'expanded';
  onActiveStopChange: (index: number, options?: { allowDeselect?: boolean }) => void;
  onLocationAssign: (coordinate: {
    latitude: number;
    longitude: number;
  }) => void;
}

const FOCUS_ANIMATION_MS = 420;

const regionForCoordinate = (
  coordinate: { latitude: number; longitude: number },
  delta: number,
): Region => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

const regionForCoordinatePreservingZoom = (
  coordinate: { latitude: number; longitude: number },
  currentRegion: Region,
): Region => {
  const maxDelta = Math.max(
    currentRegion.latitudeDelta,
    currentRegion.longitudeDelta,
  );

  if (maxDelta > ROUTE_ASSIGN_PRESERVE_ZOOM_MAX_DELTA) {
    return regionForCoordinate(coordinate, ROUTE_FOCUS_ZOOM_DELTA);
  }

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: currentRegion.latitudeDelta,
    longitudeDelta: currentRegion.longitudeDelta,
  };
};

export const RouteEditorMap: React.FC<RouteEditorMapProps> = ({
  stops,
  activeStopIndex,
  readOnly = false,
  layout = 'compact',
  onActiveStopChange,
  onLocationAssign,
}) => {
  const isExpanded = layout === 'expanded';
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const lastFocusTargetRef = useRef<string | null>(null);
  const currentRegionRef = useRef<Region>(DEFAULT_MAP_REGION);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('light');

  const styles = useThemedStyles((t) => ({
    container: {
      borderRadius: isExpanded ? 0 : 14,
      overflow: 'hidden',
      borderWidth: isExpanded ? 0 : 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
      ...(isExpanded ? { flex: 1 } : {}),
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isExpanded ? 16 : 12,
      paddingVertical: isExpanded ? 10 : 8,
      backgroundColor: t.background,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    toolbarTitle: {
      fontSize: isExpanded ? 14 : 13,
      fontWeight: '700',
      color: t.textPrimary,
    },
    toolbarHint: {
      fontSize: 11,
      color: t.textSecondary,
      marginTop: 2,
    },
    mapWrapper: {
      position: 'relative',
      ...(isExpanded ? { flex: 1 } : {}),
    },
    map: isExpanded
      ? { flex: 1, width: '100%' }
      : { height: 200, width: '100%' },
    mapHintOverlay: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: t.overlayDark,
    },
    mapHintText: {
      fontSize: 11,
      color: t.onMedia,
      textAlign: 'center',
      lineHeight: 16,
    },
    markerLabel: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
    },
    markerLabelActive: {
      backgroundColor: t.accent,
    },
    markerLabelIdle: {
      backgroundColor: t.textSecondary,
    },
    markerText: {
      color: t.background,
      fontSize: 11,
      fontWeight: '800',
    },
    footer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: t.background,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    footerText: {
      fontSize: 11,
      color: t.textSecondary,
      textAlign: 'center',
    },
  }));

  const locatedCount = useMemo(
    () => stops.filter((stop) => stop.coordinate).length,
    [stops],
  );

  const activeStop =
    activeStopIndex === null ? undefined : stops[activeStopIndex];

  const applyMapFocus = useCallback(
    (animated: boolean) => {
      if (activeStopIndex === null) {
        return;
      }

      if (!activeStop?.coordinate) {
        lastFocusTargetRef.current = `unlocated:${activeStopIndex}`;
        return;
      }

      const { latitude, longitude } = activeStop.coordinate;
      const focusTarget = `stop:${activeStopIndex}:${latitude.toFixed(6)}:${longitude.toFixed(6)}`;

      if (focusTarget === lastFocusTargetRef.current) {
        return;
      }

      lastFocusTargetRef.current = focusTarget;

      mapRef.current?.animateToRegion(
        regionForCoordinatePreservingZoom(
          activeStop.coordinate,
          currentRegionRef.current,
        ),
        animated ? FOCUS_ANIMATION_MS : 0,
      );
    },
    [activeStop, activeStopIndex],
  );

  useEffect(() => {
    if (!mapReadyRef.current) {
      return;
    }

    applyMapFocus(true);
  }, [
    applyMapFocus,
    activeStop?.coordinate?.latitude,
    activeStop?.coordinate?.longitude,
    activeStopIndex,
  ]);

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    applyMapFocus(true);
  }, [applyMapFocus]);

  const handleMarkerPress = useCallback(
    (index: number) => {
      onActiveStopChange(index, { allowDeselect: false });
    },
    [onActiveStopChange],
  );

  const handleMapPress = useCallback(
    (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      if (readOnly || activeStopIndex === null || !activeStop) {
        return;
      }

      const coordinate = event.nativeEvent.coordinate;

      lastFocusTargetRef.current = `stop:${activeStopIndex}:${coordinate.latitude.toFixed(6)}:${coordinate.longitude.toFixed(6)}`;

      mapRef.current?.animateToRegion(
        regionForCoordinatePreservingZoom(coordinate, currentRegionRef.current),
        FOCUS_ANIMATION_MS,
      );

      onLocationAssign(coordinate);
    },
    [readOnly, activeStopIndex, activeStop, onLocationAssign],
  );

  const mapHint =
    activeStopIndex === null
      ? 'Konum atamak için alttan bir fotoğraf seç'
      : 'Haritaya dokunarak seçili fotoğrafın konumunu güncelle';

  const handleMapStyleToggle = () => {
    setMapStyleMode((prev) => getNextMapStyle(prev));
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarTitle}>Konumlar</Text>
          <Text style={styles.toolbarHint}>
            {locatedCount}/{stops.length} fotoğrafa konum atandı
          </Text>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={getMapProvider()}
          mapType={getNativeMapType(mapStyleMode)}
          style={styles.map}
          initialRegion={DEFAULT_MAP_REGION}
          onMapReady={handleMapReady}
          onRegionChangeComplete={(region) => {
            currentRegionRef.current = region;
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {stops.map((stop, index) => {
            if (!stop.coordinate) {
              return null;
            }

            const isActive = activeStopIndex !== null && index === activeStopIndex;

            return (
              <Marker
                key={stop.id}
                coordinate={stop.coordinate}
                onPress={() => handleMarkerPress(index)}
              >
                <View
                  style={[
                    styles.markerLabel,
                    isActive ? styles.markerLabelActive : styles.markerLabelIdle,
                  ]}
                >
                  <Text style={styles.markerText}>{index + 1}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        <MapStyleToggle
          mode={mapStyleMode}
          onToggle={handleMapStyleToggle}
          topOffset={12}
        />

        {isExpanded ? (
          <View style={styles.mapHintOverlay} pointerEvents="none">
            <Text style={styles.mapHintText}>{mapHint}</Text>
          </View>
        ) : null}
      </View>

      {!isExpanded ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{mapHint}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default RouteEditorMap;

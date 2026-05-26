import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  DEFAULT_MAP_REGION,
  ROUTE_FOCUS_ZOOM_DELTA,
} from '../../constants/mapDefaults';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import type { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import {
  getRouteDistanceLabel,
} from '../../utils/routeDistance';

interface RoutePreviewModalProps {
  visible: boolean;
  stops: RouteStop[];
  onClose: () => void;
}

export const RoutePreviewModal: React.FC<RoutePreviewModalProps> = ({
  visible,
  stops,
  onClose,
}) => {
  const theme = useAppTheme();
  const mapRef = useRef<MapView>(null);

  const locatedStops = useMemo(
    () =>
      stops.filter(
        (stop) =>
          stop.coordinate &&
          typeof stop.coordinate.latitude === 'number' &&
          typeof stop.coordinate.longitude === 'number',
      ),
    [stops],
  );

  const polylineCoordinates = useMemo(
    () => locatedStops.map((stop) => stop.coordinate!),
    [locatedStops],
  );

  const distanceLabel = useMemo(
    () => getRouteDistanceLabel(stops.map((stop) => stop.coordinate ?? {})),
    [stops],
  );

  const fitRoute = useCallback(() => {
    if (polylineCoordinates.length === 0) {
      return;
    }

    if (polylineCoordinates.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...polylineCoordinates[0],
          latitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
          longitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
        },
        0,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(polylineCoordinates, {
      edgePadding: { top: 80, right: 48, bottom: 120, left: 48 },
      animated: false,
    });
  }, [polylineCoordinates]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(fitRoute, 120);
    return () => clearTimeout(timer);
  }, [fitRoute, visible]);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    titleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: t.textSecondary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceMuted,
    },
    map: {
      flex: 1,
    },
    markerLabel: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
      backgroundColor: t.accent,
    },
    markerText: {
      color: t.background,
      fontSize: 11,
      fontWeight: '800',
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    footerText: {
      fontSize: 12,
      color: t.textSecondary,
      textAlign: 'center',
    },
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Rota önizleme</Text>
            <Text style={styles.subtitle}>
              {locatedStops.length}/{stops.length} durak
              {distanceLabel ? ` · Toplam ${distanceLabel}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Önizlemeyi kapat"
          >
            <Icon name="close" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          provider={getMapProvider()}
          mapType={getNativeMapType('light')}
          style={styles.map}
          initialRegion={DEFAULT_MAP_REGION}
          onMapReady={fitRoute}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {locatedStops.map((stop) => {
            const stopIndex = stops.findIndex((item) => item.id === stop.id);

            return (
              <Marker key={stop.id} coordinate={stop.coordinate!}>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerText}>{stopIndex + 1}</Text>
                </View>
              </Marker>
            );
          })}

          {polylineCoordinates.length > 1 ? (
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor={theme.accent}
              strokeWidth={3}
            />
          ) : null}
        </MapView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Kuş uçuşu mesafe; gerçek yol rotası yayın sonrası belirlenebilir.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default RoutePreviewModal;

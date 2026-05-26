import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LocationSearchBar } from '../../components/route/LocationSearchBar';
import {
  DEFAULT_MAP_REGION,
  ROUTE_FOCUS_ZOOM_DELTA,
} from '../../constants/mapDefaults';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import type { CreateRouteStackParamList } from '../../navigation/CreateRouteStack';
import { requestLocation } from '../../permissions';
import GeocodingService from '../../services/GeocodingService';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { showToast } from '../../utils/alert';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

type LocationPickerRouteProp = RouteProp<CreateRouteStackParamList, 'LocationPicker'>;
type LocationPickerNavigationProp = NativeStackNavigationProp<
  CreateRouteStackParamList,
  'LocationPicker'
>;

const regionForCoordinate = (
  coordinate: { latitude: number; longitude: number },
  delta: number = ROUTE_FOCUS_ZOOM_DELTA,
): Region => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export const LocationPickerScreen = () => {
  const navigation = useNavigation<LocationPickerNavigationProp>();
  const route = useRoute<LocationPickerRouteProp>();
  const theme = useAppTheme();
  const { stopId } = route.params;

  const routeStops = useCreateRouteFlowStore((state) => state.routeStops);
  const setStopLocation = useCreateRouteFlowStore((state) => state.setStopLocation);
  const setRouteStops = useCreateRouteFlowStore((state) => state.setRouteStops);

  const stop = routeStops.find((item) => item.id === stopId);
  const firstLocated = routeStops.find((item) => item.coordinate);

  const initialCoordinate = useMemo(() => {
    if (stop?.coordinate) {
      return stop.coordinate;
    }

    if (firstLocated?.coordinate) {
      return firstLocated.coordinate;
    }

    return {
      latitude: DEFAULT_MAP_REGION.latitude,
      longitude: DEFAULT_MAP_REGION.longitude,
    };
  }, [firstLocated?.coordinate, stop?.coordinate]);

  const mapRef = useRef<MapView>(null);
  const [pinCoordinate, setPinCoordinate] = useState(initialCoordinate);
  const [locationGranted, setLocationGranted] = useState(false);
  const [saving, setSaving] = useState(false);

  const { shortAddress, loading: reverseLoading } = useReverseGeocode({
    latitude: pinCoordinate.latitude,
    longitude: pinCoordinate.longitude,
    enabled: true,
  });

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
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    searchWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    mapWrap: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    crosshair: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -16,
      marginTop: -32,
      alignItems: 'center',
      pointerEvents: 'none',
    },
    crosshairPin: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.background,
    },
    crosshairStem: {
      width: 2,
      height: 10,
      backgroundColor: t.accent,
      marginTop: -1,
    },
    bottomPanel: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
      gap: 10,
    },
    addressText: {
      fontSize: 14,
      color: t.textPrimary,
      lineHeight: 20,
      minHeight: 20,
    },
    coordsText: {
      fontSize: 12,
      color: t.textSecondary,
      fontFamily: 'monospace',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderStrong,
      backgroundColor: t.surfaceMuted,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
    },
    confirmButton: {
      backgroundColor: t.buttonPrimaryBg,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: t.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '700',
    },
    confirmButtonDisabled: {
      opacity: 0.6,
    },
  }));

  const handleRegionChangeComplete = useCallback((region: Region) => {
    setPinCoordinate({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  }, []);

  const handleSearchResult = useCallback((result: { latitude: number; longitude: number }) => {
    const coordinate = {
      latitude: result.latitude,
      longitude: result.longitude,
    };

    setPinCoordinate(coordinate);
    mapRef.current?.animateToRegion(regionForCoordinate(coordinate), 420);
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    const granted = await requestLocation();
    setLocationGranted(granted);

    if (!granted) {
      showToast('error', 'Konum izni gerekli');
    }
  }, []);

  const handleUserLocationChange = useCallback(
    (event: { nativeEvent?: { coordinate?: { latitude: number; longitude: number } } }) => {
      const coordinate = event.nativeEvent?.coordinate;

      if (!coordinate) {
        return;
      }

      setPinCoordinate(coordinate);
      mapRef.current?.animateToRegion(regionForCoordinate(coordinate), 420);
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (!stop) {
      navigation.goBack();
      return;
    }

    setSaving(true);

    setStopLocation(stopId, {
      latitude: pinCoordinate.latitude,
      longitude: pinCoordinate.longitude,
      address: shortAddress ?? undefined,
    });

    if (!shortAddress) {
      const reverse = await GeocodingService.reverseGeocode(
        pinCoordinate.latitude,
        pinCoordinate.longitude,
      );

      if (reverse?.shortName) {
        setRouteStops(
          useCreateRouteFlowStore.getState().routeStops.map((item) =>
            item.id === stopId ? { ...item, address: reverse.shortName } : item,
          ),
        );
      }
    }

    setSaving(false);
    navigation.goBack();
  }, [navigation, pinCoordinate, setRouteStops, setStopLocation, shortAddress, stop, stopId]);

  if (!stop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Konum seç</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={[styles.addressText, { padding: 16 }]}>Durak bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konum seç</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <LocationSearchBar onResultPress={handleSearchResult} />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={getMapProvider()}
          mapType={getNativeMapType('light')}
          style={styles.map}
          initialRegion={regionForCoordinate(initialCoordinate)}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={locationGranted}
          showsMyLocationButton={false}
          onUserLocationChange={handleUserLocationChange}
          rotateEnabled={false}
          pitchEnabled={false}
        />

        <View style={styles.crosshair} pointerEvents="none">
          <View style={styles.crosshairPin}>
            <Icon name="map-marker" size={18} color={theme.background} />
          </View>
          <View style={styles.crosshairStem} />
        </View>
      </View>

      <View style={styles.bottomPanel}>
        {reverseLoading ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <Text style={styles.addressText}>
            {shortAddress || 'Haritayı kaydırarak konumu seç'}
          </Text>
        )}
        <Text style={styles.coordsText}>
          {pinCoordinate.latitude.toFixed(5)}, {pinCoordinate.longitude.toFixed(5)}
        </Text>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleUseMyLocation}>
          <Icon name="crosshairs-gps" size={18} color={theme.accent} />
          <Text style={styles.secondaryButtonText}>Konumumu kullan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          <Text style={styles.confirmButtonText}>
            {saving ? 'Kaydediliyor…' : 'Konumu onayla'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LocationPickerScreen;

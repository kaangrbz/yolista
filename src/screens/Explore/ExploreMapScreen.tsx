import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  LatLng,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  Region,
  UrlTile,
} from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appTheme } from '../../theme/appTheme';
import { useAuth } from '../../context/AuthContext';
import RouteModel, { RouteWithProfile } from '../../model/routes.model';
import CategoryModel from '../../model/category.model';
import { CategoryItem } from '../../types/category.types';
import { requestLocation } from '../../permissions';
import { useViewportRoutes } from '../../hooks/useViewportRoutes';
import {
  CLUSTER_MIN_POINTS,
  CLUSTER_RADIUS,
  DEFAULT_MAP_REGION,
  ROUTE_FOCUS_ZOOM_DELTA,
  USER_LOCATION_ZOOM_DELTA,
} from '../../constants/mapDefaults';
import {
  getNextMapStyle,
  getTileSource,
  MapStyleMode,
} from '../../constants/mapStyles';

import MapFilterBar, { MapFilters } from '../../components/explore/map/MapFilterBar';
import MapClusterMarker from '../../components/explore/map/MapClusterMarker';
import MapRouteMarker from '../../components/explore/map/MapRouteMarker';
import MapStyleToggle from '../../components/explore/map/MapStyleToggle';
import MyLocationFab from '../../components/explore/map/MyLocationFab';
import MapSearchBar from '../../components/explore/map/MapSearchBar';
import { GeocodingResult } from '../../services/GeocodingService';
import MapBottomSheet, {
  MapBottomSheetHandle,
} from '../../components/explore/map/MapBottomSheet';

const DEFAULT_FILTERS: MapFilters = {
  categoryId: 0,
  maxDistanceKm: null,
  nearMe: false,
};

const ExploreMapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<MapBottomSheetHandle>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [polylineLoading, setPolylineLoading] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('light');
  const [locating, setLocating] = useState(false);

  const discoveryFilters = useMemo(() => {
    return {
      categoryId: filters.categoryId || undefined,
      maxDistanceKm:
        filters.nearMe && filters.maxDistanceKm
          ? filters.maxDistanceKm
          : undefined,
      userCoordinate:
        filters.nearMe && userCoordinate
          ? {
              latitude: userCoordinate.latitude,
              longitude: userCoordinate.longitude,
            }
          : null,
    };
  }, [filters, userCoordinate]);

  const { routes, loading } = useViewportRoutes({
    region,
    filters: discoveryFilters,
  });

  useEffect(() => {
    let isCancelled = false;

    const loadCategories = async () => {
      try {
        const fetched: CategoryItem[] = await CategoryModel.getCategories();

        if (isCancelled) {
          return;
        }

        fetched.unshift({
          id: 0,
          name: 'Tümü',
          icon_name: 'routes',
          description: 'Tüm Rotalar',
          index: 0,
          is_disabled: false,
        });

        setCategories(fetched.sort((a, b) => a.index - b.index));
      } catch (err) {
        console.error('Map categories load error:', err);
      }
    };

    void loadCategories();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const tryGetLocation = async () => {
      const granted = await requestLocation();

      if (!granted || isCancelled) {
        return;
      }

      // Konum, MapView'in onUserLocationChange event'i üzerinden de yakalanır.
      // Burada extra bir şey yapmıyoruz, sadece izin alıyoruz.
    };

    void tryGetLocation();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRegionChangeComplete = useCallback((next: Region) => {
    setRegion(next);
  }, []);

  const handleUserLocationChange = useCallback((event: any) => {
    const coordinate = event?.nativeEvent?.coordinate;

    if (!coordinate) {
      return;
    }

    setUserCoordinate({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  }, []);

  const fetchPolylineForRoute = useCallback(
    async (routeId: string) => {
      setPolylineLoading(true);

      try {
        const all = await RouteModel.getRoutesById(routeId, user?.id);

        if (!Array.isArray(all)) {
          setPolylineCoords([]);

          return;
        }

        const coords: LatLng[] = all
          .filter(
            (row: any) =>
              typeof row.latitude === 'number' &&
              typeof row.longitude === 'number',
          )
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((row: any) => ({
            latitude: row.latitude,
            longitude: row.longitude,
          }));

        setPolylineCoords(coords);
      } catch (err) {
        console.error('Polyline load error:', err);
        setPolylineCoords([]);
      } finally {
        setPolylineLoading(false);
      }
    },
    [user?.id],
  );

  const handleSelectRoute = useCallback(
    (route: RouteWithProfile) => {
      if (!route.id) {
        return;
      }

      setSelectedRouteId(route.id);

      if (
        typeof route.latitude === 'number' &&
        typeof route.longitude === 'number'
      ) {
        mapRef.current?.animateToRegion(
          {
            latitude: route.latitude,
            longitude: route.longitude,
            latitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
            longitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
          },
          350,
        );
      }

      sheetRef.current?.snapTo('medium');
      sheetRef.current?.scrollToRoute(route.id);
      void fetchPolylineForRoute(route.id);
    },
    [fetchPolylineForRoute],
  );

  const handleMarkerPress = useCallback(
    (route: RouteWithProfile) => {
      handleSelectRoute(route);
    },
    [handleSelectRoute],
  );

  const handleCalloutPress = useCallback(
    (route: RouteWithProfile) => {
      if (!route.id) {
        return;
      }

      navigation.navigate('RouteDetail', { routeId: route.id });
    },
    [navigation],
  );

  const handleMyLocationPress = useCallback(async () => {
    setLocating(true);

    try {
      const granted = await requestLocation();

      if (!granted) {
        return;
      }

      if (!userCoordinate) {
        return;
      }

      mapRef.current?.animateToRegion(
        {
          latitude: userCoordinate.latitude,
          longitude: userCoordinate.longitude,
          latitudeDelta: USER_LOCATION_ZOOM_DELTA,
          longitudeDelta: USER_LOCATION_ZOOM_DELTA,
        },
        400,
      );
    } finally {
      setLocating(false);
    }
  }, [userCoordinate]);

  const handleStyleToggle = useCallback(() => {
    setMapStyleMode((prev) => getNextMapStyle(prev));
  }, []);

  const handleSearchResult = useCallback((result: GeocodingResult) => {
    if (result.boundingBox) {
      const { minLat, maxLat, minLng, maxLng } = result.boundingBox;
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latitudeDelta = Math.max(maxLat - minLat, 0.01);
      const longitudeDelta = Math.max(maxLng - minLng, 0.01);

      mapRef.current?.animateToRegion(
        {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latitudeDelta * 1.1,
          longitudeDelta: longitudeDelta * 1.1,
        },
        450,
      );

      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
        longitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
      },
      450,
    );
  }, []);

  const renderMarker = useCallback(
    (route: RouteWithProfile) => {
      if (
        typeof route.latitude !== 'number' ||
        typeof route.longitude !== 'number'
      ) {
        return null;
      }

      const isSelected = route.id === selectedRouteId;

      return (
        <Marker
          key={route.id}
          identifier={route.id || undefined}
          coordinate={{
            latitude: route.latitude,
            longitude: route.longitude,
          }}
          tracksViewChanges={false}
          onPress={(event) => {
            event.stopPropagation();
            handleMarkerPress(route);
          }}
          onCalloutPress={() => handleCalloutPress(route)}
          title={route.title}
          description={route.cities?.name}
        >
          <MapRouteMarker
            iconName={route.categories?.icon_name}
            selected={isSelected}
          />
        </Marker>
      );
    },
    [handleCalloutPress, handleMarkerPress, selectedRouteId],
  );

  const renderClusterFn = useCallback((cluster: any) => {
    const { id, geometry, properties, onPress } = cluster;
    const points = properties.point_count;

    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{
          longitude: geometry.coordinates[0],
          latitude: geometry.coordinates[1],
        }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <MapClusterMarker count={points} />
      </Marker>
    );
  }, []);

  const showsTopOffset = insets.top + 6;
  const tileSource = getTileSource(mapStyleMode);

  return (
    <View style={styles.container}>
      <ClusteredMapView
        mapRef={((ref: MapView | null) => {
          (mapRef as React.MutableRefObject<MapView | null>).current = ref;
        }) as any}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        style={styles.map}
        initialRegion={DEFAULT_MAP_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onUserLocationChange={handleUserLocationChange}
        clusterColor={appTheme.accent}
        clusterTextColor="#fff"
        radius={CLUSTER_RADIUS}
        minPoints={CLUSTER_MIN_POINTS}
        renderCluster={renderClusterFn}
      >
        <UrlTile
          urlTemplate={tileSource.urlTemplate}
          maximumZ={tileSource.maximumZ}
          flipY={false}
          shouldReplaceMapContent
          zIndex={-2}
        />

        {tileSource.overlayUrlTemplate ? (
          <UrlTile
            urlTemplate={tileSource.overlayUrlTemplate}
            maximumZ={tileSource.maximumZ}
            flipY={false}
            zIndex={-1}
          />
        ) : null}

        {routes.map(renderMarker)}

        {polylineCoords.length > 1 ? (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={appTheme.accent}
            strokeWidth={4}
          />
        ) : null}
      </ClusteredMapView>

      <View
        style={[styles.topBar, { paddingTop: showsTopOffset }]}
        pointerEvents="box-none"
      >
        <View style={styles.searchRow} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Icon name="arrow-left" size={20} color={appTheme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBarWrapper}>
            <MapSearchBar onResultPress={handleSearchResult} />
          </View>
        </View>

        <View style={styles.filterBarRow} pointerEvents="box-none">
          <MapFilterBar
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </View>
      </View>

      {loading || polylineLoading ? (
        <View style={[styles.loadingBadge, { top: showsTopOffset + 110 }]}>
          <ActivityIndicator size="small" color={appTheme.accent} />
          <Text style={styles.loadingText}>Yükleniyor</Text>
        </View>
      ) : null}

      <MapStyleToggle
        mode={mapStyleMode}
        onToggle={handleStyleToggle}
        bottomOffset={insets.bottom + 320}
      />

      <MyLocationFab
        onPress={handleMyLocationPress}
        loading={locating}
        bottomOffset={insets.bottom + 260}
      />

      <View
        style={[styles.attribution, { bottom: insets.bottom + 100 }]}
        pointerEvents="none"
      >
        <Text style={styles.attributionText}>{tileSource.attribution}</Text>
      </View>

      <MapBottomSheet
        ref={sheetRef}
        routes={routes}
        loading={loading}
        selectedRouteId={selectedRouteId}
        onSelectRoute={handleSelectRoute}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterBarRow: {
    marginTop: 6,
  },
  loadingBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: appTheme.textSecondary,
    fontWeight: '500',
  },
  attribution: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 9,
    color: appTheme.textSecondary,
  },
});

export default ExploreMapScreen;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  LatLng,
  Polyline,
  Region,
} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { useAuth } from '../../context/AuthContext';
import RouteModel, { RouteWithProfile } from '../../model/routes.model';
import CategoryModel from '../../model/category.model';
import { CategoryItem } from '../../types/category.types';
import { requestLocation } from '../../permissions';
import { useViewportRoutes } from '../../hooks/useViewportRoutes';
import { useRouteMapClusters } from '../../hooks/useRouteMapClusters';
import {
  ROUTE_FOCUS_ZOOM_DELTA,
  regionForStopFocus,
  regionDeltaForDistanceKm,
  TURKEY_BOUNDS,
  TURKEY_REGION,
  MAP_FILTER_DEFAULT_DISTANCE_KM,
} from '../../constants/mapDefaults';
import {
  getNextMapStyle,
  MapStyleMode,
} from '../../constants/mapStyles';
import {
  getMapProvider,
  getNativeMapType,
} from '../../constants/mapViewConfig';

import MapFilterBar, { MapFilters } from '../../components/explore/map/MapFilterBar';
import MapRouteGroupMarker from '../../components/explore/map/MapRouteGroupMarker';
import MapRouteStopMarker from '../../components/explore/map/MapRouteStopMarker';
import { getMapStopKey } from '../../components/explore/map/MapRouteStopCard';
import MapClusterMarkerWrapper from '../../components/explore/map/MapClusterMarkerWrapper';
import MapStyleToggle from '../../components/explore/map/MapStyleToggle';
import MyLocationFab from '../../components/explore/map/MyLocationFab';
import MapZoomControls from '../../components/explore/map/MapZoomControls';
import MapSearchBar from '../../components/explore/map/MapSearchBar';
import { GeocodingResult } from '../../services/GeocodingService';
import MapBottomSheet, {
  MapBottomSheetHandle,
} from '../../components/explore/map/MapBottomSheet';
import { showToast } from '../../utils/alert';
import { prefetchMapPreviewImages } from '../../utils/mapPreviewImageCache';

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
  const userCoordinateRef = useRef<LatLng | null>(null);
  const locationWaitersRef = useRef<Array<(coordinate: LatLng) => void>>([]);
  const [region, setRegion] = useState<Region>(TURKEY_REGION);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteMeta, setSelectedRouteMeta] = useState<RouteWithProfile | null>(
    null,
  );
  const [selectedRouteStops, setSelectedRouteStops] = useState<RouteWithProfile[]>([]);
  const [routeStopsExpanded, setRouteStopsExpanded] = useState(true);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [polylineLoading, setPolylineLoading] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('light');
  const [locating, setLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    map: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
      backgroundColor: t.background,
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
  }));

  const discoveryFilters = useMemo(() => {
    return {
      categoryId: filters.categoryId || undefined,
      maxDistanceKm: filters.nearMe
        ? filters.maxDistanceKm ?? MAP_FILTER_DEFAULT_DISTANCE_KM
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

  const mapClusters = useRouteMapClusters(routes, region);

  useEffect(() => {
    prefetchMapPreviewImages(routes);
  }, [routes]);

  useEffect(() => {
    prefetchMapPreviewImages(selectedRouteStops);
  }, [selectedRouteStops]);

  const selectedStopsWithCoords = useMemo(
    () =>
      selectedRouteStops.filter(
        (stop) =>
          typeof stop.latitude === 'number' &&
          typeof stop.longitude === 'number',
      ),
    [selectedRouteStops],
  );

  const mainRouteStop = useMemo(() => {
    if (selectedRouteStops.length === 0) {
      return null;
    }

    return (
      selectedRouteStops.find((stop) => stop.order_index === 0) ??
      selectedRouteStops[0]
    );
  }, [selectedRouteStops]);

  const mapStopsToRender = useMemo(() => {
    if (routeStopsExpanded) {
      return selectedStopsWithCoords;
    }

    if (
      mainRouteStop &&
      typeof mainRouteStop.latitude === 'number' &&
      typeof mainRouteStop.longitude === 'number'
    ) {
      return [mainRouteStop];
    }

    return [];
  }, [mainRouteStop, routeStopsExpanded, selectedStopsWithCoords]);

  const showSelectedRouteOnMap = mapStopsToRender.length > 0;

  const resolvedSelectedRoute = useMemo(() => {
    if (selectedRouteMeta) {
      return selectedRouteMeta;
    }

    if (!selectedRouteId || selectedRouteStops.length === 0) {
      return null;
    }

    return (
      selectedRouteStops.find((stop) => stop.order_index === 0) ??
      selectedRouteStops[0]
    );
  }, [selectedRouteMeta, selectedRouteId, selectedRouteStops]);

  const bottomSheetRoutes = useMemo(() => {
    if (!selectedRouteId || !resolvedSelectedRoute?.id) {
      return routes;
    }

    if (routes.some((route) => route.id === selectedRouteId)) {
      return routes;
    }

    return [resolvedSelectedRoute, ...routes];
  }, [resolvedSelectedRoute, routes, selectedRouteId]);

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

  const fitTurkey = useCallback(() => {
    mapRef.current?.fitToCoordinates(
      [TURKEY_BOUNDS.northEast, TURKEY_BOUNDS.southWest],
      {
        edgePadding: { top: 80, right: 40, bottom: 220, left: 40 },
        animated: true,
      },
    );
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const tryGetLocation = async () => {
      try {
        const granted = await requestLocation();

        if (isCancelled) {
          return;
        }

        setLocationGranted(granted);

        if (!granted) {
          // Konum yoksa Türkiye'yi tam kapsayacak şekilde sığdır.
          setTimeout(() => {
            if (!isCancelled) {
              fitTurkey();
            }
          }, 300);
        }
      } catch (err) {
        console.warn('Location permission error:', err);

        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) {
              fitTurkey();
            }
          }, 300);
        }
      }
    };

    void tryGetLocation();

    return () => {
      isCancelled = true;
    };
  }, [fitTurkey]);

  const handleRegionChangeComplete = useCallback((next: Region) => {
    setRegion(next);
  }, []);

  const handleUserLocationChange = useCallback((event: any) => {
    const coordinate = event?.nativeEvent?.coordinate;

    if (!coordinate) {
      return;
    }

    const next: LatLng = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };

    userCoordinateRef.current = next;
    setUserCoordinate(next);

    if (locationWaitersRef.current.length > 0) {
      locationWaitersRef.current.forEach((resolve) => resolve(next));
      locationWaitersRef.current = [];
    }
  }, []);

  const waitForUserCoordinate = useCallback((timeoutMs = 10_000): Promise<LatLng | null> => {
    if (userCoordinateRef.current) {
      return Promise.resolve(userCoordinateRef.current);
    }

    return new Promise((resolve) => {
      const onCoordinate = (coordinate: LatLng) => {
        clearTimeout(timer);
        resolve(coordinate);
      };

      const timer = setTimeout(() => {
        locationWaitersRef.current = locationWaitersRef.current.filter(
          (entry) => entry !== onCoordinate,
        );
        resolve(null);
      }, timeoutMs);

      locationWaitersRef.current.push(onCoordinate);
    });
  }, []);

  const ensureUserLocation = useCallback(async (): Promise<LatLng | null> => {
    const granted = await requestLocation();
    setLocationGranted(granted);

    if (!granted) {
      showToast('error', 'Konum izni gerekli');
      return null;
    }

    if (userCoordinateRef.current) {
      return userCoordinateRef.current;
    }

    return waitForUserCoordinate();
  }, [waitForUserCoordinate]);

  const animateToUserCoordinate = useCallback(
    (coordinate: LatLng, distanceKm: number) => {
      const delta = regionDeltaForDistanceKm(distanceKm);

      mapRef.current?.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        },
        400,
      );
    },
    [],
  );

  const handleFiltersChange = useCallback(
    async (next: MapFilters) => {
      const wasNearMe = filters.nearMe;
      const isNearMe = next.nearMe;

      setFilters(next);

      if (!isNearMe) {
        return;
      }

      const nextDistanceKm = next.maxDistanceKm ?? MAP_FILTER_DEFAULT_DISTANCE_KM;
      const needsMapMove =
        !wasNearMe || next.maxDistanceKm !== filters.maxDistanceKm;

      if (!needsMapMove) {
        return;
      }

      const coordinate = await ensureUserLocation();

      if (!coordinate) {
        setFilters((previous) =>
          previous.nearMe
            ? { ...previous, nearMe: false, maxDistanceKm: null }
            : previous,
        );
        return;
      }

      animateToUserCoordinate(coordinate, nextDistanceKm);
    },
    [animateToUserCoordinate, ensureUserLocation, filters.maxDistanceKm, filters.nearMe],
  );

  const fetchRouteDetails = useCallback(
    async (routeId: string) => {
      setStopsLoading(true);
      setPolylineLoading(true);

      try {
        const all = await RouteModel.getRoutesById(routeId, user?.id);

        if (!Array.isArray(all)) {
          setSelectedRouteStops([]);
          setPolylineCoords([]);
          setActiveStopId(null);

          return;
        }

        const sorted = [...all].sort(
          (a: RouteWithProfile, b: RouteWithProfile) =>
            (a.order_index || 0) - (b.order_index || 0),
        );

        const mainRoute =
          sorted.find((row) => row.order_index === 0) ?? sorted[0];
        const ownerId =
          mainRoute?.user_id || mainRoute?.profiles?.id || '';

        const stopsWithOwner = sorted.map((stop) => ({
          ...stop,
          user_id: stop.user_id || ownerId,
        }));

        setSelectedRouteStops(stopsWithOwner);

        const defaultActiveStop =
          stopsWithOwner.find(
            (stop) =>
              typeof stop.latitude === 'number' &&
              typeof stop.longitude === 'number',
          ) ?? stopsWithOwner[0];

        setActiveStopId(
          defaultActiveStop ? getMapStopKey(defaultActiveStop) : null,
        );

        if (mainRoute) {
          setSelectedRouteMeta((previous) => ({
            ...mainRoute,
            user_id: mainRoute.user_id || ownerId,
            profiles: mainRoute.profiles ?? previous?.profiles,
            categories: mainRoute.categories ?? previous?.categories,
            cities: mainRoute.cities ?? previous?.cities,
          }));
        }

        const coords: LatLng[] = sorted
          .filter(
            (row) =>
              typeof row.latitude === 'number' &&
              typeof row.longitude === 'number',
          )
          .map((row) => ({
            latitude: row.latitude as number,
            longitude: row.longitude as number,
          }));

        setPolylineCoords(coords);
      } catch (err) {
        console.error('Route details load error:', err);
        setSelectedRouteStops([]);
        setPolylineCoords([]);
        setActiveStopId(null);
      } finally {
        setStopsLoading(false);
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
      setSelectedRouteMeta(route);
      setRouteStopsExpanded(true);
      setActiveStopId(null);

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
      void fetchRouteDetails(route.id);
    },
    [fetchRouteDetails],
  );

  const handleStopPress = useCallback((stop: RouteWithProfile) => {
    setActiveStopId(getMapStopKey(stop));

    if (
      typeof stop.latitude !== 'number' ||
      typeof stop.longitude !== 'number'
    ) {
      return;
    }

    mapRef.current?.animateToRegion(
      regionForStopFocus({
        latitude: stop.latitude,
        longitude: stop.longitude,
      }),
      350,
    );
  }, []);

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
      const coordinate = await ensureUserLocation();

      if (!coordinate) {
        return;
      }

      const distanceKm = filters.nearMe
        ? filters.maxDistanceKm ?? MAP_FILTER_DEFAULT_DISTANCE_KM
        : 2;

      animateToUserCoordinate(coordinate, distanceKm);
    } finally {
      setLocating(false);
    }
  }, [animateToUserCoordinate, ensureUserLocation, filters.maxDistanceKm, filters.nearMe]);

  const handleStyleToggle = useCallback(() => {
    setMapStyleMode((prev) => getNextMapStyle(prev));
  }, []);

  const handleZoom = useCallback(
    (factor: number) => {
      const next: Region = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: Math.min(
          Math.max(region.latitudeDelta * factor, 0.001),
          180,
        ),
        longitudeDelta: Math.min(
          Math.max(region.longitudeDelta * factor, 0.001),
          180,
        ),
      };

      mapRef.current?.animateToRegion(next, 250);
    },
    [region],
  );

  const handleZoomIn = useCallback(() => handleZoom(0.5), [handleZoom]);
  const handleZoomOut = useCallback(() => handleZoom(2), [handleZoom]);

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

  const handleDismissRouteStops = useCallback(() => {
    setRouteStopsExpanded(false);
    setPolylineCoords([]);
    setActiveStopId(null);
  }, []);

  const handleClusterPress = useCallback(
    (expansionZoom: number, latitude: number, longitude: number) => {
      const latitudeDelta = Math.min(360 / 2 ** expansionZoom, region.latitudeDelta);
      const longitudeDelta = Math.min(360 / 2 ** expansionZoom, region.longitudeDelta);

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: Math.max(latitudeDelta, 0.005),
          longitudeDelta: Math.max(longitudeDelta, 0.005),
        },
        350,
      );
    },
    [region.latitudeDelta, region.longitudeDelta],
  );

  const renderMapFeature = useCallback(
    (feature: (typeof mapClusters)[number]) => {
      if (feature.type === 'cluster') {
        return (
          <MapClusterMarkerWrapper
            key={`cluster-${feature.clusterId}`}
            clusterId={feature.clusterId}
            latitude={feature.latitude}
            longitude={feature.longitude}
            count={feature.count}
            onPress={() =>
              handleClusterPress(
                feature.expansionZoom,
                feature.latitude,
                feature.longitude,
              )
            }
          />
        );
      }

      const group = feature.group;

      if (
        showSelectedRouteOnMap &&
        selectedRouteId &&
        group.some((route) => route.id === selectedRouteId)
      ) {
        return null;
      }

      return (
        <MapRouteGroupMarker
          key={
            group[0]?.id
              ? `group-${group[0].id}`
              : `group-${group[0]?.latitude}-${group[0]?.longitude}`
          }
          group={group}
          selectedRouteId={selectedRouteId}
          onPress={handleMarkerPress}
          onCalloutPress={handleCalloutPress}
        />
      );
    },
    [
      handleCalloutPress,
      handleClusterPress,
      handleMarkerPress,
      selectedRouteId,
      showSelectedRouteOnMap,
    ],
  );

  const showsTopOffset = insets.top + 6;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={getMapProvider()}
        mapType={getNativeMapType(mapStyleMode)}
        style={styles.map}
        initialRegion={TURKEY_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onUserLocationChange={locationGranted ? handleUserLocationChange : undefined}
      >
        {mapClusters.map(renderMapFeature)}

        {routeStopsExpanded && polylineCoords.length > 1 ? (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={theme.accent}
            strokeWidth={4}
          />
        ) : null}

        {mapStopsToRender.map((stop) => (
          <MapRouteStopMarker
            key={stop.id || `stop-${stop.order_index}`}
            stop={stop}
            selected={routeStopsExpanded && activeStopId === getMapStopKey(stop)}
            onPress={routeStopsExpanded ? handleStopPress : undefined}
          />
        ))}
      </MapView>

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
            <Icon name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBarWrapper}>
            <MapSearchBar onResultPress={handleSearchResult} />
          </View>
        </View>

        <View style={styles.filterBarRow} pointerEvents="box-none">
          <MapFilterBar
            categories={categories}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </View>
      </View>

      <MapZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        topOffset={showsTopOffset + 120}
      />

      <MyLocationFab
        onPress={handleMyLocationPress}
        loading={locating}
        topOffset={showsTopOffset + 120}
      />

      <MapStyleToggle
        mode={mapStyleMode}
        onToggle={handleStyleToggle}
        topOffset={showsTopOffset + 172}
      />

      <MapBottomSheet
        ref={sheetRef}
        routes={bottomSheetRoutes}
        loading={loading}
        selectedRouteId={selectedRouteId}
        selectedRoute={resolvedSelectedRoute}
        selectedRouteStops={selectedRouteStops}
        showRouteStopsPanel={routeStopsExpanded}
        activeStopId={activeStopId}
        stopsLoading={stopsLoading}
        onSelectRoute={handleSelectRoute}
        onStopPress={handleStopPress}
        onDismissRouteStops={handleDismissRouteStops}
        weatherLatitude={region.latitude}
        weatherLongitude={region.longitude}
      />
    </View>
  );
};

export default ExploreMapScreen;

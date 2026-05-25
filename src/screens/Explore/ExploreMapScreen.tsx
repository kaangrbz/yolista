import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
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
import {
  ROUTE_FOCUS_ZOOM_DELTA,
  TURKEY_BOUNDS,
  TURKEY_REGION,
  USER_LOCATION_ZOOM_DELTA,
} from '../../constants/mapDefaults';
import {
  getNextMapStyle,
  getTileSource,
  MapStyleMode,
} from '../../constants/mapStyles';

import MapFilterBar, { MapFilters } from '../../components/explore/map/MapFilterBar';
import MapRouteMarker from '../../components/explore/map/MapRouteMarker';
import MapStyleToggle from '../../components/explore/map/MapStyleToggle';
import MyLocationFab from '../../components/explore/map/MyLocationFab';
import MapZoomControls from '../../components/explore/map/MapZoomControls';
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

  const [region, setRegion] = useState<Region>(TURKEY_REGION);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
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
    loadingBadge: {
      position: 'absolute',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.background,
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
      color: t.textSecondary,
      fontWeight: '500',
    },
    attribution: {
      position: 'absolute',
      alignSelf: 'center',
      paddingHorizontal: 6,
      paddingVertical: 1,
      backgroundColor: t.background,
      borderRadius: 4,
    },
    attributionText: {
      fontSize: 9,
      color: t.textSecondary,
    },
  }));

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

      setLocationGranted(granted);

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

  // Aynı koordinattaki (≈11m hassasiyet) rotaları grupla — iskambil-kart efekti için.
  const routeGroups = useMemo(() => {
    const groups = new Map<string, RouteWithProfile[]>();

    routes.forEach((route) => {
      if (
        typeof route.latitude !== 'number' ||
        typeof route.longitude !== 'number'
      ) {
        return;
      }

      const key = `${route.latitude.toFixed(4)}_${route.longitude.toFixed(4)}`;
      const existing = groups.get(key);

      if (existing) {
        existing.push(route);
      } else {
        groups.set(key, [route]);
      }
    });

    return Array.from(groups.values());
  }, [routes]);

  const renderGroupMarker = useCallback(
    (group: RouteWithProfile[]) => {
      const primary = group[0];

      if (
        !primary ||
        typeof primary.latitude !== 'number' ||
        typeof primary.longitude !== 'number'
      ) {
        return null;
      }

      const isSelected = group.some((r) => r.id === selectedRouteId);
      const key = primary.id
        ? `group-${primary.id}`
        : `group-${primary.latitude.toFixed(4)}-${primary.longitude.toFixed(4)}`;
      // Resim async indiği için ilk render'da tracksViewChanges açık olmalı;
      // Marker'ın kendi içindeki MapRouteMarker yüklenince native tarafa kopyalanacak.
      // Performans için Marker bir kez ısıdıktan sonra false'a düşürmek istenirse
      // ileride bu mantık imageReady state'iyle iyileştirilebilir.
      const hasImage = !!primary.image_url;

      return (
        <Marker
          key={key}
          identifier={primary.id || undefined}
          coordinate={{
            latitude: primary.latitude,
            longitude: primary.longitude,
          }}
          tracksViewChanges={hasImage}
          onPress={(event) => {
            event.stopPropagation();
            handleMarkerPress(primary);
          }}
          onCalloutPress={() => handleCalloutPress(primary)}
          title={
            group.length > 1
              ? `${group.length} rota`
              : primary.title
          }
          description={primary.cities?.name}
        >
          <MapRouteMarker
            imageUrl={primary.image_url || null}
            userId={primary.user_id || null}
            iconName={primary.categories?.icon_name}
            selected={isSelected}
            stackCount={group.length}
          />
        </Marker>
      );
    },
    [handleCalloutPress, handleMarkerPress, selectedRouteId],
  );

  const showsTopOffset = insets.top + 6;
  const tileSource = getTileSource(mapStyleMode);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        style={styles.map}
        initialRegion={TURKEY_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onUserLocationChange={locationGranted ? handleUserLocationChange : undefined}
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

        {routeGroups.map(renderGroupMarker)}

        {polylineCoords.length > 1 ? (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={theme.accent}
            strokeWidth={4}
          />
        ) : null}
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
            onFiltersChange={setFilters}
          />
        </View>
      </View>

      {loading || polylineLoading ? (
        <View style={[styles.loadingBadge, { top: showsTopOffset + 110 }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.loadingText}>Yükleniyor</Text>
        </View>
      ) : null}

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
        weatherLatitude={region.latitude}
        weatherLongitude={region.longitude}
      />
    </View>
  );
};

export default ExploreMapScreen;

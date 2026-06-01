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
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, {
  LatLng,
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
import { requestLocation, checkLocation } from '../../permissions';
import { useViewportRoutes } from '../../hooks/useViewportRoutes';
import { useRouteMapClusters } from '../../hooks/useRouteMapClusters';
import {
  ROUTE_FOCUS_ZOOM_DELTA,
  regionForStopFocus,
  regionForUserLocation,
  regionDeltaForDistanceKm,
  TURKEY_BOUNDS,
  TURKEY_REGION,
  MAP_FILTER_DEFAULT_DISTANCE_KM,
  computeMapBottomSheetSnapHeights,
  mapSheetEdgePadding,
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
import MapSearchBar, {
  type MapSearchBarHandle,
} from '../../components/explore/map/MapSearchBar';
import { GeocodingResult } from '../../services/GeocodingService';
import MapBottomSheet, {
  MapBottomSheetHandle,
  type BottomSheetSnap,
  type MapBottomSheetSnapMetrics,
} from '../../components/explore/map/MapBottomSheet';
import MapRoutePolylineLayer from '../../components/explore/map/MapRoutePolylineLayer';
import { showToast } from '../../utils/alert';
import { prefetchMapPreviewImages } from '../../utils/mapPreviewImageCache';
import {
  buildRouteSegments,
  fetchWalkingDirections,
} from '../../services/walkingDirectionsService';
import { useRouteSegmentProgress } from '../../hooks/useRouteSegmentProgress';
import type { RouteSegment, RouteSheetTab } from '../../types/routeSegment.types';
import { openRouteInMaps, openStopInMaps } from '../../utils/openInMaps';
import { extractValidCoordinates } from '../../utils/routeDistance';
import { ShareService } from '../../services/ShareService';
import { getRouteShareLabel } from '../../utils/getRouteDisplayLabel';
import { usePostActions } from '../../hooks/usePostActions';
import SavedCollectionsSheet from '../../components/common/SavedCollectionsSheet';
import {
  getLastKnownLocationSync,
  hydrateLastKnownLocation,
  saveLastKnownLocation,
} from '../../services/lastKnownLocationStorage';

const DEFAULT_FILTERS: MapFilters = {
  categoryId: 0,
  maxDistanceKm: null,
  nearMe: false,
};

const ExploreMapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<MapBottomSheetHandle>(null);
  const searchBarRef = useRef<MapSearchBarHandle>(null);
  const lastFittedRouteIdRef = useRef<string | null>(null);
  const userCoordinateRef = useRef<LatLng | null>(getLastKnownLocationSync());
  const locationWaitersRef = useRef<Array<(coordinate: LatLng) => void>>([]);
  const [region, setRegion] = useState<Region>(() => {
    const cached = getLastKnownLocationSync();

    return cached ? regionForUserLocation(cached) : TURKEY_REGION;
  });
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [userCoordinate, setUserCoordinate] = useState<LatLng | null>(
    () => getLastKnownLocationSync(),
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteMeta, setSelectedRouteMeta] = useState<RouteWithProfile | null>(
    null,
  );
  const [selectedRouteStops, setSelectedRouteStops] = useState<RouteWithProfile[]>([]);
  const [routeStopsExpanded, setRouteStopsExpanded] = useState(true);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [approachPolylineCoords, setApproachPolylineCoords] = useState<LatLng[]>([]);
  const [startFromUserLocation, setStartFromUserLocation] = useState(false);
  const [routeSheetTab, setRouteSheetTab] = useState<RouteSheetTab>('stops');
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [polylineLoading, setPolylineLoading] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('light');
  const [locating, setLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [sheetMetrics, setSheetMetrics] = useState<MapBottomSheetSnapMetrics>(() => {
    const snapHeights = computeMapBottomSheetSnapHeights(windowHeight, 0);

    return {
      sheetHeight: snapHeights.closed,
      snapHeights,
    };
  });
  const [sheetSnap, setSheetSnap] = useState<BottomSheetSnap>('small');

  const handleSheetSnapChange = useCallback(
    (snap: BottomSheetSnap, metrics: MapBottomSheetSnapMetrics) => {
      setSheetMetrics(metrics);
      setSheetSnap(snap);

      if (snap === 'large') {
        searchBarRef.current?.blur();
      }
    },
    [],
  );

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
      zIndex: 20,
      elevation: 20,
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
    mapOverlayHidden: {
      opacity: 0,
    },
    sheetHost: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 40,
      elevation: 40,
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

  const isRouteDetailOpen = Boolean(selectedRouteId && routeStopsExpanded);

  const { routes, loading } = useViewportRoutes({
    region,
    filters: discoveryFilters,
    enabled: !isRouteDetailOpen,
  });

  const mapClusters = useRouteMapClusters(routes, region);
  const visibleMapClusters = isRouteDetailOpen ? [] : mapClusters;

  useEffect(() => {
    prefetchMapPreviewImages(routes);
  }, [routes]);

  useEffect(() => {
    prefetchMapPreviewImages(selectedRouteStops);
  }, [selectedRouteStops]);

  useEffect(() => {
    lastFittedRouteIdRef.current = null;
  }, [selectedRouteId]);

  const loadRouteSegments = useCallback(async () => {
    if (!selectedRouteId || selectedRouteStops.length === 0) {
      setRouteSegments([]);
      return;
    }

    setSegmentsLoading(true);

    try {
      const segments = await buildRouteSegments(selectedRouteStops, {
        userLocation: userCoordinate,
        startFromUser: startFromUserLocation,
      });

      if (selectedRouteIdRef.current !== selectedRouteId) {
        return;
      }

      setRouteSegments(segments);
      setActiveSegmentIndex((previous) =>
        Math.min(previous, Math.max(0, segments.length - 1)),
      );
    } catch (error) {
      console.warn('Route segments load error:', error);
      setRouteSegments([]);
    } finally {
      setSegmentsLoading(false);
    }
  }, [
    selectedRouteId,
    selectedRouteStops,
    startFromUserLocation,
    userCoordinate,
  ]);

  useEffect(() => {
    if (!routeStopsExpanded || !selectedRouteId) {
      setRouteSegments([]);
      return;
    }

    void loadRouteSegments();
  }, [loadRouteSegments, routeStopsExpanded, selectedRouteId]);

  useEffect(() => {
    if (!routeStopsExpanded || !selectedRouteId) {
      return;
    }

    const activeSegment = routeSegments[activeSegmentIndex];

    if (routeSheetTab === 'directions' && activeSegment?.coordinates.length) {
      mapRef.current?.fitToCoordinates(activeSegment.coordinates, {
        edgePadding: mapSheetEdgePadding(sheetMetrics.sheetHeight),
        animated: true,
      });
      return;
    }

    if (routeSheetTab !== 'stops' || polylineCoords.length < 2) {
      return;
    }

    if (lastFittedRouteIdRef.current === selectedRouteId) {
      return;
    }

    lastFittedRouteIdRef.current = selectedRouteId;

    const fitCoords = [
      ...polylineCoords,
      ...(approachPolylineCoords.length > 1 ? approachPolylineCoords : []),
    ];

    mapRef.current?.fitToCoordinates(fitCoords, {
      edgePadding: mapSheetEdgePadding(sheetMetrics.sheetHeight),
      animated: true,
    });
  }, [
    activeSegmentIndex,
    approachPolylineCoords,
    polylineCoords,
    routeSegments,
    routeSheetTab,
    routeStopsExpanded,
    selectedRouteId,
    sheetMetrics.sheetHeight,
  ]);

  const selectedStopsWithCoords = useMemo(
    () =>
      selectedRouteStops.filter(
        (stop) =>
          typeof stop.latitude === 'number' &&
          typeof stop.longitude === 'number',
      ),
    [selectedRouteStops],
  );

  const firstStopCoordinate = useMemo((): LatLng | null => {
    const sorted = [...selectedRouteStops].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
    );
    const firstStop = sorted.find(
      (stop) =>
        typeof stop.latitude === 'number' && typeof stop.longitude === 'number',
    );

    if (!firstStop) {
      return null;
    }

    return {
      latitude: firstStop.latitude as number,
      longitude: firstStop.longitude as number,
    };
  }, [selectedRouteStops]);

  useEffect(() => {
    let isCancelled = false;

    const loadApproachPolyline = async () => {
      if (
        !startFromUserLocation ||
        !routeStopsExpanded ||
        !userCoordinate ||
        !firstStopCoordinate
      ) {
        setApproachPolylineCoords([]);
        return;
      }

      try {
        const walkingDirections = await fetchWalkingDirections([
          userCoordinate,
          firstStopCoordinate,
        ]);

        if (!isCancelled) {
          setApproachPolylineCoords(walkingDirections.coordinates);
        }
      } catch (error) {
        console.warn('Approach polyline error:', error);

        if (!isCancelled) {
          setApproachPolylineCoords([userCoordinate, firstStopCoordinate]);
        }
      }
    };

    void loadApproachPolyline();

    return () => {
      isCancelled = true;
    };
  }, [
    firstStopCoordinate,
    routeStopsExpanded,
    startFromUserLocation,
    userCoordinate,
  ]);

  const mapStopsToRender = useMemo(() => {
    if (!routeStopsExpanded) {
      return [];
    }

    return selectedStopsWithCoords;
  }, [routeStopsExpanded, selectedStopsWithCoords]);

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

  const selectedRouteOwnerId =
    resolvedSelectedRoute?.user_id || resolvedSelectedRoute?.profiles?.id || '';

  const {
    isSaved: isSelectedRouteSaved,
    isSaveSheetVisible,
    isCollectionsLoading,
    collections,
    selectedCollectionIds,
    rowLoadingMap,
    handleSave: handleSaveSelectedRouteAction,
    closeSaveSheet,
    toggleCollectionForPost,
    createCollectionForPost,
  } = usePostActions(
    selectedRouteId ?? '',
    user?.id ?? null,
    selectedRouteOwnerId,
  );

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

  const applyUserCoordinate = useCallback((coordinate: LatLng) => {
    userCoordinateRef.current = coordinate;
    setUserCoordinate(coordinate);
  }, []);

  const centerMapOnCoordinate = useCallback((coordinate: LatLng, animated = true) => {
    const nextRegion = regionForUserLocation(coordinate);

    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, animated ? 350 : 0);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapLocation = async () => {
      const cached =
        getLastKnownLocationSync() ?? (await hydrateLastKnownLocation());

      if (isCancelled) {
        return;
      }

      if (cached) {
        applyUserCoordinate(cached);
        centerMapOnCoordinate(cached, false);
      }

      try {
        const granted = await checkLocation();

        if (isCancelled) {
          return;
        }

        setLocationGranted(granted);

        if (!granted && !cached) {
          setTimeout(() => {
            if (!isCancelled) {
              fitTurkey();
            }
          }, 300);
        }
      } catch (err) {
        console.warn('Location permission check error:', err);

        if (!isCancelled && !cached) {
          setTimeout(() => {
            if (!isCancelled) {
              fitTurkey();
            }
          }, 300);
        }
      }
    };

    void bootstrapLocation();

    return () => {
      isCancelled = true;
    };
  }, [applyUserCoordinate, centerMapOnCoordinate, fitTurkey]);

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
    saveLastKnownLocation(next);

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

  const selectedRouteIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRouteIdRef.current = selectedRouteId;
  }, [selectedRouteId]);

  const fetchRouteDetails = useCallback(
    async (routeId: string) => {
      setStopsLoading(true);
      setPolylineLoading(true);
      setPolylineCoords([]);

      try {
        const all = await RouteModel.getRoutesById(routeId, user?.id);

        if (selectedRouteIdRef.current !== routeId) {
          return;
        }

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

        const walkingDirections = await fetchWalkingDirections(coords);

        if (selectedRouteIdRef.current !== routeId) {
          return;
        }

        setPolylineCoords(walkingDirections.coordinates);
      } catch (err) {
        if (selectedRouteIdRef.current !== routeId) {
          return;
        }

        console.error('Route details load error:', err);
        setSelectedRouteStops([]);
        setPolylineCoords([]);
        setActiveStopId(null);
      } finally {
        if (selectedRouteIdRef.current === routeId) {
          setStopsLoading(false);
          setPolylineLoading(false);
        }
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
      setStartFromUserLocation(false);
      setApproachPolylineCoords([]);
      setRouteSheetTab('stops');
      setRouteSegments([]);
      setActiveSegmentIndex(0);

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

  const handleStartFromUserLocationChange = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setStartFromUserLocation(false);
        setApproachPolylineCoords([]);
        setActiveSegmentIndex(0);
        return;
      }

      if (!firstStopCoordinate) {
        showToast('error', 'Rotanın başlangıç durağında konum yok');
        return;
      }

      const coordinate = userCoordinate ?? (await ensureUserLocation());

      if (!coordinate) {
        return;
      }

      setStartFromUserLocation(true);
      setActiveSegmentIndex(0);
    },
    [ensureUserLocation, firstStopCoordinate, userCoordinate],
  );

  const syncActiveStopFromSegment = useCallback(
    (segmentIndex: number) => {
      const segment = routeSegments[segmentIndex];

      if (!segment) {
        return;
      }

      const targetStop = selectedRouteStops.find(
        (stop) => stop.order_index === segment.targetStopOrderIndex,
      );

      if (targetStop) {
        setActiveStopId(getMapStopKey(targetStop));
      }
    },
    [routeSegments, selectedRouteStops],
  );

  const handleSegmentPress = useCallback(
    (index: number) => {
      setActiveSegmentIndex(index);
      syncActiveStopFromSegment(index);

      const segment = routeSegments[index];

      if (segment?.coordinates.length) {
        mapRef.current?.fitToCoordinates(segment.coordinates, {
          edgePadding: mapSheetEdgePadding(sheetMetrics.sheetHeight),
          animated: true,
        });
      }
    },
    [routeSegments, syncActiveStopFromSegment, sheetMetrics.sheetHeight],
  );

  const handleRouteSheetTabChange = useCallback((tab: RouteSheetTab) => {
    setRouteSheetTab(tab);

    if (tab === 'directions') {
      const segment = routeSegments[activeSegmentIndex];

      if (segment?.coordinates.length) {
        mapRef.current?.fitToCoordinates(segment.coordinates, {
          edgePadding: mapSheetEdgePadding(sheetMetrics.sheetHeight),
          animated: true,
        });
      }
    }
  }, [activeSegmentIndex, routeSegments, sheetMetrics.sheetHeight]);

  const handleOpenActiveStopInMaps = useCallback(() => {
    const segment = routeSegments[activeSegmentIndex];

    if (!segment) {
      return;
    }

    void openStopInMaps(segment.to, { from: segment.from });
  }, [activeSegmentIndex, routeSegments]);

  useRouteSegmentProgress({
    enabled: locationGranted && routeStopsExpanded,
    routeSheetTab,
    userCoordinate,
    routeSegments,
    activeSegmentIndex,
    onAdvance: (nextIndex) => {
      setActiveSegmentIndex(nextIndex);
      syncActiveStopFromSegment(nextIndex);

      const segment = routeSegments[nextIndex];

      if (routeSheetTab === 'directions' && segment?.coordinates.length) {
        mapRef.current?.fitToCoordinates(segment.coordinates, {
          edgePadding: mapSheetEdgePadding(sheetMetrics.sheetHeight),
          animated: true,
        });
      }
    },
  });

  const handleOpenRouteInMaps = useCallback(() => {
    const coords = extractValidCoordinates(
      selectedRouteStops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    );

    if (coords.length === 0) {
      return;
    }

    void openRouteInMaps(coords);
  }, [selectedRouteStops]);

  const handleOpenStopInMaps = useCallback((stop: RouteWithProfile) => {
    if (
      typeof stop.latitude !== 'number' ||
      typeof stop.longitude !== 'number'
    ) {
      return;
    }

    const destination = {
      latitude: stop.latitude,
      longitude: stop.longitude,
    };

    if (userCoordinate) {
      void openStopInMaps(destination, { from: userCoordinate });
      return;
    }

    void openStopInMaps(destination);
  }, [userCoordinate]);

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

  const handleOpenRouteDetail = useCallback(() => {
    if (!selectedRouteId) {
      return;
    }

    let initialStopIndex = 0;

    if (activeStopId) {
      const stopIndex = selectedRouteStops.findIndex(
        (stop) => getMapStopKey(stop) === activeStopId,
      );

      if (stopIndex >= 0) {
        initialStopIndex = stopIndex;
      }
    }

    navigation.navigate('RouteDetail', {
      routeId: selectedRouteId,
      initialTab: routeSheetTab,
      initialStopIndex,
      initialSegmentIndex: activeSegmentIndex,
      startFromUserLocation,
    });
  }, [
    activeSegmentIndex,
    activeStopId,
    navigation,
    routeSheetTab,
    selectedRouteId,
    selectedRouteStops,
    startFromUserLocation,
  ]);

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
    const mainRoute =
      selectedRouteMeta ??
      selectedRouteStops.find((stop) => stop.order_index === 0) ??
      selectedRouteStops[0] ??
      null;

    setRouteStopsExpanded(false);
    setPolylineCoords([]);
    setApproachPolylineCoords([]);
    setStartFromUserLocation(false);
    setRouteSheetTab('stops');
    setRouteSegments([]);
    setActiveSegmentIndex(0);
    setActiveStopId(null);

    if (
      mainRoute &&
      typeof mainRoute.latitude === 'number' &&
      typeof mainRoute.longitude === 'number'
    ) {
      mapRef.current?.animateToRegion(
        {
          latitude: mainRoute.latitude,
          longitude: mainRoute.longitude,
          latitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
          longitudeDelta: ROUTE_FOCUS_ZOOM_DELTA,
        },
        350,
      );
    }

    if (selectedRouteId) {
      sheetRef.current?.scrollToRoute(selectedRouteId);
    }
  }, [selectedRouteId, selectedRouteMeta, selectedRouteStops]);

  const handleClearSelectedRoute = useCallback(() => {
    searchBarRef.current?.blur();

    setSelectedRouteId(null);
    setSelectedRouteMeta(null);
    setSelectedRouteStops([]);
    setRouteStopsExpanded(false);
    setPolylineCoords([]);
    setApproachPolylineCoords([]);
    setStartFromUserLocation(false);
    setRouteSheetTab('stops');
    setRouteSegments([]);
    setActiveSegmentIndex(0);
    setActiveStopId(null);
    setStopsLoading(false);
    setPolylineLoading(false);
    setSegmentsLoading(false);
    lastFittedRouteIdRef.current = null;
  }, []);

  const handleShareSelectedRoute = useCallback(async () => {
    if (!selectedRouteId || !resolvedSelectedRoute) {
      return;
    }

    await ShareService.sharePost({
      postId: selectedRouteId,
      title: getRouteShareLabel(resolvedSelectedRoute),
    });
  }, [resolvedSelectedRoute, selectedRouteId]);

  const handleSaveSelectedRoute = useCallback(async () => {
    if (!selectedRouteId) {
      return;
    }

    if (!user?.id) {
      showToast('error', 'Kaydetmek için giriş yapmalısın');
      return;
    }

    await handleSaveSelectedRouteAction();
  }, [handleSaveSelectedRouteAction, selectedRouteId, user?.id]);

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

      const isGroupSelected = group.some((route) => route.id === selectedRouteId);
      const shouldDim = Boolean(selectedRouteId) && !isGroupSelected;

      return (
        <MapRouteGroupMarker
          key={
            group[0]?.id
              ? `group-${group[0].id}`
              : `group-${group[0]?.latitude}-${group[0]?.longitude}`
          }
          group={group}
          selectedRouteId={selectedRouteId}
          dimmed={shouldDim}
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

  const initialMapRegion = useMemo(() => {
    const cached = getLastKnownLocationSync();

    return cached ? regionForUserLocation(cached) : TURKEY_REGION;
  }, []);

  const showsTopOffset = insets.top + 6;
  const isSheetFullScreen = sheetSnap === 'large';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={getMapProvider()}
        mapType={getNativeMapType(mapStyleMode)}
        style={styles.map}
        initialRegion={initialMapRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onUserLocationChange={locationGranted ? handleUserLocationChange : undefined}
      >
        {visibleMapClusters.map(renderMapFeature)}

        <MapRoutePolylineLayer
          showRoute={routeStopsExpanded}
          routeCoordinates={
            routeSheetTab === 'stops' ? polylineCoords : []
          }
          approachCoordinates={
            routeSheetTab === 'stops' ? approachPolylineCoords : []
          }
          segments={routeSheetTab === 'directions' ? routeSegments : []}
          activeSegmentIndex={activeSegmentIndex}
        />

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
        style={[
          styles.topBar,
          { paddingTop: showsTopOffset },
          isSheetFullScreen && styles.mapOverlayHidden,
        ]}
        pointerEvents={isSheetFullScreen ? 'none' : 'box-none'}
      >
        <View style={styles.searchRow} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ExploreMain');
              }
            }}
            activeOpacity={0.85}
          >
            <Icon name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBarWrapper}>
            <MapSearchBar ref={searchBarRef} onResultPress={handleSearchResult} />
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

      {!isSheetFullScreen ? (
        <>
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
        </>
      ) : null}

      <View style={styles.sheetHost} pointerEvents="box-none">
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
          onOpenRouteInMaps={handleOpenRouteInMaps}
          onOpenStopInMaps={handleOpenStopInMaps}
          startFromUserLocation={startFromUserLocation}
          onStartFromUserLocationChange={handleStartFromUserLocationChange}
          canStartFromUserLocation={firstStopCoordinate !== null}
          routeSheetTab={routeSheetTab}
          onRouteSheetTabChange={handleRouteSheetTabChange}
          routeSegments={routeSegments}
          activeSegmentIndex={activeSegmentIndex}
          segmentsLoading={segmentsLoading}
          onSegmentPress={handleSegmentPress}
          onOpenActiveStopInMaps={handleOpenActiveStopInMaps}
          onOpenRouteDetail={handleOpenRouteDetail}
          onSnapChange={handleSheetSnapChange}
          topInset={insets.top}
          weatherLatitude={region.latitude}
          weatherLongitude={region.longitude}
          onClearSelectedRoute={handleClearSelectedRoute}
          onShareRoute={handleShareSelectedRoute}
          onSaveRoute={handleSaveSelectedRoute}
          isRouteSaved={isSelectedRouteSaved}
          saveLoading={isCollectionsLoading}
        />
      </View>

      <SavedCollectionsSheet
        visible={isSaveSheetVisible}
        loading={isCollectionsLoading}
        collections={collections}
        selectedCollectionIds={selectedCollectionIds}
        rowLoadingMap={rowLoadingMap}
        onClose={closeSaveSheet}
        onToggleCollection={toggleCollectionForPost}
        onCreateCollection={createCollectionForPost}
      />
    </View>
  );
};

export default ExploreMapScreen;

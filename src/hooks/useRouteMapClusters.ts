import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { Region } from 'react-native-maps';
import { RouteWithProfile } from '../model/routes.model';
import {
  CLUSTER_MIN_POINTS,
  CLUSTER_RADIUS,
} from '../constants/mapDefaults';

export type RouteCoordinateGroup = RouteWithProfile[];

export interface MapRouteCluster {
  type: 'cluster';
  clusterId: number;
  latitude: number;
  longitude: number;
  count: number;
  expansionZoom: number;
}

export interface MapRouteGroupFeature {
  type: 'group';
  group: RouteCoordinateGroup;
}

export type MapClusterFeature = MapRouteCluster | MapRouteGroupFeature;

interface GroupProperties {
  group: RouteCoordinateGroup;
}

const groupRoutesByCoordinate = (
  routes: RouteWithProfile[],
): RouteCoordinateGroup[] => {
  const groups = new Map<string, RouteWithProfile[]>();

  routes.forEach((route) => {
    if (
      typeof route.latitude !== 'number' ||
      typeof route.longitude !== 'number' ||
      route.location_source === 'none'
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
};

const regionToBbox = (region: Region): [number, number, number, number] => {
  return [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ];
};

const regionToZoom = (region: Region): number => {
  const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
  return Math.max(0, Math.min(zoom, 16));
};

export const useRouteMapClusters = (
  routes: RouteWithProfile[],
  region: Region,
): MapClusterFeature[] => {
  return useMemo(() => {
    const groups = groupRoutesByCoordinate(routes);

    if (groups.length === 0) {
      return [];
    }

    const index = new Supercluster<GroupProperties, GroupProperties>({
      radius: CLUSTER_RADIUS,
      maxZoom: 16,
      minPoints: CLUSTER_MIN_POINTS,
    });

    index.load(
      groups.map((group) => {
        const primary = group[0];

        return {
          type: 'Feature',
          properties: { group },
          geometry: {
            type: 'Point',
            coordinates: [primary.longitude as number, primary.latitude as number],
          },
        };
      }),
    );

    const bbox = regionToBbox(region);
    const zoom = regionToZoom(region);
    const features = index.getClusters(bbox, zoom);

    return features.map((feature): MapClusterFeature => {
      const [longitude, latitude] = feature.geometry.coordinates;

      if ('cluster' in feature.properties && feature.properties.cluster) {
        const clusterId = feature.properties.cluster_id as number;

        return {
          type: 'cluster',
          clusterId,
          latitude,
          longitude,
          count: feature.properties.point_count as number,
          expansionZoom: index.getClusterExpansionZoom(clusterId),
        };
      }

      return {
        type: 'group',
        group: (feature.properties as GroupProperties).group,
      };
    });
  }, [routes, region]);
};

export default useRouteMapClusters;

import { supabase } from '../lib/supabase';
import { RouteWithProfile } from '../model/routes.model';
import { getCityCenter, getCityIdsInBbox } from '../data/cityCenters';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DiscoveryFilters {
  categoryId?: number;
  maxDistanceKm?: number;
  userCoordinate?: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface FetchRoutesInBboxParams {
  bbox: BoundingBox;
  filters?: DiscoveryFilters;
  limit?: number;
}

interface CacheEntry {
  expiresAt: number;
  data: RouteWithProfile[];
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

const buildCacheKey = (params: FetchRoutesInBboxParams): string => {
  const { bbox, filters, limit } = params;
  const bboxKey = `${bbox.minLat.toFixed(3)}_${bbox.maxLat.toFixed(3)}_${bbox.minLng.toFixed(3)}_${bbox.maxLng.toFixed(3)}`;
  const filterKey = `${filters?.categoryId ?? 'all'}_${filters?.maxDistanceKm ?? 'inf'}`;

  return `${bboxKey}|${filterKey}|${limit ?? 200}`;
};

const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const enrichRoutes = async (
  routes: any[],
  loggedUserId: string | null,
): Promise<RouteWithProfile[]> => {
  if (routes.length === 0) {
    return [];
  }

  const ids = routes.map((row) => row.id);

  const { data: likesData } = await supabase
    .from('likes')
    .select('entity_id, user_id')
    .eq('entity_type', 'route')
    .in('entity_id', ids);

  const likeCountMap: Record<string, number> = {};
  const userLikedMap: Record<string, boolean> = {};

  (likesData || []).forEach((like: any) => {
    likeCountMap[like.entity_id] = (likeCountMap[like.entity_id] || 0) + 1;

    if (loggedUserId && like.user_id === loggedUserId) {
      userLikedMap[like.entity_id] = true;
    }
  });

  return routes.map((row: any) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
    cities: Array.isArray(row.cities) ? row.cities[0] : row.cities,
    categories: Array.isArray(row.categories) ? row.categories[0] : row.categories,
    like_count: likeCountMap[row.id] || 0,
    did_like: loggedUserId ? !!userLikedMap[row.id] : false,
    comment_count: 0,
  })) as RouteWithProfile[];
};

export const RouteDiscoveryService = {
  /**
   * Belirli bir bbox içindeki ana rotaları döndürür.
   *
   * NOTE (TODO backend): Şu an `routes` tablosunda latitude/longitude alanları
   * sorgulanıyor. Backend tarafında `/routes?bbox=...` desteği eklenirse
   * burası RPC'ye/REST çağrısına geçirilebilir.
   */
  async fetchRoutesInBoundingBox(
    params: FetchRoutesInBboxParams,
    loggedUserId: string | null = null,
  ): Promise<RouteWithProfile[]> {
    const { bbox, filters, limit = 200 } = params;
    const cacheKey = buildCacheKey(params);
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const cityIdsInBbox = getCityIdsInBbox(bbox);

    // Rotalar: ya kendi lat/lng'leri bbox içinde, ya da lat/lng yok ama
    // city_id bbox'taki şehirlerden birine işaret ediyor (eski kayıtlar için fallback).
    const orFilters: string[] = [
      `and(latitude.gte.${bbox.minLat},latitude.lte.${bbox.maxLat},longitude.gte.${bbox.minLng},longitude.lte.${bbox.maxLng})`,
    ];

    if (cityIdsInBbox.length > 0) {
      orFilters.push(
        `and(latitude.is.null,city_id.in.(${cityIdsInBbox.join(',')}))`,
      );
    }

    let query = supabase
      .from('routes')
      .select(`
        *,
        profiles (*),
        cities (*),
        categories (*)
      `)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .eq('order_index', 0)
      .or(orFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.categoryId && filters.categoryId !== 0) {
      query = query.eq('category_id', filters.categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('RouteDiscoveryService.fetchRoutesInBoundingBox:', error);
      throw new Error(`Failed to fetch routes in viewport: ${error.message}`);
    }

    let rows = (data || []).map((row: any) => {
      if (
        (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') &&
        row.city_id != null
      ) {
        const cityCenter = getCityCenter(row.city_id);

        if (cityCenter) {
          return {
            ...row,
            latitude: cityCenter.latitude,
            longitude: cityCenter.longitude,
          };
        }
      }

      return row;
    });

    if (
      filters?.maxDistanceKm &&
      filters.userCoordinate &&
      Number.isFinite(filters.maxDistanceKm)
    ) {
      const origin = filters.userCoordinate;
      const maxKm = filters.maxDistanceKm;

      rows = rows.filter((row: any) => {
        if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
          return false;
        }

        const distance = haversineKm(origin, {
          latitude: row.latitude,
          longitude: row.longitude,
        });

        return distance <= maxKm;
      });
    }

    const enriched = await enrichRoutes(rows, loggedUserId);

    cache.set(cacheKey, {
      data: enriched,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return enriched;
  },

  clearCache() {
    cache.clear();
  },
};

export default RouteDiscoveryService;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_ROUTE_IMAGE_JPEG_QUALITY,
  DEFAULT_ROUTE_IMAGE_SIZES,
  mergeRouteImagePolicy,
  type RouteImagePolicy,
} from '../utils/routeImage';

const STORAGE_KEY = '@yolista/route_image_policy_v1';
const TTL_MS = 1000 * 60 * 60 * 24;

type CacheEntry = {
  policy: RouteImagePolicy;
  savedAt: number;
};

let memoryPolicy: RouteImagePolicy | null = null;
let inflight: Promise<RouteImagePolicy> | null = null;

async function hydrateFromStorage(): Promise<RouteImagePolicy | null> {
  if (memoryPolicy) {
    return memoryPolicy;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEntry;

    if (parsed?.policy) {
      memoryPolicy = mergeRouteImagePolicy(parsed.policy);
      return memoryPolicy;
    }
  } catch (error) {
    console.warn('routeImagePolicy hydrate failed:', error);
  }

  return null;
}

async function fetchFromNetwork(): Promise<RouteImagePolicy> {
  const { data, error } = await supabase
    .from('route_image_policy')
    .select('thumb_size_px, medium_size_px, full_max_px, jpeg_quality')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const policy = mergeRouteImagePolicy(data ?? undefined);
  memoryPolicy = policy;

  try {
    const entry: CacheEntry = { policy, savedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore write errors
  }

  return policy;
}

export function getDefaultRouteImagePolicy(): RouteImagePolicy {
  return {
    thumb_size_px: DEFAULT_ROUTE_IMAGE_SIZES.thumb,
    medium_size_px: DEFAULT_ROUTE_IMAGE_SIZES.medium,
    full_max_px: DEFAULT_ROUTE_IMAGE_SIZES.full,
    jpeg_quality: DEFAULT_ROUTE_IMAGE_JPEG_QUALITY,
  };
}

/** Aktif politika — bellek, disk veya varsayılan. */
export async function getRouteImagePolicy(): Promise<RouteImagePolicy> {
  if (memoryPolicy) {
    return memoryPolicy;
  }

  const cached = await hydrateFromStorage();

  if (cached) {
    return cached;
  }

  return getDefaultRouteImagePolicy();
}

/** Açılışta arka planda politika yenile (ağ yoksa sessiz). */
export async function refreshRouteImagePolicy(): Promise<RouteImagePolicy> {
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const cached = await hydrateFromStorage();
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let shouldRefresh = true;

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as CacheEntry;
          shouldRefresh = Date.now() - (parsed.savedAt ?? 0) > TTL_MS;
        } catch {
          shouldRefresh = true;
        }
      }

      if (shouldRefresh) {
        return await fetchFromNetwork();
      }

      return cached ?? getDefaultRouteImagePolicy();
    } catch {
      return (await hydrateFromStorage()) ?? getDefaultRouteImagePolicy();
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

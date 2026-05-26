import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteWithProfile } from '../model/routes.model';

const STORAGE_KEY_PREFIX = '@yolista/home_feed_cache_v1';

export const HOME_FEED_CACHE_SIZE = 4;

type CacheEntry = {
  userId: string;
  data: RouteWithProfile[];
  savedAt: number;
};

const memoryByUser = new Map<string, RouteWithProfile[]>();

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export function getCachedHomeFeedPostsSync(userId: string): RouteWithProfile[] {
  return memoryByUser.get(userId) ?? [];
}

export async function hydrateHomeFeedCache(userId: string): Promise<RouteWithProfile[]> {
  const existing = memoryByUser.get(userId);

  if (existing && existing.length > 0) {
    return existing;
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CacheEntry;

    if (parsed.userId !== userId || !Array.isArray(parsed.data)) {
      return [];
    }

    const data = parsed.data.slice(0, HOME_FEED_CACHE_SIZE);

    if (data.length > 0) {
      memoryByUser.set(userId, data);
    }

    return data;
  } catch (err) {
    console.warn('homeFeedCache hydrate failed:', err);
    return [];
  }
}

export async function getCachedHomeFeedPosts(userId: string): Promise<RouteWithProfile[]> {
  const sync = getCachedHomeFeedPostsSync(userId);

  if (sync.length > 0) {
    return sync;
  }

  return hydrateHomeFeedCache(userId);
}

export async function setCachedHomeFeedPosts(
  userId: string,
  posts: RouteWithProfile[],
): Promise<void> {
  const data = posts.slice(0, HOME_FEED_CACHE_SIZE);

  if (data.length === 0) {
    return;
  }

  memoryByUser.set(userId, data);

  try {
    const entry: CacheEntry = {
      userId,
      data,
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(entry));
  } catch (err) {
    console.warn('homeFeedCache persist failed:', err);
  }
}

export async function clearHomeFeedCache(userId?: string): Promise<void> {
  if (userId) {
    memoryByUser.delete(userId);

    try {
      await AsyncStorage.removeItem(storageKey(userId));
    } catch {
      // ignore
    }

    return;
  }

  memoryByUser.clear();
}

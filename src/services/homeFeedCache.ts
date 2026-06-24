import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteWithProfile } from '../model/routes.model';

const STORAGE_KEY_PREFIX = '@yolista/home_feed_cache_v1';

export const HOME_FEED_CACHE_SIZE = 4;
/** Önbellek bu süreden eskiyse cold start'ta gösterilmez. */
export const HOME_FEED_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

type CacheEntry = {
  userId: string;
  data: RouteWithProfile[];
  savedAt: number;
};

type MemoryEntry = {
  data: RouteWithProfile[];
  savedAt: number;
};

const memoryByUser = new Map<string, MemoryEntry>();

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function isCacheExpired(savedAt: number): boolean {
  return Date.now() - savedAt > HOME_FEED_CACHE_TTL_MS;
}

function parseValidCacheEntry(entry: CacheEntry, userId: string): RouteWithProfile[] | null {
  if (entry.userId !== userId || !Array.isArray(entry.data)) {
    return null;
  }

  if (isCacheExpired(entry.savedAt)) {
    return null;
  }

  const data = entry.data.slice(0, HOME_FEED_CACHE_SIZE);

  return data.length > 0 ? data : null;
}

function rememberInMemory(userId: string, data: RouteWithProfile[], savedAt: number) {
  memoryByUser.set(userId, { data, savedAt });
}

async function evictCache(userId: string): Promise<void> {
  memoryByUser.delete(userId);

  try {
    await AsyncStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export function getCachedHomeFeedPostsSync(userId: string): RouteWithProfile[] {
  const memoryEntry = memoryByUser.get(userId);

  if (!memoryEntry) {
    return [];
  }

  if (isCacheExpired(memoryEntry.savedAt)) {
    void evictCache(userId);
    return [];
  }

  return memoryEntry.data;
}

export async function hydrateHomeFeedCache(userId: string): Promise<RouteWithProfile[]> {
  const memoryEntry = memoryByUser.get(userId);

  if (memoryEntry) {
    if (isCacheExpired(memoryEntry.savedAt)) {
      await evictCache(userId);
      return [];
    }

    return memoryEntry.data;
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CacheEntry;
    const data = parseValidCacheEntry(parsed, userId);

    if (!data) {
      if (parsed.userId === userId && isCacheExpired(parsed.savedAt)) {
        await evictCache(userId);
      }

      return [];
    }

    rememberInMemory(userId, data, parsed.savedAt);

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

  const savedAt = Date.now();
  rememberInMemory(userId, data, savedAt);

  try {
    const entry: CacheEntry = {
      userId,
      data,
      savedAt,
    };

    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(entry));
  } catch (err) {
    console.warn('homeFeedCache persist failed:', err);
  }
}

export async function clearHomeFeedCache(userId?: string): Promise<void> {
  if (userId) {
    await evictCache(userId);
    return;
  }

  memoryByUser.clear();
}

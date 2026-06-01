import { ImageService } from '../services/ImageService';

/** Oturum içi LRU — sadece harita 128×128 preview file URI'leri. */
export const MAP_PREVIEW_MEMORY_CACHE_MAX = 256;

const previewMemoryCache = new Map<string, string>();
const cacheListeners = new Set<() => void>();

export const getMapPreviewCacheKey = (
  userId: string,
  storageKey: string,
): string => `${userId}:${storageKey}`;

const notifyCacheListeners = () => {
  cacheListeners.forEach((listener) => listener());
};

export const subscribeMapPreviewCache = (listener: () => void): (() => void) => {
  cacheListeners.add(listener);

  return () => {
    cacheListeners.delete(listener);
  };
};

const touchMemoryEntry = (key: string, fileUri: string): string => {
  const previous = previewMemoryCache.get(key);

  if (previewMemoryCache.has(key)) {
    previewMemoryCache.delete(key);
  }

  previewMemoryCache.set(key, fileUri);

  while (previewMemoryCache.size > MAP_PREVIEW_MEMORY_CACHE_MAX) {
    const oldestKey = previewMemoryCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    previewMemoryCache.delete(oldestKey);
  }

  if (previous !== fileUri) {
    notifyCacheListeners();
  }

  return fileUri;
};

export const peekMapPreviewFromMemory = (
  userId: string,
  storageKey: string,
): string | null => {
  return previewMemoryCache.get(getMapPreviewCacheKey(userId, storageKey)) ?? null;
};

export const getMapPreviewFromMemory = (
  userId: string,
  storageKey: string,
): string | null => {
  const key = getMapPreviewCacheKey(userId, storageKey);
  const cached = previewMemoryCache.get(key);

  if (!cached) {
    return null;
  }

  return touchMemoryEntry(key, cached);
};

/** Bellekte hazır preview URI — senkron (bottom sheet anında gösterim). */
export const getSyncMapPreviewUri = (
  userId: string,
  imagePreviewUrl?: string | null,
  imageUrl?: string | null,
): string | null => {
  if (!userId) {
    return null;
  }

  if (imagePreviewUrl) {
    const previewHit = peekMapPreviewFromMemory(userId, imagePreviewUrl);

    if (previewHit) {
      return previewHit;
    }
  }

  if (imageUrl) {
    return peekMapPreviewFromMemory(userId, imageUrl);
  }

  return null;
};

const loadStorageKey = async (
  userId: string,
  storageKey: string,
  allowNetwork: boolean,
): Promise<string | null> => {
  const memoryHit = getMapPreviewFromMemory(userId, storageKey);

  if (memoryHit) {
    return memoryHit;
  }

  const diskHit = await ImageService.getCachedRouteImageUri(storageKey, userId);

  if (diskHit) {
    return touchMemoryEntry(getMapPreviewCacheKey(userId, storageKey), diskHit);
  }

  if (!allowNetwork) {
    return null;
  }

  const fileUri = await ImageService.loadImageWithCache(
    storageKey,
    'routes',
    userId,
  );

  if (!fileUri) {
    return null;
  }

  return touchMemoryEntry(getMapPreviewCacheKey(userId, storageKey), fileUri);
};

export interface LoadMapPreviewOptions {
  /** Ağ isteği yok — sadece bellek + disk önbelleği. */
  cacheOnly?: boolean;
  /** Preview yoksa full image indirme (bottom sheet için true). */
  previewOnly?: boolean;
}

/**
 * Harita pin / küçük thumb — önce 128×128 preview, yoksa orijinal.
 * Disk (CacheManager LRU) + bellek (MAP_PREVIEW_MEMORY_CACHE_MAX) önbelleği.
 */
export async function loadMapPreviewImage(
  userId: string,
  imagePreviewUrl?: string | null,
  imageUrl?: string | null,
  options: LoadMapPreviewOptions = {},
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const allowNetwork = !options.cacheOnly;

  if (imagePreviewUrl) {
    try {
      const previewUri = await loadStorageKey(userId, imagePreviewUrl, allowNetwork);

      if (previewUri) {
        return previewUri;
      }
    } catch {
      // Preview yüklenemezse ana görsele düş.
    }
  }

  if (options.previewOnly) {
    return null;
  }

  if (imageUrl) {
    return loadStorageKey(userId, imageUrl, allowNetwork);
  }

  return null;
}

/** Viewport rotaları için arka planda preview önbelleğini ısıt. */
export function prefetchMapPreviewImages(
  items: Array<{
    user_id?: string | null;
    image_preview_url?: string | null;
    image_url?: string | null;
  }>,
): void {
  items.forEach((item) => {
    if (!item.user_id) {
      return;
    }

    void loadMapPreviewImage(
      item.user_id,
      item.image_preview_url,
      item.image_url,
    );
  });
}

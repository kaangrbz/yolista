import { ImageService } from '../services/ImageService';
import {
  resolveRouteImagePath,
  type RouteImageUrls,
  type RouteImageVariant,
} from './routeImage';

export const ROUTE_IMAGE_MEMORY_CACHE_MAX = 256;

const imageMemoryCache = new Map<string, string>();
const cacheListeners = new Set<() => void>();

export const getRouteImageCacheKey = (
  userId: string,
  variant: RouteImageVariant,
  storageKey: string,
): string => `${userId}:${variant}:${storageKey}`;

export const subscribeRouteImageCache = (listener: () => void): (() => void) => {
  cacheListeners.add(listener);

  return () => {
    cacheListeners.delete(listener);
  };
};

const notifyCacheListeners = () => {
  cacheListeners.forEach((listener) => listener());
};

const touchMemoryEntry = (key: string, fileUri: string): string => {
  const previous = imageMemoryCache.get(key);

  if (imageMemoryCache.has(key)) {
    imageMemoryCache.delete(key);
  }

  imageMemoryCache.set(key, fileUri);

  while (imageMemoryCache.size > ROUTE_IMAGE_MEMORY_CACHE_MAX) {
    const oldestKey = imageMemoryCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    imageMemoryCache.delete(oldestKey);
  }

  if (previous !== fileUri) {
    notifyCacheListeners();
  }

  return fileUri;
};

export const peekRouteImageFromMemory = (
  userId: string,
  variant: RouteImageVariant,
  storageKey: string,
): string | null => {
  return imageMemoryCache.get(getRouteImageCacheKey(userId, variant, storageKey)) ?? null;
};

export const getRouteImageFromMemory = (
  userId: string,
  variant: RouteImageVariant,
  storageKey: string,
): string | null => {
  const key = getRouteImageCacheKey(userId, variant, storageKey);
  const cached = imageMemoryCache.get(key);

  if (!cached) {
    return null;
  }

  return touchMemoryEntry(key, cached);
};

export const getSyncRouteImageUri = (
  userId: string,
  variant: RouteImageVariant,
  urls: RouteImageUrls,
  options?: { strict?: boolean },
): string | null => {
  if (!userId) {
    return null;
  }

  const storageKey = resolveRouteImagePath(variant, urls, options);

  if (!storageKey) {
    return null;
  }

  return peekRouteImageFromMemory(userId, variant, storageKey);
};

const loadStorageKey = async (
  userId: string,
  variant: RouteImageVariant,
  storageKey: string,
  allowNetwork: boolean,
): Promise<string | null> => {
  const memoryHit = getRouteImageFromMemory(userId, variant, storageKey);

  if (memoryHit) {
    return memoryHit;
  }

  const diskHit = await ImageService.getCachedRouteImageUri(storageKey, userId);

  if (diskHit) {
    return touchMemoryEntry(getRouteImageCacheKey(userId, variant, storageKey), diskHit);
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

  return touchMemoryEntry(getRouteImageCacheKey(userId, variant, storageKey), fileUri);
};

export interface LoadRouteImageOptions {
  cacheOnly?: boolean;
  strict?: boolean;
}

export async function loadRouteImage(
  userId: string,
  variant: RouteImageVariant,
  urls: RouteImageUrls,
  options: LoadRouteImageOptions = {},
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const allowNetwork = !options.cacheOnly;
  const chain: RouteImageVariant[] =
    variant === 'thumb' && options.strict
      ? ['thumb']
      : variant === 'thumb'
        ? ['thumb', 'medium', 'full']
        : variant === 'medium'
          ? ['medium', 'full', 'thumb']
          : ['full', 'medium', 'thumb'];

  for (const step of chain) {
    const storageKey = resolveRouteImagePath(step, urls, { strict: step === variant && options.strict });

    if (!storageKey) {
      continue;
    }

    try {
      const fileUri = await loadStorageKey(userId, variant, storageKey, allowNetwork);

      if (fileUri) {
        return fileUri;
      }
    } catch {
      // Sonraki varyanta düş.
    }
  }

  return null;
}

export function prefetchRouteImages(
  variant: RouteImageVariant,
  items: Array<{
    user_id?: string | null;
    image_thumb_url?: string | null;
    image_medium_url?: string | null;
    image_url?: string | null;
  }>,
  options?: LoadRouteImageOptions,
): void {
  items.forEach((item) => {
    if (!item.user_id) {
      return;
    }

    void loadRouteImage(
      item.user_id,
      variant,
      {
        thumb: item.image_thumb_url,
        medium: item.image_medium_url,
        full: item.image_url,
      },
      options,
    );
  });
}

/** @deprecated loadRouteImage kullanın */
export async function loadMapPreviewImage(
  userId: string,
  imageThumbUrl?: string | null,
  imageUrl?: string | null,
  options: { cacheOnly?: boolean; previewOnly?: boolean } = {},
): Promise<string | null> {
  return loadRouteImage(
    userId,
    'thumb',
    { thumb: imageThumbUrl, full: imageUrl },
    { cacheOnly: options.cacheOnly, strict: options.previewOnly },
  );
}

/** @deprecated getSyncRouteImageUri kullanın */
export const getSyncMapPreviewUri = (
  userId: string,
  imageThumbUrl?: string | null,
  imageUrl?: string | null,
): string | null =>
  getSyncRouteImageUri(userId, 'thumb', { thumb: imageThumbUrl, full: imageUrl });

/** @deprecated prefetchRouteImages kullanın */
export function prefetchMapPreviewImages(
  items: Array<{
    user_id?: string | null;
    image_thumb_url?: string | null;
    image_preview_url?: string | null;
    image_url?: string | null;
  }>,
): void {
  prefetchRouteImages(
    'thumb',
    items.map((item) => ({
      user_id: item.user_id,
      image_thumb_url: item.image_thumb_url ?? item.image_preview_url,
      image_url: item.image_url,
    })),
  );
}

/** @deprecated subscribeRouteImageCache kullanın */
export const subscribeMapPreviewCache = subscribeRouteImageCache;

/** @deprecated ROUTE_IMAGE_MEMORY_CACHE_MAX kullanın */
export const MAP_PREVIEW_MEMORY_CACHE_MAX = ROUTE_IMAGE_MEMORY_CACHE_MAX;

/** @deprecated getRouteImageCacheKey kullanın */
export const getMapPreviewCacheKey = (
  userId: string,
  storageKey: string,
): string => getRouteImageCacheKey(userId, 'thumb', storageKey);

/** @deprecated peekRouteImageFromMemory kullanın */
export const peekMapPreviewFromMemory = (
  userId: string,
  storageKey: string,
): string | null => peekRouteImageFromMemory(userId, 'thumb', storageKey);

/** @deprecated getRouteImageFromMemory kullanın */
export const getMapPreviewFromMemory = (
  userId: string,
  storageKey: string,
): string | null => getRouteImageFromMemory(userId, 'thumb', storageKey);

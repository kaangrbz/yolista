const readyKeys = new Set<string>();

export const getMarkerImageKey = (
  userId: string | null | undefined,
  imageUrl: string | null | undefined,
  imageThumbUrl?: string | null | undefined,
): string | null => {
  const storageKey = imageThumbUrl || imageUrl;

  if (!userId || !storageKey) {
    return null;
  }

  return `${userId}:${storageKey}`;
};

export const isMarkerImageReady = (key: string | null): boolean => {
  if (!key) {
    return false;
  }

  return readyKeys.has(key);
};

export const markMarkerImageReady = (key: string | null): void => {
  if (key) {
    readyKeys.add(key);
  }
};

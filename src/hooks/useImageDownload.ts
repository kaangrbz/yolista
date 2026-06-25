import { useEffect, useState } from 'react';
import { ImageService } from '../services/ImageService';
import {
  getSyncRouteImageUri,
  loadRouteImage,
  subscribeRouteImageCache,
  type LoadRouteImageOptions,
} from '../utils/routeImageCache';
import type { RouteImageUrls } from '../utils/routeImage';

interface ImageDownloadState {
  imageUri: string | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export const useImageDownload = (
  imageUrl: string | undefined,
  bucketName: string,
  userId: string,
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    if (!imageUrl || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    setState({
      imageUri: null,
      loading: true,
      error: null,
      retryCount: 0,
    });

    const downloadImage = async () => {
      await ImageService.downloadImage(
        imageUrl,
        bucketName,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        },
      );
    };

    void downloadImage();
  }, [imageUrl, bucketName, userId]);

  return state;
};

const postImageMemoryCache = new Map<string, string>();

const getPostImageCacheKey = (imageUrl: string, userId: string) =>
  `${userId}:${imageUrl}`;

export const usePostImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  urls?: RouteImageUrls,
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    const storageKey =
      urls?.full || urls?.medium || urls?.thumb || imageUrl;

    if (!userId || !storageKey) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    let cancelled = false;

    const loadFromCacheOrNetwork = async (key: string): Promise<string | null> => {
      const memoryKey = getPostImageCacheKey(key, userId);
      const cachedUri = postImageMemoryCache.get(memoryKey);

      if (cachedUri) {
        return cachedUri;
      }

      const fileUri = await ImageService.loadImageWithCache(
        key,
        'routes',
        userId,
      );

      if (fileUri) {
        postImageMemoryCache.set(memoryKey, fileUri);
      }

      return fileUri;
    };

    const downloadImage = async () => {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const chain = [urls?.full, urls?.medium, urls?.thumb, imageUrl].filter(Boolean) as string[];

        for (const key of chain) {
          const uri = await loadFromCacheOrNetwork(key);

          if (cancelled) {
            return;
          }

          if (uri) {
            setState({
              imageUri: uri,
              loading: false,
              error: null,
              retryCount: 0,
            });
            return;
          }
        }

        setState({
          imageUri: null,
          loading: false,
          error: 'Failed to load image',
          retryCount: 0,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to load image';

        setState({
          imageUri: null,
          loading: false,
          error: message,
          retryCount: 0,
        });
      }
    };

    void downloadImage();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, urls?.full, urls?.medium, urls?.thumb, userId]);

  return state;
};

export const useRouteImageDownload = (
  userId: string,
  urls: RouteImageUrls,
  options: LoadRouteImageOptions = {},
) => {
  const { cacheOnly = false, strict = false } = options;
  const optionsKey = `${cacheOnly}:${strict}`;
  const variant = strict ? 'thumb' : 'medium';

  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => subscribeRouteImageCache(() => setCacheTick((value) => value + 1)), []);

  const [state, setState] = useState<ImageDownloadState>(() => {
    const cachedUri = userId
      ? getSyncRouteImageUri(userId, variant, urls, { strict })
      : null;

    const hasAnyUrl = Boolean(urls.thumb || urls.medium || urls.full);

    return {
      imageUri: cachedUri,
      loading: Boolean(userId && hasAnyUrl && !cachedUri),
      error: null,
      retryCount: 0,
    };
  });

  useEffect(() => {
    const hasAnyUrl = Boolean(urls.thumb || urls.medium || urls.full);

    if (!userId || !hasAnyUrl) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const syncUri = getSyncRouteImageUri(userId, variant, urls, { strict });

    if (syncUri) {
      setState({
        imageUri: syncUri,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    let cancelled = false;

    const resolveImage = async () => {
      setState((previous) => ({
        ...previous,
        loading: !previous.imageUri,
        error: null,
      }));

      try {
        const fileUri = await loadRouteImage(userId, variant, urls, {
          cacheOnly,
          strict,
        });

        if (cancelled) {
          return;
        }

        setState({
          imageUri: fileUri,
          loading: false,
          error: fileUri ? null : 'Failed to load image',
          retryCount: 0,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to load image';

        setState({
          imageUri: null,
          loading: false,
          error: message,
          retryCount: 0,
        });
      }
    };

    void resolveImage();

    return () => {
      cancelled = true;
    };
  }, [cacheOnly, cacheTick, optionsKey, strict, urls.full, urls.medium, urls.thumb, userId, variant]);

  return state;
};

/** @deprecated useRouteImageDownload kullanın */
export const useMapPreviewImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  imageThumbUrl?: string | undefined,
  options: LoadRouteImageOptions = {},
) =>
  useRouteImageDownload(
    userId,
    { thumb: imageThumbUrl, full: imageUrl },
    { ...options, strict: options.strict ?? true },
  );

export const useProfileImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined,
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    const storageKey = imagePreviewUrl || imageUrl;

    if (!storageKey || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      await ImageService.downloadProfileImage(
        storageKey,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        },
      );
    };

    void downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

export const useProfileBackgroundDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined,
) => {
  const [state, setState] = useState<ImageDownloadState>({
    imageUri: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    const storageKey = imagePreviewUrl || imageUrl;

    if (!storageKey || !userId) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const downloadImage = async () => {
      await ImageService.downloadProfileBackground(
        storageKey,
        userId,
        (downloadState) => {
          setState({
            imageUri: downloadState.imageUri,
            loading: downloadState.loading,
            error: downloadState.error,
            retryCount: downloadState.retryCount,
          });
        },
      );
    };

    void downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

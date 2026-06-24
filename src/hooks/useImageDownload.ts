import { useState, useEffect } from 'react';
import { ImageService } from '../services/ImageService';
import {
  getSyncMapPreviewUri,
  loadMapPreviewImage,
  subscribeMapPreviewCache,
  type LoadMapPreviewOptions,
} from '../utils/mapPreviewImageCache';

interface ImageDownloadState {
  imageUri: string | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

// Generic image download hook
export const useImageDownload = (
  imageUrl: string | undefined,
  bucketName: string,
  userId: string
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
      const result = await ImageService.downloadImage(
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
        }
      );
    };

    downloadImage();
  }, [imageUrl, bucketName, userId]);

  return state;
};

const postImageMemoryCache = new Map<string, string>();

const getPostImageCacheKey = (imageUrl: string, userId: string) =>
  `${userId}:${imageUrl}`;

// Post image download hook — prefers preview when provided; falls back to full image.
export const usePostImageDownload = (
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
    if (!userId || (!imagePreviewUrl && !imageUrl)) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    let cancelled = false;

    const loadFromCacheOrNetwork = async (storageKey: string): Promise<string | null> => {
      const memoryKey = getPostImageCacheKey(storageKey, userId);
      const cachedUri = postImageMemoryCache.get(memoryKey);

      if (cachedUri) {
        return cachedUri;
      }

      const fileUri = await ImageService.loadImageWithCache(
        storageKey,
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
        if (imagePreviewUrl) {
          const previewUri = await loadFromCacheOrNetwork(imagePreviewUrl);

          if (cancelled) {
            return;
          }

          if (previewUri) {
            setState({
              imageUri: previewUri,
              loading: false,
              error: null,
              retryCount: 0,
            });
            return;
          }
        }

        if (imageUrl) {
          const fullUri = await loadFromCacheOrNetwork(imageUrl);

          if (cancelled) {
            return;
          }

          setState({
            imageUri: fullUri,
            loading: false,
            error: fullUri ? null : 'Failed to load image',
            retryCount: 0,
          });
          return;
        }

        setState({
          imageUri: null,
          loading: false,
          error: null,
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
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

/** Harita 128×128 preview — bellek + disk önbelleği; bottom sheet için cacheOnly/previewOnly. */
export const useMapPreviewImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined,
  options: LoadMapPreviewOptions = {},
) => {
  const { cacheOnly = false, previewOnly = false } = options;
  const optionsKey = `${cacheOnly}:${previewOnly}`;

  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => subscribeMapPreviewCache(() => setCacheTick((value) => value + 1)), []);

  const [state, setState] = useState<ImageDownloadState>(() => {
    const cachedUri =
      userId && (imagePreviewUrl || imageUrl)
        ? getSyncMapPreviewUri(userId, imagePreviewUrl, imageUrl)
        : null;

    return {
      imageUri: cachedUri,
      loading: Boolean(userId && (imagePreviewUrl || imageUrl) && !cachedUri),
      error: null,
      retryCount: 0,
    };
  });

  useEffect(() => {
    if (!userId || (!imagePreviewUrl && !imageUrl)) {
      setState({
        imageUri: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    const syncUri = getSyncMapPreviewUri(userId, imagePreviewUrl, imageUrl);

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
        const fileUri = await loadMapPreviewImage(
          userId,
          imagePreviewUrl,
          imageUrl,
          { cacheOnly, previewOnly },
        );

        if (cancelled) {
          return;
        }

        setState({
          imageUri: fileUri,
          loading: false,
          error: fileUri ? null : 'Failed to load preview',
          retryCount: 0,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to load preview';

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
  }, [cacheOnly, cacheTick, imagePreviewUrl, imageUrl, optionsKey, previewOnly, userId]);

  return state;
};

// Profile image download hook (prefers preview path when provided)
export const useProfileImageDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined
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
        }
      );
    };

    downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

// Profile background image download hook (prefers preview path when provided)
export const useProfileBackgroundDownload = (
  imageUrl: string | undefined,
  userId: string,
  imagePreviewUrl?: string | undefined
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
        }
      );
    };

    downloadImage();
  }, [imageUrl, imagePreviewUrl, userId]);

  return state;
};

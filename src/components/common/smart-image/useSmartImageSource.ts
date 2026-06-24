import { useEffect, useState } from 'react';
import { ImageService } from '../../../services/ImageService';
import {
  getSyncMapPreviewUri,
  loadMapPreviewImage,
} from '../../../utils/mapPreviewImageCache';
import type { SmartImageKind, SmartImageSourceState } from './types';

const LOAD_TIMEOUT_MS = 12_000;

interface UseSmartImageSourceOptions {
  kind: SmartImageKind;
  userId: string;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  cacheOnly?: boolean;
  previewOnly?: boolean;
  downloadEnabled?: boolean;
  resolvedUri?: string | null;
}

export function useSmartImageSource({
  kind,
  userId,
  imageUrl,
  imagePreviewUrl,
  cacheOnly = false,
  previewOnly = false,
  downloadEnabled = true,
  resolvedUri,
}: UseSmartImageSourceOptions): SmartImageSourceState {
  const [state, setState] = useState<SmartImageSourceState>(() => {
    if (resolvedUri) {
      return { imageUri: resolvedUri, loading: false, error: null };
    }

    if (kind === 'routePreview' && userId) {
      const cached = getSyncMapPreviewUri(userId, imagePreviewUrl, imageUrl);

      return {
        imageUri: cached,
        loading: Boolean(!cached && userId && (imagePreviewUrl || imageUrl)),
        error: null,
      };
    }

    return {
      imageUri: null,
      loading: Boolean(userId && (imagePreviewUrl || imageUrl)),
      error: null,
    };
  });

  useEffect(() => {
    if (resolvedUri) {
      setState({ imageUri: resolvedUri, loading: false, error: null });
      return;
    }

    const allowNetwork = downloadEnabled && !cacheOnly;

    if (kind === 'user' && !imagePreviewUrl && !imageUrl) {
      setState({ imageUri: null, loading: false, error: null });
      return;
    }

    if (!userId || (!imagePreviewUrl && !imageUrl)) {
      setState({ imageUri: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const clearLoadTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const startLoadTimeout = () => {
      clearLoadTimeout();
      timeoutId = setTimeout(() => {
        if (cancelled) {
          return;
        }

        setState((previous) => {
          if (!previous.loading || previous.imageUri) {
            return previous;
          }

          return {
            imageUri: null,
            loading: false,
            error: 'Failed to load image',
          };
        });
      }, LOAD_TIMEOUT_MS);
    };

    const resolve = async () => {
      if (kind === 'routePreview') {
        const syncUri = getSyncMapPreviewUri(userId, imagePreviewUrl, imageUrl);

        if (syncUri) {
          if (!cancelled) {
            setState({ imageUri: syncUri, loading: false, error: null });
          }

          return;
        }

        setState((previous) => ({
          ...previous,
          loading: !previous.imageUri,
          error: null,
        }));
        startLoadTimeout();

        const fileUri = await loadMapPreviewImage(
          userId,
          imagePreviewUrl,
          imageUrl,
          { cacheOnly: !allowNetwork, previewOnly },
        );

        if (!cancelled) {
          clearLoadTimeout();
          setState({
            imageUri: fileUri,
            loading: false,
            error: fileUri ? null : 'Failed to load image',
          });
        }

        return;
      }

      const bucketName =
        kind === 'header' ? 'headers' : kind === 'user' ? 'profiles' : 'routes';
      const primaryKey = imagePreviewUrl || imageUrl;

      if (!primaryKey) {
        if (!cancelled) {
          clearLoadTimeout();
          setState({ imageUri: null, loading: false, error: null });
        }

        return;
      }

      setState((previous) => ({
        ...previous,
        loading: !previous.imageUri,
        error: null,
      }));
      startLoadTimeout();

      const cachedUri = await ImageService.getCachedImageUri(
        primaryKey,
        bucketName,
        userId,
      );

      if (cancelled) {
        return;
      }

      if (cachedUri) {
        clearLoadTimeout();
        setState({ imageUri: cachedUri, loading: false, error: null });
        return;
      }

      if (!allowNetwork) {
        clearLoadTimeout();
        setState({ imageUri: null, loading: false, error: null });
        return;
      }

      const download =
        kind === 'user'
          ? ImageService.downloadProfileImage(primaryKey, userId)
          : kind === 'header'
            ? ImageService.downloadImage(primaryKey, 'headers', userId)
            : ImageService.downloadPostImage(primaryKey, userId);

      const fileUri = await download;

      if (!cancelled) {
        clearLoadTimeout();
        setState({
          imageUri: fileUri,
          loading: false,
          error: fileUri ? null : 'Failed to load image',
        });
      }
    };

    if (!resolvedUri && userId && (imagePreviewUrl || imageUrl)) {
      startLoadTimeout();
    }

    void resolve();

    return () => {
      cancelled = true;
      clearLoadTimeout();
    };
  }, [
    cacheOnly,
    downloadEnabled,
    imagePreviewUrl,
    imageUrl,
    kind,
    previewOnly,
    resolvedUri,
    userId,
  ]);

  return state;
}

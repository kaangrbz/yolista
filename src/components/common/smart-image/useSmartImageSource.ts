import { useEffect, useState } from 'react';
import { ImageService } from '../../../services/ImageService';
import {
  getSyncRouteImageUri,
  loadRouteImage,
} from '../../../utils/routeImageCache';
import { resolveRouteImagePath } from '../../../utils/routeImage';
import type { SmartImageKind, SmartImageSourceState } from './types';
import type { RouteImageVariant } from '../../../utils/routeImage';

const LOAD_TIMEOUT_MS = 12_000;

interface UseSmartImageSourceOptions {
  kind: SmartImageKind;
  userId: string;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  imageMediumUrl?: string | null;
  imagePreviewUrl?: string | null;
  variant?: RouteImageVariant;
  cacheOnly?: boolean;
  strictVariant?: boolean;
  downloadEnabled?: boolean;
  resolvedUri?: string | null;
}

export function useSmartImageSource({
  kind,
  userId,
  imageUrl,
  imageThumbUrl,
  imageMediumUrl,
  imagePreviewUrl,
  variant = 'medium',
  cacheOnly = false,
  strictVariant = false,
  downloadEnabled = true,
  resolvedUri,
}: UseSmartImageSourceOptions): SmartImageSourceState {
  const routeUrls = {
    thumb: imageThumbUrl,
    medium: imageMediumUrl,
    full: imageUrl,
  };

  const [state, setState] = useState<SmartImageSourceState>(() => {
    if (resolvedUri) {
      return { imageUri: resolvedUri, loading: false, error: null };
    }

    if (kind === 'route' && userId) {
      const cached = getSyncRouteImageUri(userId, variant, routeUrls, {
        strict: strictVariant,
      });

      const hasAnyUrl = Boolean(imageThumbUrl || imageMediumUrl || imageUrl);

      return {
        imageUri: cached,
        loading: Boolean(!cached && hasAnyUrl),
        error: null,
      };
    }

    const hasProfileUrl = Boolean(imagePreviewUrl || imageUrl);

    return {
      imageUri: null,
      loading: Boolean(kind !== 'route' && userId && hasProfileUrl),
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

    if (kind === 'route' && !userId) {
      setState({ imageUri: null, loading: false, error: null });
      return;
    }

    if (kind === 'route' && !imageThumbUrl && !imageMediumUrl && !imageUrl) {
      setState({ imageUri: null, loading: false, error: null });
      return;
    }

    if (kind !== 'route' && (!userId || (!imagePreviewUrl && !imageUrl))) {
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
      if (kind === 'route') {
        const syncUri = getSyncRouteImageUri(userId, variant, routeUrls, {
          strict: strictVariant,
        });

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

        const fileUri = await loadRouteImage(userId, variant, routeUrls, {
          cacheOnly: !allowNetwork,
          strict: strictVariant,
        });

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

      const bucketName = kind === 'header' ? 'headers' : 'profiles';
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
          : ImageService.downloadImage(primaryKey, 'headers', userId);

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

    const hasRouteUrls = Boolean(imageThumbUrl || imageMediumUrl || imageUrl);
    const hasProfileUrls = Boolean(imagePreviewUrl || imageUrl);

    if (!resolvedUri && userId && (kind === 'route' ? hasRouteUrls : hasProfileUrls)) {
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
    imageMediumUrl,
    imagePreviewUrl,
    imageThumbUrl,
    imageUrl,
    kind,
    resolvedUri,
    strictVariant,
    userId,
    variant,
  ]);

  return state;
}

export function getRouteStorageKeyForVariant(
  variant: RouteImageVariant,
  urls: {
    thumb?: string | null;
    medium?: string | null;
    full?: string | null;
  },
  strict = false,
): string | null {
  return resolveRouteImagePath(variant, urls, { strict });
}

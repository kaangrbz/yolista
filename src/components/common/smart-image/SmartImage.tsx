import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  TouchableOpacity,
  View,
  type ImageStyle,
  type StyleProp,
  type DimensionValue,
} from 'react-native';
import { DefaultAvatar, NoImage } from '../../../assets';
import UserImageSkeleton from './UserImageSkeleton';
import RouteImageSkeleton from './RouteImageSkeleton';
import { useSmartImageSource } from './useSmartImageSource';
import type { SmartImageProps } from './types';
import { useAppTheme } from '../../../context/AppThemeContext';

const IMAGE_RENDER_TIMEOUT_MS = 12_000;

const SmartImage: React.FC<SmartImageProps> = ({
  kind,
  userId,
  imageUrl,
  imageThumbUrl,
  imageMediumUrl,
  imagePreviewUrl,
  variant = 'medium',
  style,
  width,
  height,
  borderRadius,
  resizeMode = 'cover',
  cacheOnly = false,
  strictVariant = false,
  downloadEnabled = true,
  resolvedUri,
  fallbackSource,
  onPress,
  onLoad,
  onError,
  accessibilityLabel,
  backgroundColor,
}) => {
  const theme = useAppTheme();
  const { imageUri, loading, error } = useSmartImageSource({
    kind,
    userId,
    imageUrl,
    imageThumbUrl,
    imageMediumUrl,
    imagePreviewUrl,
    variant,
    cacheOnly,
    strictVariant,
    downloadEnabled,
    resolvedUri,
  });

  const [renderError, setRenderError] = useState(false);
  const [renderTimedOut, setRenderTimedOut] = useState(false);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRenderError(false);
    setRenderTimedOut(false);

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
  }, [imageUri, imageUrl, imageThumbUrl, imageMediumUrl, imagePreviewUrl, resolvedUri]);

  useEffect(() => {
    if (!imageUri || renderError || renderTimedOut || error) {
      return;
    }

    renderTimeoutRef.current = setTimeout(() => {
      setRenderTimedOut(true);
    }, IMAGE_RENDER_TIMEOUT_MS);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [error, imageUri, renderError, renderTimedOut]);

  const handleImageLoad = () => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    setRenderTimedOut(false);
    onLoad?.();
  };

  const flatStyle = style as StyleProp<ImageStyle>;
  const resolvedWidth = (width ?? (flatStyle as ImageStyle)?.width) as DimensionValue | undefined;
  const resolvedHeight = (height ?? (flatStyle as ImageStyle)?.height) as DimensionValue | undefined;
  const resolvedRadius =
    borderRadius ??
    (kind === 'user' &&
    typeof resolvedWidth === 'number' &&
    typeof resolvedHeight === 'number' &&
    resolvedWidth === resolvedHeight
      ? resolvedWidth / 2
      : 0);

  const defaultFallback =
    kind === 'user' ? DefaultAvatar : kind === 'header' ? undefined : NoImage;
  const fallback = fallbackSource ?? defaultFallback;
  const shouldShowFallback =
    renderError ||
    renderTimedOut ||
    Boolean(error) ||
    (!loading && !imageUri);

  const containerStyle = {
    width: resolvedWidth,
    height: resolvedHeight,
    borderRadius: resolvedRadius,
    overflow: 'hidden' as const,
    backgroundColor: backgroundColor ?? theme.surfaceMuted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const renderContent = () => {
    if (loading && !imageUri && !shouldShowFallback) {
      if (kind === 'user') {
        return (
          <UserImageSkeleton
            width={typeof resolvedWidth === 'number' ? resolvedWidth : 40}
            height={typeof resolvedHeight === 'number' ? resolvedHeight : 40}
            borderRadius={resolvedRadius}
          />
        );
      }

      return (
        <RouteImageSkeleton
          width={resolvedWidth ?? '100%'}
          height={resolvedHeight ?? '100%'}
          borderRadius={resolvedRadius}
        />
      );
    }

    if (imageUri && !shouldShowFallback) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={[{ width: resolvedWidth, height: resolvedHeight, borderRadius: resolvedRadius }, flatStyle]}
          resizeMode={resizeMode}
          onLoad={handleImageLoad}
          onError={() => {
            if (renderTimeoutRef.current) {
              clearTimeout(renderTimeoutRef.current);
              renderTimeoutRef.current = null;
            }

            setRenderError(true);
            onError?.();
          }}
          accessibilityLabel={accessibilityLabel}
        />
      );
    }

    if (shouldShowFallback) {
      if (kind === 'user' && fallback) {
        return (
          <Image
            source={fallback}
            style={[
              {
                width: resolvedWidth,
                height: resolvedHeight,
                borderRadius: resolvedRadius,
              },
              flatStyle,
            ]}
            resizeMode="cover"
            accessibilityLabel={accessibilityLabel ?? 'Görsel yok'}
          />
        );
      }

      if ((kind === 'route' || kind === 'header') && fallback) {
        const fallbackSize =
          typeof resolvedWidth === 'number' && typeof resolvedHeight === 'number'
            ? Math.round(Math.min(resolvedWidth, resolvedHeight) * 0.35)
            : 96;

        return (
          <Image
            source={fallback}
            style={{
              width: fallbackSize,
              height: fallbackSize,
              borderRadius: resolvedRadius,
            }}
            resizeMode="contain"
            accessibilityLabel={accessibilityLabel ?? 'Görsel yok'}
          />
        );
      }

      if (kind === 'route' || kind === 'header') {
        return (
          <RouteImageSkeleton
            width={resolvedWidth ?? '100%'}
            height={resolvedHeight ?? '100%'}
            borderRadius={resolvedRadius}
          />
        );
      }

      if (fallback) {
        const fallbackSize =
          typeof resolvedWidth === 'number' && typeof resolvedHeight === 'number'
            ? Math.round(Math.min(resolvedWidth, resolvedHeight) * 0.35)
            : 96;

        return (
          <Image
            source={fallback}
            style={{
              width: fallbackSize,
              height: fallbackSize,
              borderRadius: resolvedRadius,
            }}
            resizeMode="contain"
            accessibilityLabel={accessibilityLabel ?? 'Görsel yok'}
          />
        );
      }

      return (
        <RouteImageSkeleton
          width={resolvedWidth ?? '100%'}
          height={resolvedHeight ?? '100%'}
          borderRadius={resolvedRadius}
        />
      );
    }

    return (
      <RouteImageSkeleton
        width={resolvedWidth ?? '100%'}
        height={resolvedHeight ?? '100%'}
        borderRadius={resolvedRadius}
      />
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
        <View style={containerStyle}>{renderContent()}</View>
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{renderContent()}</View>;
};

export default SmartImage;

export { UserImageSkeleton, RouteImageSkeleton };

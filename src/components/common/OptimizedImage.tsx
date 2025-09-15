import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { EnhancedImageService } from '../../services/EnhancedImageService';
import SimpleSkeletonLoader from './SimpleSkeletonLoader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onPress?: () => void;
  showRetryButton?: boolean;
  bucketName?: string;
  userId?: string;
  fallbackSource?: { uri: string } | number;
  lazy?: boolean;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: string) => void;
  priority?: 'high' | 'normal' | 'low';
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  style,
  resizeMode = 'cover',
  onPress,
  showRetryButton = true,
  bucketName,
  userId,
  fallbackSource,
  lazy = false,
  placeholder,
  onLoad,
  onError,
  priority = 'normal',
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [progress, setProgress] = useState(0);

  const loadImage = useCallback(async () => {
    if (typeof source === 'number') {
      // Local image
      setImageUri(null);
      setLoading(false);
      setError(null);
      onLoad?.();
      return;
    }

    if (typeof source !== 'object' || !('uri' in source) || !source.uri) {
      const errorMsg = 'No image URL provided';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // If it's a network image (not from our storage), use it directly
    if (!bucketName || !userId || !source.uri.includes('supabase')) {
      setImageUri(source.uri);
      setLoading(false);
      setError(null);
      onLoad?.();
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const cachedUri = await EnhancedImageService.loadImageWithCache(
        source.uri,
        bucketName,
        userId,
        (state) => {
          setLoading(state.loading);
          setError(state.error);
          setRetryCount(state.retryCount);
          setProgress(state.progress || 0);
        }
      );

      if (cachedUri) {
        setImageUri(cachedUri);
        setError(null);
        onLoad?.();
      } else {
        const errorMsg = 'Failed to load image';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Error loading image';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('OptimizedImage error:', err);
    } finally {
      setLoading(false);
    }
  }, [source, bucketName, userId, onLoad, onError]);

  useEffect(() => {
    if (shouldLoad) {
      // Delay loading based on priority
      const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 300;
      const timer = setTimeout(loadImage, delay);
      return () => clearTimeout(timer);
    }
  }, [shouldLoad, loadImage, priority]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setProgress(0);
    loadImage();
  }, [loadImage]);

  const handleLazyLoad = useCallback(() => {
    if (lazy && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [lazy, shouldLoad]);

  const renderContent = () => {
    // Lazy loading placeholder
    if (lazy && !shouldLoad) {
      return (
        <TouchableOpacity
          style={[style, styles.lazyContainer]}
          onPress={handleLazyLoad}
          activeOpacity={0.8}
        >
          {placeholder || (
            <View style={styles.lazyPlaceholder}>
              <Icon name="image-outline" size={24} color="#ccc" />
              <Text style={styles.lazyText}>Resmi yükle</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Loading state
    if (loading) {
      return (
        <View style={style}>
          <SimpleSkeletonLoader style={style} />
          {progress > 0 && progress < 100 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          )}
        </View>
      );
    }

    // Error state with retry
    if (error && showRetryButton) {
      return (
        <View style={[style, styles.errorContainer]}>
          <Icon name="image-broken-variant" size={24} color="#999" />
          <Text style={styles.errorText}>Resim yüklenemedi</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Error state with fallback
    if (error && fallbackSource) {
      return (
        <Image
          source={fallbackSource}
          style={style}
          resizeMode={resizeMode}
        />
      );
    }

    // Success state
    if (imageUri || typeof source === 'number') {
      return (
        <Image
          source={imageUri ? { uri: imageUri } : source}
          style={style}
          resizeMode={resizeMode}
          onError={() => {
            const errorMsg = 'Image load failed';
            setError(errorMsg);
            onError?.(errorMsg);
          }}
          onLoad={onLoad}
        />
      );
    }

    // Default loading state
    return <SimpleSkeletonLoader style={style} />;
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
});

const styles = StyleSheet.create({
  lazyContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  lazyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lazyText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1DA1F2',
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

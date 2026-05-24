import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Pressable } from 'react-native';
import { ImageService } from '../../services/ImageService';
import SimpleSkeletonLoader from './SimpleSkeletonLoader';

interface CachedImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onPress?: () => void;
  showRetryButton?: boolean;
  /** true: hata durumunda metin gösterme, sadece boş placeholder */
  suppressErrorText?: boolean;
  bucketName?: string;
  userId?: string;
  fallbackSource?: { uri: string } | number;
}

const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  onPress,
  showRetryButton = true,
  suppressErrorText = false,
  bucketName,
  userId,
  fallbackSource,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadImage = async () => {
    if (typeof source === 'number') {
      // Local image
      setImageUri(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (typeof source !== 'object' || !('uri' in source) || !source.uri) {
      setError('No image URL provided');
      return;
    }

    // If it's a network image (not from our storage), use it directly
    if (!bucketName || !userId || !source.uri.includes('supabase')) {
      setImageUri(source.uri);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cachedUri = await ImageService.loadImageWithCache(
        source.uri,
        bucketName,
        userId,
        (state) => {
          setLoading(state.loading);
          setError(state.error);
          setRetryCount(state.retryCount);
        }
      );

      if (cachedUri) {
        setImageUri(cachedUri);
        setError(null);
      } else {
        setError('Failed to load image');
      }
    } catch (err) {
      setError('Error loading image');
      console.error('CachedImage error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImage();
  }, [source, bucketName, userId]);

  const handleRetry = () => {
    setRetryCount(0);
    loadImage();
  };

  const renderContent = () => {
    if (loading) {
      return <SimpleSkeletonLoader style={style} />;
    }

    if (error && fallbackSource) {
      return (
        <Image
          source={fallbackSource}
          style={style}
          resizeMode={resizeMode}
        />
      );
    }

    if (error && suppressErrorText) {
      if (showRetryButton) {
        return (
          <Pressable
            style={({ pressed }) => [
              style,
              styles.errorPlaceholder,
              pressed && styles.errorPressed,
            ]}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Tekrar dene"
          />
        );
      }

      return <View style={[style, styles.errorPlaceholder]} />;
    }

    if (error && showRetryButton) {
      return (
        <Pressable
          style={({ pressed }) => [
            style,
            styles.errorContainer,
            pressed && styles.errorPressed,
          ]}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.errorText}>Resim yüklenemedi</Text>
          <Text style={styles.errorText}>Tekrar dene</Text>
        </Pressable>
      );
    }

    if (error) {
      return (
        <View style={[style, styles.errorContainer]}>
          <Text style={styles.errorText}>Resim yüklenemedi</Text>
        </View>
      );
    }

    if (imageUri || typeof source === 'number') {
      return (
        <Image
          source={imageUri ? { uri: imageUri } : source}
          style={style}
          resizeMode={resizeMode}
          onError={() => setError('Image load failed')}
        />
      );
    }

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
};

const styles = StyleSheet.create({
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderRadius: 8,
  },
  errorPlaceholder: {
    backgroundColor: '#e8e8e8',
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  errorPressed: {
    opacity: 0.88,
  },
});

export default CachedImage;

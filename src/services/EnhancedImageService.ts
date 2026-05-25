import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

interface CachedImage {
  localPath: string;
  timestamp: number;
  expiresAt: number;
  size: number;
}

interface ImageLoadState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  progress?: number;
}

export class EnhancedImageService {
  private static cache = new Map<string, CachedImage>();
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 gün
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  private static readonly CACHE_DIR = `${RNFS.CachesDirectoryPath}/images`;

  // Cache initialization with file system
  static async initializeCache(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      const dirExists = await RNFS.exists(this.CACHE_DIR);
      if (!dirExists) {
        await RNFS.mkdir(this.CACHE_DIR);
      }

      // Load cache metadata
      const cachedData = await AsyncStorage.getItem('enhanced_image_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsed));
        await this.cleanExpiredCache();
        await this.enforceMaxCacheSize();
      }
    } catch (error) {
      console.error('Error initializing enhanced image cache:', error);
    }
  }

  // Save cache metadata to AsyncStorage
  static async saveCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('enhanced_image_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving enhanced image cache:', error);
    }
  }

  // Clean expired cache files
  static async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        expiredKeys.push(key);
        // Delete file from filesystem
        try {
          const fileExists = await RNFS.exists(value.localPath);
          if (fileExists) {
            await RNFS.unlink(value.localPath);
          }
        } catch (error) {
          console.warn('Error deleting expired cache file:', error);
        }
      }
    }

    // Remove from cache map
    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      await this.saveCache();
    }
  }

  // Enforce maximum cache size (LRU eviction)
  static async enforceMaxCacheSize(): Promise<void> {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);

    if (totalSize > this.MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first)
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);

      let currentSize = totalSize;
      const targetSize = this.MAX_CACHE_SIZE * 0.8; // Remove until 80% of max size

      for (const [key, value] of sortedEntries) {
        if (currentSize <= targetSize) {break;}

        try {
          const fileExists = await RNFS.exists(value.localPath);
          if (fileExists) {
            await RNFS.unlink(value.localPath);
          }
          this.cache.delete(key);
          currentSize -= value.size;
        } catch (error) {
          console.warn('Error removing cache file during size enforcement:', error);
        }
      }

      await this.saveCache();
    }
  }

  // Enhanced image loading with file system cache
  static async loadImageWithCache(
    imageUrl: string,
    bucketName: string,
    userId: string,
    onStateChange?: (state: ImageLoadState) => void
  ): Promise<string | null> {
    const cacheKey = `${bucketName}/${userId}/${imageUrl}`;
    const fileName = this.generateFileName(imageUrl);
    const localPath = `${this.CACHE_DIR}/${fileName}`;

    try {
      // Check memory cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        const fileExists = await RNFS.exists(cached.localPath);
        if (fileExists) {
          return `file://${cached.localPath}`;
        } else {
          // File missing, remove from cache
          this.cache.delete(cacheKey);
        }
      }

      // Load with retry mechanism
      return await this.loadImageWithRetry(
        imageUrl,
        bucketName,
        userId,
        cacheKey,
        localPath,
        onStateChange
      );
    } catch (error) {
      console.error('Error in loadImageWithCache:', error);
      onStateChange?.({ loading: false, error: 'Resim yüklenemedi', retryCount: 0 });
      return null;
    }
  }

  // Load image with retry and progress tracking
  private static async loadImageWithRetry(
    imageUrl: string,
    bucketName: string,
    userId: string,
    cacheKey: string,
    localPath: string,
    onStateChange?: (state: ImageLoadState) => void,
    retryCount = 0
  ): Promise<string | null> {
    try {
      onStateChange?.({ loading: true, error: null, retryCount, progress: 0 });

      // Download from Supabase
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(`${userId}/${imageUrl}`);

      if (error) {throw error;}

      // Convert blob to array buffer and save to file
      const arrayBuffer = await data.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      // Save to file system
      await RNFS.writeFile(localPath, base64Data, 'base64');

      // Get file stats for cache management
      const fileStats = await RNFS.stat(localPath);

      // Update cache
      this.cache.set(cacheKey, {
        localPath,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION,
        size: fileStats.size,
      });

      await this.saveCache();
      await this.enforceMaxCacheSize();

      onStateChange?.({ loading: false, error: null, retryCount, progress: 100 });
      return `file://${localPath}`;

    } catch (error) {
      console.error(`Error loading image (attempt ${retryCount + 1}):`, error);

      if (retryCount < this.MAX_RETRIES) {
        onStateChange?.({
          loading: true,
          error: `Tekrar deneniyor... (${retryCount + 1}/${this.MAX_RETRIES})`,
          retryCount: retryCount + 1,
        });

        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), this.RETRY_DELAY * (retryCount + 1)),
        );

        return this.loadImageWithRetry(
          imageUrl,
          bucketName,
          userId,
          cacheKey,
          localPath,
          onStateChange,
          retryCount + 1
        );
      } else {
        onStateChange?.({
          loading: false,
          error: 'Resim yüklenemedi',
          retryCount,
        });
        return null;
      }
    }
  }

  // Generate unique filename for cache
  private static generateFileName(imageUrl: string): string {
    const hash = imageUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const extension = imageUrl.split('.').pop() || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  }

  // Preload images for better UX
  static async preloadImages(imageUrls: string[], bucketName: string, userId: string): Promise<void> {
    const preloadPromises = imageUrls.slice(0, 5).map(url => // Preload first 5 images
      this.loadImageWithCache(url, bucketName, userId)
        .catch(error => console.warn('Preload failed for:', url, error))
    );

    await Promise.allSettled(preloadPromises);
  }

  // Clear all cache
  static async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      const dirExists = await RNFS.exists(this.CACHE_DIR);
      if (dirExists) {
        await RNFS.unlink(this.CACHE_DIR);
        await RNFS.mkdir(this.CACHE_DIR);
      }

      // Clear memory cache
      this.cache.clear();

      // Clear AsyncStorage
      await AsyncStorage.removeItem('enhanced_image_cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache statistics
  static async getCacheStats(): Promise<{size: number, count: number, oldestItem: number}> {
    const items = Array.from(this.cache.values());
    const size = items.reduce((sum, item) => sum + item.size, 0);
    const count = items.length;
    const oldestItem = items.length > 0
      ? Math.min(...items.map(item => item.timestamp))
      : Date.now();

    return { size, count, oldestItem };
  }
}

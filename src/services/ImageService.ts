import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedImage {
  uri: string;
  timestamp: number;
  expiresAt: number;
}

interface ImageLoadState {
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export class ImageService {
  private static cache = new Map<string, CachedImage>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  // Cache management
  static async initializeCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('image_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsed));
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.error('Error initializing image cache:', error);
    }
  }

  static async saveCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('image_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving image cache:', error);
    }
  }

  static cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Enhanced image loading with caching and retry
  static async loadImageWithCache(
    imageUrl: string, 
    bucketName: string, 
    userId: string,
    onStateChange?: (state: ImageLoadState) => void
  ): Promise<string | null> {
    const cacheKey = `${bucketName}/${userId}/${imageUrl}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.uri;
    }

    // Load with retry mechanism
    return this.loadImageWithRetry(imageUrl, bucketName, userId, cacheKey, onStateChange);
  }

  private static async loadImageWithRetry(
    imageUrl: string,
    bucketName: string,
    userId: string,
    cacheKey: string,
    onStateChange?: (state: ImageLoadState) => void,
    retryCount = 0
  ): Promise<string | null> {
    try {
      onStateChange?.({ loading: true, error: null, retryCount });

      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(`${userId}/${imageUrl}`);

      if (error) throw error;

      const reader = new FileReader();
      const uri = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });

      // Cache the result
      this.cache.set(cacheKey, {
        uri,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      });

      await this.saveCache();
      onStateChange?.({ loading: false, error: null, retryCount });

      return uri;
    } catch (error) {
      console.error(`Error loading image (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.MAX_RETRIES) {
        onStateChange?.({ 
          loading: false, 
          error: `Retrying... (${retryCount + 1}/${this.MAX_RETRIES})`, 
          retryCount: retryCount + 1 
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
        
        return this.loadImageWithRetry(imageUrl, bucketName, userId, cacheKey, onStateChange, retryCount + 1);
      } else {
        onStateChange?.({ 
          loading: false, 
          error: 'Failed to load image after multiple attempts', 
          retryCount 
        });
        return null;
      }
    }
  }

  // Mock images with caching for posts
  static async getPostImages(postId: string, userId: string): Promise<string[]> {
    try {
      const cacheKey = `post_images_${postId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiresAt) {
        return JSON.parse(cached.uri);
      }

      // Generate mock images
      const mockImages = [
        'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
        'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
        'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
        'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
        'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
      ];
      
      // Cache the result
      this.cache.set(cacheKey, {
        uri: JSON.stringify(mockImages),
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      });

      await this.saveCache();
      return mockImages;
    } catch (error) {
      console.error('Error getting post images:', error);
      return [];
    }
  }

  static async uploadImage(imageUri: string, userId: string, postId: string): Promise<string | null> {
    try {
      // Image upload logic will be implemented here
      console.log('Uploading image:', { imageUri, userId, postId });
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Image deletion logic will be implemented here
      console.log('Deleting image:', imageUrl);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  // Clear cache
  static async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('image_cache');
  }

  // Get cache size
  static getCacheSize(): number {
    return this.cache.size;
  }
}

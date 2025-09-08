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

  // Get multiple post images for a route (deprecated - use useImages hook instead)
  static async getPostImages(postId: string, userId: string): Promise<string[]> {
    console.warn('getPostImages is deprecated. Use useImages hook instead.');
    return [];
  }

  // Generic download image helper - best practice implementation
  static async downloadImage(
    imageUrl: string | undefined,
    bucketName: string,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    if (!imageUrl) {
      onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: null });
      return null;
    }

    const cacheKey = `${bucketName}/${userId}/${imageUrl}`;
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: cached.uri });
        return cached.uri;
      }

      onStateChange?.({ loading: true, error: null, retryCount: 0, imageUri: null });

      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(`${userId}/${imageUrl}`);

      if (error) throw error;

      // Convert Blob to Base64
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
      onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: uri });

      return uri;
    } catch (error) {
      console.error('Error downloading image:', error);
      onStateChange?.({ 
        loading: false, 
        error: 'Resim yüklenirken bir hata oluştu', 
        retryCount: 0, 
        imageUri: null 
      });
      return null;
    }
  }

  // Post image download helper
  static async downloadPostImage(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'routes', userId, onStateChange);
  }

  // Profile image download helper
  static async downloadProfileImage(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'profiles', userId, onStateChange);
  }

  // Profile background image download helper
  static async downloadProfileBackground(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'profiles', userId, onStateChange);
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { CacheManager } from './CacheManager';

interface ImageLoadState {
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export class ImageService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  private static readonly SUPABASE_OBJECT_PATH = '/storage/v1/object/';
  private static readonly LEGACY_ASYNC_STORAGE_KEY = 'image_cache';

  private static toLoggableError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.parse(JSON.stringify(error));
      } catch (serializationError) {
        return {
          message: 'Unserializable error object',
          serializationError: String(serializationError),
        };
      }
    }

    return {
      message: String(error),
    };
  }

  /** Harici CDN / admin JSON import — Supabase indirmesi yok, URI doğrudan kullanılır. */
  private static isExternalHttpImageUrl(imageUrl: string): boolean {
    const trimmed = imageUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return false;
    }

    return this.extractPathFromSupabaseUrl(trimmed, 'routes') === null
      && this.extractPathFromSupabaseUrl(trimmed, 'profiles') === null;
  }

  private static extractPathFromSupabaseUrl(imageUrl: string, bucketName: string): string | null {
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return null;
    }

    const marker = `${this.SUPABASE_OBJECT_PATH}${bucketName}/`;
    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const rawPath = imageUrl.slice(markerIndex + marker.length);
    const queryIndex = rawPath.indexOf('?');
    const pathWithoutQuery = queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex);

    if (!pathWithoutQuery) {
      return null;
    }

    return decodeURIComponent(pathWithoutQuery);
  }

  /**
   * Depolama nesnesi yolu + bucket ile benzersiz anahtar; önizleme ve tam resim farklı path’lerde olduğu için ayrı önbelleklenir.
   */
  private static buildDiskCacheKey(bucketName: string, imageUrl: string, userId: string): string {
    const pathFromUrl = this.extractPathFromSupabaseUrl(imageUrl, bucketName);

    if (pathFromUrl) {
      return `${bucketName}:${pathFromUrl}`;
    }

    const normalizedImageUrl = imageUrl.trim();

    if (!normalizedImageUrl) {
      return `${bucketName}:${userId}:empty`;
    }

    if (normalizedImageUrl.startsWith(`${userId}/`)) {
      return `${bucketName}:${normalizedImageUrl}`;
    }

    if (
      normalizedImageUrl.includes('/')
      && !normalizedImageUrl.startsWith('http://')
      && !normalizedImageUrl.startsWith('https://')
    ) {
      return `${bucketName}:${normalizedImageUrl}`;
    }

    return `${bucketName}:${userId}:${normalizedImageUrl}`;
  }

  private static inferExtensionFromUrl(url: string): string {
    const lower = url.toLowerCase();
    const match = lower.match(/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i);

    if (match) {
      return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    }

    return 'jpg';
  }

  private static getCandidatePaths(imageUrl: string, userId: string, bucketName: string): string[] {
    const normalizedImageUrl = imageUrl.trim();

    if (!normalizedImageUrl) {
      return [];
    }

    const candidatePaths = new Set<string>();
    const pathFromUrl = this.extractPathFromSupabaseUrl(normalizedImageUrl, bucketName);

    if (pathFromUrl) {
      candidatePaths.add(pathFromUrl);
    }

    if (normalizedImageUrl.startsWith(`${userId}/`)) {
      candidatePaths.add(normalizedImageUrl);
    }

    if (
      normalizedImageUrl.includes('/')
      && !normalizedImageUrl.startsWith('http://')
      && !normalizedImageUrl.startsWith('https://')
    ) {
      candidatePaths.add(normalizedImageUrl);
    }

    candidatePaths.add(`${userId}/${normalizedImageUrl}`);

    return Array.from(candidatePaths);
  }

  private static async downloadFromCandidatePaths(
    bucketName: string,
    candidatePaths: string[]
  ): Promise<Blob> {
    let lastError: unknown = null;

    for (const candidatePath of candidatePaths) {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(candidatePath);

      if (!error) {
        return data;
      }

      lastError = error;
    }

    throw lastError ?? new Error('No valid storage path found for image');
  }

  private static async downloadBlobToDiskCache(
    imageUrl: string,
    bucketName: string,
    userId: string,
    cacheKey: string
  ): Promise<string | null> {
    const candidatePaths = this.getCandidatePaths(imageUrl, userId, bucketName);
    const data = await this.downloadFromCandidatePaths(bucketName, candidatePaths);
    const ext = this.inferExtensionFromUrl(imageUrl);

    return CacheManager.putBlob(cacheKey, data, ext);
  }

  static async initializeCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LEGACY_ASYNC_STORAGE_KEY);
      await CacheManager.init();
    } catch (error) {
      console.error('Error initializing image cache:', error);
    }
  }

  /** Önbellek hazır olmadan anında gösterim — önce preview, yoksa ana görsel. */
  static resolveRouteImageRemoteUri(
    imageUrl: string | null | undefined,
    userId: string,
    imagePreviewUrl?: string | null,
  ): string | null {
    if (!userId) {
      return null;
    }

    const candidates = [imagePreviewUrl, imageUrl].filter(
      (value): value is string => Boolean(value?.trim()),
    );

    for (const candidate of candidates) {
      const trimmed = candidate.trim();

      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }

      const paths = this.getCandidatePaths(trimmed, userId, 'routes');

      for (const path of paths) {
        const { data } = supabase.storage.from('routes').getPublicUrl(path);

        if (data.publicUrl) {
          return data.publicUrl;
        }
      }
    }

    return null;
  }

  static async loadImageWithCache(
    imageUrl: string,
    bucketName: string,
    userId: string,
    onStateChange?: (state: ImageLoadState) => void
  ): Promise<string | null> {
    if (this.isExternalHttpImageUrl(imageUrl)) {
      onStateChange?.({ loading: false, error: null, retryCount: 0 });
      return imageUrl.trim();
    }

    const cacheKey = this.buildDiskCacheKey(bucketName, imageUrl, userId);

    const cachedUri = await CacheManager.getFileUriIfCached(cacheKey);

    if (cachedUri) {
      return cachedUri;
    }

    return this.loadImageWithRetry(imageUrl, bucketName, userId, cacheKey, onStateChange);
  }

  /** Disk önbelleğinde varsa file URI döner; ağ isteği yapmaz. */
  static async getCachedImageUri(
    imageUrl: string,
    bucketName: string,
    userId: string,
  ): Promise<string | null> {
    await CacheManager.ensureReady();

    const cacheKey = this.buildDiskCacheKey(bucketName, imageUrl, userId);

    return CacheManager.getFileUriIfCached(cacheKey);
  }

  /** Disk önbelleğinde varsa file URI döner; ağ isteği yapmaz. */
  static async getCachedRouteImageUri(
    imageUrl: string,
    userId: string,
  ): Promise<string | null> {
    return this.getCachedImageUri(imageUrl, 'routes', userId);
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

      const fileUri = await this.downloadBlobToDiskCache(imageUrl, bucketName, userId, cacheKey);

      onStateChange?.({ loading: false, error: null, retryCount });

      return fileUri;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        onStateChange?.({
          loading: false,
          error: `Retrying... (${retryCount + 1}/${this.MAX_RETRIES})`,
          retryCount: retryCount + 1,
        });

        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), this.RETRY_DELAY * (retryCount + 1)),
        );

        return this.loadImageWithRetry(imageUrl, bucketName, userId, cacheKey, onStateChange, retryCount + 1);
      }

      console.error('Image load failed after retries:', this.toLoggableError(error));

      onStateChange?.({
        loading: false,
        error: 'Failed to load image after multiple attempts',
        retryCount,
      });

      return null;
    }
  }

  static async getPostImages(_postId: string, _userId: string): Promise<string[]> {
    return [];
  }

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

    if (this.isExternalHttpImageUrl(imageUrl)) {
      const externalUri = imageUrl.trim();
      onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: externalUri });
      return externalUri;
    }

    const cacheKey = this.buildDiskCacheKey(bucketName, imageUrl, userId);

    try {
      const cachedUri = await CacheManager.getFileUriIfCached(cacheKey);

      if (cachedUri) {
        onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: cachedUri });
        return cachedUri;
      }

      onStateChange?.({ loading: true, error: null, retryCount: 0, imageUri: null });

      const fileUri = await this.downloadBlobToDiskCache(imageUrl, bucketName, userId, cacheKey);

      onStateChange?.({ loading: false, error: null, retryCount: 0, imageUri: fileUri });

      return fileUri;
    } catch {
      onStateChange?.({
        loading: false,
        error: 'Resim yüklenirken bir hata oluştu',
        retryCount: 0,
        imageUri: null,
      });

      return null;
    }
  }

  static async downloadPostImage(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'routes', userId, onStateChange);
  }

  static async downloadProfileImage(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'profiles', userId, onStateChange);
  }

  static async downloadProfileBackground(
    imageUrl: string | undefined,
    userId: string,
    onStateChange?: (state: ImageLoadState & { imageUri: string | null }) => void
  ): Promise<string | null> {
    return this.downloadImage(imageUrl, 'profiles', userId, onStateChange);
  }

  static async uploadImage(_imageUri: string, _userId: string, _postId: string): Promise<string | null> {
    try {
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  static async deleteImage(_imageUrl: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  static async clearCache(): Promise<void> {
    await CacheManager.clearAll();
  }

  /** Disk önbelleğindeki tahmini toplam bayt. */
  static getCacheSize(): number {
    return CacheManager.getTotalBytes();
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { encode } from 'base64-arraybuffer';

interface DiskCacheEntry {
  relativePath: string;
  sizeBytes: number;
  lastAccessAt: number;
}

/**
 * Disk üzerinde medya dosyalarını tutar; anahtar uygulama mantığından gelir (ör. bucket + depolama yolu).
 * Boyut limiti aşıldığında en eski erişilen (LRU) dosyalar silinir.
 */
export class CacheManager {
  private static entries = new Map<string, DiskCacheEntry>();
  private static totalBytes = 0;
  private static didInit = false;
  private static readonly INDEX_KEY = 'yolista_disk_cache_index_v2';
  private static readonly CACHE_DIR_NAME = 'yolista_media_cache';

  /** Varsayılan üst sınır (~150 MB). */
  static readonly MAX_CACHE_BYTES = 150 * 1024 * 1024;

  private static async sha256Hex(message: string): Promise<string> {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      const buffer = new TextEncoder().encode(message);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));

      return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    let hash = 0;

    for (let i = 0; i < message.length; i++) {
      hash = Math.imul(31, hash) + message.charCodeAt(i);
    }

    return `h${Math.abs(hash).toString(16)}_${message.length.toString(16)}`;
  }

  static getTotalBytes(): number {
    return this.totalBytes;
  }

  static getEntryCount(): number {
    return this.entries.size;
  }

  static async init(): Promise<void> {
    await this.ensureCacheDir();
    await this.loadIndex();
    await this.pruneMissingFiles();
    await this.evictToSizeLimit();
    this.didInit = true;
  }

  private static async ensureCacheDir(): Promise<void> {
    const path = `${RNFS.CachesDirectoryPath}/${this.CACHE_DIR_NAME}`;
    const exists = await RNFS.exists(path);

    if (!exists) {
      await RNFS.mkdir(path);
    }
  }

  static getCacheRoot(): string {
    return `${RNFS.CachesDirectoryPath}/${this.CACHE_DIR_NAME}`;
  }

  private static async loadIndex(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(this.INDEX_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, DiskCacheEntry>;
      this.entries = new Map(Object.entries(parsed));
      this.recalculateTotalBytes();
    } catch (error) {
      console.error('CacheManager loadIndex error:', error);
    }
  }

  private static recalculateTotalBytes(): void {
    this.totalBytes = 0;

    for (const entry of this.entries.values()) {
      this.totalBytes += entry.sizeBytes;
    }
  }

  private static async saveIndex(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.entries);
      await AsyncStorage.setItem(this.INDEX_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('CacheManager saveIndex error:', error);
    }
  }

  private static async pruneMissingFiles(): Promise<void> {
    const root = this.getCacheRoot();

    for (const [key, entry] of Array.from(this.entries.entries())) {
      const fullPath = `${root}/${entry.relativePath}`;
      const exists = await RNFS.exists(fullPath);

      if (!exists) {
        this.entries.delete(key);
      }
    }

    this.recalculateTotalBytes();
    await this.saveIndex();
  }

  private static async evictToSizeLimit(): Promise<void> {
    if (this.totalBytes <= this.MAX_CACHE_BYTES) {
      return;
    }

    const sorted = Array.from(this.entries.entries()).sort(
      (a, b) => a[1].lastAccessAt - b[1].lastAccessAt
    );

    const root = this.getCacheRoot();

    for (const [key, entry] of sorted) {
      if (this.totalBytes <= this.MAX_CACHE_BYTES) {
        break;
      }

      const fullPath = `${root}/${entry.relativePath}`;

      try {
        await RNFS.unlink(fullPath);
      } catch {
        // ignore
      }

      this.entries.delete(key);
      this.totalBytes -= entry.sizeBytes;
    }

    if (this.totalBytes < 0) {
      this.recalculateTotalBytes();
    }

    await this.saveIndex();
  }

  static async ensureReady(): Promise<void> {
    if (this.didInit) {
      return;
    }

    await this.init();
  }

  static async getFileUriIfCached(cacheKey: string): Promise<string | null> {
    await this.ensureReady();

    const entry = this.entries.get(cacheKey);

    if (!entry) {
      return null;
    }

    const fullPath = `${this.getCacheRoot()}/${entry.relativePath}`;
    const exists = await RNFS.exists(fullPath);

    if (!exists) {
      this.entries.delete(cacheKey);
      this.recalculateTotalBytes();
      await this.saveIndex();
      return null;
    }

    entry.lastAccessAt = Date.now();
    await this.saveIndex();

    return this.toFileUri(fullPath);
  }

  private static toFileUri(fullPath: string): string {
    if (fullPath.startsWith('file://')) {
      return fullPath;
    }

    return `file://${fullPath}`;
  }

  /**
   * RN Blob often lacks a working arrayBuffer(); RouteCard uses FileReader successfully for the same storage blobs.
   */
  private static async blobToBase64Payload(blob: Blob): Promise<string> {
    if (typeof blob.arrayBuffer === 'function') {
      try {
        const arrayBuffer = await blob.arrayBuffer();

        return encode(arrayBuffer);
      } catch {
        // Fall through to FileReader (matches RouteCard download path).
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;

        if (typeof result !== 'string') {
          reject(new Error('FileReader did not return a data URL'));
          return;
        }

        const commaIndex = result.indexOf(',');

        if (commaIndex === -1) {
          reject(new Error('Invalid data URL from FileReader'));
          return;
        }

        resolve(result.slice(commaIndex + 1));
      };

      reader.onerror = () => {
        reject(reader.error ?? new Error('FileReader failed'));
      };

      reader.readAsDataURL(blob);
    });
  }

  static async putBlob(cacheKey: string, blob: Blob, extension: string): Promise<string> {
    await this.ensureReady();

    const safeExt = extension.replace(/[^a-z0-9]/gi, '').slice(0, 4) || 'jpg';
    const hash = await this.sha256Hex(cacheKey);
    const relativePath = `${hash}.${safeExt}`;
    const fullPath = `${this.getCacheRoot()}/${relativePath}`;

    const prior = this.entries.get(cacheKey);

    if (prior) {
      this.totalBytes -= prior.sizeBytes;

      if (prior.relativePath !== relativePath) {
        const oldFull = `${this.getCacheRoot()}/${prior.relativePath}`;

        try {
          await RNFS.unlink(oldFull);
        } catch {
          // ignore
        }
      }
    }

    const base64Payload = await this.blobToBase64Payload(blob);
    await RNFS.writeFile(fullPath, base64Payload, 'base64');

    const stat = await RNFS.stat(fullPath);
    const sizeBytes = Number(stat.size);

    this.entries.set(cacheKey, {
      relativePath,
      sizeBytes,
      lastAccessAt: Date.now(),
    });
    this.recalculateTotalBytes();
    await this.evictToSizeLimit();
    await this.saveIndex();

    return this.toFileUri(fullPath);
  }

  static async clearAll(): Promise<void> {
    await this.ensureCacheDir();
    await this.loadIndex();

    const root = this.getCacheRoot();

    try {
      const files = await RNFS.readDir(root);

      for (const file of files) {
        await RNFS.unlink(file.path);
      }
    } catch (error) {
      console.error('CacheManager clearAll error:', error);
    }

    this.entries.clear();
    this.totalBytes = 0;
    this.didInit = true;
    await this.saveIndex();
  }
}

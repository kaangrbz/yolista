import { ImageService } from './ImageService';

export type ProfileAvatarMissingReason =
  | 'no_image'
  | 'deleted_profile'
  | 'download_failed';

type ProfileAvatarCacheEntry =
  | {
      status: 'ready';
      uri: string;
    }
  | {
      status: 'missing';
      reason: ProfileAvatarMissingReason;
      expiresAt: number | null;
    };

const FAILED_RETRY_MS = 30 * 60 * 1000;

class ProfileAvatarCache {
  private entries = new Map<string, ProfileAvatarCacheEntry>();
  private inflight = new Map<string, Promise<string | null>>();

  private buildKey(
    userId: string,
    imagePreviewUrl?: string | null,
    imageUrl?: string | null,
  ): string {
    const storageKey = imagePreviewUrl || imageUrl || 'none';

    return `${userId}:${storageKey}`;
  }

  peek(
    userId: string,
    imagePreviewUrl?: string | null,
    imageUrl?: string | null,
  ): string | null | undefined {
    const key = this.buildKey(userId, imagePreviewUrl, imageUrl);
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.status === 'ready') {
      return entry.uri;
    }

    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return null;
  }

  private setMissing(
    key: string,
    reason: ProfileAvatarMissingReason,
    retryAfterMs: number | null = null,
  ): void {
    this.entries.set(key, {
      status: 'missing',
      reason,
      expiresAt: retryAfterMs === null ? null : Date.now() + retryAfterMs,
    });
  }

  private setReady(key: string, uri: string): void {
    this.entries.set(key, {
      status: 'ready',
      uri,
    });
  }

  markProfileDeleted(userId: string): void {
    const prefix = `${userId}:`;

    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }

    this.setMissing(`${userId}:none`, 'deleted_profile', null);
  }

  async resolve(params: {
    userId: string;
    imageUrl?: string | null;
    imagePreviewUrl?: string | null;
    profileDeleted?: boolean;
  }): Promise<string | null> {
    const { userId, imageUrl, imagePreviewUrl, profileDeleted = false } = params;

    if (!userId) {
      return null;
    }

    if (profileDeleted) {
      this.markProfileDeleted(userId);
      return null;
    }

    const key = this.buildKey(userId, imagePreviewUrl, imageUrl);
    const cached = this.peek(userId, imagePreviewUrl, imageUrl);

    if (cached !== undefined) {
      return cached;
    }

    const storageKey = imagePreviewUrl || imageUrl;

    if (!storageKey) {
      this.setMissing(key, 'no_image', null);
      return null;
    }

    const existingInflight = this.inflight.get(key);

    if (existingInflight) {
      return existingInflight;
    }

    const loadPromise = ImageService.downloadProfileImage(storageKey, userId)
      .then((uri) => {
        if (uri) {
          this.setReady(key, uri);
          return uri;
        }

        this.setMissing(key, 'download_failed', FAILED_RETRY_MS);
        return null;
      })
      .catch(() => {
        this.setMissing(key, 'download_failed', FAILED_RETRY_MS);
        return null;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, loadPromise);

    return loadPromise;
  }

  clear(): void {
    this.entries.clear();
    this.inflight.clear();
  }
}

export const profileAvatarCache = new ProfileAvatarCache();

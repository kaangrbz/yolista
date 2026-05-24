import type { NotificationType } from '../model/notifications.model';

interface NotificationsCacheEntry {
  userId: string;
  items: NotificationType[];
  fetchedAt: number;
}

let cache: NotificationsCacheEntry | null = null;

const STALE_MS = 2 * 60 * 1000;

export const getCachedNotifications = (userId: string): NotificationType[] | null => {
  if (!cache || cache.userId !== userId) {
    return null;
  }

  return cache.items;
};

export const isNotificationsCacheStale = (userId: string): boolean => {
  if (!cache || cache.userId !== userId) {
    return true;
  }

  return Date.now() - cache.fetchedAt > STALE_MS;
};

export const setCachedNotifications = (
  userId: string,
  items: NotificationType[],
): void => {
  cache = {
    userId,
    items,
    fetchedAt: Date.now(),
  };
};

export const invalidateNotificationsCache = (): void => {
  cache = null;
};

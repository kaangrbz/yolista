import { NotificationType } from '../model/notifications.model';
import { Profile } from '../model/profile.model';
import { RouteWithProfile } from '../model/routes.model';

const PROFILE_COMPARE_FIELDS: (keyof Profile)[] = [
  'id',
  'username',
  'full_name',
  'description',
  'website',
  'image_url',
  'image_preview_url',
  'header_image_url',
  'header_image_preview_url',
  'is_verified',
  'updated_at',
];

export const isSameProfile = (previous: Profile, next: Profile): boolean => {
  return PROFILE_COMPARE_FIELDS.every((field) => previous[field] === next[field]);
};

const isSameRoute = (previous: RouteWithProfile, next: RouteWithProfile): boolean => {
  if (previous.id !== next.id) {
    return false;
  }

  return (
    previous.updated_at === next.updated_at
    && previous.image_url === next.image_url
    && previous.title === next.title
  );
};

const isSameNotification = (
  previous: NotificationType,
  next: NotificationType,
): boolean => {
  return (
    previous.id === next.id
    && previous.is_read === next.is_read
    && previous.created_at === next.created_at
    && previous.entity_type === next.entity_type
    && previous.entity_id === next.entity_id
    && previous.message === next.message
    && previous.sender_id === next.sender_id
    && previous.profiles?.username === next.profiles?.username
    && previous.profiles?.image_url === next.profiles?.image_url
    && previous.profiles?.image_preview_url === next.profiles?.image_preview_url
    && previous.profiles?.is_deleted === next.profiles?.is_deleted
  );
};

const mergeListPreservingUnchanged = <TItem extends { id?: string | number }>(
  previous: TItem[],
  next: TItem[],
  isSameItem: (existing: TItem, incoming: TItem) => boolean,
  getItemKey: (item: TItem) => string | null,
): TItem[] => {
  const previousByKey = new Map<string, TItem>();

  for (const item of previous) {
    const key = getItemKey(item);

    if (key) {
      previousByKey.set(key, item);
    }
  }

  return next.map((item) => {
    const key = getItemKey(item);

    if (!key) {
      return item;
    }

    const existing = previousByKey.get(key);

    if (!existing) {
      return item;
    }

    if (isSameItem(existing, item)) {
      return existing;
    }

    return item;
  });
};

export const mergeRoutesPreservingUnchanged = (
  previous: RouteWithProfile[],
  next: RouteWithProfile[],
): RouteWithProfile[] => {
  return mergeListPreservingUnchanged(
    previous,
    next,
    isSameRoute,
    (route) => route.id || null,
  );
};

export const mergeProfilesPreservingUnchanged = (
  previous: Profile[],
  next: Profile[],
): Profile[] => {
  return mergeListPreservingUnchanged(
    previous,
    next,
    isSameProfile,
    (profile) => profile.id || null,
  );
};

export const mergeNotificationsPreservingUnchanged = (
  previous: NotificationType[],
  next: NotificationType[],
): NotificationType[] => {
  return mergeListPreservingUnchanged(
    previous,
    next,
    isSameNotification,
    (notification) => (notification.id != null ? String(notification.id) : null),
  );
};

/** İlk yükleme: liste boşken tam loader; yenileme: mevcut içerik kalır. */
export const isInitialListLoading = (
  isLoading: boolean,
  itemCount: number,
): boolean => {
  return isLoading && itemCount === 0;
};

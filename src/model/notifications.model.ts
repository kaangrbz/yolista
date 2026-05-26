import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';

export type NotificationNavTarget = 'profile' | 'route' | 'none';

export interface NotificationTypeMeta {
  key: string;
  label: string;
  icon_name: string;
  color: string;
  nav_target: NotificationNavTarget;
  rate_limit_ms: number | null;
}

export interface NotificationType {
  id: number;
  recipient_id: string;
  sender_id: string;
  entity_id: string;
  entity_type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  notification_types: NotificationTypeMeta | null;
  profiles: {
    id: string;
    full_name: string;
    username: string;
    image_url: string;
    image_preview_url?: string | null;
    is_verified: boolean;
    is_deleted: boolean;
  } | null;
}

function unwrapNotificationTypeMeta(
  value: NotificationTypeMeta | NotificationTypeMeta[] | null | undefined,
): NotificationTypeMeta | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const NotificationModel = {
  async getNotifications({
    userId,
  }: {
    userId: string;
    lastCreatedAt?: string | null;
  }): Promise<NotificationType[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_types (
          key,
          label,
          icon_name,
          color,
          nav_target,
          rate_limit_ms
        ),
        profiles!notifications_sender_id_fkey (
          id,
          full_name,
          username,
          image_url,
          image_preview_url,
          is_verified,
          is_deleted
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      showToast('error', 'Bildirimler alınamadı');
      throw error;
    }

    return (data ?? []).map((row) => ({
      ...row,
      notification_types: unwrapNotificationTypeMeta(row.notification_types),
    })) as NotificationType[];
  },

  async createNotification({
    senderId,
    recipientId,
    entityId,
    entityType,
    message,
  }: {
    senderId?: string;
    recipientId: string;
    entityId?: string;
    entityType: string;
    message?: string;
  }) {
    if (senderId && senderId === recipientId) {
      return null;
    }

    const { data: typeRow, error: typeError } = await supabase
      .from('notification_types')
      .select('rate_limit_ms')
      .eq('key', entityType)
      .eq('is_active', true)
      .maybeSingle();

    if (typeError) {
      showToast('error', 'Bildirim tipi kontrol edilemedi');
      throw typeError;
    }

    if (senderId && typeRow?.rate_limit_ms) {
      const { data: recentNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('recipient_id', recipientId)
        .eq('sender_id', senderId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        showToast('error', 'Bildirim kontrolü sırasında hata oluştu');
        throw fetchError;
      }

      if (
        recentNotifications.length > 0
        && Date.now() - new Date(recentNotifications[0].created_at).getTime()
          < typeRow.rate_limit_ms
      ) {
        return null;
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        sender_id: senderId || null,
        recipient_id: recipientId,
        entity_id: entityId || null,
        entity_type: entityType,
        message: message || null,
        is_read: false,
      })
      .select('*');

    if (error) {
      throw error;
    }

    return data as NotificationType[];
  },

  async markAsRead({ userId }: { userId: string }): Promise<NotificationType[]> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .select('*');

    if (error) {
      showToast('error', 'Bildirim okundu olarak işaretlenirken bir hata oluştu');
      throw error;
    }

    return data as NotificationType[];
  },

  async deleteNotification({ notificationId }: { notificationId: number }): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      showToast('error', 'Bildirim silinirken bir hata oluştu');
      throw error;
    }
  },
};

export default NotificationModel;

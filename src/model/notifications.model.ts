import { NOTIFICATION_RATE_LIMITS } from "../config/notificationConfig";
import { supabase } from "../lib/supabase";
import { showToast } from "../utils/alert";

export type NotificationEntityType = 'follow' | 'like' | 'comment' | 'mention';

export interface NotificationType {
    id: number,
    recipient_id: string,
    sender_id: string,
    entity_id: string,
    entity_type: NotificationEntityType,
    message: string,
    created_at: string,
    is_read: boolean,
    profiles: {
        id: string,
        full_name: string,
        username: string,
        image_url: string,
        is_verified: boolean,
        is_deleted: boolean,
    }
}

const NotificationModel = {
  /**
   * Fetch notifications for a specific user
   * @param {string} userId - The recipient ID of the user
   * @returns {Promise<any[]>} List of notifications with profile data
   */
  async getNotifications({ userId, lastCreatedAt }: { userId: string, lastCreatedAt?: string | null }): Promise<NotificationType[]> {
    const query = supabase
      .from("notifications")
      .select(`
        *,
        profiles!notifications_sender_id_fkey (
          id,
          full_name,
          username,
          image_url,
          is_verified,
          is_deleted
        )
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })

    // if (lastCreatedAt) {
    //   query.gte("created_at", lastCreatedAt);
    // }

    const { data, error } = await query.limit(50);

    console.log('notification data',data, error);
    if (error) {
      showToast("error", "Bildirimler alınamadı");
      throw error;
    }
    return data as NotificationType[];
  },

  /**
   * Create a new notification
   * @param {string} senderId - The ID of the sender (optional)
   * @param {string} recipientId - The ID of the recipient
   * @param {string} entityId - The ID of the related entity (optional)
   * @param {string} entityType - The type of the related entity
   * @param {string} message - Notification message (optional)
   * @returns {Promise<any>} Created notification object
   */
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
    entityType: NotificationEntityType;
    message?: string;
  }) {
    // Prevent users from sending notifications to themselves
    if (senderId && senderId === recipientId) {
      return null;
    }

    // Rate limit uygulanacak tipler
    const rateLimitTypes = ["follow"];
  
    if (senderId && rateLimitTypes.includes(entityType)) {
      const limitMs = NOTIFICATION_RATE_LIMITS[entityType as keyof typeof NOTIFICATION_RATE_LIMITS];
  
      const { data: recentNotifications, error: fetchError } = await supabase
        .from("notifications")
        .select("created_at")
        .eq("recipient_id", recipientId)
        .eq("sender_id", senderId)
        .eq("entity_type", entityType)
        .order("created_at", { ascending: false })
        .limit(1);
  
      if (fetchError) {
        showToast("error", "Bildirim kontrolü sırasında hata oluştu");
        throw fetchError;
      }
  
      if (
        recentNotifications.length > 0 &&
        new Date().getTime() - new Date(recentNotifications[0].created_at).getTime() < limitMs
      ) {
        // Süre içinde bildirim varsa yeni bildirim oluşturma
        return null;
      }
    }
  
    // Bildirimi oluştur
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        sender_id: senderId || null,
        recipient_id: recipientId,
        entity_id: entityId || null,
        entity_type: entityType,
        message: message || null,
        is_read: false,
      })
      .select("*");
  
    if (error) {
      showToast("error", "Bildirim oluşturulurken bir hata oluştu");
      throw error;
    }
    return data as NotificationType[];
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - The ID of the notification to update
   * @returns {Promise<any>} Updated notification object
   */
  async markAsRead({ notificationId }: { notificationId: number }): Promise<NotificationType[]> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select("*");

    if (error) {
      showToast("error", "Bildirim okundu olarak işaretlenirken bir hata oluştu");
      throw error;
    }
    return data as NotificationType[];
  },

  /**
   * Delete a notification
   * @param {number} notificationId - The ID of the notification to delete
   * @returns {Promise<void>}
   */
  async deleteNotification({ notificationId }: { notificationId: number }): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      showToast("error", "Bildirim silinirken bir hata oluştu");
      throw error;
    }

    return;
  },
};

export default NotificationModel;

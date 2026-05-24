import { supabase } from '../lib/supabase';
import NotificationModel from './notifications.model';

export interface Comment {
  id: string;
  bookmark_id?: string;
  route_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    image_url?: string;
    image_preview_url?: string;
    full_name?: string;
    user_id?: string;
    is_verified?: boolean;
  };
}

const CommentModel = {
  // Get comments for a specific route
  async getRouteComments(routeId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, image_url, image_preview_url, full_name)')
      .eq('route_id', routeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching route comments:', error);
      throw error;
    }

    return data as Comment[];
  },

  // Add a comment to a route
  async addRouteComment(routeId: string, userId: string, content: string, routeOwnerId: string): Promise<Comment> {
    console.log('routeId:', routeId);
    console.log('userId:', userId);
    console.log('content:', content);
    console.log('routeOwnerId:', routeOwnerId);
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          route_id: routeId,
          user_id: userId,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding route comment:', error);
      throw error;
    }

    try {
      console.log('routeOwber Id:', routeOwnerId);
      //* Send notification to the user
      const notification = await NotificationModel.createNotification({
        recipientId: routeOwnerId,
        senderId: userId,
        entityType: 'comment',
        entityId: routeId,
      });

      console.log('Notification:', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return data as Comment;
  },

  // Delete a comment
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // First check if the user is the author of the comment
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Update a comment
  async updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
    // First check if the user is the author of the comment
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      throw new Error('Unauthorized: You can only update your own comments');
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return data as Comment;
  },
};

export default CommentModel;

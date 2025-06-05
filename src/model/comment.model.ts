import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  bookmark_id?: string;
  route_id?: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    image_url?: string;
    full_name?: string;
  };
}

export interface CommentWithProfile extends Comment {
  profiles: {
    username: string;
    image_url?: string;
    full_name?: string;
  };
}

const CommentModel = {
  // Get comments for a specific route
  async getRouteComments(routeId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, image_url, full_name)')
      .eq('route_id', routeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching route comments:', error);
      throw error;
    }

    return data as CommentWithProfile[];
  },

  // Get comments for a specific bookmark
  async getBookmarkComments(bookmarkId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, image_url, full_name)')
      .eq('bookmark_id', bookmarkId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmark comments:', error);
      throw error;
    }

    return data as CommentWithProfile[];
  },

  // Add a comment to a route
  async addRouteComment(routeId: string, authorId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          route_id: routeId,
          author_id: authorId,
          content
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding route comment:', error);
      throw error;
    }

    return data as Comment;
  },

  // Add a comment to a bookmark
  async addBookmarkComment(bookmarkId: string, authorId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          bookmark_id: bookmarkId,
          author_id: authorId,
          content
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding bookmark comment:', error);
      throw error;
    }

    return data as Comment;
  },

  // Delete a comment
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // First check if the user is the author of the comment
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.author_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

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
      .select('author_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.author_id !== userId) {
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
  }
};

export default CommentModel;

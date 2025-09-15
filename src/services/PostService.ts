import RouteModel from '../model/routes.model';
import { Post } from '../types/post.types';

export class PostService {
  static async getPost(postId: string, userId?: string): Promise<Post | null> {
    try {
      const routes = await RouteModel.getRoutesById(postId, userId);

      if (routes && routes.length > 0) {
        const postData = routes[0];

        if (postData.is_deleted) {
          throw new Error('Bu gönderi silinmiş veya artık mevcut değil.');
        }

        return postData;
      }

      return null;
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  }

  static async likePost(postId: string, postOwnerId: string, userId: string): Promise<boolean> {
    try {
      const result = await RouteModel.likeRoute(postId, postOwnerId, userId);
      return result.success;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }

  static async unlikePost(postId: string, userId: string): Promise<boolean> {
    try {
      const result = await RouteModel.unlikeRoute(postId, userId);
      return result.success;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }

  static async getPosts(options: {
    onlyMain?: boolean;
    loggedUserId?: string;
    categoryId?: number;
    cityId?: number;
  }): Promise<Post[]> {
    try {
      const routes = await RouteModel.getRoutes(options);
      return routes || [];
    } catch (error) {
      console.error('Error getting posts:', error);
      return [];
    }
  }
}

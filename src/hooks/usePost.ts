import { useState, useEffect, useCallback } from 'react';
import RouteModel from '../model/routes.model';
import { Post } from '../types/post.types';

interface UsePostOptions {
  initialPost?: Post | null;
}

function findMainRoutePost(routes: Array<Post & { order_index?: number }>): Post | null {
  const mainRoute = routes.find((route) => route.order_index === 0);

  if (mainRoute) {
    return mainRoute;
  }

  if (routes.length > 0) {
    return routes[0];
  }

  return null;
}

export const usePost = (
  postId: string,
  userId: string | null,
  options?: UsePostOptions,
) => {
  const initialPost = options?.initialPost ?? null;
  const hasInitialPost = initialPost !== null;

  const [post, setPost] = useState<Post | null>(initialPost);
  const [loading, setLoading] = useState(!hasInitialPost);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const routes = await RouteModel.getRoutesById(postId, userId || undefined);
      const postData = findMainRoutePost(routes as Array<Post & { order_index?: number }>);

      if (!postData) {
        setError('Gönderi bulunamadı.');
        return;
      }

      if (postData.is_deleted) {
        setError('Bu gönderi silinmiş veya artık mevcut değil.');
        return;
      }

      setPost(postData);
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Gönderi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  const refreshPost = useCallback(async () => {
    await loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    if (initialPost && initialPost.id === postId) {
      setPost(initialPost);
      setLoading(false);
      setError(null);
      return;
    }

    loadPost();
  }, [postId, userId, initialPost, loadPost]);

  return {
    post,
    loading,
    error,
    refreshPost,
  };
};

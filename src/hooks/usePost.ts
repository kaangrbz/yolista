import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import RouteModel from '../model/routes.model';
import { Post } from '../types/post.types';

export const usePost = (postId: string, userId: string | null) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const routes = await RouteModel.getRoutesById(postId, userId || undefined);
      
      if (routes && routes.length > 0) {
        const postData = routes[0];
        
        if (postData.is_deleted) {
          setError('Bu gönderi silinmiş veya artık mevcut değil.');
          return;
        }
        
        setPost(postData);
      } else {
        setError('Gönderi bulunamadı.');
      }
    } catch (err) {
      console.error('Error loading post:', err);
      setError('Gönderi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const refreshPost = async () => {
    await loadPost();
  };

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId, userId]);

  return {
    post,
    loading,
    error,
    refreshPost,
  };
};

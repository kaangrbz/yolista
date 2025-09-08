import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import RouteModel from '../model/routes.model';

export const usePostActions = (postId: string, userId: string | null, postOwnerId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const handleLike = async () => {
    if (!userId || !postId) return;
    
    try {
      // Optimistic update
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
      
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);

      const result = newIsLiked
        ? await RouteModel.likeRoute(postId, postOwnerId, userId)
        : await RouteModel.unlikeRoute(postId, userId);

      if (!result.success) {
        // Revert on failure
        setIsLiked(!newIsLiked);
        setLikeCount(likeCount);
        Alert.alert('Hata', 'Beğeni işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleComment = () => {
    // This will be handled by the parent component
    console.log('Comment action triggered for post:', postId);
  };

  const handleShare = () => {
    console.log('Share action triggered for post:', postId);
    // Share logic will be implemented here
  };

  const handleSave = () => {
    console.log('Save action triggered for post:', postId);
    // Save logic will be implemented here
  };

  const updatePostData = useCallback((postData: any) => {
    if (postData) {
      setIsLiked(postData.did_like || false);
      setLikeCount(postData.like_count || 0);
      setCommentCount(postData.comment_count || 0);
    }
  }, []);

  return {
    isLiked,
    likeCount,
    commentCount,
    handleLike,
    handleComment,
    handleShare,
    handleSave,
    updatePostData,
  };
};

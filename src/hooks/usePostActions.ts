import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import RouteModel from '../model/routes.model';
import { SavedCollection } from '../services/SaveCollectionsService';

export const usePostActions = (postId: string, userId: string | null, postOwnerId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveSheetVisible, setIsSaveSheetVisible] = useState(false);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>({});

  const handleLike = async () => {
    if (!userId || !postId) {
      return;
    }

    try {
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);

      const result = newIsLiked
        ? await RouteModel.likeRoute(postId, postOwnerId, userId)
        : await RouteModel.unlikeRoute(postId, userId);

      if (!result.success) {
        setIsLiked(!newIsLiked);
        setLikeCount(likeCount);
        Alert.alert('Hata', 'Beğeni işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleDoubleTapLike = async () => {
    if (!userId || !postId || isLiked) {
      return;
    }

    try {
      setIsLiked(true);
      setLikeCount(likeCount + 1);

      const result = await RouteModel.likeRoute(postId, postOwnerId, userId);

      if (!result.success) {
        setIsLiked(false);
        setLikeCount(likeCount);
        Alert.alert('Hata', 'Beğeni işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Error double-tap like:', error);
      setIsLiked(false);
      setLikeCount(likeCount);
    }
  };

  const handleComment = () => {
    // This will be handled by the parent component
    console.log('Comment action triggered for post:', postId);
  };

  const handleShare = () => {
    // Paylaşım UniversalPost içinde ShareModal ile yapılır
  };

  const syncSaveCollections = useCallback(async (options?: { ensureDefaultMembership?: boolean }) => {
    if (!userId || !postId) {
      return;
    }

    setIsCollectionsLoading(true);

    try {
      const existingCollections = await RouteModel.getSavedCollections(userId);

      if (existingCollections.length === 0) {
        await RouteModel.ensureDefaultSavedCollection(userId);
      }

      const collectionsData = await RouteModel.getSavedCollections(userId);
      let selectedIds = await RouteModel.getSavedCollectionItemIds(userId, postId);

      const defaultColl = collectionsData.find((c) => c.is_default);

      if (options?.ensureDefaultMembership && defaultColl && !selectedIds.includes(defaultColl.id)) {
        try {
          await RouteModel.toggleSavedCollectionItem(userId, defaultColl.id, postId);
          selectedIds = [...selectedIds, defaultColl.id];
        } catch (addError) {
          console.error('ensureDefaultMembership error:', addError);
          Alert.alert('Hata', 'Genel listeye eklenemedi.');
        }
      }

      setCollections(collectionsData);
      setSelectedCollectionIds(selectedIds);
      setIsSaved(selectedIds.length > 0);
    } catch (error) {
      console.error('syncSaveCollections error:', error);
      Alert.alert('Hata', 'Kaydedilen listeler alınamadı.');
    } finally {
      setIsCollectionsLoading(false);
    }
  }, [userId, postId]);

  const handleSave = async () => {
    if (!userId || !postId) {
      return;
    }

    await syncSaveCollections({ ensureDefaultMembership: true });
    setIsSaveSheetVisible(true);
  };

  const closeSaveSheet = () => {
    setIsSaveSheetVisible(false);
  };

  const toggleCollectionForPost = async (collectionId: string) => {
    if (!userId || !postId) {
      return;
    }

    setRowLoadingMap((prev) => ({
      ...prev,
      [collectionId]: true,
    }));

    const currentSelectedIds = selectedCollectionIds;
    const nextSelectedIds = currentSelectedIds.includes(collectionId)
      ? currentSelectedIds.filter((id) => id !== collectionId)
      : [...currentSelectedIds, collectionId];

    setSelectedCollectionIds(nextSelectedIds);
    setIsSaved(nextSelectedIds.length > 0);

    try {
      await RouteModel.toggleSavedCollectionItem(userId, collectionId, postId);
    } catch (error) {
      console.error('toggleCollectionForPost error:', error);
      setSelectedCollectionIds(currentSelectedIds);
      setIsSaved(currentSelectedIds.length > 0);
      Alert.alert('Hata', 'Liste güncellenemedi.');
    } finally {
      setRowLoadingMap((prev) => ({
        ...prev,
        [collectionId]: false,
      }));
    }
  };

  const createCollectionForPost = async (name: string) => {
    if (!userId || !postId) {
      return;
    }

    try {
      const newCollection = await RouteModel.createSavedCollection(userId, name);
      setCollections((prev) => [newCollection, ...prev]);
      await toggleCollectionForPost(newCollection.id);
    } catch (error: any) {
      console.error('createCollectionForPost error:', error);
      Alert.alert('Hata', error?.message || 'Liste oluşturulamadı.');
      throw error;
    }
  };

  const updatePostData = useCallback((postData: any) => {
    if (postData) {
      setIsLiked(postData.did_like || false);
      setLikeCount(postData.like_count || 0);
      setCommentCount(postData.comment_count || 0);
    }
  }, []);

  const syncCommentCount = useCallback((count: number) => {
    setCommentCount(Math.max(0, count));
  }, []);

  return {
    isLiked,
    isSaved,
    isSaveSheetVisible,
    isCollectionsLoading,
    collections,
    selectedCollectionIds,
    rowLoadingMap,
    likeCount,
    commentCount,
    handleLike,
    handleDoubleTapLike,
    handleComment,
    handleShare,
    handleSave,
    closeSaveSheet,
    toggleCollectionForPost,
    createCollectionForPost,
    syncSaveCollections,
    updatePostData,
    syncCommentCount,
  };
};

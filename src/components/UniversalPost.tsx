import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePost } from '../hooks/usePost';
import { usePostActions } from '../hooks/usePostActions';
import { usePostImageLayout } from '../hooks/usePostImageLayout';
import { buildProfileNavigationParams } from '../utils/profileSlug';
import { useImages } from '../hooks/useImages';
import { postFromRouteWithProfile, leadSlideFromRoute } from '../utils/postFromRoute';
import PostHeader from './post/PostHeader';
import PostImageSkeleton from './post/PostImageSkeleton';
import ImageCarousel from './post/ImageCarousel';
import PostActions from './post/PostActions';
import PostCaption from './post/PostCaption';
import ShareModal from './ShareModal';
import { ShareService } from '../services/ShareService';
import { PostProps } from '../types/post.types';
import RouteModel from '../model/routes.model';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import SavedCollectionsSheet from './common/SavedCollectionsSheet';
import { useCommentsSheet } from '../context/CommentsSheetContext';

const UniversalPost: React.FC<PostProps> = ({
  postId,
  userId,
  initialRoute,
  batchImages = false,
  prefetchedImageRows,
  showFullScreen = false,
  actions,
}) => {
  const navigation = useNavigation();
  const { openComments, subscribeCommentCount } = useCommentsSheet();
  const initialPost = useMemo(
    () => (initialRoute ? postFromRouteWithProfile(initialRoute) : null),
    [initialRoute],
  );
  const leadSlide = useMemo(
    () => (initialRoute ? leadSlideFromRoute(initialRoute) : null),
    [initialRoute],
  );

  const { post, loading, error } = usePost(postId, userId, { initialPost });
  const postOwnerId = post?.user_id ?? initialPost?.user_id ?? '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const {
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
  } = usePostActions(postId, userId, postOwnerId);

  const {
    slides: imageSlides,
    loading: imagesLoading,
    error: imagesError,
    currentIndex,
    handleImageScroll,
    refreshImages,
  } = useImages(postId, postOwnerId, {
    leadSlide,
    batchMode: batchImages,
    prefetchedRows: prefetchedImageRows,
  });

  const {
    carouselHeightOptions,
    screenWidth,
    imagePlaceholderHeight,
    carouselImages,
    displayHeights,
  } = usePostImageLayout(imageSlides, leadSlide);

  const { showAlert, copyToClipboard } = useGlobalAlert();

  useEffect(() => {
    const source = post ?? initialPost;

    if (source) {
      updatePostData(source);
    }
  }, [post, initialPost, updatePostData]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    return subscribeCommentCount(postId, syncCommentCount);
  }, [postId, subscribeCommentCount, syncCommentCount]);

  useEffect(() => {
    setIsExpanded(false);
  }, [post?.id]);

  useEffect(() => {
    syncSaveCollections();
  }, [syncSaveCollections]);

  const handleProfilePress = () => {
    if (!post?.user_id) {
      return;
    }

    if (actions?.onProfilePress) {
      if (post.profiles?.username) {
        actions.onProfilePress(post.profiles.username);
      }
    } else {
      if (!post.profiles?.username) {
        return;
      }

      (navigation as any).navigate(
        'ProfileMain',
        buildProfileNavigationParams({
          username: post.profiles.username,
          currentUserId: userId || '',
        }),
      );
    }
  };

  const handleCommentPress = () => {
    if (actions?.onComment) {
      actions.onComment(postId);

      return;
    }

    openComments({
      routeId: postId,
      routeOwnerId: post?.user_id || postOwnerId,
      parentType: 'homePage',
    });
  };

  const handleLikePress = () => {
    if (actions?.onLike) {
      actions.onLike(postId, !isLiked);
    } else {
      handleLike();
    }
  };

  const handleLikesCaptionPress = () => {
    if (likeCount <= 0) {
      return;
    }

    (navigation as any).navigate('SocialUserList', {
      kind: 'route_likers',
      routeId: postId,
      likeCount,
    });
  };

  const handleSharePress = () => {
    if (actions?.onShare) {
      actions.onShare(postId);
    } else {
      setIsShareModalVisible(true);
    }
  };

  const handleSavePress = () => {
    if (actions?.onSave) {
      actions.onSave(postId);
    } else {
      handleSave();
    }
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEditPost = () => {
    Alert.alert(
      'Düzenle',
      'Bu özellik yakında eklenecek',
      [{ text: 'Tamam' }],
    );
  };

  const handleDeletePost = async () => {
    if (!post) {
      return;
    }

    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await RouteModel.deleteRoute(postId);

              if (deleteError) {
                console.error('Error deleting post:', deleteError);
                showAlert('Gönderi silinirken bir hata oluştu');
                return;
              }

              showAlert('Gönderi başarıyla silindi');

              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('HomeStack' as never);
              }
            } catch (deleteErr) {
              console.error('Error deleting post:', deleteErr);
              showAlert('Gönderi silinirken bir hata oluştu');
            }
          },
        },
      ],
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      'Şikayet Et',
      'Bu gönderiyi şikayet etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Şikayet Et',
          style: 'destructive',
          onPress: () => {
            console.log('Post reported:', postId);
          },
        },
      ],
    );
  };

  const handleBlockUser = () => {
    if (!post) {
      return;
    }

    Alert.alert(
      'Engelle',
      `${post.profiles?.username || 'Bu kullanıcıyı'} engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            console.log('User blocked:', post.user_id);
          },
        },
      ],
    );
  };

  const handleFollowUser = () => {
    if (!post) {
      return;
    }

    Alert.alert('Takip Edildi', `${post.profiles?.username || 'Kullanıcı'} takip edildi`);
  };

  const handleUnfollowUser = () => {
    if (!post) {
      return;
    }

    Alert.alert(
      'Takibi Bırak',
      `${post.profiles?.username || 'Bu kullanıcının'} takibini bırakmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Takibi Bırak',
          style: 'destructive',
          onPress: () => {
            console.log('Unfollowed user:', post.user_id);
          },
        },
      ],
    );
  };

  const handleCopyLink = async () => {
    const url = ShareService.generatePostUrl(postId);
    const title = post?.title?.trim() ?? '';
    const text = ShareService.composeShareMessage(title, url);

    await copyToClipboard(text, 'Paylaşım metni panoya kopyalandı!');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Gönderi bulunamadı'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PostHeader
        username={post.profiles?.username || 'unknown'}
        userImage={post.profiles?.image_url}
        userImagePreview={post.profiles?.image_preview_url}
        userId={post.user_id}
        location={post.cities?.name}
        onProfilePress={handleProfilePress}
        isOwnPost={post.user_id === userId}
        isFollowing={false}
        onMorePress={handleEditPost}
        onReportPress={handleReportPost}
        onBlockPress={handleBlockUser}
        onFollowPress={handleFollowUser}
        onUnfollowPress={handleUnfollowUser}
        onEditPress={handleEditPost}
        onDeletePress={handleDeletePost}
        onSharePress={handleSharePress}
        onCopyLinkPress={handleCopyLink}
      />

      {imagesLoading && (
        <PostImageSkeleton
          width={screenWidth}
          height={imagePlaceholderHeight}
        />
      )}

      {imagesError && !imagesLoading && (
        <Pressable
          style={({ pressed }) => [
            styles.imagePlaceholder,
            { height: imagePlaceholderHeight, width: screenWidth },
            pressed && styles.imagePlaceholderPressed,
          ]}
          onPress={refreshImages}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.imageMessageText}>{imagesError}</Text>
          <Text style={styles.imageMessageText}>Tekrar dene</Text>
        </Pressable>
      )}

      {!imagesLoading && !imagesError && carouselImages.length > 0 && (
        <ImageCarousel
          images={carouselImages}
          currentIndex={currentIndex}
          onIndexChange={(index) =>
            handleImageScroll(
              { nativeEvent: { contentOffset: { x: index * screenWidth } } },
              screenWidth,
            )
          }
          height={carouselHeightOptions.defaultHeight}
          dynamicHeight={true}
          displayHeights={displayHeights}
          maxHeight={carouselHeightOptions.maxHeight}
          minHeight={carouselHeightOptions.minHeight}
          isLiked={isLiked}
          onDoubleTap={handleDoubleTapLike}
        />
      )}

      {!imagesLoading && !imagesError && carouselImages.length === 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.imagePlaceholder,
            { height: imagePlaceholderHeight, width: screenWidth },
            pressed && styles.imagePlaceholderPressed,
          ]}
          onPress={refreshImages}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.imageMessageText}>
            {'Bu gönderi için resim bulunamadı\n\nTekrar dene'}
          </Text>
        </Pressable>
      )}

      <PostActions
        isLiked={isLiked}
        isSaved={isSaved}
        isSaveLoading={isCollectionsLoading}
        likeCount={likeCount}
        commentCount={commentCount}
        onLike={handleLikePress}
        onComment={handleCommentPress}
        onShare={handleSharePress}
        onSave={handleSavePress}
      />

      <PostCaption
        username={post.profiles?.username || 'unknown'}
        title={post.title}
        description={post.description}
        likeCount={likeCount}
        commentCount={commentCount}
        createdAt={post.created_at}
        onComment={handleCommentPress}
        onLikesPress={handleLikesCaptionPress}
        isExpanded={isExpanded}
        onToggleExpanded={handleToggleExpanded}
      />

      <ShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postId={postId}
        postTitle={post.title}
        postImage={carouselImages[0]}
        postUrl={ShareService.generatePostUrl(postId)}
      />

      <SavedCollectionsSheet
        visible={isSaveSheetVisible}
        loading={isCollectionsLoading}
        collections={collections}
        selectedCollectionIds={selectedCollectionIds}
        rowLoadingMap={rowLoadingMap}
        onClose={closeSaveSheet}
        onToggleCollection={toggleCollectionForPost}
        onCreateCollection={createCollectionForPost}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  loadingContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  imagePlaceholder: {
    alignSelf: 'center',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderPressed: {
    opacity: 0.88,
  },
  imageMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default UniversalPost;

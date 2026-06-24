import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { showConfirm } from './common/ConfirmModal';
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
import { getRouteShareLabel } from '../utils/getRouteDisplayLabel';
import {
  composeRouteShareText,
} from '../utils/composeRouteShareText';
import { resolveCarouselIndexForRouteStop } from '../utils/resolveCarouselIndexForRouteStop';
import { PostProps } from '../types/post.types';
import RouteModel from '../model/routes.model';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import SavedCollectionsSheet from './common/SavedCollectionsSheet';
import { useCommentsSheet } from '../context/CommentsSheetContext';
import { useThemedStyles } from '../theme/useThemedStyles';
import RouteDetailCTA from './routeDetail/RouteDetailCTA';
import PostRoutePreviewSheet from './post/PostRoutePreviewSheet';
import PostImagePreview, {
  savePreviewSlide,
  type PreviewMenuOption,
} from './post/PostImagePreview';
import type { RouteWithProfile } from '../model/routes.model';

const { height: windowHeight } = Dimensions.get('window');
const FULL_SCREEN_MIN_HEIGHT = Math.max(windowHeight - 160, 480);

const UniversalPost: React.FC<PostProps> = ({
  postId,
  userId,
  initialRoute,
  batchImages = false,
  prefetchedImageRows,
  showFullScreen = false,
  actions,
  detailExperienceSlot,
  stopCountHint = null,
  activeSlideIndex,
  onActiveSlideIndexChange,
  imageDownloadEnabled = true,
  downloadGeneration = 0,
  feedIndex,
  lockCarouselToFirstPhotoDimensions = true,
  secondaryImageResizeMode = 'cover',
}) => {
  const navigation = useNavigation();
  const styles = useThemedStyles((t) => ({
    container: {
      backgroundColor: t.background,
      borderBottomWidth: 0,
      borderBottomColor: t.hairlineBorder,
    },
    fullScreenContainer: {
      flexGrow: 1,
      minHeight: FULL_SCREEN_MIN_HEIGHT,
    },
    loadingContainer: {
      flex: 1,
      minHeight: 400,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.background,
    },
    fullScreenLoadingContainer: {
      minHeight: FULL_SCREEN_MIN_HEIGHT,
    },
    errorContainer: {
      flex: 1,
      minHeight: 400,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.background,
    },
    fullScreenErrorContainer: {
      minHeight: FULL_SCREEN_MIN_HEIGHT,
    },
    errorText: {
      fontSize: 16,
      color: t.textSecondary,
    },
    imagePlaceholder: {
      alignSelf: 'center',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
    },
    imagePlaceholderPressed: {
      opacity: 0.88,
    },
    imageMessageText: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
    },
  }));

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
  const [isRoutePreviewVisible, setIsRoutePreviewVisible] = useState(false);
  const [isRoutePreviewLoading, setIsRoutePreviewLoading] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewIndexRef = useRef(0);
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
    goToImage,
    downloadAllSlides,
    refreshImages,
  } = useImages(postId, postOwnerId, {
    leadSlide,
    batchMode: batchImages,
    prefetchedRows: prefetchedImageRows,
    enabled: imageDownloadEnabled,
    downloadGeneration,
    feedIndex,
    slidePrefetchAhead: showFullScreen ? 1 : 1,
    eagerSlides: showFullScreen,
  });

  const {
    carouselHeightOptions,
    screenWidth,
    imagePlaceholderHeight,
    carouselSlides,
    carouselImages,
    carouselHints,
    displayHeights,
  } = usePostImageLayout(imageSlides, leadSlide, {
    keepPlaceholderSlides: true,
    lockToFirstPhotoDimensions: lockCarouselToFirstPhotoDimensions,
  });

  const routeShareMeta = useMemo(() => {
    const slideTitles = imageSlides
      .map((slide) => slide.hint?.trim() ?? '')
      .filter((title) => title.length > 0);
    const stopCount =
      stopCountHint ??
      (carouselImages.length > 0 ? carouselImages.length : slideTitles.length);

    return {
      stopCount,
      stopTitles: slideTitles,
    };
  }, [carouselImages.length, imageSlides, stopCountHint]);

  previewIndexRef.current = previewIndex;

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

  useEffect(() => {
    if (activeSlideIndex === undefined) {
      return;
    }

    goToImage(activeSlideIndex);
  }, [activeSlideIndex, goToImage]);

  const handleCarouselIndexChange = (index: number) => {
    handleImageScroll(
      { nativeEvent: { contentOffset: { x: index * screenWidth } } },
      screenWidth,
    );
    onActiveSlideIndexChange?.(index);
  };

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

  const closeImagePreview = useCallback(() => {
    const index = previewIndexRef.current;

    setIsImagePreviewVisible(false);

    if (index !== currentIndex) {
      goToImage(index);
    }
  }, [currentIndex, goToImage]);

  const openImagePreview = useCallback(
    (index: number) => {
      previewIndexRef.current = index;
      setPreviewIndex(index);
      setIsImagePreviewVisible(true);
      downloadAllSlides();
    },
    [downloadAllSlides],
  );

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRoutePreviewStopImagePress = useCallback(
    (stop: RouteWithProfile, previewStops: RouteWithProfile[]) => {
      const index = resolveCarouselIndexForRouteStop(
        stop,
        carouselSlides,
        previewStops,
      );

      openImagePreview(index);
    },
    [carouselSlides, openImagePreview],
  );

  const handleEditPost = () => {
    showConfirm({
      title: 'Düzenle',
      message: 'Bu özellik yakında eklenecek',
      icon: 'information-outline',
      actions: [{ key: 'ok', label: 'Tamam', variant: 'primary' }],
    });
  };

  const handleDeletePost = async () => {
    if (!post) {
      return;
    }

    showConfirm({
      title: 'Gönderiyi Sil',
      message: 'Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      icon: 'trash-can-outline',
      iconColor: '#dc2626',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        {
          key: 'delete',
          label: 'Sil',
          variant: 'destructive',
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
    });
  };

  const handleReportPost = () => {
    showConfirm({
      title: 'Şikayet Et',
      message: 'Bu gönderiyi şikayet etmek istediğinizden emin misiniz?',
      icon: 'flag-outline',
      iconColor: '#dc2626',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        {
          key: 'report',
          label: 'Şikayet Et',
          variant: 'destructive',
          onPress: () => {
            console.log('Post reported:', postId);
          },
        },
      ],
    });
  };

  const handleBlockUser = () => {
    if (!post) {
      return;
    }

    showConfirm({
      title: 'Engelle',
      message: `${post.profiles?.username || 'Bu kullanıcıyı'} engellemek istediğinizden emin misiniz?`,
      icon: 'block-helper',
      iconColor: '#dc2626',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        {
          key: 'block',
          label: 'Engelle',
          variant: 'destructive',
          onPress: () => {
            console.log('User blocked:', post.user_id);
          },
        },
      ],
    });
  };

  const handleFollowUser = () => {
    if (!post) {
      return;
    }

    showAlert(`${post.profiles?.username || 'Kullanıcı'} takip edildi`);
  };

  const handleUnfollowUser = () => {
    if (!post) {
      return;
    }

    showConfirm({
      title: 'Takibi Bırak',
      message: `${post.profiles?.username || 'Bu kullanıcının'} takibini bırakmak istediğinizden emin misiniz?`,
      icon: 'account-remove-outline',
      actions: [
        { key: 'cancel', label: 'İptal', variant: 'ghost' },
        {
          key: 'unfollow',
          label: 'Takibi Bırak',
          variant: 'destructive',
          onPress: () => {
            console.log('Unfollowed user:', post.user_id);
          },
        },
      ],
    });
  };

  const handleCopyLink = async () => {
    const url = ShareService.generatePostUrl(postId);
    const text = composeRouteShareText({
      cityName: post?.cities?.name,
      categoryName: post?.categories?.name,
      stopCount: routeShareMeta.stopCount,
      stopTitles: routeShareMeta.stopTitles,
      authorUsername: post?.profiles?.username,
      url,
    });

    await copyToClipboard(text, 'Paylaşım metni panoya kopyalandı!');
  };

  const previewMenuOptions = useMemo((): PreviewMenuOption[] => {
    const options: PreviewMenuOption[] = [
      {
        id: 'download',
        title: 'İndir',
        icon: 'download',
        onPress: () => {
          void savePreviewSlide(carouselSlides[previewIndexRef.current]);
        },
      },
      {
        id: 'share',
        title: 'Paylaş',
        icon: 'share',
        onPress: () => {
          setIsImagePreviewVisible(false);
          setIsShareModalVisible(true);
        },
      },
      {
        id: 'copy',
        title: 'Linki Kopyala',
        icon: 'content-copy',
        onPress: () => {
          void handleCopyLink();
        },
      },
    ];

    if (post?.user_id !== userId) {
      options.push(
        {
          id: 'report',
          title: 'Şikayet Et',
          icon: 'flag',
          color: '#ff4444',
          onPress: handleReportPost,
        },
        {
          id: 'block',
          title: 'Engelle',
          icon: 'block-helper',
          color: '#ff4444',
          onPress: handleBlockUser,
        },
      );
    }

    return options;
  }, [carouselSlides, handleBlockUser, handleCopyLink, handleReportPost, post?.user_id, userId]);

  if (loading) {
    return (
      <View style={[styles.container, showFullScreen && styles.fullScreenContainer]}>
        <View
          style={[
            styles.loadingContainer,
            showFullScreen && styles.fullScreenLoadingContainer,
          ]}
        >
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.container, showFullScreen && styles.fullScreenContainer]}>
        <View
          style={[
            styles.errorContainer,
            showFullScreen && styles.fullScreenErrorContainer,
          ]}
        >
          <Text style={styles.errorText}>{error || 'Gönderi bulunamadı'}</Text>
        </View>
      </View>
    );
  }

  const postHeader = (
    <PostHeader
      username={post.profiles?.username || 'unknown'}
      userImage={post.profiles?.image_url}
      userImagePreview={post.profiles?.image_preview_url}
      userId={post.user_id}
      location={post.cities?.name}
      onProfilePress={handleProfilePress}
      isOwnPost={post.user_id === userId}
      isFollowing={false}
      isVerified={!!post.profiles?.is_verified}
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
  );

  const hasCarouselSlides = imageSlides.length > 0;
  const hasLoadedSlide = imageSlides.some((slide) => slide.uri !== null);
  const showInitialImageSkeleton = imagesLoading && !hasLoadedSlide;
  const showCarousel = hasCarouselSlides && !imagesError && (hasLoadedSlide || !imagesLoading);

  const carouselBlock = (
    <>
      {showInitialImageSkeleton && (
        <PostImageSkeleton
          width={screenWidth}
          height={imagePlaceholderHeight}
        />
      )}

      {imagesError && !showInitialImageSkeleton && !showCarousel && (
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

      {showCarousel && (
        <ImageCarousel
          slides={carouselSlides}
          hints={carouselHints}
          currentIndex={currentIndex}
          onIndexChange={handleCarouselIndexChange}
          height={displayHeights[0] ?? carouselHeightOptions.defaultHeight}
          dynamicHeight={!lockCarouselToFirstPhotoDimensions}
          lockToFirstPhotoDimensions={lockCarouselToFirstPhotoDimensions}
          displayHeights={displayHeights}
          maxHeight={carouselHeightOptions.maxHeight}
          minHeight={carouselHeightOptions.minHeight}
          secondaryImageResizeMode={secondaryImageResizeMode}
          isLiked={isLiked}
          onDoubleTap={handleDoubleTapLike}
          onImagePress={openImagePreview}
          downloadEnabled={imageDownloadEnabled}
        />
      )}

      {!showCarousel && !showInitialImageSkeleton && !imagesError && !hasCarouselSlides && (
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
    </>
  );

  const feedRouteCta =
    !detailExperienceSlot && !showFullScreen ? (
      <RouteDetailCTA
        routeId={postId}
        stopCountHint={
          stopCountHint ??
          (carouselImages.length > 0 ? carouselImages.length : null)
        }
        loading={isRoutePreviewLoading}
        onPress={() => {
          setIsRoutePreviewLoading(true);
          setIsRoutePreviewVisible(true);
        }}
      />
    ) : null;

  const postActions = (
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
  );

  const postCaption = (
    <PostCaption
      username={post.profiles?.username || 'unknown'}
      description={post.description}
      likeCount={likeCount}
      commentCount={commentCount}
      createdAt={post.created_at}
      onComment={handleCommentPress}
      onLikesPress={handleLikesCaptionPress}
      isExpanded={isExpanded}
      onToggleExpanded={handleToggleExpanded}
    />
  );

  return (
    <View style={[styles.container, showFullScreen && styles.fullScreenContainer]}>
      {postHeader}
      {detailExperienceSlot}
      {carouselBlock}
      {feedRouteCta}
      {postActions}
      {postCaption}

      <ShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postId={postId}
        postTitle={getRouteShareLabel(post)}
        postImage={carouselImages.find((uri) => uri !== null) ?? undefined}
        postUrl={ShareService.generatePostUrl(postId)}
        cityName={post?.cities?.name}
        categoryName={post?.categories?.name}
        stopCount={routeShareMeta.stopCount}
        stopTitles={routeShareMeta.stopTitles}
        authorUsername={post?.profiles?.username}
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

      {!detailExperienceSlot && !showFullScreen ? (
        <PostRoutePreviewSheet
          visible={isRoutePreviewVisible}
          routeId={postId}
          userId={userId}
          initialRoute={initialRoute ?? null}
          isRouteSaved={isSaved}
          saveLoading={isCollectionsLoading}
          onClose={() => {
            setIsRoutePreviewVisible(false);
            setIsRoutePreviewLoading(false);
          }}
          onShare={() => setIsShareModalVisible(true)}
          onSave={handleSavePress}
          onLoadingChange={setIsRoutePreviewLoading}
          onStopImagePress={handleRoutePreviewStopImagePress}
        />
      ) : null}

      <PostImagePreview
        slides={carouselSlides}
        visible={isImagePreviewVisible}
        initialIndex={previewIndex}
        description={post.description}
        menuOptions={previewMenuOptions}
        onRequestClose={closeImagePreview}
        onIndexChange={(index) => {
          previewIndexRef.current = index;
        }}
      />
    </View>
  );
};

export default UniversalPost;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showConfirm } from '../common/ConfirmModal';
import { RouteDetailHeader } from '../header/Header';
import ThemedScrollView from '../common/ThemedScrollView';
import PostHeader from '../post/PostHeader';
import PostImageSkeleton from '../post/PostImageSkeleton';
import ImageCarousel from '../post/ImageCarousel';
import PostCaption from '../post/PostCaption';
import PostCaptionPreview from '../post/PostCaptionPreview';
import ShareModal from '../ShareModal';
import SavedCollectionsSheet from '../common/SavedCollectionsSheet';
import RouteDetailHeroToggle, {
  type RouteDetailHeroMode,
} from './RouteDetailHeroToggle';
import RouteDetailMap from './RouteDetailMap';
import RouteSummaryBar from './RouteSummaryBar';
import RouteDetailHeaderSocialActions from './RouteDetailHeaderSocialActions';
import MapRouteTimelinePanel from '../explore/map/MapRouteTimelinePanel';
import PostImagePreview, {
  savePreviewSlide,
  type PreviewMenuOption,
} from '../post/PostImagePreview';
import { getMapStopKey } from '../explore/map/MapRouteStopCard';
import { usePost } from '../../hooks/usePost';
import { usePostActions } from '../../hooks/usePostActions';
import { usePostImageLayout } from '../../hooks/usePostImageLayout';
import { useRouteDetailSlides } from '../../hooks/useRouteDetailSlides';
import { useCommentsSheet } from '../../context/CommentsSheetContext';
import { useGlobalAlert } from '../../hooks/useGlobalAlert';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { buildProfileNavigationParams } from '../../utils/profileSlug';
import { ShareService } from '../../services/ShareService';
import { getRouteShareLabel } from '../../utils/getRouteDisplayLabel';
import {
  composeRouteShareText,
  extractShareMetaFromStops,
} from '../../utils/composeRouteShareText';
import { resolveCarouselIndexForRouteStop } from '../../utils/resolveCarouselIndexForRouteStop';
import RouteModel from '../../model/routes.model';
import type { RouteWithProfile } from '../../model/routes.model';
import type { RouteSegment, RouteSheetTab } from '../../types/routeSegment.types';

const ROUTE_DETAIL_HEADER_HEIGHT = 52;

export interface RouteDetailLayoutProps {
  navigation: any;
  headerTitle: string;
  routeId: string;
  userId: string | null;
  stops: RouteWithProfile[];
  stopsLoading: boolean;
  heroMode: RouteDetailHeroMode;
  onHeroModeChange: (mode: RouteDetailHeroMode) => void;
  activeStopIndex: number;
  onActiveStopIndexChange: (index: number) => void;
  routeDetailTab: RouteSheetTab;
  onTabChange: (tab: RouteSheetTab) => void;
  segments: RouteSegment[];
  segmentsLoading: boolean;
  activeSegmentIndex: number;
  onSegmentPress: (index: number) => void;
  startFromUserLocation: boolean;
  canStartFromUserLocation: boolean;
  onStartFromUserLocationChange: (enabled: boolean) => void;
  useFloatingPrimaryCta: boolean;
  onNestedScrollLockChange?: (isActive: boolean) => void;
  onExpandMap?: () => void;
  scrollEnabled?: boolean;
  scrollContentStyle?: StyleProp<ViewStyle>;
  hasEstimatedSegments?: boolean;
  optimizeRouteOrder?: boolean;
  onOptimizeRouteOrderChange?: (enabled: boolean) => void;
  optimizeSavingsPercent?: number | null;
  onOpenRouteInMaps?: () => void;
  onOpenActiveStopInMaps?: () => void;
}

export const RouteDetailLayout: React.FC<RouteDetailLayoutProps> = ({
  navigation,
  headerTitle,
  routeId,
  userId,
  stops,
  stopsLoading,
  heroMode,
  onHeroModeChange,
  activeStopIndex,
  onActiveStopIndexChange,
  routeDetailTab,
  onTabChange,
  segments,
  segmentsLoading,
  activeSegmentIndex,
  onSegmentPress,
  startFromUserLocation,
  canStartFromUserLocation,
  onStartFromUserLocationChange,
  useFloatingPrimaryCta,
  onNestedScrollLockChange,
  onExpandMap,
  scrollEnabled = true,
  hasEstimatedSegments = false,
  optimizeRouteOrder = false,
  onOptimizeRouteOrderChange,
  optimizeSavingsPercent = null,
  scrollContentStyle,
  onOpenRouteInMaps,
  onOpenActiveStopInMaps,
}) => {
  const rootNavigation = useNavigation();
  const { openComments, subscribeCommentCount } = useCommentsSheet();
  const { showAlert, copyToClipboard } = useGlobalAlert();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewIndexRef = useRef(0);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    loadingWrap: {
      flex: 1,
      backgroundColor: t.background,
    },
    errorContainer: {
      minHeight: 320,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      fontSize: 16,
      color: t.textSecondary,
      textAlign: 'center',
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
    commentRow: {
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    commentButton: {
      alignSelf: 'flex-start',
    },
    commentText: {
      fontSize: 14,
      color: t.textMuted,
      fontWeight: '500',
    },
  }));

  const { post, loading, error } = usePost(routeId, userId);
  const postOwnerId = post?.user_id ?? '';

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
    handleSave,
    closeSaveSheet,
    toggleCollectionForPost,
    createCollectionForPost,
    syncSaveCollections,
    updatePostData,
    syncCommentCount,
  } = usePostActions(routeId, userId, postOwnerId);

  const {
    slides,
    loading: slidesLoading,
    error: slidesError,
    currentIndex,
    handleImageScroll,
    goToImage,
    refreshSlides,
  } = useRouteDetailSlides(stops, stops.length > 0, routeId);

  const isHeroLoading = loading || stopsLoading || slidesLoading;

  const routeShareMeta = useMemo(
    () => extractShareMetaFromStops(stops),
    [stops],
  );

  const selectedRoute = useMemo((): RouteWithProfile | null => {
    if (!post) {
      return null;
    }

    const mainStop =
      stops.find((stop) => stop.order_index === 0) ?? stops[0] ?? null;

    return {
      ...(mainStop ?? {}),
      ...post,
      id: post.id,
      user_id: post.user_id,
      profiles: post.profiles,
      cities: post.cities,
      categories: post.categories,
    } as RouteWithProfile;
  }, [post, stops]);

  const activeStopId = useMemo(() => {
    const stop = stops[activeStopIndex];

    return stop ? getMapStopKey(stop) : null;
  }, [activeStopIndex, stops]);

  const handleTimelineStopPress = (stop: RouteWithProfile) => {
    const index = stops.findIndex(
      (candidate) => getMapStopKey(candidate) === getMapStopKey(stop),
    );

    if (index >= 0) {
      onActiveStopIndexChange(index);
    }
  };

  const {
    carouselHeightOptions,
    screenWidth,
    imagePlaceholderHeight,
    carouselSlides,
    carouselImages,
    carouselHints,
    displayHeights,
  } = usePostImageLayout(slides, null, {
    keepPlaceholderSlides: true,
  });

  previewIndexRef.current = previewIndex;

  const handleTimelineStopImagePress = useCallback(
    (stop: RouteWithProfile) => {
      const index = resolveCarouselIndexForRouteStop(stop, carouselSlides, stops);

      previewIndexRef.current = index;
      setPreviewIndex(index);
      setIsImagePreviewVisible(true);
    },
    [carouselSlides, stops],
  );

  const closeImagePreview = useCallback(() => {
    const index = previewIndexRef.current;

    setIsImagePreviewVisible(false);

    if (index !== currentIndex) {
      goToImage(index);
    }

    if (index !== activeStopIndex) {
      onActiveStopIndexChange(index);
    }
  }, [activeStopIndex, currentIndex, goToImage, onActiveStopIndexChange]);

  useEffect(() => {
    if (post) {
      updatePostData(post);
    }
  }, [post, updatePostData]);

  useEffect(() => {
    if (!routeId) {
      return;
    }

    return subscribeCommentCount(routeId, syncCommentCount);
  }, [routeId, subscribeCommentCount, syncCommentCount]);

  useEffect(() => {
    setIsExpanded(false);
  }, [post?.id]);

  useEffect(() => {
    syncSaveCollections();
  }, [syncSaveCollections]);

  useEffect(() => {
    const maxIndex = stops.length - 1;

    if (maxIndex < 0) {
      return;
    }

    const clampedIndex = Math.min(Math.max(0, activeStopIndex), maxIndex);

    if (__DEV__ && activeStopIndex !== clampedIndex) {
      console.warn(
        '[RouteDetail] activeStopIndex clamped:',
        activeStopIndex,
        '→',
        clampedIndex,
      );
    }

    goToImage(clampedIndex);
  }, [activeStopIndex, goToImage, stops.length]);

  const handleCarouselIndexChange = (index: number) => {
    handleImageScroll(
      { nativeEvent: { contentOffset: { x: index * screenWidth } } },
      screenWidth,
    );
    onActiveStopIndexChange(index);
  };

  const handleProfilePress = () => {
    if (!post?.profiles?.username || !post.user_id) {
      return;
    }

    (rootNavigation as any).navigate(
      'ProfileMain',
      buildProfileNavigationParams({
        username: post.profiles.username,
        currentUserId: userId || '',
      }),
    );
  };

  const handleCommentPress = () => {
    openComments({
      routeId,
      routeOwnerId: post?.user_id || postOwnerId,
      parentType: 'homePage',
    });
  };

  const handleLikesPress = () => {
    if (likeCount <= 0) {
      return;
    }

    (rootNavigation as any).navigate('SocialUserList', {
      kind: 'route_likers',
      routeId,
      likeCount,
    });
  };

  const handleCopyLink = async () => {
    const url = ShareService.generatePostUrl(routeId);
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

  const handleEditPost = () => {
    showConfirm({
      title: 'Düzenle',
      message: 'Bu özellik yakında eklenecek',
      icon: 'information-outline',
      actions: [{ key: 'ok', label: 'Tamam', variant: 'primary' }],
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
            console.log('Post reported:', routeId);
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

  const handleDeletePost = () => {
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
              const { error: deleteError } = await RouteModel.deleteRoute(routeId);

              if (deleteError) {
                showAlert('Gönderi silinirken bir hata oluştu');
                return;
              }

              showAlert('Gönderi başarıyla silindi');

              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            } catch {
              showAlert('Gönderi silinirken bir hata oluştu');
            }
          },
        },
      ],
    });
  };

  const headerSocial = (
    <RouteDetailHeaderSocialActions
      isLiked={isLiked}
      isSaved={isSaved}
      isSaveLoading={isCollectionsLoading}
      likeCount={likeCount}
      onLike={handleLike}
      onSave={handleSave}
      onShare={() => setIsShareModalVisible(true)}
    />
  );

  const renderHero = () => {
    if (isHeroLoading) {
      return (
        <PostImageSkeleton
          width={screenWidth}
          height={imagePlaceholderHeight}
        />
      );
    }

    if (slidesError) {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.imagePlaceholder,
            { height: imagePlaceholderHeight, width: screenWidth },
            pressed && styles.imagePlaceholderPressed,
          ]}
          onPress={() => void refreshSlides()}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.imageMessageText}>{slidesError}</Text>
          <Text style={styles.imageMessageText}>Tekrar dene</Text>
        </Pressable>
      );
    }

    if (heroMode === 'map') {
      return (
        <RouteDetailMap
          stops={stops}
          activeStopIndex={activeStopIndex}
          segments={segments}
          activeSegmentIndex={activeSegmentIndex}
          onStopPress={onActiveStopIndexChange}
          variant="hero"
          height={imagePlaceholderHeight}
          onMapInteractionChange={onNestedScrollLockChange}
        />
      );
    }

    if (carouselImages.length === 0) {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.imagePlaceholder,
            { height: imagePlaceholderHeight, width: screenWidth },
            pressed && styles.imagePlaceholderPressed,
          ]}
          onPress={() => void refreshSlides()}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.imageMessageText}>
            {'Bu gönderi için resim bulunamadı\n\nTekrar dene'}
          </Text>
        </Pressable>
      );
    }

    return (
      <ImageCarousel
        slides={carouselSlides}
        hints={carouselHints}
        currentIndex={currentIndex}
        onIndexChange={handleCarouselIndexChange}
        height={displayHeights[0] ?? carouselHeightOptions.defaultHeight}
        displayHeights={displayHeights}
        maxHeight={carouselHeightOptions.maxHeight}
        minHeight={carouselHeightOptions.minHeight}
        secondaryImageResizeMode="cover"
        isLiked={isLiked}
        onDoubleTap={handleDoubleTapLike}
        onImagePress={(index) => {
          previewIndexRef.current = index;
          setPreviewIndex(index);
          setIsImagePreviewVisible(true);
        }}
      />
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <PostImageSkeleton
          width={screenWidth}
          height={imagePlaceholderHeight}
        />
      );
    }

    if (error || !post) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Gönderi bulunamadı'}</Text>
        </View>
      );
    }

    const hasCaptionPreview = Boolean(post.description?.trim());

    return (
      <>
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
          onFollowPress={() => undefined}
          onUnfollowPress={() => undefined}
          onEditPress={handleEditPost}
          onDeletePress={handleDeletePost}
          onSharePress={() => setIsShareModalVisible(true)}
          onCopyLinkPress={handleCopyLink}
        />

        {hasCaptionPreview ? (
          <PostCaptionPreview
            description={post.description}
            isExpanded={isExpanded}
            onToggleExpanded={() => setIsExpanded((value) => !value)}
          />
        ) : null}

        {!isHeroLoading ? (
          <RouteDetailHeroToggle mode={heroMode} onModeChange={onHeroModeChange} />
        ) : null}

        {renderHero()}

        {!isHeroLoading && stops.length > 0 && heroMode !== 'map' ? (
          <RouteSummaryBar
            stops={stops}
            hasEstimatedDistance={hasEstimatedSegments}
          />
        ) : null}

        {!isHeroLoading ? (
          <MapRouteTimelinePanel
            stops={stops}
            stopsLoading={stopsLoading}
            selectedRoute={selectedRoute}
            activeStopId={activeStopId}
            segments={segments}
            activeSegmentIndex={activeSegmentIndex}
            segmentsLoading={segmentsLoading}
            startFromUserLocation={startFromUserLocation}
            onStopPress={handleTimelineStopPress}
            onStopImagePress={handleTimelineStopImagePress}
            onSegmentPress={onSegmentPress}
            onOpenRouteInMaps={onOpenRouteInMaps}
            onOpenActiveStopInMaps={onOpenActiveStopInMaps}
            showDragHandle={false}
            scrollMode="embedded"
          />
        ) : null}

        <View style={styles.commentRow}>
          <Pressable
            style={styles.commentButton}
            onPress={handleCommentPress}
            accessibilityRole="button"
            accessibilityLabel={
              commentCount > 0
                ? `${commentCount} yorum, tümünü gör`
                : 'İlk yorumu sen yap'
            }
          >
            <Text style={styles.commentText}>
              {commentCount > 0
                ? `${commentCount} yorumun tümünü gör`
                : 'İlk yorumu sen ol'}
            </Text>
          </Pressable>
        </View>

        <PostCaption
          username={post.profiles?.username || 'unknown'}
          description={post.description}
          likeCount={likeCount}
          commentCount={commentCount}
          createdAt={post.created_at}
          onComment={handleCommentPress}
          onLikesPress={handleLikesPress}
          isExpanded={isExpanded}
          onToggleExpanded={() => setIsExpanded((value) => !value)}
          hideDescription={hasCaptionPreview}
          hideCommentPreview
        />

        <ShareModal
          visible={isShareModalVisible}
          onClose={() => setIsShareModalVisible(false)}
          postId={routeId}
          postTitle={getRouteShareLabel(post)}
          postImage={carouselImages.find((uri) => uri !== null) ?? undefined}
          postUrl={ShareService.generatePostUrl(routeId)}
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
      </>
    );
  };

  return (
    <View style={styles.container}>
      <RouteDetailHeader
        navigation={navigation}
        title={headerTitle}
        rightComponent={headerSocial}
      />

      <ThemedScrollView
        reservedTop={ROUTE_DETAIL_HEADER_HEIGHT}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        bounces
        alwaysBounceVertical
        contentContainerStyle={scrollContentStyle}
      >
        {renderBody()}
      </ThemedScrollView>
    </View>
  );
};

export default RouteDetailLayout;

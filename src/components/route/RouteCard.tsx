import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthorInfo from '../AuthorInfo';
import RouteModel, { RouteWithProfile } from '../../model/routes.model';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Seperator from '../Seperator';
import { DefaultAvatar } from '../../assets';
import SmartImage from '../common/smart-image/SmartImage';
import { usePostImageDownload } from '../../hooks/useImageDownload';
import { showToast } from '../../utils/alert';
import ImageViewer from '../ImageViewer';
import KeyboardAwareContainer from '../common/KeyboardAwareContainer';
import ShareModal from '../ShareModal';
import { ShareService } from '../../services/ShareService';
import { getRouteDisplayLabel, getRouteShareLabel } from '../../utils/getRouteDisplayLabel';
import { useCommentsSheet } from '../../context/CommentsSheetContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

// Define the navigation param list type
type RootStackParamList = {
  HomeMain: undefined;
  RouteDetail: { routeId: string };
  AddCategory: undefined;
  Explore: { categoryId?: number };
  ProfileMain: { username: string; currentUserId?: string };
  SocialUserList:
    | { kind: 'followers'; userId: string }
    | { kind: 'following'; userId: string }
    | { kind: 'route_likers'; routeId: string; likeCount?: number };
  ExploreMain: { categoryId?: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteCardProps {
  route: RouteWithProfile;
  userId: string | null;
  onRefresh: () => void;
  expandedDescriptions: { [key: string]: boolean };
  onToggleDescription: (routeId: string) => void;
  showAuthorHeader?: boolean;
  showConnectingLine?: boolean;
  isLastItem?: boolean;
  /** Keşfet masonry modunda hücre yüksekliği (image_alignment ile uyumlu). */
  exploreCellHeight?: number;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  userId,
  onRefresh,
  expandedDescriptions,
  onToggleDescription,
  showAuthorHeader = true,
  showConnectingLine = true,
  isLastItem = false,
  exploreCellHeight,
}) => {
  const routeKey = String(route.id ?? '');
  const isMainRoute = route.order_index === 0;
  const [isExpanded, setIsExpanded] = useState(expandedDescriptions[routeKey] || false);
  const [localLikeCount, setLocalLikeCount] = useState(route.like_count || 0);
  const [localDidLike, setLocalDidLike] = useState(route.did_like || false);
  const [localCommentCount, setLocalCommentCount] = useState(route.comment_count || 0);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { openComments } = useCommentsSheet();
  const currentRoute = useRoute();
  const isExploreScreen = currentRoute.name === 'ExploreMain';
  const [loading, setLoading] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  const { imageUri } = usePostImageDownload(
    route.image_url,
    route.user_id || '',
    {
      thumb: route.image_thumb_url ?? undefined,
      medium: route.image_medium_url ?? undefined,
      full: route.image_url ?? undefined,
    },
  );
  const styles = useThemedStyles((t) => ({
    cardContainer: {
      position: 'relative',
      minHeight: 400,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    categoryContainer: {
      alignSelf: 'flex-start',
    },
    withConnectingLine: {
      paddingLeft: 16,
    },
    connectingLine: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: t.border,
    },
    connectingLineLast: {
      height: 24,
    },
    routeCard: {
      backgroundColor: t.background,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    imageContainer: {
      width: '100%',
      height: 200,
      backgroundColor: t.surfaceMuted,
    },
    routeInfo: {
      paddingBottom: 0,
    },
    routeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
      color: t.textPrimary,
    },
    routeDescription: {
      fontSize: 14,
      color: t.textSecondary,
      marginBottom: 8,
      marginTop: 4,
      lineHeight: 20,
    },
    routeCategory: {
      fontSize: 14,
      color: t.textSecondary,
      marginBottom: 8,
      marginTop: 4,
    },
    cityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    cityName: {
      fontSize: 13,
      color: t.textPrimary,
    },
    seeMoreText: {
      color: '#1DA1F2',
      fontSize: 14,
      marginBottom: 4,
    },
    reactionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.hairlineBorder,
      paddingTop: 12,
    },
    reactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reactionText: {
      marginLeft: 4,
      color: t.textSecondary,
    },
    commentContainer: {},
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.hairlineBorder,
    },
    commentImage: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
    },
    commentInput: {
      flex: 1,
      padding: 0,
      margin: 0,
      fontSize: 14,
      color: t.textPrimary,
    },
    routeImage: {
      width: '100%',
      height: '100%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exploreCard: {
      backgroundColor: t.background,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: '100%',
      height: '100%',
    },
    exploreImageContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: t.surfaceMuted,
    },
    exploreImage: {
      width: '100%',
      height: '100%',
    },
    exploreOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1,
    },
    likeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    likeCount: {
      color: '#fff',
      fontSize: 12,
      marginLeft: 4,
      fontWeight: '600',
    },
    exploreInfo: {
      padding: 8,
    },
    exploreTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 4,
    },
    exploreDescription: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 16,
    },
  }));

  // Handle text layout if needed
  const handleTextLayout = (e: any, key: string) => {
    // Implementation if needed
  };

  // Ensure we have valid values for required props
  const safeFullName = route.profiles?.full_name || 'Unknown User';
  const safeUsername = route.profiles?.username || 'unknown';
  const safeCreatedAt = route.created_at || new Date().toISOString();
  const safeAuthorId = route.user_id || '';
  const safeRouteId = route.id || '';

  const handleSharePress = () => {
    setIsShareModalVisible(true);
  };

  if (isExploreScreen) {
    const exploreCardStyle = exploreCellHeight
      ? { height: exploreCellHeight }
      : undefined;

    return (
      <TouchableOpacity
        style={[styles.exploreCard, exploreCardStyle]}
        onPress={() => navigation.navigate('RouteDetail', { routeId: route.id || '' })}
      >
        <TouchableOpacity
          style={styles.exploreImageContainer}
          onPress={() => {
            navigation.navigate('RouteDetail', { routeId: route.id || '' });
          }}
        >
          <SmartImage
            kind="route"
            variant="medium"
            userId={route.user_id || ''}
            imageUrl={route.image_url}
            imageThumbUrl={route.image_thumb_url}
            imageMediumUrl={route.image_medium_url}
            style={styles.exploreImage}
          />
          <View style={styles.exploreOverlay}>
            <View style={styles.likeContainer}>
              <Icon name={localDidLike ? 'heart' : 'heart-outline'} size={16} color="#fff" />
              <Text style={styles.likeCount}>{localLikeCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardContainer, (showConnectingLine && !isMainRoute) && styles.withConnectingLine]}>
      {showConnectingLine && (
        <View style={[styles.connectingLine, isLastItem && styles.connectingLineLast]} />
      )}
      <View style={styles.routeCard}>
        {showAuthorHeader && (
          <AuthorInfo
            fullName={safeFullName}
            image_url={route.profiles?.image_url}
            image_preview_url={route.profiles?.image_preview_url}
            isVerified={route.profiles?.is_verified || false}
            username={safeUsername}
            createdAt={safeCreatedAt}
            authorId={safeAuthorId}
            callback={onRefresh}
            loggedUserId={userId}
            routeId={safeRouteId}
            cityName={route.cities?.name || ''}
          />
        )}

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => {
            if (imageUri) {
              setIsImageViewerVisible(true);
            }
          }}
          disabled={!imageUri}
        >
          <SmartImage
            kind="route"
            variant="full"
            userId={route.user_id || ''}
            imageUrl={route.image_url}
            imageThumbUrl={route.image_thumb_url}
            imageMediumUrl={route.image_medium_url}
            style={styles.routeImage}
          />
        </TouchableOpacity>

        <View style={styles.routeInfo}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{ padding: 16 }}
            onPress={() => {
              if (!isMainRoute) return;
              navigation.navigate('RouteDetail', { routeId: route.id || '' });
            }}
            disabled={!isMainRoute}>
            <Text style={styles.routeTitle}>{getRouteDisplayLabel(route)}</Text>

            {/* Category and city should be hidden for not main routes */}
            <View style={[styles.row, !isMainRoute && { display: 'none' }, { paddingBottom: 4 }]}>
              {route.categories?.name && (
                <>
                  <TouchableOpacity
                    style={[styles.row, styles.categoryContainer]}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('Explore', { categoryId: route.category_id });
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name={route.categories?.icon_name} size={18} color="#666" />
                    <Text style={styles.routeCategory}>
                      {route.categories?.name}
                    </Text>
                  </TouchableOpacity>
                  <Seperator />
                </>
              )}

              {route.cities?.name && (
                <View style={styles.cityContainer}>
                  <Icon name="map-marker" size={16} color="#666" />
                  <Text style={styles.cityName}>{route.cities?.name}</Text>
                </View>
              )}
            </View>
            {route.description && (
              <>
                <Text
                  style={styles.routeDescription}
                  numberOfLines={isExpanded ? undefined : 3}
                  onTextLayout={e => handleTextLayout(e, routeKey)}
                >
                  {route.description}
                </Text>
                {route.description?.length > 140 && (
                  <TouchableOpacity style={styles.seeMoreText} onPress={() => {
                    setIsExpanded(!isExpanded);
                  }}>
                    <Text
                      style={styles.seeMoreText}
                    >
                      {isExpanded ? 'daha az' : 'daha fazla'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={styles.reactionContainer}>
              <TouchableOpacity
                style={styles.reactionItem}
                onPress={() => {
                  openComments({
                    routeId: safeRouteId,
                    routeOwnerId: safeAuthorId,
                    parentType: 'routeDetail',
                  });
                }}
              >
                <Icon name="comment-outline" size={18} color="#121" />
                <Text style={styles.reactionText}>{route.comment_count}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem} onPress={async () => {
                if (!userId || !route.id) {return;}

                // Optimistically update UI
                setLocalLikeCount(prev => localDidLike ? prev - 1 : prev + 1);
                setLocalDidLike(prev => !prev);

                const result = localDidLike
                  ? await RouteModel.unlikeRoute(route.id, userId)
                  : await RouteModel.likeRoute(route.id, route.user_id || '', userId);

                if (!result.success) {
                  // Revert on failure
                  setLocalLikeCount(prev => localDidLike ? prev + 1 : prev - 1);
                  setLocalDidLike(prev => !prev);
                }
              }}>
                <Icon name={localDidLike ? 'heart' : 'heart-outline'} size={18} color="#c00" />
                <Text style={styles.reactionText}>{localLikeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="eye-outline" size={18} color="#121" />
                <Text style={styles.reactionText}>{0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem}>
                <Icon name="bookmark-outline" size={18} color="#121" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reactionItem}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  handleSharePress();
                }}
              >
                <Icon name="share-variant" size={18} color="#121" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <KeyboardAwareContainer
            enableScrollView={false}
            style={styles.commentInputContainer}
          >
            <Image
              source={DefaultAvatar}
              style={styles.commentImage}
            />
            <TextInput
              placeholder="Yorum yap"
              placeholderTextColor="#666"
              style={styles.commentInput}
            />
            <TouchableOpacity>
              <Icon name="send" size={20} color="#121" />
            </TouchableOpacity>
          </KeyboardAwareContainer>
        </View>
      </View>

      <ImageViewer
        images={imageUri ? [{ uri: imageUri }] : []}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />

      <ShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postId={safeRouteId}
        postTitle={getRouteShareLabel(route)}
        postImage={imageUri || undefined}
        postUrl={ShareService.generatePostUrl(safeRouteId)}
        cityName={route.cities?.name}
        categoryName={route.categories?.name}
        stopCount={route.title?.trim() ? 1 : 0}
        stopTitles={route.title?.trim() ? [route.title.trim()] : undefined}
        authorUsername={route.profiles?.username}
      />
    </View>
  );
};

export default RouteCard;

import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Text,
  View,
} from 'react-native';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';
import {
  useMapPreviewImageDownload,
  useProfileImageDownload,
} from '../../../hooks/useImageDownload';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import { useCommentsSheet } from '../../../context/CommentsSheetContext';

interface MapRouteRowProps {
  route: RouteWithProfile;
  selected?: boolean;
  distanceLabel?: string | null;
  onPress: () => void;
}

const THUMB_SIZE = 72;

export const MapRouteRow: React.FC<MapRouteRowProps> = ({
  route,
  selected = false,
  distanceLabel = null,
  onPress,
}) => {
  const theme = useAppTheme();
  const { openComments } = useCommentsSheet();
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    rowSelected: {
      backgroundColor: t.surfaceMuted,
    },
    selectedAccent: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: 3,
      borderRadius: 2,
      backgroundColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    imageWrapper: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: t.surfaceMuted,
    },
    imageWrapperSelected: {
      borderWidth: 2,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: t.textPrimary,
      letterSpacing: -0.2,
      lineHeight: 20,
    },
    subtitle: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 18,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    avatar: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.surfaceMuted,
    },
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorName: {
      fontSize: 12,
      color: t.textSecondary,
      fontWeight: '600',
      flexShrink: 1,
    },
    trailing: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 8,
      marginLeft: 4,
    },
    statButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      minWidth: 28,
      justifyContent: 'flex-end',
    },
    statText: {
      fontSize: 12,
      color: t.textMuted,
      fontWeight: '600',
      minWidth: 10,
      textAlign: 'right',
    },
  }));

  const { imageUri } = useMapPreviewImageDownload(
    route.image_url,
    route.user_id || '',
    route.image_preview_url || undefined,
    { cacheOnly: true, previewOnly: true },
  );

  const { imageUri: avatarUri } = useProfileImageDownload(
    route.profiles?.image_url,
    route.user_id || '',
    route.profiles?.image_preview_url,
  );

  const stopTitle = getStopPhotoHintLabel(route);
  const routeLabel = getRouteDisplayLabel(route);
  const username = route.profiles?.username?.trim() || null;

  const primaryTitle = stopTitle || routeLabel;

  const subtitle = useMemo(() => {
    const parts: string[] = [];

    if (stopTitle) {
      parts.push(routeLabel);
    } else if (route.cities?.name) {
      parts.push(route.cities.name);
    }

    if (!stopTitle && route.categories?.name) {
      const category = route.categories.name;

      if (!parts.includes(category)) {
        parts.push(category);
      }
    }

    if (distanceLabel) {
      parts.push(distanceLabel);
    }

    return parts.join(' · ');
  }, [
    distanceLabel,
    route.categories?.name,
    route.cities?.name,
    routeLabel,
    stopTitle,
  ]);

  const showAuthor = !subtitle && Boolean(username);

  const handleCommentPress = useCallback(() => {
    if (!route.id) {
      return;
    }

    openComments({
      routeId: route.id,
      routeOwnerId: route.user_id || route.profiles?.id || '',
      parentType: 'routeDetail',
    });
  }, [openComments, route.id, route.profiles?.id, route.user_id]);

  const likeCount = route.like_count || 0;
  const commentCount = route.comment_count || 0;

  return (
    <View style={[styles.row, selected && styles.rowSelected]}>
      {selected ? <View style={styles.selectedAccent} /> : null}

      <TouchableOpacity
        onPress={onPress}
        disabled={selected}
        activeOpacity={selected ? 1 : 0.7}
        accessibilityState={{ selected }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={[styles.imageWrapper, selected && styles.imageWrapperSelected]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Icon name="image-outline" size={28} color={theme.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {primaryTitle}
          </Text>

          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : showAuthor ? (
            <View style={styles.authorRow}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Icon name="account" size={11} color={theme.textMuted} />
                </View>
              )}
              <Text numberOfLines={1} style={styles.authorName}>
                @{username}
              </Text>
              {route.profiles?.is_verified ? (
                <Icon name="check-decagram" size={12} color={theme.accent} />
              ) : null}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.trailing}>
        <View style={styles.statButton}>
          <Icon name="heart-outline" size={16} color={theme.textMuted} />
          <Text style={styles.statText}>{likeCount}</Text>
        </View>

        <TouchableOpacity
          style={styles.statButton}
          onPress={handleCommentPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={
            commentCount > 0 ? `${commentCount} yorum` : 'Yorum yap'
          }
        >
          <Icon name="comment-outline" size={16} color={theme.textMuted} />
          <Text style={styles.statText}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapRouteRow;

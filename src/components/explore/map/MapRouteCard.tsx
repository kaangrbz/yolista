import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import {
  usePostImageDownload,
  useProfileImageDownload,
} from '../../../hooks/useImageDownload';

interface MapRouteCardProps {
  route: RouteWithProfile;
  selected?: boolean;
  onPress: () => void;
}

const CARD_WIDTH = 232;
const IMAGE_HEIGHT = 124;
const CONTENT_HEIGHT = 62;

export const MapRouteCard: React.FC<MapRouteCardProps> = ({
  route,
  selected = false,
  onPress,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    card: {
      width: CARD_WIDTH,
      backgroundColor: t.background,
      borderRadius: 14,
      marginHorizontal: 6,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    cardSelected: {
      borderColor: t.accent,
      borderWidth: 2,
    },
    imageWrapper: {
      position: 'relative',
      width: '100%',
      height: IMAGE_HEIGHT,
      backgroundColor: t.surfaceMuted,
      overflow: 'hidden',
      borderTopLeftRadius: 13,
      borderTopRightRadius: 13,
    },
    imageFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageOverlayRow: {
      paddingTop: 8,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 6,
    },
    chipSpacer: {
      flex: 0,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.overlayDark,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      maxWidth: '70%',
      flexShrink: 1,
    },
    categoryChipText: {
      color: t.background,
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
      flexShrink: 1,
    },
    likeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.overlayDark,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      flexShrink: 0,
    },
    likeBadgeText: {
      color: t.background,
      fontSize: 10,
      fontWeight: '700',
      marginLeft: 3,
    },
    content: {
      minHeight: CONTENT_HEIGHT,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: t.background,
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 6,
      lineHeight: 18,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    avatar: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 6,
      backgroundColor: t.surfaceMuted,
    },
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorName: {
      fontSize: 11,
      color: t.textSecondary,
      fontWeight: '600',
      flexShrink: 1,
    },
    verifiedIcon: {
      marginLeft: 3,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: t.textSecondary,
      flexShrink: 1,
    },
    metaTextMuted: {
      fontSize: 12,
      color: t.textMuted,
      fontStyle: 'italic',
    },
  }));

  const { imageUri } = usePostImageDownload(
    route.image_url,
    route.user_id || '',
  );

  const { imageUri: avatarUri } = useProfileImageDownload(
    route.profiles?.image_url,
    route.user_id || '',
    route.profiles?.image_preview_url,
  );

  const username = route.profiles?.username?.trim() || null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imageFill} />
        ) : (
          <View style={[styles.imageFill, styles.imagePlaceholder]}>
            <Icon
              name="image-outline"
              size={28}
              color={theme.textMuted}
            />
          </View>
        )}

        <View style={styles.imageOverlayRow} pointerEvents="box-none">
          {route.categories?.name ? (
            <View style={styles.categoryChip}>
              <Icon
                name={route.categories.icon_name || 'tag'}
                size={11}
                color={theme.background}
              />
              <Text numberOfLines={1} style={styles.categoryChipText}>
                {route.categories.name}
              </Text>
            </View>
          ) : (
            <View style={styles.chipSpacer} />
          )}

          <View style={styles.likeBadge}>
            <Icon name="heart" size={11} color={theme.background} />
            <Text style={styles.likeBadgeText}>{route.like_count || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {route.title}
        </Text>

        {username ? (
          <View style={styles.authorRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Icon name="account" size={10} color={theme.textMuted} />
              </View>
            )}
            <Text numberOfLines={1} style={styles.authorName}>
              @{username}
            </Text>
            {route.profiles?.is_verified ? (
              <Icon
                name="check-decagram"
                size={11}
                color={theme.accent}
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {route.cities?.name ? (
            <>
              <Icon
                name="map-marker"
                size={12}
                color={theme.textSecondary}
              />
              <Text numberOfLines={1} style={styles.metaText}>
                {route.cities.name}
              </Text>
            </>
          ) : (
            <Text style={styles.metaTextMuted}>Konum yok</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MapRouteCard;

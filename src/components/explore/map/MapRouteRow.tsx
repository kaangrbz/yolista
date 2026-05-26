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
import { getRouteDisplayLabel } from '../../../utils/getRouteDisplayLabel';
import {
  getRouteLocationLabel,
  getRouteLocationSource,
} from '../../../utils/routeLocationLabel';
import {
  usePostImageDownload,
  useProfileImageDownload,
} from '../../../hooks/useImageDownload';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';

interface MapRouteRowProps {
  route: RouteWithProfile;
  selected?: boolean;
  onPress: () => void;
}

/**
 * Bottom sheet'in dikey listesinde gözüken satır — Google Maps'in
 * arama sonuçları satırına benzer: solda kare fotoğraf, sağda metin yığını.
 */
export const MapRouteRow: React.FC<MapRouteRowProps> = ({
  route,
  selected = false,
  onPress,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    rowSelected: {
      backgroundColor: t.surfaceMuted,
    },
    imageWrapper: {
      width: 64,
      height: 64,
      borderRadius: 10,
      overflow: 'hidden',
      marginRight: 12,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
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
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 4,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
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
      flexShrink: 1,
      fontWeight: '600',
    },
    verifiedIcon: {
      marginLeft: 3,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    metaText: {
      fontSize: 11,
      color: t.textSecondary,
      marginLeft: 3,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: t.textMuted,
      marginHorizontal: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      marginLeft: 8,
      maxWidth: 110,
    },
    chipText: {
      fontSize: 10,
      color: t.textSecondary,
      marginLeft: 3,
      fontWeight: '600',
    },
    chevron: {
      marginLeft: 6,
    },
  }));

  const { imageUri } = usePostImageDownload(
    route.image_url,
    route.user_id || '',
    route.image_preview_url || undefined,
  );

  const { imageUri: avatarUri } = useProfileImageDownload(
    route.profiles?.image_url,
    route.user_id || '',
    route.profiles?.image_preview_url,
  );

  const username = route.profiles?.username?.trim() || null;
  const locationLabel = getRouteLocationLabel(getRouteLocationSource(route));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={[styles.imageWrapper, selected && styles.imageWrapperSelected]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Icon
              name="image-outline"
              size={26}
              color={theme.textMuted}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {getRouteDisplayLabel(route)}
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
              {locationLabel ? (
                <>
                  <View style={styles.dot} />
                  <Text numberOfLines={1} style={styles.metaText}>
                    {locationLabel}
                  </Text>
                </>
              ) : (
                <View style={styles.dot} />
              )}
            </>
          ) : locationLabel ? (
            <Text numberOfLines={1} style={styles.metaText}>
              {locationLabel}
            </Text>
          ) : null}

          <Icon
            name="heart"
            size={12}
            color={theme.textSecondary}
          />
          <Text style={styles.metaText}>{route.like_count || 0}</Text>

          {route.categories?.name ? (
            <View style={styles.chip}>
              <Icon
                name={route.categories.icon_name || 'tag'}
                size={10}
                color={theme.textSecondary}
              />
              <Text numberOfLines={1} style={styles.chipText}>
                {route.categories.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Icon
        name="chevron-right"
        size={20}
        color={theme.textMuted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

export default MapRouteRow;

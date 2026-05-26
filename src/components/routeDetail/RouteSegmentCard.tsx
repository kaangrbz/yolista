import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../model/routes.model';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { useMapPreviewImageDownload } from '../../hooks/useImageDownload';
import { getStopPhotoHintLabel } from '../../utils/getStopPhotoHintLabel';
import { openStopInMaps } from '../../utils/openInMaps';

interface RouteSegmentCardProps {
  stop: RouteWithProfile;
  stopIndex: number;
  selected?: boolean;
  onPress?: () => void;
}

export const RouteSegmentCard: React.FC<RouteSegmentCardProps> = ({
  stop,
  stopIndex,
  selected = false,
  onPress,
}) => {
  const theme = useAppTheme();
  const label = getStopPhotoHintLabel(stop);
  const hasCoordinate =
    typeof stop.latitude === 'number' && typeof stop.longitude === 'number';
  const description = stop.description?.trim() || '';

  const { imageUri } = useMapPreviewImageDownload(
    stop.image_url,
    stop.user_id || '',
    stop.image_preview_url || undefined,
    { cacheOnly: true, previewOnly: true },
  );

  const styles = useThemedStyles((t) => ({
    card: {
      marginHorizontal: 16,
      borderRadius: 14,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? MAP_ACTIVE_ROUTE_BORDER : t.border,
      backgroundColor: t.background,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    thumb: {
      width: 72,
      height: 72,
      backgroundColor: t.surfaceMuted,
    },
    thumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: selected ? MAP_ACTIVE_ROUTE_BORDER : t.surfaceMuted,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: selected ? '#fff' : t.textPrimary,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      color: t.textSecondary,
    },
    locationMissing: {
      fontSize: 11,
      color: t.textMuted,
      fontStyle: 'italic',
    },
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    mapsButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: t.accent,
    },
  }));

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.88 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.row}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Icon name="image-outline" size={22} color={theme.textMuted} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stopIndex + 1}</Text>
            </View>
            {label ? <Text style={styles.title} numberOfLines={1}>{label}</Text> : null}
          </View>

          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          {!hasCoordinate ? (
            <Text style={styles.locationMissing}>Konum yok</Text>
          ) : (
            <TouchableOpacity
              style={styles.mapsButton}
              activeOpacity={0.85}
              onPress={() => {
                void openStopInMaps({
                  latitude: stop.latitude as number,
                  longitude: stop.longitude as number,
                });
              }}
            >
              <Icon name="map-marker-radius" size={14} color={theme.accent} />
              <Text style={styles.mapsButtonText}>Bu durağı haritada aç</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RouteSegmentCard;

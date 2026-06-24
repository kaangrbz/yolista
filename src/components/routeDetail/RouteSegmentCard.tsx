import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RouteWithProfile } from '../../model/routes.model';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../constants/mapDefaults';
import { useThemedStyles } from '../../theme/useThemedStyles';
import SmartImage from '../common/smart-image/SmartImage';
import { getStopPhotoHintLabel } from '../../utils/getStopPhotoHintLabel';

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
  const label = getStopPhotoHintLabel(stop);
  const description = stop.description?.trim() || '';

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
  }));

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.88 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.row}>
        <SmartImage
          kind="routePreview"
          userId={stop.user_id || ''}
          imageUrl={stop.image_url}
          imagePreviewUrl={stop.image_preview_url}
          cacheOnly
          previewOnly
          width={72}
          height={72}
          style={styles.thumb}
        />

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
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RouteSegmentCard;

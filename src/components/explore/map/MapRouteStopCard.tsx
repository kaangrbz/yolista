import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteWithProfile } from '../../../model/routes.model';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import SmartImage from '../../common/smart-image/SmartImage';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';
import { getStopLetterLabel } from '../../../utils/getStopOrderLabel';

interface MapRouteStopCardProps {
  stop: RouteWithProfile;
  stopLabel: string;
  selected?: boolean;
  onPress?: () => void;
}

export const MAP_ROUTE_STOP_CARD_WIDTH = 200;
export const MAP_ROUTE_STOP_CARD_STEP = MAP_ROUTE_STOP_CARD_WIDTH + 12;

const CARD_WIDTH = MAP_ROUTE_STOP_CARD_WIDTH;
const IMAGE_HEIGHT = 112;

export const MapRouteStopCard: React.FC<MapRouteStopCardProps> = ({
  stop,
  stopLabel,
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
    },
    cardSelected: {
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
      borderWidth: 2,
      shadowColor: MAP_ACTIVE_ROUTE_BORDER,
      shadowOpacity: 0.28,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    imageWrapper: {
      width: '100%',
      height: IMAGE_HEIGHT,
      backgroundColor: t.surfaceMuted,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.overlayDark,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      gap: 4,
    },
    stopBadgeText: {
      color: t.id === 'light' ? '#fff' : t.textPrimary,
      fontSize: 10,
      fontWeight: '700',
    },
    noLocationBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.overlayDark,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      gap: 4,
    },
    noLocationBadgeText: {
      color: t.id === 'light' ? '#fff' : t.textPrimary,
      fontSize: 10,
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 10,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 4,
      lineHeight: 17,
    },
    description: {
      fontSize: 11,
      color: t.textSecondary,
      lineHeight: 15,
    },
    descriptionEmpty: {
      fontSize: 11,
      color: t.textMuted,
      fontStyle: 'italic',
    },
  }));

  const userId = stop.user_id || stop.profiles?.id || '';

  const description = stop.description?.trim() || '';
  const hasStopLabel = Boolean(stopLabel);
  const stopBadgeLabel = getStopLetterLabel(stop.order_index ?? 0);
  const hasCoordinates =
    typeof stop.latitude === 'number' && typeof stop.longitude === 'number';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.88 : 1}
      disabled={!onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.imageWrapper}>
        <SmartImage
          kind="route"
          userId={userId}
          imageUrl={stop.image_url}
          imagePreviewUrl={stop.image_preview_url}
          width={CARD_WIDTH}
          height={IMAGE_HEIGHT}
          style={styles.image}
        />

        <View style={styles.stopBadge}>
          <Icon
            name={stop.order_index === 0 ? 'flag-checkered' : 'map-marker'}
            size={11}
            color={theme.id === 'light' ? '#fff' : theme.textPrimary}
          />
          <Text numberOfLines={1} style={styles.stopBadgeText}>
            {stopBadgeLabel}
          </Text>
        </View>

        {!hasCoordinates ? (
          <View style={styles.noLocationBadge}>
            <Icon
              name="map-marker-off-outline"
              size={11}
              color={theme.id === 'light' ? '#fff' : theme.textPrimary}
            />
            <Text style={styles.noLocationBadgeText}>Konum yok</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        {hasStopLabel ? (
          <Text numberOfLines={2} style={styles.title}>
            {stopLabel}
          </Text>
        ) : null}
        {description ? (
          <Text numberOfLines={3} style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export function getMapStopKey(stop: RouteWithProfile): string {
  return String(stop.id ?? stop.order_index ?? '');
}

export function getMapStopLabel(stop: RouteWithProfile): string {
  return getStopPhotoHintLabel(stop);
}

export default MapRouteStopCard;

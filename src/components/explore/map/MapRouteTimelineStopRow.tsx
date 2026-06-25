import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RouteWithProfile } from '../../../model/routes.model';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import SmartImage from '../../common/smart-image/SmartImage';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';
import { getMapStopKey } from './MapRouteStopCard';

const THUMB_SIZE = 56;
const PIN_SIZE = 28;

interface MapRouteTimelineStopRowProps {
  stop: RouteWithProfile;
  stopNumber: number;
  selected?: boolean;
  showConnectorBelow?: boolean;
  onPress?: () => void;
  onImagePress?: () => void;
}

export const MapRouteTimelineStopRow: React.FC<MapRouteTimelineStopRowProps> = ({
  stop,
  stopNumber,
  selected = false,
  showConnectorBelow = true,
  onPress,
  onImagePress,
}) => {
  const userId = stop.user_id || stop.profiles?.id || '';
  const title = getStopPhotoHintLabel(stop) || `Durak ${stopNumber}`;
  const description = stop.description?.trim() || '';

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 18,
      minHeight: THUMB_SIZE + 8,
    },
    rail: {
      width: PIN_SIZE,
      alignItems: 'center',
      marginRight: 10,
      paddingTop: 4,
    },
    pinOuter: {
      width: PIN_SIZE,
      height: PIN_SIZE,
      borderRadius: PIN_SIZE / 2,
      borderWidth: 2,
      borderColor: selected ? MAP_ACTIVE_ROUTE_BORDER : MAP_ACTIVE_ROUTE_BORDER,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.background,
    },
    pinInner: {
      width: PIN_SIZE - 10,
      height: PIN_SIZE - 10,
      borderRadius: (PIN_SIZE - 10) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: selected ? MAP_ACTIVE_ROUTE_BORDER : t.surfaceMuted,
    },
    pinText: {
      fontSize: 11,
      fontWeight: '800',
      color: selected ? '#fff' : t.textPrimary,
    },
    connector: {
      width: 2,
      flex: 1,
      minHeight: 12,
      marginTop: 4,
      backgroundColor: MAP_ACTIVE_ROUTE_BORDER,
      opacity: 0.45,
      borderRadius: 1,
    },
    card: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      opacity: 0.92,
      borderWidth: 1,
      borderColor: selected ? MAP_ACTIVE_ROUTE_BORDER : t.border,
    },
    cardSelected: {
      borderWidth: 2,
      opacity: 1,
    },
    thumbButton: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: t.background,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: t.textPrimary,
      lineHeight: 18,
    },
    description: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 16,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.pinOuter}>
          <View style={styles.pinInner}>
            <Text style={styles.pinText}>{stopNumber}</Text>
          </View>
        </View>
        {showConnectorBelow ? <View style={styles.connector} /> : null}
      </View>

      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={onPress ? 0.88 : 1}
        disabled={!onPress}
        onPress={onPress}
        accessibilityLabel={`Durak ${stopNumber}: ${title}`}
      >
        <TouchableOpacity
          style={styles.thumbButton}
          activeOpacity={onImagePress ? 0.85 : 1}
          disabled={!onImagePress}
          onPress={(event) => {
            event.stopPropagation?.();
            onImagePress?.();
          }}
          accessibilityLabel="Durak fotoğrafını önizle"
        >
          <SmartImage
            kind="route"
            variant="thumb"
            userId={userId}
            imageUrl={stop.image_url}
            imageThumbUrl={stop.image_thumb_url}
            imageMediumUrl={stop.image_medium_url}
            strictVariant
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            borderRadius={8}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export { getMapStopKey };

export default MapRouteTimelineStopRow;

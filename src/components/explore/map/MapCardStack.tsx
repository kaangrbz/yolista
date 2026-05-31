import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  ViewProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import {
  MAP_MARKER_CARD_BASE_BOTTOM,
  MAP_MARKER_CARD_BASE_LEFT,
  MAP_MARKER_CARD_SIZE,
  MAP_MARKER_HEIGHT,
  MAP_MARKER_STACK_HEIGHT,
  MAP_MARKER_STACK_WIDTH,
  MAP_MARKER_TAIL_HEIGHT,
  MAP_MARKER_TAIL_WIDTH,
  MAP_MARKER_WIDTH,
  MapMarkerCardSlot,
  getMapMarkerBadgeLabel,
  getMapMarkerStackSlots,
  getMapMarkerVisibleCount,
} from '../../../constants/mapMarkerLayout';
import { useMapPreviewImageDownload } from '../../../hooks/useImageDownload';

export interface MapCardStackItem {
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  userId?: string | null;
  iconName?: string;
  estimatedLocation?: boolean;
}

interface MapCardStackProps extends Pick<ViewProps, 'collapsable'> {
  count: number;
  items?: MapCardStackItem[];
  selected?: boolean;
  dimmed?: boolean;
  accentColor?: string;
  orderLabel?: string;
  badgeLabel?: string | null;
  variant?: 'route' | 'cluster';
  onImageReady?: () => void;
}

interface MapCardStackCardProps {
  item: MapCardStackItem;
  slot: MapMarkerCardSlot;
  selected: boolean;
  isFront: boolean;
  variant: 'route' | 'cluster';
  accentColor: string;
  badgeLabel?: string | null;
  onLoad?: () => void;
}

const MapCardStackCard: React.FC<MapCardStackCardProps> = ({
  item,
  slot,
  selected,
  isFront,
  variant,
  accentColor,
  badgeLabel,
  onLoad,
}) => {
  const theme = useAppTheme();
  const storageKey = item.imagePreviewUrl || item.imageUrl;
  const { imageUri, loading } = useMapPreviewImageDownload(
    item.imageUrl || undefined,
    item.userId || '',
    item.imagePreviewUrl || undefined,
  );

  useEffect(() => {
    if (variant === 'cluster') {
      onLoad?.();
      return;
    }

    if (!storageKey || !item.userId) {
      onLoad?.();
      return;
    }

    if (!loading && !imageUri) {
      onLoad?.();
    }
  }, [imageUri, item.userId, loading, onLoad, storageKey, variant]);

  const showImage = variant === 'route' && Boolean(imageUri);
  const iconName = item.iconName || 'map-marker';
  const borderColor =
    selected && isFront
      ? accentColor
      : item.estimatedLocation && isFront
        ? theme.textMuted
        : accentColor;

  return (
    <View
      style={[
        styles.card,
        {
          left: MAP_MARKER_CARD_BASE_LEFT,
          bottom: MAP_MARKER_CARD_BASE_BOTTOM,
          zIndex: slot.zIndex,
          opacity: slot.opacity,
          borderColor,
          borderWidth: selected && isFront ? 2 : 2,
          borderStyle: item.estimatedLocation && isFront ? 'dashed' : 'solid',
          transform: [{ translateX: slot.translateX }, { rotate: slot.rotate }],
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri as string }}
          style={styles.cardImage}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={onLoad}
          onError={onLoad}
        />
      ) : variant === 'cluster' ? (
        <View style={[styles.cardImage, styles.cardBack, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.cardBackLine, { backgroundColor: theme.accent }]} />
          <View style={[styles.cardBackLineReverse, { backgroundColor: theme.accent }]} />
          <Icon name="routes" size={16} color={theme.accent} />
        </View>
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name={iconName} size={18} color={theme.textPrimary} />
        </View>
      )}

      {isFront && badgeLabel ? (
        <View style={[styles.badge, { backgroundColor: accentColor, borderColor: theme.background }]}>
          <Text style={[styles.badgeText, { color: theme.background }]}>{badgeLabel}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const MapCardStack: React.FC<MapCardStackProps> = ({
  count,
  items,
  selected = false,
  dimmed = false,
  accentColor: accentColorProp,
  orderLabel,
  badgeLabel: badgeLabelProp,
  variant = 'route',
  onImageReady,
  collapsable,
}) => {
  const theme = useAppTheme();
  const accentColor = accentColorProp ?? theme.accent;
  const safeCount = Math.max(1, count);
  const visibleCount = getMapMarkerVisibleCount(safeCount);
  const slots = getMapMarkerStackSlots(safeCount);
  const badgeLabel =
    badgeLabelProp !== undefined
      ? badgeLabelProp
      : orderLabel || getMapMarkerBadgeLabel(safeCount);
  const loadedRef = useRef(0);
  const [allLoaded, setAllLoaded] = useState(variant === 'cluster');

  const resolvedItems = useMemo((): MapCardStackItem[] => {
    const source = items && items.length > 0 ? items.slice(0, visibleCount) : [];
    const padded = [...source];

    while (padded.length < visibleCount) {
      padded.push(items?.[0] ?? {});
    }

    return padded;
  }, [items, visibleCount]);

  const handleCardLoad = useCallback(() => {
    loadedRef.current += 1;

    if (loadedRef.current >= visibleCount) {
      setAllLoaded(true);
    }
  }, [visibleCount]);

  useEffect(() => {
    loadedRef.current = 0;
    setAllLoaded(variant === 'cluster');
  }, [resolvedItems, variant, visibleCount]);

  useEffect(() => {
    if (allLoaded) {
      onImageReady?.();
    }
  }, [allLoaded, onImageReady]);

  return (
    <View
      style={[styles.root, dimmed && !selected ? styles.rootDimmed : null]}
      collapsable={collapsable}
    >
      <View style={styles.stack}>
        <View style={[styles.tail, { borderTopColor: accentColor }]} />
        {resolvedItems.map((item, index) => (
          <MapCardStackCard
            key={`card-${index}`}
            item={item}
            slot={slots[index]}
            selected={selected}
            isFront={index === visibleCount - 1}
            variant={variant}
            accentColor={accentColor}
            badgeLabel={index === visibleCount - 1 ? badgeLabel : null}
            onLoad={handleCardLoad}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: MAP_MARKER_WIDTH,
    height: MAP_MARKER_HEIGHT,
  },
  rootDimmed: {
    opacity: 0.42,
  },
  stack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MAP_MARKER_STACK_WIDTH,
    height: MAP_MARKER_STACK_HEIGHT,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    width: MAP_MARKER_CARD_SIZE,
    height: MAP_MARKER_CARD_SIZE,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardImage: {
    width: MAP_MARKER_CARD_SIZE,
    height: MAP_MARKER_CARD_SIZE,
  },
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackLine: {
    position: 'absolute',
    width: '140%',
    height: 2,
    opacity: 0.2,
    transform: [{ rotate: '45deg' }],
  },
  cardBackLineReverse: {
    position: 'absolute',
    width: '140%',
    height: 2,
    opacity: 0.2,
    transform: [{ rotate: '-45deg' }],
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tail: {
    position: 'absolute',
    left: (MAP_MARKER_WIDTH - MAP_MARKER_TAIL_WIDTH) / 2,
    bottom: 0,
    zIndex: 0,
    width: 0,
    height: 0,
    borderLeftWidth: MAP_MARKER_TAIL_WIDTH / 2,
    borderRightWidth: MAP_MARKER_TAIL_WIDTH / 2,
    borderTopWidth: MAP_MARKER_TAIL_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default MapCardStack;

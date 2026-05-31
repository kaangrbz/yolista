import React from 'react';
import { ViewProps } from 'react-native';
import MapCardStack, { MapCardStackItem } from './MapCardStack';

interface MapRouteMarkerProps extends Pick<ViewProps, 'collapsable'> {
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  userId?: string | null;
  iconName?: string;
  selected?: boolean;
  dimmed?: boolean;
  accentColor?: string;
  stackCount?: number;
  stackItems?: MapCardStackItem[];
  orderLabel?: string;
  badgeLabel?: string | null;
  estimatedLocation?: boolean;
  onImageReady?: () => void;
}

export const MapRouteMarker: React.FC<MapRouteMarkerProps> = ({
  imageUrl,
  imagePreviewUrl,
  userId,
  iconName = 'map-marker',
  selected = false,
  dimmed = false,
  accentColor,
  stackCount = 1,
  stackItems,
  orderLabel,
  badgeLabel,
  estimatedLocation = false,
  onImageReady,
  collapsable,
}) => {
  const safeStack = Math.max(1, stackCount);
  const resolvedItems: MapCardStackItem[] =
    stackItems && stackItems.length > 0
      ? stackItems
      : [{ imageUrl, imagePreviewUrl, userId, iconName, estimatedLocation }];

  return (
    <MapCardStack
      count={orderLabel ? 1 : safeStack}
      items={resolvedItems}
      selected={selected}
      dimmed={dimmed}
      accentColor={accentColor}
      orderLabel={orderLabel}
      badgeLabel={badgeLabel}
      onImageReady={onImageReady}
      collapsable={collapsable}
    />
  );
};

export default MapRouteMarker;

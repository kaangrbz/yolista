import React from 'react';
import MapCardStack from './MapCardStack';

interface MapClusterMarkerProps {
  count: number;
}

export const MapClusterMarker: React.FC<MapClusterMarkerProps> = ({ count }) => {
  const safeCount = Math.max(1, count);

  return (
    <MapCardStack
      count={safeCount}
      variant="cluster"
      badgeLabel={String(safeCount)}
    />
  );
};

export default MapClusterMarker;

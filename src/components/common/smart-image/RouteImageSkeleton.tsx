import React from 'react';
import { View, type DimensionValue } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonLoader from '../SkeletonLoader';
import { useAppTheme } from '../../../context/AppThemeContext';

interface RouteImageSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

const RouteImageSkeleton: React.FC<RouteImageSkeletonProps> = ({
  width = '100%',
  height = '100%',
  borderRadius = 0,
}) => {
  const theme = useAppTheme();
  const iconSize =
    typeof height === 'number' ? Math.max(20, Math.min(height * 0.35, 48)) : 32;

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
      <SkeletonLoader
        width={width as number | `${number}%` | undefined}
        height={height as number | `${number}%` | undefined}
        borderRadius={borderRadius}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '18%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="image-filter-hdr" size={iconSize} color={theme.textMuted} />
      </View>
    </View>
  );
};

export default RouteImageSkeleton;

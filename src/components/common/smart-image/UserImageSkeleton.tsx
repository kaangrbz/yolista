import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonLoader from '../SkeletonLoader';
import { useAppTheme } from '../../../context/AppThemeContext';

interface UserImageSkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
}

const UserImageSkeleton: React.FC<UserImageSkeletonProps> = ({
  width = 40,
  height = 40,
  borderRadius,
}) => {
  const theme = useAppTheme();
  const radius = borderRadius ?? Math.min(width, height) / 2;

  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
      <SkeletonLoader width={width} height={height} borderRadius={radius} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="account" size={Math.max(14, Math.min(width, height) * 0.45)} color={theme.textMuted} />
      </View>
    </View>
  );
};

export default UserImageSkeleton;

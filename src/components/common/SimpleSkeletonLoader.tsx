import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface SimpleSkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const SimpleSkeletonLoader: React.FC<SimpleSkeletonLoaderProps> = ({
  width: customWidth = '100%',
  height: customHeight = 20,
  borderRadius = 4,
  style,
}) => {
  const styles = useThemedStyles((t) => ({
    skeleton: {
      backgroundColor: t.surfaceMuted,
    },
  }));

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: customWidth,
          height: customHeight,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

export default SimpleSkeletonLoader;

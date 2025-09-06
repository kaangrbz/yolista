import React from 'react';
import { View, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
  },
});

export default SimpleSkeletonLoader;

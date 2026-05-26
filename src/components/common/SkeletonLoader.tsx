import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width: customWidth = '100%',
  height: customHeight = 20,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const styles = useThemedStyles((t) => ({
    container: {
      backgroundColor: t.surfaceMuted,
      overflow: 'hidden',
    },
    shimmer: {
      flex: 1,
      backgroundColor: t.borderStrong,
    },
  }));

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animate();

    return () => {
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <View
      style={[
        styles.container,
        {
          width: customWidth,
          height: customHeight,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
          },
        ]}
      />
    </View>
  );
};

export default SkeletonLoader;

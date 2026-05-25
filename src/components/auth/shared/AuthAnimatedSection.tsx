import React, { useEffect } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { ReanimatedView } from '../../../utils/reanimatedComponents';

interface AuthAnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

const AuthAnimatedSection: React.FC<AuthAnimatedSectionProps> = ({
  children,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, { damping: 18, stiffness: 120 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ReanimatedView
      style={[animatedStyle, style]}
      collapsable={Platform.OS === 'android' ? false : undefined}
    >
      {children}
    </ReanimatedView>
  );
};

export default AuthAnimatedSection;

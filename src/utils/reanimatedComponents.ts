import type { ComponentProps, ComponentType, ReactElement } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

type ReanimatedComponent<P> = ComponentType<P> & {
  (props: P): ReactElement | null;
};

export const ReanimatedView = Animated.View as ReanimatedComponent<
  AnimatedProps<ComponentProps<typeof View>>
>;

export const ReanimatedTouchable = Animated.createAnimatedComponent(
  TouchableOpacity,
) as ReanimatedComponent<AnimatedProps<ComponentProps<typeof TouchableOpacity>>>;

export const ReanimatedAnimatedView = Animated.createAnimatedComponent(
  View,
) as ReanimatedComponent<AnimatedProps<ComponentProps<typeof View>>>;

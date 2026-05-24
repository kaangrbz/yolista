import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { authTheme } from '../../../theme/authTheme';

const AuthFloatingBackground: React.FC = () => {
  const orbOneY = useSharedValue(0);
  const orbTwoY = useSharedValue(0);
  const orbThreeScale = useSharedValue(1);

  useEffect(() => {
    orbOneY.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    orbTwoY.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-8, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    orbThreeScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [orbOneY, orbTwoY, orbThreeScale]);

  const orbOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbOneY.value }],
  }));

  const orbTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbTwoY.value }],
  }));

  const orbThreeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbThreeScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.gradientBase} />
      <View style={styles.topWash} />
      <Animated.View style={[styles.orb, styles.orbOne, orbOneStyle]} />
      <Animated.View style={[styles.orb, styles.orbTwo, orbTwoStyle]} />
      <Animated.View style={[styles.orb, styles.orbThree, orbThreeStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: authTheme.backgroundBottom,
  },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: authTheme.backgroundTop,
    opacity: 0.85,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbOne: {
    width: 220,
    height: 220,
    top: -40,
    right: -50,
    backgroundColor: authTheme.orb1,
  },
  orbTwo: {
    width: 160,
    height: 160,
    top: 120,
    left: -40,
    backgroundColor: authTheme.orb2,
  },
  orbThree: {
    width: 280,
    height: 280,
    bottom: -80,
    right: -60,
    backgroundColor: authTheme.orb3,
  },
});

export default AuthFloatingBackground;

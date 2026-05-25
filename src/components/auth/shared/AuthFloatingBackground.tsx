import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ReanimatedView } from '../../../utils/reanimatedComponents';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';

const AuthFloatingBackground: React.FC = () => {
  const styles = useAuthThemedStyles((t) => ({
    container: {
      ...StyleSheet.absoluteFill,
    },
    orbSlot: {
      position: 'absolute',
    },
    orb: {
      borderRadius: 999,
    },
    orbOneSlot: {
      top: 48,
      right: -72,
    },
    orbOne: {
      width: 240,
      height: 240,
      backgroundColor: t.orb1,
      opacity: 0.55,
    },
    orbTwoSlot: {
      top: 220,
      left: -56,
    },
    orbTwo: {
      width: 180,
      height: 180,
      backgroundColor: t.orb2,
      opacity: 0.45,
    },
    orbThreeSlot: {
      bottom: 48,
      right: -88,
    },
    orbThree: {
      width: 300,
      height: 300,
      backgroundColor: t.orb3,
      opacity: 0.5,
    },
  }));

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
      <ReanimatedView style={[styles.orbSlot, styles.orbOneSlot, orbOneStyle]}>
        <View style={[styles.orb, styles.orbOne]} />
      </ReanimatedView>
      <ReanimatedView style={[styles.orbSlot, styles.orbTwoSlot, orbTwoStyle]}>
        <View style={[styles.orb, styles.orbTwo]} />
      </ReanimatedView>
      <ReanimatedView style={[styles.orbSlot, styles.orbThreeSlot, orbThreeStyle]}>
        <View style={[styles.orb, styles.orbThree]} />
      </ReanimatedView>
    </View>
  );
};

export default AuthFloatingBackground;

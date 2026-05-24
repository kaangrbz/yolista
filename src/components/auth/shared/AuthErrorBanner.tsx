import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { authTheme } from '../../../theme/authTheme';

interface AuthErrorBannerProps {
  message: string;
}

const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({ message }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    opacity.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, [message, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!message) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Icon name="alert-circle-outline" size={20} color={authTheme.error} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authTheme.errorBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.errorBorder,
    marginBottom: 16,
    gap: 10,
  },
  text: {
    flex: 1,
    color: authTheme.error,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AuthErrorBanner;

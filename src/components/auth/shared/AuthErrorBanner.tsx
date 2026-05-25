import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ReanimatedView } from '../../../utils/reanimatedComponents';
import { useAuthTheme } from '../../../context/AppThemeContext';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';

interface AuthErrorBannerProps {
  message: string;
}

const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({ message }) => {
  const theme = useAuthTheme();
  const styles = useAuthThemedStyles((t) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.errorBg,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.errorBorder,
      marginBottom: 16,
      gap: 10,
    },
    text: {
      flex: 1,
      color: t.error,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

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
    <ReanimatedView style={[styles.container, animatedStyle]}>
      <Icon name="alert-circle-outline" size={20} color={theme.error} />
      <Text style={styles.text}>{message}</Text>
    </ReanimatedView>
  );
};

export default AuthErrorBanner;

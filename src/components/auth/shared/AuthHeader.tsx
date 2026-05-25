import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { authVariantConfig, AuthVariant } from '../../../theme/authTheme';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';

interface AuthHeaderProps {
  variant: AuthVariant;
  title?: string;
  subtitle?: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ variant, title, subtitle }) => {
  const config = authVariantConfig[variant];
  const styles = useAuthThemedStyles((t) => ({
    container: {
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 12,
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: t.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: t.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 12,
      maxWidth: 300,
    },
  }));

  const iconScale = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    iconOpacity.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [iconOpacity, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? config.title}</Text>
      <Text style={styles.subtitle}>{subtitle ?? config.subtitle}</Text>
    </View>
  );
};

export default AuthHeader;

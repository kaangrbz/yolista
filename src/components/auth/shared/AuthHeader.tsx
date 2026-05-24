import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { authTheme, authVariantConfig, AuthVariant } from '../../../theme/authTheme';

interface AuthHeaderProps {
  variant: AuthVariant;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ variant }) => {
  const config = authVariantConfig[variant];
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
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: authTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: authTheme.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: authTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    maxWidth: 300,
  },
});

export default AuthHeader;

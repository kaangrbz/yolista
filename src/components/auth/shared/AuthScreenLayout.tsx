import React from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Logo } from '../../Logo';
import AuthFloatingBackground from './AuthFloatingBackground';
import AuthHeader from './AuthHeader';
import { AppThemeToggle } from '../../settings/AppThemeToggle';
import { useAuthTheme } from '../../../context/AppThemeContext';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';
import { AuthVariant } from '../../../theme/authTheme';

const { height } = Dimensions.get('window');

interface AuthScreenLayoutProps {
  variant: AuthVariant;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  variant,
  children,
  showBack = false,
  onBack,
  headerTitle,
  headerSubtitle,
}) => {
  const insets = useSafeAreaInsets();
  const authTheme = useAuthTheme();
  const styles = useAuthThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.backgroundBottom,
    },
    backgroundLayer: {
      ...StyleSheet.absoluteFill,
    },
    gradientBase: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.backgroundBottom,
    },
    topWash: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '55%',
      backgroundColor: t.backgroundTop,
      opacity: 0.7,
    },
    keyboardContainer: {
      flex: 1,
      zIndex: 1,
      elevation: 1,
      backgroundColor: 'transparent',
    },
    scrollView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      minHeight: height,
      backgroundColor: 'transparent',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: t.backButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 8,
    },
    backPlaceholder: {
      height: 44,
      marginBottom: 8,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: t.cardBorder,
      shadowColor: t.cardShadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    footer: {
      alignItems: 'center',
      marginTop: 28,
      paddingBottom: 8,
      gap: 16,
    },
    footerTagline: {
      fontSize: 12,
      color: t.textMuted,
      letterSpacing: 0.5,
    },
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={authTheme.statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.backgroundLayer} pointerEvents="none">
        <View style={styles.gradientBase} />
        <View style={styles.topWash} />
        <AuthFloatingBackground />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          removeClippedSubviews={false}
        >
          {showBack && onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="arrow-left" size={24} color={authTheme.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <View style={styles.logoContainer}>
            <Logo size="large" />
          </View>

          <AuthHeader
            variant={variant}
            title={headerTitle}
            subtitle={headerSubtitle}
          />

          <View style={styles.card}>
            {children}
          </View>

          <View style={styles.footer}>
            <AppThemeToggle />
            <Text style={styles.footerTagline}>Rotanı paylaş · Keşfet · Bağlan</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AuthScreenLayout;

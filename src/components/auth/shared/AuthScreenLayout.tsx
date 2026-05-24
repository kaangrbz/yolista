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
import { authTheme, AuthVariant } from '../../../theme/authTheme';

const { height } = Dimensions.get('window');

interface AuthScreenLayoutProps {
  variant: AuthVariant;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  variant,
  children,
  showBack = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AuthFloatingBackground />

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

          <AuthHeader variant={variant} />

          <View style={styles.card}>
            {children}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTagline}>Rotanı paylaş · Keşfet · Bağlan</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: authTheme.backgroundBottom,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    minHeight: height,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
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
    backgroundColor: authTheme.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: authTheme.textMuted,
    letterSpacing: 0.5,
  },
});

export default AuthScreenLayout;

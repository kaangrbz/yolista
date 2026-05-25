import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { validateEmail } from '../utils/validationUtils';
import {
  AUTH_MOBILE,
  formatForgotSuccessBody,
} from '../shared/auth-messages';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextInput,
} from '../components/auth/shared';
import { useAuthThemedStyles } from '../theme/useAuthThemedStyles';

export const ForgotPasswordScreen = () => {
  const styles = useAuthThemedStyles((t) => ({
    successBox: {
      backgroundColor: t.primaryLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    successTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 8,
    },
    successText: {
      fontSize: 14,
      color: t.textSecondary,
      lineHeight: 21,
    },
    linkContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    linkText: {
      fontSize: 15,
      color: t.primary,
      fontWeight: '600',
    },
  }));

  const navigation = useNavigation();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    if (!validateEmail(email)) {
      setError(AUTH_MOBILE.errors.invalidEmail);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await resetPasswordForEmail(email.trim());
      setIsSent(true);
      showToast('success', AUTH_MOBILE.forgot.sendSuccessToast);
    } catch (sendError: unknown) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : AUTH_MOBILE.errors.sendEmailFailed;

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    navigation.navigate('ResetPassword' as never, { email: email.trim() } as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <AuthScreenLayout variant="forgot" showBack onBack={handleBack}>
      <AuthErrorBanner message={error} />

      {isSent ? (
        <AuthAnimatedSection delay={80}>
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>{AUTH_MOBILE.forgot.successTitle}</Text>
            <Text style={styles.successText}>
              {formatForgotSuccessBody(email)}
            </Text>
          </View>
          <AuthPrimaryButton
            label={AUTH_MOBILE.forgot.continueButton}
            onPress={handleContinueToReset}
            icon="key-variant"
          />
        </AuthAnimatedSection>
      ) : (
        <>
          <AuthAnimatedSection delay={80}>
            <AuthTextInput
              icon="email-outline"
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </AuthAnimatedSection>

          <AuthAnimatedSection delay={140}>
            <AuthPrimaryButton
              label={AUTH_MOBILE.forgot.sendButton}
              onPress={handleSend}
              loading={isLoading}
              disabled={email.length === 0}
              icon="email-fast-outline"
            />
          </AuthAnimatedSection>
        </>
      )}

      <AuthAnimatedSection delay={200}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>
            {AUTH_MOBILE.forgot.backToLogin}
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </AuthScreenLayout>
  );
};

export default ForgotPasswordScreen;

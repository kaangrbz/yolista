import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { validatePassword } from '../utils/validationUtils';
import { AUTH_MOBILE } from '../shared/auth-messages';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthOtpInput,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextInput,
  OTP_LENGTH,
} from '../components/auth/shared';
import { useAuthThemedStyles } from '../theme/useAuthThemedStyles';

type ResetPasswordRouteParams = {
  ResetPassword: {
    email?: string;
    fromDeepLink?: boolean;
  };
};

export const ResetPasswordScreen = () => {
  const styles = useAuthThemedStyles((t) => ({
    deepLinkHint: {
      fontSize: 14,
      color: t.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
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
  const route = useRoute<RouteProp<ResetPasswordRouteParams, 'ResetPassword'>>();
  const { verifyRecoveryOtp, updatePassword } = useAuth();

  const initialEmail = route.params?.email ?? '';
  const fromDeepLink = route.params?.fromDeepLink === true;

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!fromDeepLink && otp.length !== OTP_LENGTH) {
      setError(AUTH_MOBILE.errors.otpRequired);
      return;
    }

    if (!validatePassword(password)) {
      setError(AUTH_MOBILE.errors.passwordRules);
      return;
    }

    if (password !== confirmPassword) {
      setError(AUTH_MOBILE.errors.passwordMismatch);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      if (!fromDeepLink) {
        await verifyRecoveryOtp(email.trim(), otp);
      }

      await updatePassword(password);
      showToast('success', AUTH_MOBILE.reset.successToast);
      navigation.navigate('Login' as never);
    } catch (resetError: unknown) {
      const message =
        resetError instanceof Error
          ? resetError.message
          : AUTH_MOBILE.errors.resetFailed;

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid = fromDeepLink
    ? password.length > 0 && confirmPassword.length > 0
    : email.length > 0 &&
      otp.length === OTP_LENGTH &&
      password.length > 0 &&
      confirmPassword.length > 0;

  return (
    <AuthScreenLayout variant="reset" showBack onBack={handleBack}>
      <AuthErrorBanner message={error} />

      {fromDeepLink ? (
        <AuthAnimatedSection delay={40}>
          <Text style={styles.deepLinkHint}>
            {AUTH_MOBILE.reset.deepLinkHint}
          </Text>
        </AuthAnimatedSection>
      ) : null}

      <AuthAnimatedSection delay={60}>
        <AuthTextInput
          icon="email-outline"
          label="E-posta"
          placeholder="ornek@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!initialEmail && !fromDeepLink}
        />
      </AuthAnimatedSection>

      {!fromDeepLink ? (
        <AuthAnimatedSection delay={120}>
          <AuthOtpInput value={otp} onChange={setOtp} />
        </AuthAnimatedSection>
      ) : null}

      <AuthAnimatedSection delay={180}>
        <AuthTextInput
          icon="lock-outline"
          label={AUTH_MOBILE.reset.newPasswordLabel}
          placeholder="En az 8 karakter"
          value={password}
          onChangeText={setPassword}
          showToggle
          autoCapitalize="none"
          textContentType="newPassword"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={220}>
        <AuthTextInput
          icon="lock-check-outline"
          label={AUTH_MOBILE.reset.confirmPasswordLabel}
          placeholder={AUTH_MOBILE.reset.confirmPasswordPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showToggle
          autoCapitalize="none"
          textContentType="newPassword"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={260}>
        <AuthPrimaryButton
          label={AUTH_MOBILE.reset.submitButton}
          onPress={handleReset}
          loading={isLoading}
          disabled={!isFormValid}
          icon="shield-check-outline"
        />
      </AuthAnimatedSection>

      {!fromDeepLink ? (
        <AuthAnimatedSection delay={300}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            style={styles.linkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>{AUTH_MOBILE.reset.resendLink}</Text>
          </TouchableOpacity>
        </AuthAnimatedSection>
      ) : null}
    </AuthScreenLayout>
  );
};

export default ResetPasswordScreen;

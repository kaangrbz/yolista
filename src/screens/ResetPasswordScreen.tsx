import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { validatePassword } from '../utils/validationUtils';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthOtpInput,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextInput,
  OTP_LENGTH,
} from '../components/auth/shared';
import { authTheme } from '../theme/authTheme';

type ResetPasswordRouteParams = {
  ResetPassword: {
    email?: string;
    fromDeepLink?: boolean;
  };
};

export const ResetPasswordScreen = () => {
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
      setError('6 haneli doğrulama kodunu girin');
      return;
    }

    if (!validatePassword(password)) {
      setError('Şifre en az 8 karakter olmalı ve harf ile rakam içermeli');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      if (!fromDeepLink) {
        await verifyRecoveryOtp(email.trim(), otp);
      }

      await updatePassword(password);
      showToast('success', 'Şifren güncellendi. Giriş yapabilirsin.');
      navigation.navigate('Login' as never);
    } catch (resetError: unknown) {
      const message =
        resetError instanceof Error
          ? resetError.message
          : 'Şifre sıfırlanırken bir hata oluştu';

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
            E-posta bağlantın doğrulandı. Yeni şifreni belirleyebilirsin.
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
          label="Yeni şifre"
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
          label="Şifre tekrar"
          placeholder="Şifreni tekrar gir"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showToggle
          autoCapitalize="none"
          textContentType="newPassword"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={260}>
        <AuthPrimaryButton
          label="Şifreyi Güncelle"
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
            <Text style={styles.linkText}>Kodu tekrar gönder</Text>
          </TouchableOpacity>
        </AuthAnimatedSection>
      ) : null}
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  deepLinkHint: {
    fontSize: 14,
    color: authTheme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 15,
    color: authTheme.primary,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;

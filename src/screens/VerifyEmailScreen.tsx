import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
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

type VerifyEmailRouteParams = {
  VerifyEmail: {
    email?: string;
    verifiedFromLink?: boolean;
  };
};

export const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<VerifyEmailRouteParams, 'VerifyEmail'>>();
  const {
    verifyEmailOtp,
    resendSignupConfirmation,
    refreshAuthSession,
    isEmailConfirmed,
    isAuthenticated,
  } = useAuth();

  const initialEmail = route.params?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const verifiedFromLink = route.params?.verifiedFromLink === true;

  useEffect(() => {
    if (!verifiedFromLink) {
      return;
    }

    void refreshAuthSession();
  }, [verifiedFromLink, refreshAuthSession]);

  useEffect(() => {
    if (!verifiedFromLink || !isEmailConfirmed) {
      return;
    }

    showToast('success', 'E-postan zaten doğrulandı.');
    navigation.goBack();
  }, [verifiedFromLink, isEmailConfirmed, navigation]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError('6 haneli doğrulama kodunu girin');
      return;
    }

    if (!email.trim()) {
      setError('E-posta adresi gerekli');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await verifyEmailOtp(email.trim(), otp);
      showToast('success', 'E-postan doğrulandı!');

      if (isAuthenticated) {
        navigation.goBack();
      } else {
        navigation.navigate('Login' as never);
      }
    } catch (verifyError: unknown) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : 'Doğrulama sırasında bir hata oluştu';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Önce e-posta adresini girin');
      return;
    }

    try {
      setIsResending(true);
      setError('');
      await resendSignupConfirmation(email.trim());
      showToast('success', 'Doğrulama kodu tekrar gönderildi');
    } catch (resendError: unknown) {
      const message =
        resendError instanceof Error
          ? resendError.message
          : 'Kod gönderilirken bir hata oluştu';

      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <AuthScreenLayout variant="verify" showBack onBack={handleBack}>
      <AuthErrorBanner message={error} />

      <AuthAnimatedSection delay={60}>
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            Kayıt veya giriş sonrası e-postana gelen 6 haneli kodu aşağıya gir.
          </Text>
        </View>
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={100}>
        <AuthTextInput
          icon="email-outline"
          label="E-posta"
          placeholder="ornek@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!initialEmail}
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={160}>
        <AuthOtpInput value={otp} onChange={setOtp} />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={220}>
        <AuthPrimaryButton
          label="Doğrula"
          onPress={handleVerify}
          loading={isLoading}
          disabled={otp.length !== OTP_LENGTH || email.length === 0}
          icon="check-circle-outline"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={280}>
        <TouchableOpacity
          onPress={handleResend}
          style={styles.linkContainer}
          activeOpacity={0.7}
          disabled={isResending}
        >
          <Text style={styles.linkText}>
            {isResending ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  hintBox: {
    backgroundColor: authTheme.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  hintText: {
    fontSize: 14,
    color: authTheme.textSecondary,
    lineHeight: 20,
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

export default VerifyEmailScreen;

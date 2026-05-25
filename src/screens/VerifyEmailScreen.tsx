import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
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

type VerifyEmailRouteParams = {
  VerifyEmail: {
    email?: string;
    verifiedFromLink?: boolean;
  };
};

export const VerifyEmailScreen = () => {
  const styles = useAuthThemedStyles((t) => ({
    hintBox: {
      backgroundColor: t.primaryLight,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    hintText: {
      fontSize: 14,
      color: t.textSecondary,
      lineHeight: 20,
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

    showToast('success', AUTH_MOBILE.verify.alreadyVerifiedToast);
    navigation.goBack();
  }, [verifiedFromLink, isEmailConfirmed, navigation]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(AUTH_MOBILE.errors.otpRequired);
      return;
    }

    if (!email.trim()) {
      setError(AUTH_MOBILE.errors.emailRequired);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await verifyEmailOtp(email.trim(), otp);
      showToast('success', AUTH_MOBILE.verify.verifySuccessToast);

      if (isAuthenticated) {
        navigation.goBack();
      } else {
        navigation.navigate('Login' as never);
      }
    } catch (verifyError: unknown) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : AUTH_MOBILE.errors.verifyFailed;

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError(AUTH_MOBILE.errors.emailRequiredForResend);
      return;
    }

    try {
      setIsResending(true);
      setError('');
      await resendSignupConfirmation(email.trim());
      showToast('success', AUTH_MOBILE.verify.resendSuccessToast);
    } catch (resendError: unknown) {
      const message =
        resendError instanceof Error
          ? resendError.message
          : AUTH_MOBILE.errors.resendSendFailed;

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
            {AUTH_MOBILE.verify.hint}
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
          label={AUTH_MOBILE.verify.submitButton}
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
            {isResending
              ? AUTH_MOBILE.verify.resendSending
              : AUTH_MOBILE.verify.resendLink}
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </AuthScreenLayout>
  );
};

export default VerifyEmailScreen;

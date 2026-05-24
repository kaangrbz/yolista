import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { validateEmail } from '../utils/validationUtils';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextInput,
} from '../components/auth/shared';
import { authTheme } from '../theme/authTheme';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await resetPasswordForEmail(email.trim());
      setIsSent(true);
      showToast('success', 'Doğrulama kodu e-postana gönderildi');
    } catch (sendError: unknown) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : 'E-posta gönderilirken bir hata oluştu';

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
            <Text style={styles.successTitle}>E-postanı kontrol et</Text>
            <Text style={styles.successText}>
              {email} adresine 6 haneli bir kod gönderdik. Kodu girerek yeni şifreni
              belirleyebilirsin.
            </Text>
          </View>
          <AuthPrimaryButton
            label="Kodu Gir"
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
              label="Kod Gönder"
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
            Girişe dön
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  successBox: {
    backgroundColor: authTheme.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: authTheme.textPrimary,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: authTheme.textSecondary,
    lineHeight: 21,
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

export default ForgotPasswordScreen;

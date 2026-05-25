import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextInput,
} from '../shared';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateToVerifyEmail: (email: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToVerifyEmail,
}) => {
  const styles = useAuthThemedStyles((t) => ({
    container: {
      width: '100%',
    },
    forgotLink: {
      alignSelf: 'flex-end',
      marginBottom: 4,
      marginTop: -4,
    },
    forgotText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.primary,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: t.inputBorder,
    },
    dividerText: {
      color: t.textMuted,
      fontSize: 13,
      marginHorizontal: 14,
      fontWeight: '500',
    },
    linkContainer: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    linkText: {
      fontSize: 15,
      color: t.textSecondary,
    },
    linkHighlight: {
      color: t.primary,
      fontWeight: '700',
    },
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await onLogin(email, password);
    } catch (loginError: unknown) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : 'Giriş yaparken bir hata oluştu';

      setError(message);

      if (message.toLowerCase().includes('doğrulamanız gerekiyor')) {
        onNavigateToVerifyEmail(email.trim());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <View style={styles.container}>
      <AuthErrorBanner message={error} />

      <AuthAnimatedSection delay={80}>
        <AuthTextInput
          icon="email-outline"
          label="E-posta"
          placeholder="ornek@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={140}>
        <AuthTextInput
          icon="lock-outline"
          label="Şifre"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          showToggle
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={180}>
        <TouchableOpacity
          onPress={onNavigateToForgotPassword}
          style={styles.forgotLink}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Şifremi unuttum</Text>
        </TouchableOpacity>
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={220}>
        <AuthPrimaryButton
          label="Giriş Yap"
          onPress={handleLogin}
          loading={isLoading}
          disabled={!isFormValid}
          icon="login"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={280}>
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={320}>
        <TouchableOpacity
          onPress={onNavigateToRegister}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>
            Hesabın yok mu?{' '}
            <Text style={styles.linkHighlight}>Kayıt ol</Text>
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </View>
  );
};

export default LoginForm;

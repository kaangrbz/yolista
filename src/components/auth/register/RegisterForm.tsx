import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthTextInput,
} from '../shared';
import {
  getValidationMessage,
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
} from '../../../utils/validationUtils';
import UserModel from '../../../model/user.model';
import { authTheme } from '../../../theme/authTheme';

interface RegisterFormProps {
  onRegister: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<{ needsEmailVerification: boolean }>;
  onNavigateToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const validateForm = async () => {
    if (!validateName(name)) {
      setError(getValidationMessage('name', name));
      return false;
    }

    if (!validateUsername(username)) {
      setError(getValidationMessage('username', username));
      return false;
    }

    const isAvailable = await UserModel.isUsernameAvailable(username);
    if (!isAvailable) {
      setError('Bu kullanıcı adı zaten kullanılıyor');
      return false;
    }

    if (!validateEmail(email)) {
      setError(getValidationMessage('email', email));
      return false;
    }

    if (!validatePassword(password)) {
      setError(getValidationMessage('password', password));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    const isFormValid = await validateForm();

    if (!isFormValid) {
      return;
    }

    try {
      setIsRegistering(true);
      setError('');
      await onRegister(email, password, name, username);
    } catch (registerError: unknown) {
      const message =
        registerError instanceof Error
          ? registerError.message
          : 'Kayıt olurken bir hata oluştu';

      setError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const isFormValid =
    name.length > 0 &&
    username.length > 0 &&
    email.length > 0 &&
    password.length > 0;

  return (
    <View style={styles.container}>
      <AuthErrorBanner message={error} />

      <AuthAnimatedSection delay={60}>
        <AuthTextInput
          icon="account-outline"
          label="Ad Soyad"
          placeholder="Adın Soyadın"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={100}>
        <AuthTextInput
          icon="at"
          label="Kullanıcı adı"
          placeholder="kullaniciadi"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={140}>
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
          returnKeyType="next"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={180}>
        <AuthTextInput
          icon="lock-outline"
          label="Şifre"
          placeholder="En az 8 karakter"
          value={password}
          onChangeText={setPassword}
          showToggle
          autoCapitalize="none"
          autoComplete="password"
          textContentType="newPassword"
          returnKeyType="done"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={220}>
        <AuthPrimaryButton
          label="Hesap Oluştur"
          onPress={handleRegister}
          loading={isRegistering}
          disabled={!isFormValid}
          icon="account-plus-outline"
        />
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={260}>
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>
      </AuthAnimatedSection>

      <AuthAnimatedSection delay={300}>
        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={styles.linkContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>
            Zaten hesabın var mı?{' '}
            <Text style={styles.linkHighlight}>Giriş yap</Text>
          </Text>
        </TouchableOpacity>
      </AuthAnimatedSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: authTheme.inputBorder,
  },
  dividerText: {
    color: authTheme.textMuted,
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
    color: authTheme.textSecondary,
  },
  linkHighlight: {
    color: authTheme.primary,
    fontWeight: '700',
  },
});

export default RegisterForm;

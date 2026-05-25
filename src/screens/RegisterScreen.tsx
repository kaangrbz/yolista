import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { AUTH_MOBILE } from '../shared/auth-messages';
import { RegisterForm } from '../components/auth';
import { AuthScreenLayout } from '../components/auth/shared';

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const { signUp } = useAuth();

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    const result = await signUp(email, password, name, username);

    if (result.needsEmailVerification) {
      showToast('success', AUTH_MOBILE.register.successToast);
      navigation.navigate('VerifyEmail' as never, { email: email.trim() } as never);

      return { needsEmailVerification: true };
    }

    showToast('success', AUTH_MOBILE.register.successReadyToast);

    return { needsEmailVerification: false };
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <AuthScreenLayout variant="register" showBack onBack={handleBack}>
      <RegisterForm
        onRegister={handleRegister}
        onNavigateToLogin={handleNavigateToLogin}
      />
    </AuthScreenLayout>
  );
};

export default RegisterScreen;

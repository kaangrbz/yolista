import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
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
      showToast('success', 'Hesabın oluşturuldu! E-postanı doğrula.');
      navigation.navigate('VerifyEmail' as never, { email: email.trim() } as never);

      return { needsEmailVerification: true };
    }

    showToast('success', 'Hoş geldin! Hesabın hazır.');

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

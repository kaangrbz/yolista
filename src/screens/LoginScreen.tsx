import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { LoginForm } from '../components/auth';
import { AuthScreenLayout } from '../components/auth/shared';
import { loginReturningCopy } from '../theme/authTheme';
import { hasLoggedInBefore } from '../utils/welcome';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    hasLoggedInBefore().then(setIsReturningUser);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      showToast('error', 'Lütfen tüm alanları doldurun');
      return;
    }

    await signIn(email, password);
  };

  const handleNavigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleNavigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleNavigateToVerifyEmail = (email: string) => {
    navigation.navigate('VerifyEmail' as never, { email } as never);
  };

  return (
    <AuthScreenLayout
      variant="login"
      headerTitle={isReturningUser ? loginReturningCopy.title : undefined}
      headerSubtitle={isReturningUser ? loginReturningCopy.subtitle : undefined}
    >
      <LoginForm
        onLogin={handleLogin}
        onNavigateToRegister={handleNavigateToRegister}
        onNavigateToForgotPassword={handleNavigateToForgotPassword}
        onNavigateToVerifyEmail={handleNavigateToVerifyEmail}
      />
    </AuthScreenLayout>
  );
};

export default LoginScreen;

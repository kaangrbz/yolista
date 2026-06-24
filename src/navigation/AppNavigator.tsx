import React, { useEffect, useState, useRef } from 'react';
import { DefaultTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { StyleSheet, Text, View, ActivityIndicator, Linking, TouchableOpacity, BackHandler, Platform } from 'react-native';
import { Logo } from '../components/Logo';
import MainTabNavigator from './MainTabNavigator';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeepLinkingService from '../services/DeepLinkingService';
import AuthLinkingService from '../services/AuthLinkingService';
import {
  fetchVersionCheckResult,
  resolveFetchErrorStatus,
  resolveStoreUrl,
  type AppVersionPolicy,
} from '../services/versionPolicy';
import { useAppTheme } from '../context/AppThemeContext';
import { CommentsSheetProvider } from '../context/CommentsSheetContext';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const theme = useAppTheme();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.background,
      text: theme.textPrimary,
      border: theme.border,
      primary: theme.accent,
    },
  };
  const { isAuthenticated, isLoading, user, reloadAuth } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const [versionStatus, setVersionStatus] = useState<'loading' | 'valid' | 'optional_update' | 'forced_update'>('loading');
  const [versionPolicy, setVersionPolicy] = useState<AppVersionPolicy | null>(null);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const [showAggressiveAlert, setShowAggressiveAlert] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const CURRENT_APP_VERSION = DeviceInfo.getVersion();

  const LOADING_TIMEOUT = 10000;
  const AGGRESSIVE_TIMEOUT = 20000;

  const openStore = async () => {
    const storeUrl = resolveStoreUrl(versionPolicy);
    if (!storeUrl) {
      return;
    }
    try {
      await Linking.openURL(storeUrl);
    } catch (err) {
      console.error('Store link open failed:', err);
    }
  };

  const checkAppVersion = async () => {
    try {
      const result = await fetchVersionCheckResult(CURRENT_APP_VERSION);

      if (result.status === 'fetch_error') {
        const fallback = resolveFetchErrorStatus(result.policy);
        setVersionPolicy(result.policy);
        setVersionStatus(fallback);
        return;
      }

      setVersionPolicy(result.policy);
      setVersionStatus(result.status);
    } catch (err) {
      console.error('Error checking app version:', err);
      setVersionStatus('valid');
    }
  };

  const reloadApp = async () => {
    setShowTimeoutAlert(false);
    setShowAggressiveAlert(false);
    setLoadingStartTime(Date.now());
    setVersionStatus('loading');
    reloadAuth(); // Reload auth context
    await AsyncStorage.clear(); // Clear AsyncStorage data
    checkAppVersion();
  };

  const forceReloadApp = async () => {
    setShowTimeoutAlert(false);
    setShowAggressiveAlert(false);
    setLoadingStartTime(Date.now());
    setVersionStatus('loading');
    reloadAuth(); // Reload auth context
    await AsyncStorage.clear(); // Clear AsyncStorage data
    // Force a longer delay to ensure complete reset
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
    checkAppVersion();
  };

  useEffect(() => {
    checkAppVersion();
  }, []);

  // Android geri: nested stack'lerde önceki ekrana dön (React Navigation önerisi)
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const onHardwareBackPress = () => {
      const navigation = navigationRef.current;

      if (!navigation?.isReady()) {
        return false;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

    return () => subscription.remove();
  }, []);

   // Handle loading timeout - sadece version kontrolü için
  useEffect(() => {
    if (versionStatus === 'loading') {
      if (!loadingStartTime) {
        setLoadingStartTime(Date.now());
      }
    } else {
      setLoadingStartTime(null);
      setShowTimeoutAlert(false);
      setShowAggressiveAlert(false);
    }
  }, [versionStatus]);

  useEffect(() => {
    if (loadingStartTime) {
      const timeoutId = setTimeout(() => {
        if (versionStatus === 'loading') {
          setShowTimeoutAlert(true);
        }
      }, LOADING_TIMEOUT);

      const aggressiveTimeoutId = setTimeout(() => {
        if (versionStatus === 'loading') {
          setShowAggressiveAlert(true);
        }
      }, AGGRESSIVE_TIMEOUT);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(aggressiveTimeoutId);
      };
    }
  }, [loadingStartTime, versionStatus]);

  if (versionStatus === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Logo size="large" color={theme.accent} />
        <ActivityIndicator size="large" color={theme.accent} />

        {showTimeoutAlert && !showAggressiveAlert ? (
          <View style={styles.timeoutContainer}>
            <Text style={styles.timeoutText}>
              Sürüm kontrolü uzun sürüyor...
            </Text>
            <TouchableOpacity style={styles.reloadButton} onPress={reloadApp}>
              <Text style={styles.reloadButtonText}>Yeniden dene</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showAggressiveAlert ? (
          <View style={styles.aggressiveTimeoutContainer}>
            <Text style={styles.aggressiveTimeoutText}>
              Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.
            </Text>
            <TouchableOpacity style={styles.forceReloadButton} onPress={forceReloadApp}>
              <Text style={styles.forceReloadButtonText}>Zorla yeniden dene</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  if (versionStatus === 'forced_update') {
    const message =
      versionPolicy?.update_message ??
      'Uygulama sürümünüz artık desteklenmiyor. Yolista\'yı kullanmaya devam etmek için lütfen güncelleyin.';

    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Logo size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{message}</Text>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Mevcut sürüm: v{CURRENT_APP_VERSION}
          {versionPolicy?.latest_version ? ` · Güncel: v${versionPolicy.latest_version}` : ''}
        </Text>
        {resolveStoreUrl(versionPolicy) ? (
          <TouchableOpacity style={styles.reloadButton} onPress={openStore}>
            <Text style={styles.reloadButtonText}>Mağazada güncelle</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (versionStatus === 'optional_update') {
    const message =
      versionPolicy?.update_message ??
      'Yolista\'nın yeni bir sürümü mevcut. En iyi deneyim için lütfen güncelleyin.';

    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Logo size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{message}</Text>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Mevcut sürüm: v{CURRENT_APP_VERSION}
          {versionPolicy?.latest_version ? ` · Güncel: v${versionPolicy.latest_version}` : ''}
        </Text>
        {resolveStoreUrl(versionPolicy) ? (
          <TouchableOpacity style={styles.reloadButton} onPress={openStore}>
            <Text style={styles.reloadButtonText}>Mağazada güncelle</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => setVersionStatus('valid')}>
          <Text style={[styles.buttonText, { color: theme.accent }]}>Devam et</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Navigation ref'i DeepLinkingService'e register et
  useEffect(() => {
    if (navigationRef.current) {
      DeepLinkingService.setNavigationRef(navigationRef.current);
      AuthLinkingService.setNavigationRef(navigationRef.current);
      console.log('🔗 Navigation ref registered to DeepLinkingService');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const navigation = navigationRef.current;

    if (isLoading || !navigation?.isReady()) {
      return;
    }

    const currentRoute = navigation.getCurrentRoute()?.name;
    const authOnlyRoutes = new Set(['Login', 'Register', 'ForgotPassword', 'ResetPassword', 'VerifyEmail']);

    if (isAuthenticated && user) {
      if (currentRoute === 'Login' || currentRoute === 'VerifyEmail') {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }

      return;
    }

    if (currentRoute && !authOnlyRoutes.has(currentRoute)) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Logo size="large" color={theme.accent} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const initialRouteName = isAuthenticated && user ? 'MainTabs' : 'Login';

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        console.log('🔗 Navigation container ready');
        if (navigationRef.current) {
          DeepLinkingService.setNavigationRef(navigationRef.current);
          AuthLinkingService.setNavigationRef(navigationRef.current);
        }
      }}
    >
      <CommentsSheetProvider>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </Stack.Navigator>
      </CommentsSheetProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    color: '#f0ad4e',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    padding: 5,
  },
  cityText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#222222',
    fontWeight: '500',
  },
  logoutButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    width: '80%',
  },
  buttonText: {
    fontSize: 16,
    color: '#1DA1F2',
    fontWeight: 'bold',
  },
  timeoutContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  timeoutText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  reloadButton: {
    backgroundColor: '#1DA1F2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aggressiveTimeoutContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  aggressiveTimeoutText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  forceReloadButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  forceReloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

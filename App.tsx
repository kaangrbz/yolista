/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useAlert } from './src/context/AlertContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { hydrateHomeFeedCache } from './src/services/homeFeedCache';
import { AppThemeProvider, useAppTheme, useAppThemeControl } from './src/context/AppThemeContext';
import {AlertProvider} from './src/context/AlertContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import Toast, {BaseToast} from 'react-native-toast-message';
import { LogBox } from 'react-native';
import { Logo } from './src/components/Logo';
import { ImageService } from './src/services/ImageService';
import GlobalAlert from './src/components/common/GlobalAlert';
import CreateFlowExitModalHost from './src/components/createFlow/CreateFlowExitModal';
import { ConfirmModalHost } from './src/components/common/ConfirmModal';
import { getCachedCategories } from './src/services/categoriesCache';
import DeepLinkingService from './src/services/DeepLinkingService';
import AuthLinkingService from './src/services/AuthLinkingService';
import { useRoutePublishStore } from './src/store/routePublishStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import 'react-native-url-polyfill/auto';

// Development modda deep link test
if (__DEV__) {
  import('./src/utils/deepLinkTester');
}

LogBox.ignoreAllLogs(); // Disables all warnings in the app



const toastConfig = {
  /*
    Overwrite 'success' type,
    by modifying the existing `BaseToast` component
  */
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: 'orange' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '400',
      }}
    />
  ),
};

const AppContent = (): React.JSX.Element => {
  const { isLoading: authLoading, user } = useAuth();
  const theme = useAppTheme();
  const { ready: themeReady } = useAppThemeControl();
  const [appInitialized, setAppInitialized] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { currentAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (user?.id) {
      void hydrateHomeFeedCache(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    const initializeApp = async () => {
      ImageService.initializeCache();

      getCachedCategories().catch(() => {
        // ilk açılışta ağ yoksa sessizce geç; bir sonraki ekran tekrar deneyecek.
      });

      Promise.resolve(useRoutePublishStore.getState().resumePendingDraftIfAny()).catch(() => {
        // Resume is best-effort
      });

      try {
        const removeDeepLinkListener = await DeepLinkingService.initialize();
        console.log('🔗 Deep linking initialized');

        return removeDeepLinkListener;
      } catch (error) {
        console.error('🔗 Deep linking initialization error:', error);
      }
    };

    const cleanup = initializeApp().finally(() => {
      setAppInitialized(true);
    });

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) {
          cleanupFn();
        }
      });
    };
  }, []);

  const isBootstrapping = authLoading || !appInitialized || !themeReady;

  if (isBootstrapping) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Logo size="large" color={theme.accent} />
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <Toast config={toastConfig}/>
      <GlobalAlert
        alert={currentAlert}
        onDismiss={hideAlert}
      />
      <CreateFlowExitModalHost />
      <ConfirmModalHost />
    </>
  );
};

function ThemedGestureRoot({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();

  return (
    <GestureHandlerRootView
      style={[styles.rootGesture, { backgroundColor: theme.background }]}
    >
      {children}
    </GestureHandlerRootView>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ThemedGestureRoot>
          <AuthProvider>
            <AlertProvider>
              <BottomSheetModalProvider>
                <AppContent />
              </BottomSheetModalProvider>
            </AlertProvider>
          </AuthProvider>
        </ThemedGestureRoot>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootGesture: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginTop: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingIndicator: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default App;

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Animated } from 'react-native';
import { useAlert } from './src/context/AlertContext';
import {AuthProvider} from './src/context/AuthContext';
import {AlertProvider} from './src/context/AlertContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import Toast, {BaseToast} from 'react-native-toast-message';
import { LogBox } from 'react-native';
import { Logo } from './src/components/Logo';
import { ImageService } from './src/services/ImageService';
import GlobalAlert from './src/components/common/GlobalAlert';
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
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const { currentAlert, hideAlert } = useAlert();

  useEffect(() => {
    const initializeApp = async () => {
      // Fade in animasyonu
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

      // Initialize image cache
      ImageService.initializeCache();

      Promise.resolve(useRoutePublishStore.getState().resumePendingDraftIfAny()).catch(() => {
        // Resume is best-effort
      });

      // Deep linking başlat
      try {
        const removeDeepLinkListener = await DeepLinkingService.initialize();
        console.log('🔗 Deep linking initialized');

        return removeDeepLinkListener;
      } catch (error) {
        console.error('🔗 Deep linking initialization error:', error);
      }
    };

    // Initialize
    const cleanup = initializeApp();

    // Sadece app initialization - AuthContext loading'i devre dışı
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 saniye app loading

    return () => {
      clearTimeout(timer);
      // Deep linking cleanup
      cleanup.then(cleanupFn => {
        if (cleanupFn) {cleanupFn();}
      });
    };
  }, []);

  // Sadece app loading kontrolü
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Logo size="large" color="#1DA1F2" />
          {/* <Text style={styles.tagline}>Yolculuklarınızı Paylaşın</Text> */}
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color="#1DA1F2" />
            {/* <Text style={styles.loadingText}>Yükleniyor...</Text> */}
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
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.rootGesture}>
      <SafeAreaProvider>
        <AuthProvider>
          <AlertProvider>
            <BottomSheetModalProvider>
              <AppContent />
            </BottomSheetModalProvider>
          </AlertProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootGesture: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

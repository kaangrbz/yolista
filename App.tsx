/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Animated } from 'react-native';
import {AuthProvider} from './src/context/AuthContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import Toast, {BaseToast} from 'react-native-toast-message';
import { LogBox } from 'react-native';
import { Logo } from './src/components/Logo';
import { ImageService } from './src/services/ImageService';

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
        fontWeight: '400'
      }}
    />
  ),
};

const AppContent = (): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
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
    
    // Sadece app initialization - AuthContext loading'i devre dışı
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 saniye app loading

    return () => clearTimeout(timer);
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
              transform: [{ scale: scaleAnim }]
            }
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
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
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

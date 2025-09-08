import React, { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { StyleSheet, Text, View, ActivityIndicator, Button, Linking, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { Logo } from '../components/Logo';
import MainTabNavigator from './MainTabNavigator';
import { supabase } from '../lib/supabase';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
    text: '#000000',
  },
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, reloadAuth } = useAuth();

  const [versionStatus, setVersionStatus] = useState<'loading' | 'valid' | 'optional_update' | 'forced_update'>('loading');
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const [showAggressiveAlert, setShowAggressiveAlert] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const CURRENT_APP_VERSION = DeviceInfo.getVersion(); // Replace with your current app version

  const LOADING_TIMEOUT = 10000; // 10 seconds
  const AGGRESSIVE_TIMEOUT = 20000; // 20 seconds

  const checkAppVersion = async () => {
    try {
      const { data, error } = await supabase
        .from('app_versions')
        .select('is_active, force_update')
        .eq('version_number', CURRENT_APP_VERSION)
        .single();

      if (error || !data) {
        console.error('Error fetching version info:', error);
        setVersionStatus('optional_update'); // Assume forced update if there's an error
        return;
      }

      if (!data.is_active) {
        setVersionStatus(data.force_update ? 'forced_update' : 'optional_update');
      } else {
        setVersionStatus('valid');
      }
    } catch (err) {
      console.error('Error checking app version:', err);
      setVersionStatus('forced_update');
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    checkAppVersion();
  };

  useEffect(() => {
    checkAppVersion();
  }, []);

  // Android geri tuşu yönetimi - sadece giriş yapmamış kullanıcılar için
  useEffect(() => {
    if (!isAuthenticated || !user) {
      const backAction = () => {
        // Giriş yapmamış kullanıcılar için uygulamadan çık
        return false; // Varsayılan davranış (uygulamadan çık)
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [isAuthenticated, user]);

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

  // AuthContext loading'i devre dışı - sadece version kontrolü
  // if (versionStatus === 'loading') {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Logo size="large" color="#1DA1F2" />
  //       <ActivityIndicator size="large" color="#1DA1F2" />
        
  //       {showTimeoutAlert && !showAggressiveAlert && (
  //         <View style={styles.timeoutContainer}>
  //           <Text style={styles.timeoutText}>
  //             Uygulama yüklenmesi uzun sürüyor...
  //           </Text>
  //           <TouchableOpacity
  //             style={styles.reloadButton}
  //             onPress={reloadApp}
  //           >
  //             <Text style={styles.reloadButtonText}>Uygulamayı Yeniden Yükle</Text>
  //           </TouchableOpacity>
  //         </View>
  //       )}

  //       {showAggressiveAlert && (
  //         <View style={styles.aggressiveTimeoutContainer}>
  //           <Text style={styles.aggressiveTimeoutText}>
  //             Uygulama yüklenmesi çok uzun sürüyor. Lütfen uygulamayı tamamen yeniden başlatın.
  //           </Text>
  //           <TouchableOpacity
  //             style={styles.forceReloadButton}
  //             onPress={forceReloadApp}
  //           >
  //             <Text style={styles.forceReloadButtonText}>Zorla Yeniden Yükle</Text>
  //           </TouchableOpacity>
  //         </View>
  //       )}
  //     </View>
  //   );
  // }

  // if (versionStatus === 'forced_update') {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Logo size="large" color="#1DA1F2" />
  //       <Text style={styles.loadingText}>Uygulama sürümünüz artık desteklenmiyor. Yolista'yı kullanmaya devam etmek için uygulama geliştiricisinden en yeni sürümü indirip güncelleyin.</Text>
  //       <Text style={styles.loadingText}>Mevcut sürüm: v{CURRENT_APP_VERSION}</Text>
  //       {/* <TouchableOpacity
  //         onPress={() => setVersionStatus('valid')} // Replace with actual app store link
  //       >
  //         <Text style={styles.buttonText}>Devam et</Text>
  //       </TouchableOpacity> */}
  //     </View>
  //   );
  // }

  // if (versionStatus === 'optional_update') {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Logo size="large" color="#1DA1F2" />
  //       <Text style={styles.loadingText}>Yolista'nın yeni bir sürümü mevcut. En iyi deneyim için lütfen güncelleyin. </Text>
  //       <Text style={styles.loadingText}>Mevcut sürüm: v{CURRENT_APP_VERSION}</Text>
  //       <TouchableOpacity
  //         onPress={() => setVersionStatus('valid')} // Replace with actual app store link
  //       >
  //         <Text style={styles.buttonText}>Devam et</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }


  return (
    <NavigationContainer theme={LightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || !user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Kayıt Ol',
                headerBackTitle: 'Geri',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
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

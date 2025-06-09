import React, { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { StyleSheet, Text, View, ActivityIndicator, Button, Linking, TouchableOpacity } from 'react-native';
import { Logo } from '../components/Logo';
import MainTabNavigator from './MainTabNavigator';
import { supabase } from '../lib/supabase';
import DeviceInfo from 'react-native-device-info';

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
  const { isAuthenticated, isLoading, user } = useAuth();

  const [versionStatus, setVersionStatus] = useState<'loading' | 'valid' | 'optional_update' | 'forced_update'>('loading');
  const CURRENT_APP_VERSION = DeviceInfo.getVersion(); // Replace with your current app version

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

  useEffect(() => {
    checkAppVersion();
  }, []);



  if (isLoading || versionStatus === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" color="#1DA1F2" />
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  if (versionStatus === 'forced_update') {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Uygulama sürümünüz artık desteklenmiyor. Yolista'yı kullanmaya devam etmek için uygulama geliştiricisinden en yeni sürümü indirip güncelleyin.</Text>
        <Text style={styles.loadingText}>Mevcut sürüm: v{CURRENT_APP_VERSION}</Text>
        {/* <TouchableOpacity
          onPress={() => setVersionStatus('valid')} // Replace with actual app store link
        >
          <Text style={styles.buttonText}>Devam et</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  if (versionStatus === 'optional_update') {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Yolista'nın yeni bir sürümü mevcut. En iyi deneyim için lütfen güncelleyin. </Text>
        <Text style={styles.loadingText}>Mevcut sürüm: v{CURRENT_APP_VERSION}</Text>
        <TouchableOpacity
          onPress={() => setVersionStatus('valid')} // Replace with actual app store link
        >
          <Text style={styles.buttonText}>Devam et</Text>
        </TouchableOpacity>
      </View>
    );
  }


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
});

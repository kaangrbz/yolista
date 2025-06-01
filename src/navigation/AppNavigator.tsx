import React from 'react';
import {DefaultTheme,  NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {StyleSheet, Text, View} from 'react-native';
import {Logo} from '../components/Logo';
import MainTabNavigator from './MainTabNavigator';

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
  const {isAuthenticated, isLoading, user} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={LightTheme}>
      <Stack.Navigator>
        {!isAuthenticated || !user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{headerShown: false}}
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
  },
});

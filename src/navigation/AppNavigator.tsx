import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {AddCategoryScreen} from '../screens/AddCategoryScreen';
import {RouteDetailScreen} from '../screens/RouteDetailScreen';
import {TouchableOpacity, StyleSheet, Text, Alert, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {cities, City} from '../data/cities';
import {Logo} from '../components/Logo';
import {CreateRouteScreen} from '../screens/CreateRouteScreen';
const Stack = createNativeStackNavigator();

const LocationHeader = () => {
  const [selectedCity, setSelectedCity] = useState<City>(cities[35]); // Default to İzmir (id: 36)

  useEffect(() => {
    const getCityId = async () => {
      try {
        const savedCityId = await AsyncStorage.getItem('city_id');
        if (savedCityId) {
          const city = cities.find(c => c.id === parseInt(savedCityId, 10));
          if (city) {
            setSelectedCity(city);
          }
        }
      } catch (error) {
        console.error('Şehir ID okuma hatası:', error);
      }
    };
    getCityId();
  }, []);

  const handlePress = () => {
    Alert.alert(
      'Şehir Seç',
      'Bir şehir seçin:',
      [
        ...cities.map(city => ({
          text: city.name,
          onPress: async () => {
            try {
              await AsyncStorage.setItem('city_id', city.id.toString());
              setSelectedCity(city);
            } catch (error) {
              console.error('Şehir kaydetme hatası:', error);
              Alert.alert('Hata', 'Şehir seçimi kaydedilemedi');
            }
          },
        })),
        {text: 'İptal', style: 'cancel'},
      ],
      {cancelable: true},
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.locationHeader}>
      <Icon name="map-marker" size={20} color="#cc0000" />
      <Text style={styles.cityText}>{selectedCity.name}</Text>
    </TouchableOpacity>
  );
};

const LogoutButton = () => {
  const {logout} = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
      <Icon name="logout" size={24} color="#333" />
    </TouchableOpacity>
  );
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
    <NavigationContainer>
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
              name="Home"
              component={HomeScreen}
              options={{
                headerTitle: () => <Logo size="small" color="#1DA1F2" />,
                headerLeft: () => <LogoutButton />,
                headerRight: () => <LocationHeader />,
              }}
            />
            <Stack.Screen
              name="AddCategory"
              component={AddCategoryScreen}
              options={{
                title: 'Öneride Bulun',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="CreateRoute"
              component={CreateRouteScreen}
              options={{
                title: 'Rota Oluştur',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="RouteDetail"
              component={RouteDetailScreen}
              options={{
                title: 'Rota Detayı',
                headerBackTitle: 'Geri',
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
    fontSize: 16,
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

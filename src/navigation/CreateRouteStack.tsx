import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PhotoSelectionScreen } from '../screens/CreateRoute/PhotoSelectionScreen';
import { StopDetailsScreen } from '../screens/CreateRoute/StopDetailsScreen';
import { CategorySelectionScreen } from '../screens/CreateRoute/CategorySelectionScreen';
import { FilterScreen } from '../screens/CreateRoute/FilterScreen';
import { Photo } from '../screens/CreateRoute/PhotoSelectionScreen';
import { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export type CreateRouteStackParamList = {
  PhotoSelection: undefined;
  StopDetails: {
    selectedPhotos: Photo[];
  };
  CategorySelection: {
    selectedPhotos: Photo[];
    routeStops: RouteStop[];
  };
  FilterScreen: {
    selectedPhotos: Photo[];
    routeStops: RouteStop[];
    selectedCategory: Category | null;
    selectedCity: City | null;
  };
};

const Stack = createStackNavigator<CreateRouteStackParamList>();

export const CreateRouteStack = () => {
  const navigation = useNavigation();

  // Android geri tuşu yönetimi
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true; // Geri tuşu işlendi
        } else {
          // Ana ekrandaysa uygulamadan çık
          return false; // Varsayılan davranış
        }
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [navigation])
  );

  return (
    <Stack.Navigator
      initialRouteName="PhotoSelection"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}>

      <Stack.Screen
        name="PhotoSelection"
        component={PhotoSelectionScreen}
        options={{
          title: 'Fotoğraf Seçimi',
        }}
      />

      <Stack.Screen
        name="StopDetails"
        component={StopDetailsScreen}
        options={{
          title: 'Durak Bilgileri',
        }}
      />

      <Stack.Screen
        name="CategorySelection"
        component={CategorySelectionScreen}
        options={{
          title: 'Kategori ve Şehir',
        }}
      />

      <Stack.Screen
        name="FilterScreen"
        component={FilterScreen}
        options={{
          title: 'Filtreler',
        }}
      />

    </Stack.Navigator>
  );
};

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PhotoSelectionScreen } from '../screens/CreateRoute/PhotoSelectionScreen';
import { StopDetailsScreen } from '../screens/CreateRoute/StopDetailsScreen';
import { CategorySelectionScreen } from '../screens/CreateRoute/CategorySelectionScreen';
import { FilterScreen } from '../screens/CreateRoute/FilterScreen';
import { Photo } from '../screens/CreateRoute/PhotoSelectionScreen';
import { RouteStop } from '../screens/CreateRoute/StopDetailsScreen';
import { Category, City } from '../screens/CreateRoute/CategorySelectionScreen';

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

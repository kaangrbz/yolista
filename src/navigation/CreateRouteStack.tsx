import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhotoSelectionScreen } from '../screens/CreateRoute/PhotoSelectionScreen';
import { StopDetailsScreen } from '../screens/CreateRoute/StopDetailsScreen';
import { CategorySelectionScreen } from '../screens/CreateRoute/CategorySelectionScreen';
import { useCreateRouteFlowStore } from '../store/createRouteFlowStore';

export type CreateRouteStackParamList = {
  PhotoSelection: undefined;
  StopDetails: undefined;
  CategorySelection: undefined;
};

const Stack = createNativeStackNavigator<CreateRouteStackParamList>();

export const CreateRouteStack = () => {
  const flowSessionId = useCreateRouteFlowStore((state) => state.flowSessionId);

  return (
    <View style={styles.wrapper}>
      <Stack.Navigator
        key={`create-route-flow-${flowSessionId}`}
        initialRouteName="PhotoSelection"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
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
      </Stack.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

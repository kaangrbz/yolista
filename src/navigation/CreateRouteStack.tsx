import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhotoSelectionScreen } from '../screens/CreateRoute/PhotoSelectionScreen';
import { StopDetailsScreen } from '../screens/CreateRoute/StopDetailsScreen';
import { CategorySelectionScreen } from '../screens/CreateRoute/CategorySelectionScreen';
import { LocationPickerScreen } from '../screens/CreateRoute/LocationPickerScreen';
import { useCreateRouteFlowStore } from '../store/createRouteFlowStore';
import { useThemedStyles } from '../theme/useThemedStyles';

export type CreateRouteStackParamList = {
  PhotoSelection: undefined;
  StopDetails: undefined;
  CategorySelection: undefined;
  LocationPicker: { stopId: string };
};

const Stack = createNativeStackNavigator<CreateRouteStackParamList>();

export const CreateRouteStack = () => {
  const flowSessionId = useCreateRouteFlowStore((state) => state.flowSessionId);
  const styles = useThemedStyles((t) => ({
    wrapper: {
      flex: 1,
      backgroundColor: t.background,
    },
  }));

  return (
    <View style={styles.wrapper}>
      <Stack.Navigator
        key={`create-route-flow-${flowSessionId}`}
        initialRouteName="PhotoSelection"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: styles.wrapper,
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
            title: 'Kategori',
          }}
        />

        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{
            title: 'Konum Seç',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </View>
  );
};

export default CreateRouteStack;

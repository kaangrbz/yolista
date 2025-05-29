/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {AuthProvider} from './src/context/AuthContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import Toast, {BaseToast} from 'react-native-toast-message';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(); // Disables all warnings in the app



const toastConfig = {
  /*
    Overwrite 'success' type,
    by modifying the existing `BaseToast` component
  */
  warning: (props) => (
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

function App(): React.JSX.Element {

  return (
    <AuthProvider>
      <AppNavigator />
      <Toast config={toastConfig}/>
    </AuthProvider>
  );
}

export default App;

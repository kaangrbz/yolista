import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageName } from '../../types/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GlobalFloatingAction = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(PageName.CreateRoute as never)}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default GlobalFloatingAction;

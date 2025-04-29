import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ensure this package is installed

const FloatingActionButton = ({onPress}: {onPress: () => void}) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Icon name="plus" size={24} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#1DA1F2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default FloatingActionButton;

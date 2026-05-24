import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { appTheme } from '../../../theme/appTheme';

interface MyLocationFabProps {
  onPress: () => void;
  loading?: boolean;
  bottomOffset?: number;
}

export const MyLocationFab: React.FC<MyLocationFabProps> = ({
  onPress,
  loading = false,
  bottomOffset = 80,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, { bottom: bottomOffset }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={appTheme.accent} />
      ) : (
        <Icon name="crosshairs-gps" size={22} color={appTheme.textPrimary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

export default MyLocationFab;

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTileSource, MapStyleMode } from '../../../constants/mapStyles';
import { appTheme } from '../../../theme/appTheme';

interface MapStyleToggleProps {
  mode: MapStyleMode;
  onToggle: () => void;
  bottomOffset?: number;
}

export const MapStyleToggle: React.FC<MapStyleToggleProps> = ({
  mode,
  onToggle,
  bottomOffset = 24,
}) => {
  const source = getTileSource(mode);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[styles.fab, { bottom: bottomOffset }]}
    >
      <Icon name={source.iconName} size={20} color={appTheme.textPrimary} />
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

export default MapStyleToggle;

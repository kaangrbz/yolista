import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMapStyleDefinition, MapStyleMode } from '../../../constants/mapStyles';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MapStyleToggleProps {
  mode: MapStyleMode;
  onToggle: () => void;
  topOffset?: number;
}

export const MapStyleToggle: React.FC<MapStyleToggleProps> = ({
  mode,
  onToggle,
  topOffset = 24,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    fab: {
      position: 'absolute',
      right: 14,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.background,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
  }));

  const styleDef = getMapStyleDefinition(mode);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[styles.fab, { top: topOffset }]}
    >
      <Icon name={styleDef.iconName} size={20} color={theme.textPrimary} />
    </TouchableOpacity>
  );
};

export default MapStyleToggle;

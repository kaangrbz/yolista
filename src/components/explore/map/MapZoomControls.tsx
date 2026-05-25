import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Üstten boşluk (badge'lerin altına yerleşmesi için). */
  topOffset?: number;
}

export const MapZoomControls: React.FC<MapZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  topOffset = 0,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      position: 'absolute',
      left: 14,
      width: 40,
      backgroundColor: t.background,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    button: {
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonTop: {},
    buttonBottom: {},
    divider: {
      height: 1,
      backgroundColor: t.border,
    },
  }));

  return (
    <View style={[styles.container, { top: topOffset }]}>
      <TouchableOpacity
        onPress={onZoomIn}
        activeOpacity={0.85}
        style={[styles.button, styles.buttonTop]}
      >
        <Icon name="plus" size={20} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        onPress={onZoomOut}
        activeOpacity={0.85}
        style={[styles.button, styles.buttonBottom]}
      >
        <Icon name="minus" size={20} color={theme.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};

export default MapZoomControls;

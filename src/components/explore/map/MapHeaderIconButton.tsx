import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MapHeaderIconButtonProps {
  iconName: string;
  onPress: () => void;
  accessibilityLabel: string;
  loading?: boolean;
  active?: boolean;
}

export const MapHeaderIconButton: React.FC<MapHeaderIconButtonProps> = ({
  iconName,
  onPress,
  accessibilityLabel,
  loading = false,
  active = false,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.background,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Icon
          name={iconName}
          size={20}
          color={active ? theme.accent : theme.textPrimary}
        />
      )}
    </TouchableOpacity>
  );
};

export default MapHeaderIconButton;

import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MyLocationFabProps {
  onPress: () => void;
  loading?: boolean;
  topOffset?: number;
}

export const MyLocationFab: React.FC<MyLocationFabProps> = ({
  onPress,
  loading = false,
  topOffset = 80,
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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, { top: topOffset }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Icon name="crosshairs-gps" size={22} color={theme.textPrimary} />
      )}
    </TouchableOpacity>
  );
};

export default MyLocationFab;

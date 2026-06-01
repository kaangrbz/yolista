import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { MAP_ACTIVE_ROUTE_BORDER } from '../../../constants/mapDefaults';

interface MapRouteDetailButtonProps {
  onPress: () => void;
}

export const MapRouteDetailButton: React.FC<MapRouteDetailButtonProps> = ({
  onPress,
}) => {
  const theme = useAppTheme();

  const styles = useThemedStyles((t) => ({
    wrapper: {
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 6,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: MAP_ACTIVE_ROUTE_BORDER,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: MAP_ACTIVE_ROUTE_BORDER,
    },
  }));

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Detaya git"
      >
        <Icon name="arrow-top-right" size={18} color={MAP_ACTIVE_ROUTE_BORDER} />
        <Text style={styles.label}>Detaya git</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MapRouteDetailButton;
